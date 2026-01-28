const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const query = (sql, params = []) => {
    try {
        if (sql.toUpperCase().includes('SELECT')) {
            const stmt = db.prepare(sql);
            return { rows: stmt.all(...params) };
        } else {
            const stmt = db.prepare(sql);
            const info = stmt.run(...params);
            return { rows: [], lastID: info.lastInsertRowid, changes: info.changes };
        }
    } catch (error) {
        throw error;
    }
};

module.exports = { query: (sql, params) => Promise.resolve(query(sql, params)) };
