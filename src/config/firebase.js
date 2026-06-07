import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configured using the service account project ID "epatrolgf"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "", 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "epatrolgf.firebaseapp.com",
  projectId: "epatrolgf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "epatrolgf.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app;
let db = null;
let isFirebaseConfigured = true; // Automatically enabled since project_id is set

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log("🔥 Firebase Firestore connected to project: epatrolgf");
} catch (error) {
  console.error("❌ Error initializing Firebase: ", error);
  isFirebaseConfigured = false;
}

export { db, isFirebaseConfigured };
