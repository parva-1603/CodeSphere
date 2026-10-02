import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzH-Q2eg9lKyx8-jZcdDCreT-B5cFo894",
  authDomain: "codesphere-b7acd.firebaseapp.com",
  databaseURL: "https://codesphere-b7acd-default-rtdb.firebaseio.com",
  projectId: "codesphere-b7acd",
  storageBucket: "codesphere-b7acd.firebasestorage.app",
  messagingSenderId: "701901506788",
  appId: "1:701901506788:web:70c42ccdf9085c55ce04f1",
  measurementId: "G-WTCLXCENSV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
