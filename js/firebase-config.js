/* firebase-config.js
   Replace the values below with your Firebase project credentials.
   Steps:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use existing)
   3. Add a Web App → copy the firebaseConfig object
   4. Enable Authentication → Email/Password + Google
   5. Enable Firestore Database (start in test mode)
   6. Paste your values below
*/

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFVkbF9NHn9F8gv2_JS6uRbwE38VDY4CY",
  authDomain: "study-reminder-8910.firebaseapp.com",
  projectId: "study-reminder-8910",
  storageBucket: "study-reminder-8910.firebasestorage.app",
  messagingSenderId: "122788831469",
  appId: "1:122788831469:web:fd6f652f9ab5d90c39ace4",
  measurementId: "G-M178C4EY4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 导出 app 实例，以便其他文件使用
export default app;