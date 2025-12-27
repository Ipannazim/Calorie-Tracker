// SERVER.JS (The Backend)
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files


// Database Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Default XAMPP password
    database: 'calorie_tracker'
});

connection.connect(err => {
    if (err) {
        console.error('❌ Database connection failed: ' + err.stack);
        return;
    }
    console.log('✅ Connected to MySQL database.');
});

// --- ROUTES ---

// 1. LOGIN / REGISTER
// Checks if matric number exists. If yes, logs in. If no, creates new user.
app.post('/api/login', (req, res) => {
    const { name, matric } = req.body;

    // Check if user exists
    const checkSql = 'SELECT * FROM users WHERE id = ?';
    connection.query(checkSql, [matric], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            // User exists, login success
            res.json({ success: true, userId: matric, message: 'Login successful' });
        } else {
            // User doesn't exist, create them
            const insertSql = 'INSERT INTO users (id, name) VALUES (?, ?)';
            connection.query(insertSql, [matric, name], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true, userId: matric, message: 'Account created' });
            });
        }
    });
});

// 2. GET USER GOAL
// Fetches the daily calorie goal for the dashboard
app.get('/api/users/:userId', (req, res) => {
    const sql = 'SELECT daily_goal FROM users WHERE id = ?';
    connection.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        // Return found goal or default to 2200 if something is wrong
        res.json(results[0] || { daily_goal: 2200 });
    });
});

// 3. UPDATE GOAL
// Saves the new goal when user clicks "Save"
app.post('/api/users/:userId/goal', (req, res) => {
    const { goal } = req.body;
    const sql = 'UPDATE users SET daily_goal = ? WHERE id = ?';
    connection.query(sql, [goal, req.params.userId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// 4. GET ENTRIES (Filtered by Date)
// Fetches food list for a specific day
app.get('/api/entries/:userId', (req, res) => {
    const userId = req.params.userId;
    const date = req.query.date; // Getting ?date=2025-12-27 from URL

    let sql = 'SELECT * FROM entries WHERE user_id = ?';
    let params = [userId];

    if (date) {
        sql += ' AND date = ?';
        params.push(date);
    }

    connection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 5. ADD NEW FOOD ENTRY
app.post('/api/entries', (req, res) => {
    const { userId, name, unit, amount, cals, date, timestamp } = req.body;

    const sql = `INSERT INTO entries 
                 (user_id, name, unit, amount, cals, date, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [userId, name, unit, amount, cals, date, timestamp], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// 6. DELETE ENTRY
app.delete('/api/entries/:id', (req, res) => {
    const sql = 'DELETE FROM entries WHERE id = ?';
    connection.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running!`);
    console.log(`👉 Open http://localhost:${PORT}/index.html`);
});