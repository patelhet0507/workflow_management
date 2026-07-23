import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBgF7NSU4xkd23ZEy8-DjxeN_Z14Ym5XP8",
  authDomain: "document-management-60655.firebaseapp.com",
  projectId: "document-management-60655",
  storageBucket: "document-management-60655.firebasestorage.app",
  messagingSenderId: "877239588657",
  appId: "1:877239588657:web:fb79d65c8e7f5d51160210",
  measurementId: "G-L9H55TBCW6"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
