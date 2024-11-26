const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Create users table
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Insert sample users (for testing purposes)
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run('user', 'password');
    stmt.run('admin', 'admin123');
    stmt.run('test', 'test123');
    stmt.finalize();
});

module.exports = db;