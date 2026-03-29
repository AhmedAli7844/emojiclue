// ─────────────────────────────────────────────────────────────────────────────
// BIGZY Games — Firebase Configuration
//
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g. "bigzy-games")
// 3. Click "Add app" → Web → register your app
// 4. Copy the firebaseConfig object below and paste your values
// 5. In Firebase console → Authentication → Sign-in method, enable:
//    - Email/Password
//    - Google
//    - Apple  (requires Apple Developer account)
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyA-_sSPuAuMAlnX9HGtScuiu1rH_IQT3hw",
  authDomain:        "bigzy-games--emojiclue.firebaseapp.com",
  projectId:         "bigzy-games--emojiclue",
  storageBucket:     "bigzy-games--emojiclue.firebasestorage.app",
  messagingSenderId: "189332858639",
  appId:             "1:189332858639:web:63126f97f1dc58f7b0407a",
  measurementId:     "G-XZLGJ45PR2",
};

// Initialize Firebase (only when config is filled in)
var auth;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
}
