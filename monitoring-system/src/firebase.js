import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyA3gbe_OKYqZJfYJig45JzIJW72JlPmR80",
  authDomain: "tp2objet-54062.firebaseapp.com",
  databaseURL: "https://tp2objet-54062-default-rtdb.firebaseio.com",
  projectId: "tp2objet-54062",
  storageBucket: "tp2objet-54062.firebasestorage.app",
  messagingSenderId: "471954154188",
  appId: "1:471954154188:web:870500c29201bcbb365869"
};


const app = initializeApp(firebaseConfig);


export const db = getDatabase(app);
