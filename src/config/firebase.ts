import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAvj5ObQPHblF0t1uMVu_UiqoaejZRlf2c",
  authDomain: "astraronixcore.firebaseapp.com",
  projectId: "astraronixcore",
  storageBucket: "astraronixcore.firebasestorage.app",
  messagingSenderId: "643322823958",
  appId: "1:643322823958:web:8875a4cfdafd3eeb60fc37",
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