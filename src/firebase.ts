import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2-Swm1zUlbdnxiKfxbr4uD7mcSuZpuMo",
  authDomain: "fir-1-b4bac.firebaseapp.com",
  projectId: "fir-1-b4bac",
  storageBucket: "fir-1-b4bac.firebasestorage.app",
  messagingSenderId: "331887053520",
  appId: "1:331887053520:web:43e775de81fb289a35acd5",
  measurementId: "G-N6R41KE38Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
