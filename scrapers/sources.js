const axios = require('axios');
const Parser = require('rss-parser');
const { categorize } = require('./categorize');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
});

const SOURCES = [
  {
    name: 'Hacker News',
    type: 'api',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    itemUrl: (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
  },
  {
    name: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/feed/',
  },
  {
    name: 'Ars Technica',
    type: 'rss',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
  },
  {
    name: 'The Verge',
    type: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
  },
  {
    name: 'NYT Tech',
    type: 'rss',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  },
];

async function fetchHackerNews() {
  try {
    const { data: ids } = await axios.get(SOURCES[0].url, { timeout: 10000 });
    const topIds = ids.slice(0, 30);

    const items = (await Promise.all(
      topIds.map(async (id) => {
        try {
          const { data } = await axios.get(SOURCES[0].itemUrl(id), { timeout: 5000 });
          return data;
        } catch { return null; }
      })
    )).filter(Boolean).filter(i => i.type === 'story' && i.title);

    return items.map(item => ({
      id: `hn-${item.id}`,
      title: item.title,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      source: 'Hacker News',
      publishedAt: new Date(item.time * 1000).toISOString(),
      summary: (item.text || '').replace(/<[^>]+>/g, '').substring(0, 250),
      categories: categorize(item.title, item.text || ''),
    }));
  } catch (err) {
    console.error('HN error:', err.message);
    return [];
  }
}

async function fetchRSS(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 15).map(item => {
      const summary = (item.contentSnippet || item.content || '')
        .replace(/<[^>]+>/g, '').trim().substring(0, 250);

      return {
        id: Buffer.from(`${source.name}-${item.guid || item.link || item.title}`)
          .toString('base64').substring(0, 40),
        title: item.title || 'No title',
        url: item.link || '',
        source: source.name,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        summary,
        categories: categorize(item.title || '', summary),
      };
    });
  } catch (err) {
    console.error(`${source.name} error:`, err.message);
    return [];
  }
}

async function fetchAllNews() {
  const results = await Promise.all([
    fetchHackerNews(),
    ...SOURCES.slice(1).map(s => fetchRSS(s)),
  ]);

  const allNews = results.flat();

  const seen = new Set();
  const deduped = allNews.filter(item => {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return deduped;
}

module.exports = { fetchAllNews };
