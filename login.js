import { db } from './firebase.js';
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginBtn = document.getElementById('loginBtn');
const userName = document.getElementById('userName');
const matricNo = document.getElementById('matricNo');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// Check if already logged in
if (localStorage.getItem('cc_user_id')) {
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
        const usersRef = collection(db, "users");

        // 1. Check if user already exists
        const q = query(usersRef, where("matric", "==", matric));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // User exists - Log them in
            showToast(`Welcome back, ${name}!`);
            localStorage.setItem('cc_user_id', matric);
            setTimeout(() => window.location.href = 'main.html', 1000);
        } else {
            // User does not exist - Register them automatically
            await addDoc(usersRef, {
                name: name,
                matric: matric,
                joinedAt: new Date().toISOString()
            });
            showToast(`Account created! Welcome, ${name}.`);
            localStorage.setItem('cc_user_id', matric);
            setTimeout(() => window.location.href = 'main.html', 1000);
        }

    } catch (error) {
        console.error("Error logging in:", error);
        showToast("Login failed. Check console.");
        loginBtn.textContent = "Enter Dashboard";
        loginBtn.disabled = false;
    }
});