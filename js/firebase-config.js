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

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

export default FIREBASE_CONFIG;
