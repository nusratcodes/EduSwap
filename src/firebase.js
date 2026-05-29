
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2E6-I28wevmnLjFbuYcyIWT2lXb-S8Vs",
  authDomain: "skillnest-95a74.firebaseapp.com",
  projectId: "skillnest-95a74",
  storageBucket: "skillnest-95a74.firebasestorage.app",
  messagingSenderId: "1009938073571",
  appId: "1:1009938073571:web:5291d819300e2f525d42d6",
  measurementId: "G-YCSFTBCTDY"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);