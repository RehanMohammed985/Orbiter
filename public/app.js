const state = {
  articles: [],
  filtered: [],
  filter: 'all',
  notif: false,
  loading: true,
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => Array.from((p || document).querySelectorAll(s));

function pad(n) { return String(n).padStart(2, '0'); }

function fmtTime(iso) {
  const d = new Date(iso);
  const s = (Date.now() - d) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

function tick() {
  const n = new Date();
  const dom = n.getDate();
  const mon = MONTHS[n.getMonth()];
  const yr = n.getFullYear();
  $('#clockdate').textContent = `${dom} ${mon} ${yr}`;
  $('#clocktime').textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
}

function srcShort(s) {
  return s.length > 10 ? s.substring(0, 10) : s;
}

function tagHTML(cats) {
  return cats.map(c => {
    const cls = ({ cs:'tag-cs', ai:'tag-ai', ml:'tag-ml', startups:'tag-startups' })[c] || '';
    return `<span class="tag ${cls}">${c.toUpperCase()}</span>`;
  }).join('');
}

function rowHTML(a, isNew) {
  return `
    <a class="item${isNew ? ' new' : ''}" data-id="${a.id}"
       href="${a.url}" target="_blank" rel="noopener noreferrer">
      <span class="item-time">${fmtTime(a.publishedAt)}</span>
      <span class="item-src">${srcShort(a.source)}</span>
      <span class="item-title">${a.title}</span>
      <span class="item-tags">${tagHTML(a.categories)}</span>
    </a>
  `;
}

function render(animate) {
  $('#loading').classList.add('hidden');
  $('#empty').classList.toggle('hidden', state.filtered.length > 0);

  if (!state.filtered.length) { $('#newsList').innerHTML = ''; return; }

  if (!animate) {
    $('#newsList').innerHTML = state.filtered.map(r => rowHTML(r)).join('');
    return;
  }

  const existing = new Set(
    $$('.item', $('#newsList')).map(el => el.dataset.id)
  );
  const newItems = state.filtered.filter(a => !existing.has(a.id));
  if (newItems.length) {
    $('#newsList').insertAdjacentHTML('afterbegin',
      newItems.map(a => rowHTML(a, true)).join(''));
  }
}

function refreshTimes() {
  $$('.item').forEach(el => {
    const id = el.dataset.id;
    const a = state.articles.find(x => x.id === id);
    if (a) el.querySelector('.item-time').textContent = fmtTime(a.publishedAt);
  });
}

function updateMeta() {
  const total = state.articles.length;
  const shown = state.filtered.length;
  $('#count').textContent = shown;
  $('#panelCount').textContent = `${shown} of ${total}`;
}

function updateFetch() {
  if (state._lastFetch) {
    const s = Math.round((Date.now() - state._lastFetch) / 1000);
    if (s < 60) $('#lastFetch').textContent = `updated ${s}s ago`;
    else $('#lastFetch').textContent = `updated ${Math.floor(s / 60)}m ago`;
  }
}

async function fetchNews() {
  try {
    const url = state.filter === 'all' ? '/api/news' : `/api/news?category=${state.filter}`;
    const res = await fetch(url);
    const data = await res.json();

    const prev = new Set(state.articles.map(a => a.id));
    state.articles = data.articles;
    state._lastFetch = data.fetchedAt ? new Date(data.fetchedAt).getTime() : Date.now();

    if (state.filter === 'all') {
      state.filtered = [...state.articles];
    } else {
      state.filtered = state.articles.filter(a =>
        a.categories.some(c => c.toLowerCase() === state.filter.toLowerCase())
      );
    }

    const fresh = data.articles.some(a => !prev.has(a.id));

    if (state.loading) {
      state.loading = false;
      render(false);
    } else if (fresh) {
      render(true);
      $('#toastMsg').textContent = 'New stories';
      $('#toast').classList.remove('hidden');
      clearTimeout(window.tt);
      window.tt = setTimeout(() => $('#toast').classList.add('hidden'), 2000);
      if (state.notif && document.hidden) {
        try { new Notification('news', { body: 'new stories' }); } catch {}
      }
    }

    updateMeta();
    updateFetch();
  } catch {
    if (state.loading) $('#loading').innerHTML = '<span class="blink">_</span> connection failed';
  }
}

function handleFilter(cat) {
  if (cat === state.filter) return;
  $$('.f-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
  state.filter = cat;
  fetchNews();
}

async function toggleNotif() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    state.notif = !state.notif;
  } else {
    state.notif = (await Notification.requestPermission()) === 'granted';
  }
  $('#notifBtn').textContent = state.notif ? 'notifications on' : 'notifications';
  $('#notifBtn').classList.toggle('on', state.notif);
}

function init() {
  $('#notifBtn').addEventListener('click', toggleNotif);
  $$('.f-btn').forEach(b => b.addEventListener('click', () => handleFilter(b.dataset.filter)));

  tick();
  setInterval(tick, 1000);

  fetchNews();
  setInterval(fetchNews, 30_000);
  setInterval(refreshTimes, 30_000);
  setInterval(updateFetch, 5_000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchNews();
  });
}

document.addEventListener('DOMContentLoaded', init);
