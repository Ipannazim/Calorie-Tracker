import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- STATE ---
// Retrieve the Matric AND Name we saved during login
const userMatric = localStorage.getItem('cc_user_matric');
const userName = localStorage.getItem('cc_user_name');

let currentEntries = [];
let currentGoal = 2200;

// Redirect if not logged in
if (!userMatric) {
  window.location.href = 'index.html';
}

// --- DOM ELEMENTS ---
const els = {
  dailyGoal: document.getElementById('dailyGoal'),
  saveGoalBtn: document.getElementById('saveGoalBtn'),
  goalCals: document.getElementById('goalCals'),
  totalCals: document.getElementById('totalCals'),
  progressBar: document.getElementById('progressBar'),
  addForm: document.getElementById('addForm'),
  foodSelect: document.getElementById('foodSelect'),
  foodAmount: document.getElementById('foodAmount'),
  amountUnit: document.getElementById('amountUnit'),
  perUnitInfo: document.getElementById('perUnitInfo'),
  entries: document.getElementById('entries'),
  resetDayBtn: document.getElementById('resetDayBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg')
};

// Start Data
initData();

// --- DATA FETCHING ---
async function initData() {
  const dateStr = new Date().toISOString().split('T')[0]; // Today's YYYY-MM-DD

  try {
    // Query 'entries' where 'matric' matches the logged-in user
    const q = query(
      collection(db, "entries"),
      where("matric", "==", userMatric),
      where("date", "==", dateStr)
    );

    const querySnapshot = await getDocs(q);

    currentEntries = [];
    querySnapshot.forEach((doc) => {
      currentEntries.push({ id: doc.id, ...doc.data() });
    });

    renderEntries();
    updateSummary();

  } catch (error) {
    console.error("Error fetching data:", error);
    showToast("Error loading data");
  }
}

// --- EVENT LISTENERS ---

// 1. ADD ENTRY (Updated for Single Table)
els.addForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const foodId = els.foodSelect.value;
  const amount = parseFloat(els.foodAmount.value);
  const food = FOOD_LIST.find(f => f.id === foodId);

  if (!food || isNaN(amount) || amount <= 0) return;

  // Calculate calories
  let calories = (food.unit === 'serving')
    ? food.cals * amount
    : (food.cals / 100) * amount;

  // Create the Single Table Entry
  const newEntry = {
    matric: userMatric,   // Replaces 'userId'
    userName: userName,   // We store the name in the entry now
    name: food.name,
    unit: food.unit,
    amount: amount,
    cals: Math.round(calories),
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, "entries"), newEntry);

    currentEntries.push({ id: docRef.id, ...newEntry });
    renderEntries();
    updateSummary();
    showToast("Entry added!");
    els.addForm.reset();
    populateFoods();

  } catch (error) {
    console.error("Error adding entry:", error);
    showToast("Failed to save entry");
  }
});

// 2. RESET DAY
els.resetDayBtn.addEventListener('click', async () => {
  if (!confirm("Clear all entries for today?")) return;

  try {
    const deletePromises = currentEntries.map(entry =>
      deleteDoc(doc(db, "entries", entry.id))
    );
    await Promise.all(deletePromises);

    currentEntries = [];
    renderEntries();
    updateSummary();
    showToast("Day reset successfully");
  } catch (error) {
    console.error("Error resetting day:", error);
    showToast("Failed to reset");
  }
});

// 3. LOGOUT
els.logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('cc_user_matric');
  localStorage.removeItem('cc_user_name');
  window.location.href = 'index.html';
});

// 4. SAVE GOAL
els.saveGoalBtn.addEventListener('click', () => {
  const goal = els.dailyGoal.value;
  if (goal && goal > 500) {
    currentGoal = goal;
    localStorage.setItem('cc_daily_goal', goal);
    updateSummary();
    showToast("Daily goal updated!");
  }
});

// --- UI HELPERS ---

