import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9zKaXIhrd5x1tvpXQXf5wIOGAW0Q62CA",
  authDomain: "kerimstodo.firebaseapp.com",
  projectId: "kerimstodo",
  storageBucket: "kerimstodo.firebasestorage.app",
  messagingSenderId: "611015747638",
  appId: "1:611015747638:web:e722665c3654c9d3319097",
  measurementId: "G-M0KJNS0G7V"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser) - lazy loaded
export const getAnalyticsInstance = () => {
  if (typeof window !== 'undefined') {
    const { getAnalytics } = require('firebase/analytics');
    return getAnalytics(app);
  }
  return null;
};

export default app;
