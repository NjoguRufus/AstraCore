import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAvj5ObQPHblF0t1uMVu_UiqoaejZRlf2c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "astraronixcore.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "astraronixcore",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "astraronixcore.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "643322823958",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:643322823958:web:8875a4cfdafd3eeb60fc37",
  measurementId: "G-HESP9Q6Z1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;