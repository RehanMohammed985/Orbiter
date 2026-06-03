const express = require('express');
const path = require('path');
const { fetchAllNews } = require('./scrapers/sources');
const { filterRelevant } = require('./scrapers/filter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

let newsCache = [];
let lastFetch = null;
const FETCH_INTERVAL = 60 * 1000;

async function refreshNews() {
  try {
    const raw = await fetchAllNews();
    const filtered = filterRelevant(raw);
    newsCache = filtered;
    lastFetch = new Date();
    console.log(`[${lastFetch.toLocaleTimeString()}] ${raw.length} fetched → ${filtered.length} relevant`);
  } catch (err) {
    console.error('Refresh failed:', err.message);
  }
}

refreshNews();
setInterval(refreshNews, FETCH_INTERVAL);

app.get('/api/news', (req, res) => {
  const { category } = req.query;
  let result = newsCache;

  if (category && category !== 'all') {
    const cat = category.toLowerCase();
    result = newsCache.filter(item =>
      item.categories.some(c => c.toLowerCase() === cat)
    );
  }

  res.json({
    articles: result,
    fetchedAt: lastFetch,
    total: result.length,
  });
});

app.get('/api/sources', (req, res) => {
  res.json([
    { id: 'all', label: 'All' },
    { id: 'cs', label: 'CS' },
    { id: 'ai', label: 'AI' },
    { id: 'ml', label: 'ML' },
    { id: 'startups', label: 'Startups' },
  ]);
});

app.listen(PORT, () => {
  console.log(`\n  News Dashboard running at http://localhost:${PORT}\n`);
});
