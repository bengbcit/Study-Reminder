/* firebase-config.js
   Replace the values below with your Firebase project credentials.
   Steps:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use existing)
   3. Add a Web App → copy the firebaseConfig object
   4. Enable Authentication → Email/Password + Google
   5. Enable Firestore Database (start in test mode)
   6. Paste your values below

  Note: For security, it's best to use environment variables for these values in production.
*/

const FIREBASE_CONFIG = {
  apiKey: typeof FIREBASE_KEYS !== 'undefined' ? FIREBASE_KEYS.apiKey : "YOUR_API_KEY",
  authDomain: typeof FIREBASE_KEYS !== 'undefined' ? FIREBASE_KEYS.authDomain : "YOUR_AUTH_DOMAIN",
  projectId: "study-reminder-8910",
  storageBucket: "study-reminder-8910.firebasestorage.app",
  messagingSenderId: "122788831469",
  appId: "1:122788831469:web:fd6f652f9ab5d90c39ace4"
};