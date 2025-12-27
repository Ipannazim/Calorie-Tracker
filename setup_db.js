const mysql = require('mysql2');

// Database Configuration
const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '' // Default XAMPP/WAMP password
};

const connection = mysql.createConnection(config);

connection.connect(err => {
    if (err) {
        console.error("❌ Could not connect to MySQL Server.", err.message);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL Server.");

    // 1. NUCLEAR OPTION: Drop Database Completely
    connection.query("DROP DATABASE IF EXISTS calorie_tracker", (err) => {
        if (err) {
            console.error("❌ Error dropping old database:", err.message);
            // Proceed anyway to try creating it
        }
        console.log("🗑️  Old database dropped (if existed).");

        // 2. Create Database
        connection.query("CREATE DATABASE calorie_tracker", (err) => {
            if (err) {
                console.error("❌ Error creating database:", err.message);
                process.exit(1);
            }
            console.log("✅ Database 'calorie_tracker' created.");

            // 3. Switch to Database
            connection.changeUser({ database: 'calorie_tracker' }, (err) => {
                if (err) {
                    console.error("❌ Error changing database:", err.message);
                    process.exit(1);
                }

                // 4. Create Users Table
                const usersTable = `
                CREATE TABLE users (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100),
                    daily_goal INT DEFAULT 2200
                ) ENGINE=InnoDB`;

                connection.query(usersTable, (err) => {
                    if (err) {
                        console.error("❌ Error creating users table:", err.message);
                        process.exit(1);
                    }
                    console.log("✅ Table 'users' created.");

                    // 5. Create Entries Table
                    const entriesTable = `
                    CREATE TABLE entries (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50),
                        name VARCHAR(100),
                        unit VARCHAR(20),
                        amount FLOAT,
                        cals FLOAT,
                        date DATE,
                        timestamp BIGINT,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB`;

                    connection.query(entriesTable, (err) => {
                        if (err) {
                            console.error("❌ Error creating entries table:", err.message);
                            process.exit(1);
                        }
                        console.log("✅ Table 'entries' created.");
                        console.log("🎉 SUCCESS: Database Setup Complete.");
                        process.exit(0);
                    });
                });
            });
        });
    });
});
