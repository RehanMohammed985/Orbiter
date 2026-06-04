const { fetchAllNews } = require('../scrapers/sources');
const { filterRelevant } = require('../scrapers/filter');

let newsCache = [];
let lastFetch = null;
let fetchPromise = null;

async function refreshNews() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const raw = await fetchAllNews();
    newsCache = filterRelevant(raw);
    lastFetch = Date.now();
    console.log(`Fetched ${raw.length} → ${newsCache.length} relevant`);
  })();
  try {
    await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const cacheAge = lastFetch ? Date.now() - lastFetch : Infinity;
  if (cacheAge > 120000 || newsCache.length === 0) {
    try {
      await refreshNews();
    } catch (err) {
      console.error('Refresh failed:', err.message);
      if (newsCache.length === 0) {
        return res.status(503).json({ error: 'Failed to fetch news' });
      }
    }
  }

  const { category } = req.query;
  let result = newsCache;
  if (category && category !== 'all') {
    const cat = category.toLowerCase();
    result = newsCache.filter(item =>
      item.categories.some(c => c.toLowerCase() === cat)
    );
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.json({
    articles: result,
    fetchedAt: lastFetch ? new Date(lastFetch).toISOString() : null,
    total: result.length,
  });
};
