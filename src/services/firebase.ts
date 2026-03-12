// services/firebase.ts
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
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
  documentId,
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
import type { YTChannel, YTVideo } from "#/types/yt";

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

export const saveChannel = async (channel: YTChannel) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = doc(db, `users/${userId}/saved_channels`, channel.id);
  await setDoc(docRef, {
    ...channel,
    savedAt: Date.now(),
  });
};

export const removeChannel = async (channelId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  await deleteDoc(doc(db, `users/${userId}/saved_channels`, channelId));
};

export const getSavedChannels = async (): Promise<YTChannel[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const q = query(collection(db, `users/${userId}/saved_channels`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as YTChannel);
};

// services/firebase.ts

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

// services/firebase.ts

export const getSavedVideosForChannel = async (
  channelId: string,
  limitCount: number,
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData>, // Cursor for pagination
): Promise<{
  videos: YTVideo[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  const userId = auth.currentUser?.uid;
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

export const isChannelExist = async (channelId: string): Promise<boolean> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const docRef = doc(db, `users/${userId}/saved_channels`, channelId);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
};

export const areChannelsExist = async (
  channelIds: string[],
): Promise<Record<string, boolean>> => {
  const userId = auth.currentUser?.uid;
  if (!userId || channelIds.length === 0) return {};

  const limitedIds = channelIds.slice(0, 30);

  const colRef = collection(db, `users/${userId}/saved_channels`);
  const q = query(colRef, where(documentId(), "in", limitedIds));

  const querySnapshot = await getDocs(q);

  const results: Record<string, boolean> = {};

  channelIds.forEach((id) => {
    results[id] = false;
  });

  querySnapshot.forEach((doc) => {
    results[doc.id] = true;
  });

  return results;
};

export const getLatestVideos = async (): Promise<YTVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  const channelsRef = collection(db, `users/${userId}/saved_channels`);
  const channelsSnap = await getDocs(channelsRef);

  const videoPromises = channelsSnap.docs.map(async (channelDoc) => {
    const videosRef = collection(
      db,
      `users/${userId}/saved_channels/${channelDoc.id}/videos`,
    );
    const q = query(
      videosRef,
      orderBy("snippet.publishedAt", "desc"),
      where("details.progressPercent", "==", 0),
      where("details.isShorts", "==", false),
      limit(1),
    );
    const videoSnap = await getDocs(q);

    return videoSnap.docs.map((doc) => doc.data() as YTVideo)[0];
  });

  const results = await Promise.all(videoPromises);
  return results
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.snippet.publishedAt).getTime() -
        new Date(a.snippet.publishedAt).getTime(),
    );
};

export const updateVideoProgress = async (
  channelId: string,
  videoId: string,
  progress: { currentTime: number; percent: number },
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
    });
  } catch (error) {
    console.error("Error saving video progress:", error);
  }
};

export const getWatchingVideos = async (): Promise<YTVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const videosRef = collectionGroup(db, "videos");
  const q = query(
    videosRef,
    where("userId", "==", userId),
    where("details.progressPercent", ">", 0),
    where("details.progressPercent", "<", 100),
    orderBy("details.updatedAt", "desc"),
    limit(100),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as YTVideo);
};

// export const getFeedVideos = async (): Promise<YTVideo[]> => {
//   const userId = auth.currentUser?.uid;
//   if (!userId) return [];

//   const videosRef = collectionGroup(db, "videos");

//   const q = query(
//     videosRef,
//     where("userId", "==", userId),
//     where("details.progressPercent", "==", 0),
//     orderBy("snippet.publishedAt", "desc"),
//   );

//   const querySnapshot = await getDocs(q);
//   const data = querySnapshot.docs.map((doc) => doc.data() as YTVideo);
//   return data;
// };

// export const migrateAllVideosProgress = async (newPercent: number = 0) => {
//   const userId = auth.currentUser?.uid;
//   if (!userId) throw new Error("User not authenticated");

//   const videosRef = collectionGroup(db, "videos");
//   const q = query(videosRef, where("userId", "==", userId));

//   const querySnapshot = await getDocs(q);
//   const docs = querySnapshot.docs;

//   const chunks = [];
//   for (let i = 0; i < docs.length; i += 500) {
//     chunks.push(docs.slice(i, i + 500));
//   }

//   for (const chunk of chunks) {
//     const batch = writeBatch(db);
//     chunk.forEach((videoDoc) => {
//       batch.update(videoDoc.ref, {
//         "details.progressPercent": newPercent,
//         "details.updatedAt": Date.now(),
//       });
//     });
//     await batch.commit();
//   }

//   return docs.length;
// };
