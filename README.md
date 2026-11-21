# 📡 Signal-Radar

A free, open-source investment dashboard for private investors. It reads 100+ public data sources and translates them into plain-language signals: what is going on, what it means, and what you could do next. Every section states its **source** and how strong the **scientific evidence** behind it is.

**The app itself is in German** (target audience: German-speaking retail investors). Code and documentation are in English.

Live: https://constantinmaier-ui.github.io/signal-radar/ – no login, installable as an app (PWA) on Windows, macOS, Android and iOS.

> Not investment advice. The radar shows patterns, probabilities and risks – not buy/sell recommendations.

## What it does
| Area | Content |
|---|---|
| **Today** | Market traffic light, one-sentence verdict, "sensible now / better avoid", top signals, news impact, ask-your-own-AI (Claude/ChatGPT) |
| **My plan** | Input form (amount, savings rate, horizon, risk quiz) → example allocation, Monte Carlo range, 2008-style crash test, anti-hype rules, cost/levers calculator, financial fitness check & daily quiz |
| **Markets** | Recession early-warning (FRED: yield curve, high-yield spread, Sahm rule), 20 asset classes with EU risk class 1–7, commodity monitor (18 futures), real estate (ECB mortgage rates, Eurostat house prices, official rent indices of the 20 largest German cities, rent-cap check, buy calculator), sentiment barometer |
| **Opportunities** | Trend radar (unusual moves in multiples of normal volatility), real-usage signals (AI SDK downloads, Hugging Face, GitHub, stablecoins, DeFi TVL, German power price), hype map of 13 themes, rule-based "hidden gems", IPO radar (Anthropic, OpenAI, SpaceX …) |
| **Pros** | Superinvestor 13F filings, insider purchases (SEC Form 4), analyst voices and price targets |
| **News** | 11 event types (rates, tariffs, war, elections, earnings …) with typical impact per asset class and research source; aggregated feed |
| **Knowledge** | Research principles with citations, latest papers (Journal of Finance, JFE, NBER, ECB, BIS, Fed, arXiv), glossary, sources, security |

## How it works
- `collector/` runs every 15 minutes in GitHub Actions, fetches all sources server-side and writes `site/data/*.json`. History is also archived daily to the `data` branch.
- `site/` is a static web app (plain HTML/CSS/JS, no dependencies). Bitcoin and tech news refresh live every minute in the browser.
- Personal data (plan, watchlist, settings) stays on the device; it can be exported as an AES-256-GCM encrypted backup.

## Setup (one-time)
1. Repository → **Settings → Pages → Build and deployment → Source: "GitHub Actions"** (browser only; not available in the GitHub mobile app).
2. **Actions → Signal-Radar → Run workflow.** The site is live after ~3 minutes.
3. Optional secrets (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY` – Claude writes the daily briefing and translates analyst quotes/paper titles into German.
   - `SEC_USER_AGENT` – contact string for SEC EDGAR requests (e.g. `Name mail@example.com`).

## Develop locally
```bash
npm ci
npm run demo     # demo data: the real collector against a simulated network (clearly marked as demo)
npm run serve    # http://localhost:8080
npm test         # unit tests + full collector run against mocked sources
```

## Project files
`docs/ROADMAP.md` (versions & scope) · `docs/TASKS.md` (prioritised backlog) · `docs/DECISIONS.md` (decision log) · `docs/COMPETITORS.md` · `CHANGELOG.md` · `SECURITY.md`
