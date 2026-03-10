# 🎬 CineScope — Bollywood Movie Recommendation System

Search 236 Bollywood films by movie, actor, singer, song or director.  
Get full details, posters, **inline YouTube trailers**, and smart recommendations.

---

## 🚀 Deploy to Render (3 steps)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "CineScope init"
git remote add origin https://github.com/YOUR_USER/cinescope.git
git push -u origin main
```

2. Go to **render.com → New → Web Service → Connect repo**  
3. Render auto-reads `render.yaml` → click **Deploy** ✅

Build: `npm install && node seed.js`  
Start: `node server.js`

---

## 💻 Run Locally

```bash
npm install
node seed.js     # creates data/movies.db
node server.js   # http://localhost:3000
```

---

## 📁 Structure

```
cinescope/
├── server.js          # Express API
├── seed.js            # DB seeder
├── package.json
├── render.yaml
├── data/
│   └── movies.sql     # 236 movies (clean SQL)
└── public/
    └── index.html     # Full standalone frontend
```

## 🔌 API

| Endpoint | Description |
|----------|-------------|
| `GET /api/search?q=&type=&sort=` | Search |
| `GET /api/movie/:id` | Movie + recommendations |
| `GET /api/featured` | Top / trending / recent |
| `GET /api/genres` | All genres |
| `GET /api/stats` | Stats |
