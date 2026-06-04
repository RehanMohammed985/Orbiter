# Orbiter

A macOS desktop app that delivers the tech stories that actually matter — no listicles, no deals, no noise. Pulls from HN, TechCrunch, Ars, The Verge, and NYT Tech, scores every story, and only shows what's relevant.

## Download

Grab the latest `.dmg` from the [Releases](https://github.com/RehanMohammed985/Orbiter/releases) page.

1. Open `Orbiter-1.0.0-arm64.dmg`
2. Drag **Orbiter** into **Applications**
3. Right-click → **Open** (first launch only — macOS warning for unsigned apps)
4. Orbiter lives in your menu bar. Click to show/hide the window. Quit from the menu bar icon to fully exit.

> **Note:** The first launch takes a few seconds to fetch and load everything. After that, it caches data locally so subsequent launches are instant.

## Build from source

```bash
git clone https://github.com/RehanMohammed985/Orbiter.git
cd Orbiter
npm install

# Run in development mode:
npm start

# Build distributable .dmg:
npm run build
# → dist/Orbiter-1.0.0-arm64.dmg
```

## How it works

**Scraping** — Fetches from HN (Firebase API) and 4 RSS feeds every 60 seconds. Each story gets scored: +10 per signal (company mention, event keyword, AI model name), auto-reject at -20 for listicles/deals/reviews. Score ≥ 10 passes, ≥ 20 hits the breaking hero bar.

**Frontend** — A single HTML file with all CSS/JS inlined. Polls the server every 10 seconds. Day-grouped layout with breaking stories at top. Auto-categorizes into CS/AI/ML/Startups.

**Desktop app** — Wrapped in Electron. Lives in the menu bar. Closing the window hides it (doesn't quit). Caches data to disk for instant startup.

## Stack

- Node.js / Express (backend)
- Electron (desktop wrapper)
- RSS + HN API scraping
- One HTML file frontend, zero JS/CSS dependencies

## Pipeline

```
5 sources → ~85 raw → scoring → ≥ 10? → ~34 relevant
                                         ↓
                                   ≥ 20? → Breaking bar
                                   < 20? → Day-grouped list
```
