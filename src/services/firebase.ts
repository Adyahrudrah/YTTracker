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

export const saveVideosToChannel = async (
  channelId: string,
  videos: YTVideo[],
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const batch = writeBatch(db);

  videos.forEach((video) => {
    const docRef = doc(
      db,
      `users/${userId}/saved_channels/${channelId}/videos`,
      video.snippet.resourceId.videoId,
    );
    batch.set(docRef, {
      ...video,
      savedAt: Date.now(),
    });
  });
  await batch.commit();
};

export const getSavedVideosForChannel = async (
  channelId: string,
): Promise<YTVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const vidsRef = collection(
    db,
    `users/${userId}/saved_channels/${channelId}/videos`,
  );
  // Sort by savedAt or publishedAt so they appear in order
  const q = query(vidsRef);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as YTVideo);
};

export const isChannelExist = async (channelId: string): Promise<boolean> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const docRef = doc(db, `users/${userId}/saved_channels`, channelId);
  const docSnap = await getDoc(docRef);

  return docSnap.exists();
};

export const getLatestVideosFromAllChannels = async (): Promise<YTVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  // 1. Get all saved channels
  const channelsRef = collection(db, `users/${userId}/saved_channels`);
  const channelsSnap = await getDocs(channelsRef);

  const videoPromises = channelsSnap.docs.map(async (channelDoc) => {
    // 2. For each channel, get the single latest video
    const videosRef = collection(
      db,
      `users/${userId}/saved_channels/${channelDoc.id}/videos`,
    );
    const q = query(
      videosRef,
      orderBy("snippet.publishedAt", "desc"),
      limit(1),
    );
    const videoSnap = await getDocs(q);

    return videoSnap.docs.map((doc) => doc.data() as YTVideo)[0];
  });

  const results = await Promise.all(videoPromises);
  // Filter out any undefined results (channels with no videos saved yet)
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
