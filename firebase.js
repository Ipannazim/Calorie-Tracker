// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { db };