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
{ id: 'nasi_putih', name: 'Nasi Putih (1 cup)', unit: 'serving', cals: 200 },
  { id: 'nasi_ayam_set', name: 'Nasi Ayam (Complete Set)', unit: 'serving', cals: 650 },
  { id: 'nasi_gepuk', name: 'Nasi Ayam Gepuk (Set)', unit: 'serving', cals: 750 },
  { id: 'nasi_lemak', name: 'Nasi Lemak (Basic)', unit: 'serving', cals: 350 },

  // --- MEAT & FISH ---
  { id: 'ayam_kurma', name: 'Ayam Masak Kurma', unit: 'serving', cals: 380 },
  { id: 'ayam_lemak', name: 'Ayam Masak Lemak', unit: 'serving', cals: 440 },
  { id: 'ayam_kicap', name: 'Ayam Masak Kicap', unit: 'serving', cals: 350 },
  { id: 'ayam_goreng', name: 'Ayam Goreng (1 piece)', unit: 'serving', cals: 310 },
  { id: 'asam_pedas', name: 'Asam Pedas Ikan Pari', unit: 'serving', cals: 250 },
  { id: 'kari_daging', name: 'Kari Daging', unit: 'serving', cals: 500 },
  { id: 'daging_lemak', name: 'Daging Masak Lemak', unit: 'serving', cals: 550 },

  // --- VEGETABLES & SIDES ---
  { id: 'kangkung_belacan', name: 'Kangkung Belacan', unit: 'serving', cals: 270 },
  { id: 'sawi_belacan', name: 'Sawi Belacan', unit: 'serving', cals: 150 },
  { id: 'taugeh_tumis', name: 'Taugeh Tumis', unit: 'serving', cals: 120 },
  { id: 'bayam_air', name: 'Bayam Masak Air', unit: 'serving', cals: 55 },
  { id: 'sambal_kentang', name: 'Sambal Kentang Ikan Bilis', unit: 'serving', cals: 300 },
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
