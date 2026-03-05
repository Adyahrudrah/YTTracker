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
  updateDoc
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

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


import { type YouTubeChannel, type YouTubeVideo } from "./youtube";

export const saveChannel = async (channel: YouTubeChannel) => {
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

export const getSavedChannels = async (): Promise<YouTubeChannel[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const q = query(collection(db, `users/${userId}/saved_channels`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as YouTubeChannel);
};

export const saveVideosToChannel = async (channelId: string, videos: YouTubeVideo[]) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const batch = writeBatch(db);
  
  videos.forEach((video) => {
    // We use the videoId as the document ID to prevent duplicates
    const docRef = doc(db, `users/${userId}/saved_channels/${channelId}/videos`, video.id.videoId);
    batch.set(docRef, {
      ...video,
      savedAt: Date.now(),
    });
  });

  await batch.commit();
};

 

export const getSavedVideosForChannel = async (channelId: string): Promise<YouTubeVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const vidsRef = collection(db, `users/${userId}/saved_channels/${channelId}/videos`);
  // Sort by savedAt or publishedAt so they appear in order
  const q = query(vidsRef, orderBy("savedAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as YouTubeVideo);
};

export const getLatestVideosFromAllChannels = async (): Promise<YouTubeVideo[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  // 1. Get all saved channels
  const channelsRef = collection(db, `users/${userId}/saved_channels`);
  const channelsSnap = await getDocs(channelsRef);
  
  const videoPromises = channelsSnap.docs.map(async (channelDoc) => {
    // 2. For each channel, get the single latest video
    const videosRef = collection(db, `users/${userId}/saved_channels/${channelDoc.id}/videos`);
    const q = query(videosRef, orderBy("snippet.publishedAt", "desc"), limit(1));
    const videoSnap = await getDocs(q);
    
    return videoSnap.docs.map(doc => doc.data() as YouTubeVideo)[0];
  });

  const results = await Promise.all(videoPromises);
  // Filter out any undefined results (channels with no videos saved yet)
  return results.filter(Boolean).sort((a, b) => 
    new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
  );
};

// // Add this to services/firebase.ts
// export const updateVideoStatus = async (channelId: string, videoId: string, status: string) => {
//   const userId = auth.currentUser?.uid;
//   if (!userId) return;

//   const docRef = doc(db, `users/${userId}/saved_channels/${channelId}/videos`, videoId);
//   await updateDoc(docRef, {
//     watchStatus: status,
//     updatedAt: Date.now()
//   });
// };