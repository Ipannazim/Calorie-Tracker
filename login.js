const API_URL = 'http://localhost:3000/api';

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
    const name = userName.value;
    const matric = matricNo.value;

    if (!name || !matric) return showToast("Please fill all fields");

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, matric })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('cc_user_id', data.userId);
            showToast(`Welcome, ${name}!`);
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
        } else {
            showToast("Login Failed");
        }
    } catch (err) {
        console.error(err);
        showToast("Server Error. Is Node running?");
    }
});
