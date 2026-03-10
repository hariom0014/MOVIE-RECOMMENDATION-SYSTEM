const express = require('express');
const path    = require('path');
const fs      = require('fs');
const Database = require('better-sqlite3');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DB ────────────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH  = path.join(DATA_DIR, 'movies.db');
const SQL_PATH = path.join(DATA_DIR, 'movies.sql');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  const ok = db.prepare("SELECT COUNT(*) as n FROM sqlite_master WHERE type='table' AND name='movies'").get();
  if (ok.n === 0) {
    db.exec(fs.readFileSync(SQL_PATH, 'utf8'));
    console.log('✅ DB auto-seeded');
  }
} catch {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(fs.readFileSync(SQL_PATH, 'utf8'));
  console.log('✅ DB created & seeded');
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── HELPERS ───────────────────────────────────────────────────────────────────
const lp = t => `%${t.trim()}%`;

// ── API ───────────────────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const { q = '', type = 'all', genre = '', sort = 'rating' } = req.query;
  if (!q.trim()) return res.json({ results: [], count: 0 });

  const t = lp(q);
  const typeMap = {
    movie:    'title LIKE ?',
    actor:    'actors LIKE ?',
    singer:   'singers LIKE ?',
    song:     'songs LIKE ?',
    director: 'director LIKE ?',
  };
  const where  = typeMap[type] || '(title LIKE ? OR actors LIKE ? OR singers LIKE ? OR songs LIKE ? OR director LIKE ?)';
  const params = typeMap[type] ? [t] : [t, t, t, t, t];
  if (genre) { params.push(`%${genre}%`); }

  const orderMap = { rating: 'rating DESC', year: 'year DESC, rating DESC', az: 'title ASC', box: 'box_office DESC' };
  const order = orderMap[sort] || 'rating DESC';

  const sql = `SELECT * FROM movies WHERE (${where})${genre ? ' AND genres LIKE ?' : ''} ORDER BY ${order} LIMIT 60`;
  const rows = db.prepare(sql).all(...params);
  res.json({ results: rows, count: rows.length });
});

app.get('/api/movie/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Not found' });
  const genres = (movie.genres || '').split(',').map(g => g.trim()).filter(Boolean);
  const gWhere = genres.map(() => 'genres LIKE ?').join(' OR ');
  const recs = genres.length
    ? db.prepare(`SELECT * FROM movies WHERE (${gWhere}) AND id != ? ORDER BY rating DESC LIMIT 12`).all(...genres.map(g=>`%${g}%`), movie.id)
    : [];
  res.json({ movie, recommendations: recs });
});

app.get('/api/featured', (req, res) => {
  res.json({
    topRated:  db.prepare('SELECT * FROM movies ORDER BY rating DESC LIMIT 16').all(),
    trending:  db.prepare('SELECT * FROM movies ORDER BY box_office DESC LIMIT 16').all(),
    recent:    db.prepare('SELECT * FROM movies ORDER BY year DESC, rating DESC LIMIT 16').all(),
  });
});

app.get('/api/genres', (req, res) => {
  const rows = db.prepare('SELECT genres FROM movies').all();
  const s = new Set();
  rows.forEach(r => (r.genres||'').split(',').forEach(g => { const t=g.trim(); if(t) s.add(t); }));
  res.json({ genres: [...s].sort() });
});

app.get('/api/stats', (req, res) => {
  const total     = db.prepare('SELECT COUNT(*) as n FROM movies').get().n;
  const avgRating = db.prepare('SELECT ROUND(AVG(rating),1) as avg FROM movies').get().avg;
  const years     = db.prepare('SELECT MIN(year) as mn, MAX(year) as mx FROM movies WHERE year > 0').get();
  res.json({ total, avgRating, yearRange: years });
});

// fallback
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🎬 CineScope on http://localhost:${PORT}`));