function renderEntries() {
  els.entries.innerHTML = '';
  const sorted = [...currentEntries].sort((a, b) => b.timestamp - a.timestamp);

  sorted.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'entry';
    el.innerHTML = `
      <div class="entry__info">
        <h3>${entry.name}</h3>
        <div class="entry__meta">${entry.amount} ${entry.unit === 'g' ? 'g' : 'serving(s)'}</div>
      </div>
      <div class="entry__actions">
        <span class="entry__cals">${entry.cals}</span>
        <button class="btn-icon delete-btn" data-id="${entry.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    el.querySelector('.delete-btn').addEventListener('click', () => deleteEntry(entry.id));
    els.entries.appendChild(el);
  });
}

async function deleteEntry(id) {
  if (!confirm("Delete this entry?")) return;
  try {
    await deleteDoc(doc(db, "entries", id));
    currentEntries = currentEntries.filter(e => e.id !== id);
    renderEntries();
    updateSummary();
    showToast("Entry deleted");
  } catch (error) {
    console.error("Error deleting:", error);
    showToast("Could not delete entry");
  }
}

function updateSummary() {
  const total = currentEntries.reduce((sum, e) => sum + e.cals, 0);
  els.totalCals.textContent = total;

  const savedGoal = localStorage.getItem('cc_daily_goal');
  if (savedGoal) currentGoal = parseInt(savedGoal);

  els.goalCals.textContent = currentGoal;
  els.dailyGoal.value = currentGoal;

  const percent = Math.min((total / currentGoal) * 100, 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressBar.style.background = percent > 100 ? 'var(--danger)' : 'var(--primary)';
}

function showToast(message) {
  if (els.toastMsg) els.toastMsg.textContent = message;
  else els.toast.textContent = message;
  els.toast.classList.add('toast--show');
  setTimeout(() => els.toast.classList.remove('toast--show'), 2000);
}

// --- FOOD DATA ---
const FOOD_LIST = [
  // --- STUDENT STAPLES ---
  { id: 'nasi_ayam', name: 'Chicken Rice (Roasted/Steamed)', unit: 'serving', cals: 620 },
  { id: 'nasi_lemak', name: 'Nasi Lemak (Bungkus/Plain)', unit: 'serving', cals: 400 },
  { id: 'nasi_goreng_k', name: 'Nasi Goreng Kampung', unit: 'serving', cals: 640 },
  { id: 'nasi_goreng_usa', name: 'Nasi Goreng USA', unit: 'serving', cals: 750 },
  { id: 'nasi_bujang', name: 'Nasi Bujang (Rice, Egg, Soup)', unit: 'serving', cals: 350 },

  // --- MAMAK & NOODLES ---
  { id: 'roti_canai', name: 'Roti Canai (1 pc + Dhal)', unit: 'serving', cals: 360 },
  { id: 'roti_telur', name: 'Roti Telur (1 pc + Curry)', unit: 'serving', cals: 450 },
  { id: 'maggi_goreng', name: 'Maggi Goreng (Biasa)', unit: 'serving', cals: 470 },
  { id: 'shawarma', name: 'Chicken Shawarma/Kebab', unit: 'serving', cals: 450 },
  { id: 'burger_ramly', name: 'Ramly Burger (Ayam/Daging)', unit: 'serving', cals: 480 },

  // --- SIDES & EXTRAS ---
  { id: 'ayam_goreng', name: 'Ayam Goreng (Mamak/Spicy)', unit: 'serving', cals: 290 },
  { id: 'telur_mata', name: 'Telur Mata (Fried Egg)', unit: 'serving', cals: 90 },
  { id: 'kuih', name: 'Kuih (Karipap/Donut - 1 pc)', unit: 'serving', cals: 130 },
  { id: 'keropok', name: 'Keropok Lekor (5 pcs)', unit: 'serving', cals: 150 },

  // --- DRINKS ---
  { id: 'milo_ais', name: 'Milo Ais', unit: 'serving', cals: 220 },
  { id: 'teh_tarik', name: 'Teh Tarik', unit: 'serving', cals: 190 },
  { id: 'teh_o_ais', name: 'Teh O Ais', unit: 'serving', cals: 80 },
  { id: 'sirap_bandung', name: 'Sirap Bandung', unit: 'serving', cals: 180 },

  // --- GENERIC (For specific measurements) ---
  { id: 'rice_g', name: 'White Rice (per 100g)', unit: 'g', cals: 130 },
  { id: 'chicken_g', name: 'Chicken Breast (per 100g)', unit: 'g', cals: 165 },
  { id: 'mixed_veg', name: 'Mixed Vegetables (1 scoop)', unit: 'serving', cals: 80 }
];

function populateFoods() {
  els.foodSelect.innerHTML = '';
  FOOD_LIST.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    els.foodSelect.appendChild(opt);
  });
  updatePerUnitInfo();
}

function updatePerUnitInfo() {
  const food = FOOD_LIST.find(f => f.id === els.foodSelect.value);
  if (!food) return;

  if (food.unit === 'serving') {
    els.amountUnit.textContent = 'serving';
    els.perUnitInfo.textContent = `Per serving: ${food.cals} kcal`;
    els.foodAmount.placeholder = '1';
    els.foodAmount.step = '0.5';
    els.foodAmount.value = 1;
  } else {
    els.amountUnit.textContent = 'g';
    els.perUnitInfo.textContent = `Per 100g: ${food.cals} kcal`;
    els.foodAmount.placeholder = '100';
    els.foodAmount.step = '10';
    els.foodAmount.value = 100;
  }
}

populateFoods();
els.foodSelect.addEventListener('change', updatePerUnitInfo);