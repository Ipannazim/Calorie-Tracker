import { db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginBtn = document.getElementById('loginBtn');
const userName = document.getElementById('userName');
const matricNo = document.getElementById('matricNo');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// Check if already logged in
if (localStorage.getItem('cc_user_matric')) {
    window.location.href = 'main.html';
}

function showToast(message) {
    if (toastMsg) toastMsg.textContent = message;
    else toast.textContent = message;
    toast.classList.add('toast--show');
    setTimeout(() => toast.classList.remove('toast--show'), 2000);
}

loginBtn.addEventListener('click', async () => {
    const name = userName.value.trim();
    const matric = matricNo.value.trim();

    if (!name || !matric) return showToast("Please fill all fields");

    loginBtn.textContent = "Loading...";
    loginBtn.disabled = true;

    try {
        // "One Table" Logic:
        // We just check the 'entries' collection to see if this person has been here before.
        const entriesRef = collection(db, "entries");
        const q = query(entriesRef, where("matric", "==", matric));
        const snapshot = await getDocs(q);

        // Save details to LocalStorage (so app.js can use them)
        localStorage.setItem('cc_user_matric', matric);
        localStorage.setItem('cc_user_name', name);

        if (!snapshot.empty) {
            showToast(`Welcome back, ${name}!`);
        } else {
            showToast(`Welcome, ${name}! Start tracking now.`);
        }

        setTimeout(() => window.location.href = 'main.html', 1000);

    } catch (error) {
        console.error("Error logging in:", error);
        showToast("Login failed. Check console.");
        loginBtn.textContent = "Enter Dashboard";
        loginBtn.disabled = false;
    }
});