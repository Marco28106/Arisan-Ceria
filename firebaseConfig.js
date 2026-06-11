import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  browserLocalPersistence,
} from "firebase/auth";
import { Platform } from "react-native"; // <-- Tambahkan ini untuk mengecek environment
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
  webClientId: "16613510760-k4hf7k4n8tc7jdu8pns49t4n1ftvdtjk.apps.googleusercontent.com",
  androidClientId: "PASTE_YOUR_ANDROID_CLIENT_ID_HERE",
  iosClientId: "PASTE_YOUR_IOS_CLIENT_ID_HERE",
};

// 1. Cegah inisialisasi ganda pada App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* 2. Inisialisasi Firestore */
const db = getFirestore(app);
/* 3. Inisialisasi Storage */
const storage = getStorage(app);

// 3. Inisialisasi Auth secara kondisional berdasarkan Platform (Web vs Mobile)
let auth;

if (Platform.OS === 'web') {
  // Jika dibuka di browser (Vercel), gunakan Local Storage browser biasa
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} else {
  // Jika dibuka di Android / iOS, gunakan AsyncStorage bawaan React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { db, auth, storage, firebaseConfig };