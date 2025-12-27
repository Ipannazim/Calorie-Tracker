import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQ-6U0sWJLI8f-Bfqgnm-JU-mcgj2en8Q",
    authDomain: "calorie-tracker-826bd.firebaseapp.com",
    projectId: "calorie-tracker-826bd",
    storageBucket: "calorie-tracker-826bd.firebasestorage.app",
    messagingSenderId: "1083662171438",
    appId: "1:1083662171438:web:8e54e17e16d70aeee58ebf",
    measurementId: "G-YLPXBN2XS3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, db, analytics };