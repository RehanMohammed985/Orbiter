const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { fetchAllNews } = require('../scrapers/sources');
const { filterRelevant } = require('../scrapers/filter');

let mainWindow = null;
let tray = null;
let server = null;
const PORT = process.env.PORT || 3000;
const CACHE_FILE = path.join(app.getPath('userData'), 'cache.json');

function createExpressApp() {
  const serverApp = express();
  serverApp.use(express.json());

  serverApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'widget.html'));
  });
  serverApp.use(express.static(path.join(__dirname, '..', 'public')));

  let newsCache = [];
  let lastFetch = null;
  const FETCH_INTERVAL = 60 * 1000;

  function loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        newsCache = data.articles || [];
        if (data.fetchedAt) lastFetch = new Date(data.fetchedAt);
        console.log(`Loaded ${newsCache.length} articles from cache`);
      }
    } catch (err) {
      console.warn('Cache load failed:', err.message);
    }
  }

  function saveCache(articles) {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ articles, fetchedAt: new Date().toISOString() }));
    } catch (err) {
      console.warn('Cache save failed:', err.message);
    }
  }

  async function refreshNews() {
    try {
      const raw = await fetchAllNews();
      const filtered = filterRelevant(raw);
      newsCache = filtered;
      lastFetch = new Date();
      saveCache(filtered);
      console.log(`[${lastFetch.toLocaleTimeString()}] ${raw.length} fetched → ${filtered.length} relevant`);
    } catch (err) {
      console.error('Refresh failed:', err.message);
    }
  }

  loadCache();
  refreshNews();
  setInterval(refreshNews, FETCH_INTERVAL);

  serverApp.get('/api/news', (req, res) => {
    const { category } = req.query;
    let result = newsCache;
    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      result = newsCache.filter(item =>
        item.categories.some(c => c.toLowerCase() === cat)
      );
    }
    res.json({ articles: result, fetchedAt: lastFetch, total: result.length });
  });

  serverApp.get('/api/sources', (req, res) => {
    res.json([
      { id: 'all', label: 'All' },
      { id: 'cs', label: 'CS' },
      { id: 'ai', label: 'AI' },
      { id: 'ml', label: 'ML' },
      { id: 'startups', label: 'Startups' },
    ]);
  });

  return serverApp;
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
  const tray = new Tray(icon);
  tray.setToolTip('Orbiter');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Orbiter', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
  return tray;
}

app.whenReady().then(() => {
  const serverApp = createExpressApp();
  server = serverApp.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  tray = createTrayIcon();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (server) server.close();
});

app.on('window-all-closed', () => {});
