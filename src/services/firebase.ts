// services/firebase.ts
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  writeBatch,
  orderBy,
  limit,
  getDoc,
  updateDoc,
  collectionGroup,
  where,
  QueryDocumentSnapshot,
  type DocumentData,
  startAfter,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import type { YTChannel, YTVideo, ytVideoStatus } from "#/types/yt";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export interface ReelConfig {
  filePath: string;
  imdbCode: string;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// services/firebase.ts

// Helper to ensure auth is initialized before running queries
export const getUserId = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        reject("User not authenticated");
      }
    });
  });
};

export const saveChannel = async (channel: YTChannel) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = doc(db, `users/${userId}/saved_channels`, channel.id);
  await setDoc(docRef, {
    ...channel,
    savedAt: Date.now(),
  });
};

// services/firebase.ts

export const removeChannel = async (channelId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const channelRef = doc(db, `users/${userId}/saved_channels`, channelId);
  const videosRef = collection(
    db,
    `users/${userId}/saved_channels/${channelId}/videos`,
  );

  try {
    const videoSnap = await getDocs(videosRef);
    const docs = videoSnap.docs;
    const BATCH_LIMIT = 500;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_LIMIT);

      chunk.forEach((videoDoc) => {
        batch.delete(videoDoc.ref);
      });

      if (i + BATCH_LIMIT >= docs.length) {
        batch.delete(channelRef);
      }

      await batch.commit();
    }

    if (docs.length === 0) {
      const batch = writeBatch(db);
      batch.delete(channelRef);
      await batch.commit();
    }
  } catch (error) {
    console.error("Error removing channel and its videos:", error);
    throw error;
  }
};

export const getSavedChannels = async (): Promise<YTChannel[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const q = query(collection(db, `users/${userId}/saved_channels`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as YTChannel);
};

export const getSavedChannelIds = async (): Promise<Set<string>> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return new Set();
  const colRef = collection(db, `users/${userId}/saved_channels`);
  const snapshot = await getDocs(colRef);
  return new Set(snapshot.docs.map((doc) => doc.id));
};

export const saveVideosToChannel = async (
  channelId: string,
  videos: YTVideo[],
  existingVideoIds: Set<string> = new Set(), // Add this parameter
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const newVideos = videos.filter(
    (v) => !existingVideoIds.has(v.snippet.resourceId.videoId),
  );

  if (newVideos.length === 0) return 0;

  const BATCH_LIMIT = 500;
  const chunks = [];

  for (let i = 0; i < newVideos.length; i += BATCH_LIMIT) {
    chunks.push(newVideos.slice(i, i + BATCH_LIMIT));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((video) => {
      const docRef = doc(
        db,
        `users/${userId}/saved_channels/${channelId}/videos`,
        video.snippet.resourceId.videoId,
      );
      batch.set(docRef, {
        ...video,
        userId,
        savedAt: Date.now(),
      });
    });
    await batch.commit();
  }
  return newVideos.length;
};

export const getSavedVideosForChannel = async (
  channelId: string,
  limitCount: number,
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{
  videos: YTVideo[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  const userId = await getUserId();
  if (!userId) return { videos: [], lastDoc: null };

  const vidsRef = collection(
    db,
    `users/${userId}/saved_channels/${channelId}/videos`,
  );

  let q = query(
    vidsRef,
    orderBy("snippet.publishedAt", "desc"),
    limit(limitCount),
  );

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  const snapshot = await getDocs(q);
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const videos = snapshot.docs.map((doc) => doc.data() as YTVideo);
  return { videos, lastDoc };
};

export const getVideo = async (channelId: string, videoId: string) => {
  const userId = await getUserId();
  if (!userId) return;

  const vidsRef = collection(
    db,
    `users/${userId}/saved_channels/${channelId}/videos`,
  );

  let q = query(
    vidsRef,
    orderBy("id.videoId", "desc"),
    where("id.videoId", "==", videoId),
  );

  const snapshot = await getDocs(q);
  const video = snapshot.docs.map((doc) => doc.data() as YTVideo);
  return video;
};

export const isChannelExist = async (channelId: string): Promise<boolean> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const docRef = doc(db, `users/${userId}/saved_channels`, channelId);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
};

export const getFeedVideos = async (): Promise<YTVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const videosRef = collectionGroup(db, "videos");
  const q = query(
    videosRef,
    where("userId", "==", userId),
    where("details.isShorts", "==", false),
    where("details.status", "in", ["watch", "watching"]),
    orderBy("details.status"),
    orderBy("details.updatedAt", "desc"),
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => doc.data() as YTVideo);
  return data;
};

export const updateVideoProgress = async (
  channelId: string,
  videoId: string,
  progress: { currentTime: number; percent: number },
  status: ytVideoStatus,
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const videoRef = doc(
    db,
    `users/${userId}/saved_channels/${channelId}/videos`,
    videoId,
  );

  try {
    await updateDoc(videoRef, {
      "details.lastPlayed": progress.currentTime,
      "details.progressPercent": progress.percent,
      "details.updatedAt": Date.now(),
      "details.status": status,
    });
  } catch (error) {
    console.error("Error saving video progress:", error);
  }
};
