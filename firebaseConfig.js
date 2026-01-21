// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7VY5xtkamt45Nb67E9W1l4SaU9wObabs",
  authDomain: "tenants-4e149.firebaseapp.com",
  projectId: "tenants-4e149",
  storageBucket: "tenants-4e149.firebasestorage.app",
  messagingSenderId: "924479238708",
  appId: "1:924479238708:web:1b3bb31334b631e1811061",
  measurementId: "G-CZQJ5MD78C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);