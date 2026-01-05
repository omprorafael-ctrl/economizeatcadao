
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAwL5YvnHWAGcJPLVP4dyUpRRzLTAZiHNI",
  authDomain: "atcadao-16b84.firebaseapp.com",
  projectId: "atcadao-16b84",
  storageBucket: "atcadao-16b84.firebasestorage.app",
  messagingSenderId: "466465117914",
  appId: "1:466465117914:web:7c8e56ab35548e564e37e3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
