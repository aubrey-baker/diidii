const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create persistent database file instead of in-memory
const db = new sqlite3.Database(path.join(__dirname, 'diidii.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    }
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Files table to track uploaded files
    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filetype TEXT NOT NULL,
        filepath TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert default test users if none exist
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
        if (err) {
            console.error('Error checking users:', err);
            return;
        }
        
        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
            stmt.run('user', 'password');
            stmt.run('admin', 'admin123');
            stmt.run('test', 'test123');
            stmt.finalize();
            console.log('Added default test users');
        }
    });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit();
    });
});

module.exports = db;