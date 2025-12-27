// --- MySQL / LOCAL SERVER CONFIG ---
const API_URL = 'http://localhost:3000/api'; // Ensure your server.js is running

// State
let userId = localStorage.getItem('cc_user_id');
let currentEntries = [];
let currentGoal = 2200;

// Redirect if not logged in
if (!userId) {
  window.location.href = 'login.html';
}

// DOM Elements
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

// --- AUTHENTICATION ---

// If userId exists (meaning we didn't redirect), initialize data
if (userId) {
  initData();
}

// --- DATA FETCHING ---

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function initData() {
  if (!userId) return;

  try {
    // 1. Get Goal
    const goalRes = await fetch(`${API_URL}/users/${userId}`);
    const goalData = await goalRes.json();
    if (goalData && goalData.daily_goal) {
      currentGoal = goalData.daily_goal;
    }

    // 2. Get Today's Entries
    await fetchEntries();
  } catch (err) {
    console.error(err);
    showToast("Error loading data");
  }
}

async function fetchEntries() {
  try {
    const date = getTodayKey();
    const res = await fetch(`${API_URL}/entries/${userId}?date=${date}`);
    currentEntries = await res.json();
    render();
  } catch (err) {
    console.error(err);
  }
}

// --- RENDERING ---

function render() {
  const total = currentEntries.reduce((sum, e) => sum + e.cals, 0);

  // Update Stats
  els.totalCals.textContent = Math.round(total);
  els.goalCals.textContent = Math.round(currentGoal);
  const pct = currentGoal ? Math.min(100, (total / currentGoal) * 100) : 0;
  els.progressBar.style.width = `${pct}%`;

  if (els.dailyGoal.value === "") {
    els.dailyGoal.value = currentGoal;
  }

  // Render List
  els.entries.innerHTML = '';
  currentEntries.forEach((e, idx) => {
    const item = document.createElement('div');
    item.className = 'entry';
    item.style.animationDelay = `${idx * 0.05}s`; // Stagger animation

    item.innerHTML = `
      <div class="entry__info">
        <h3>${e.name}</h3>
        <div class="entry__meta">${e.amount} ${e.unit}${e.unit === 'g' ? '' : e.amount > 1 ? 's' : ''}</div>
      </div>
      <div class="entry__actions">
        <span class="entry__cals">${Math.round(e.cals)}</span>
        <button class="btn btn--danger" style="padding: 6px;" data-action="del" data-id="${e.id}" aria-label="Delete">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>`;
    els.entries.appendChild(item);
  });
}

// --- ACTIONS ---

async function addEntry(e) {
  e.preventDefault();
  const selectedId = els.foodSelect.value;
  const food = FOOD_LIST.find(f => f.id === selectedId);
  const amount = Number(els.foodAmount.value || 0);

  if (!food || isNaN(amount) || amount <= 0) {
    showToast('Select food & amount');
    return;
  }

  let cals = 0;
  if (food.unit === 'serving') cals = amount * food.cals;
  else if (food.unit === 'g') cals = (amount / 100) * food.cals;

  const entry = {
    userId,
    name: food.name,
    unit: food.unit === 'g' ? 'g' : 'serving',
    amount,
    cals,
    date: getTodayKey(),
    timestamp: Date.now()
  };

  try {
    const res = await fetch(`${API_URL}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (res.ok) {
      els.foodAmount.value = '';
      showToast('Added');
      fetchEntries(); // Reload list
    } else {
      showToast('Error adding');
    }
  } catch (err) {
    console.error(err);
    showToast('Server connection error');
  }
}

async function saveGoal() {
  const g = Number(els.dailyGoal.value || 0);
  const newGoal = Math.max(0, g);

  try {
    await fetch(`${API_URL}/users/${userId}/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: newGoal })
    });
    currentGoal = newGoal;
    render();
    showToast('Goal saved');
  } catch (err) {
    showToast('Error saving goal');
  }
}

async function handleEntryClick(ev) {
  const btn = ev.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');

  if (action === 'del') {
    try {
      await fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' });
      showToast('Deleted');
      fetchEntries();
    } catch (err) {
      showToast('Error deleting');
    }
  }
}

async function resetDay() {
  if (!confirm("Clear all today's entries?")) return;
  // In a real app, you'd make a batch delete API endpoint. 
  // For now, we'll just delete them one by one or implementing a 'clear day' endpoint is better.
  // Let's keep it simple for this snippet or add a clear-day endpoint later.
  // We will loop delete for now.
  for (const e of currentEntries) {
    await fetch(`${API_URL}/entries/${e.id}`, { method: 'DELETE' });
  }
  showToast('Reset complete');
  fetchEntries();
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem('cc_user_id');
    window.location.href = 'login.html';
  }
}

// --- UTILS & CONSTANTS ---

function showToast(message) {
  if (els.toastMsg) els.toastMsg.textContent = message;
  else els.toast.textContent = message;
  els.toast.classList.add('toast--show');
  setTimeout(() => els.toast.classList.remove('toast--show'), 2000);
}

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

    // --- ADD THIS LINE BELOW ---
    els.foodAmount.value = 1;
    // ---------------------------

  } else {
    els.amountUnit.textContent = 'g';
    els.perUnitInfo.textContent = `Per 100g: ${food.cals} kcal`;
    els.foodAmount.placeholder = '100';
    els.foodAmount.step = '10';

    // Optional: Auto-set to 100 for gram-based items
    els.foodAmount.value = 100;
  }
}

// Event Listeners
els.saveGoalBtn.addEventListener('click', saveGoal);
els.addForm.addEventListener('submit', addEntry);
els.entries.addEventListener('click', handleEntryClick);
els.resetDayBtn.addEventListener('click', resetDay);
els.logoutBtn.addEventListener('click', handleLogout);
els.foodSelect.addEventListener('change', updatePerUnitInfo);

// Initialize
populateFoods();
