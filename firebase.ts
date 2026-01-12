import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDjx4t3YNnOU4NEuj0ojnq_ZURQ5VPFfk",
  authDomain: "meusgastos-6fe58.firebaseapp.com",
  projectId: "meusgastos-6fe58",
  storageBucket: "meusgastos-6fe58.firebasestorage.app",
  messagingSenderId: "239462224328",
  appId: "1:239462224328:web:d87967b3598af86d4130fd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);