import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyCpVA5pmeA-b0gayXmqunQSm7rR48oKOjI",
  authDomain: "arisanceriayuk.firebaseapp.com",
  projectId: "arisanceriayuk",
  storageBucket: "arisanceriayuk.firebasestorage.app",
  messagingSenderId: "16613510760",
  appId: "1:16613510760:web:cf42066cda42e19af4b5dd",
  measurementId: "G-13R70QXE7W",

  // Google OAuth Client IDs untuk Google Sign-In (expo-auth-session)
  webClientId: "PASTE_YOUR_GOOGLE_WEB_CLIENT_ID_HERE",
  androidClientId: "PASTE_YOUR_ANDROID_CLIENT_ID_HERE",
  iosClientId: "PASTE_YOUR_IOS_CLIENT_ID_HERE",
};

// 1. Cegah inisialisasi ganda pada App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* 2. Inisialisasi Firestore */
const db = getFirestore(app);
/* 3. Inisialisasi Storage */
const storage = getStorage(app);

// 3. Inisialisasi Auth dengan persistence.
// Ini harus dipanggil sekali saat aplikasi dimulai untuk mengatur persistence.
// getAuth(app) dapat digunakan di tempat lain untuk mendapatkan instance auth yang sama.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { db, auth, storage, firebaseConfig };
