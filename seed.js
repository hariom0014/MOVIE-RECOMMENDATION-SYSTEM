const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH  = path.join(DATA_DIR, 'movies.db');
const SQL_PATH = path.join(DATA_DIR, 'movies.sql');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(SQL_PATH, 'utf8'));

const n = db.prepare('SELECT COUNT(*) as n FROM movies').get().n;
console.log(`✅ DB seeded: ${n} movies → ${DB_PATH}`);
db.close();
