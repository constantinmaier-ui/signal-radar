# Roadmap & versions

Each version has a clear scope. Anything not listed goes into a later version.
Version numbers: **major.minor** (e.g. 2.1). Major = big step, minor = improvements.

## ✅ 1.0 – First dashboard (2026-11-19)
Bubble meter, hype map (13 themes), theme ranking, IPO radar (Anthropic/Claude, OpenAI, SpaceX …), my plan (allocation, Monte Carlo, crash test), asset classes, superinvestors (SEC 13F), analysts, hidden gems, signal feed from ~40 sources, WhatsApp sharing, public site without login.

## 🔨 2.0 – Simple, understandable, installable (PR #1)
- Today view: daily check, "sensible now / better avoid", signal reader
- Six sections, mobile tab bar, beginner/pro mode, personalisation (interests, visible sections)
- Refresh button; crypto & tech news every minute, collector every 15 minutes
- News impact: 11 event types with typical impact per asset class + research source
- Research: principles with citations; latest papers (Journal of Finance, JFE, NBER, ECB, BIS, Fed, arXiv)
- Real estate: ECB mortgage rates, Eurostat house prices, official rent indices of the 20 largest German cities, rent-cap check, buy calculator
- Installable PWA, offline mode; Content-Security-Policy
- New asset classes (money market, inflation-linked, quality, small value, infrastructure, private credit, broad commodities) + 12 instrument explainers
- Insider purchases (SEC Form 4); recession early-warning (FRED); sentiment barometer; commodity monitor (18 futures)
- Evidence level & source on every section; ask-your-own-AI (Claude/ChatGPT)
- Trend radar + real-usage signals (AI SDK downloads, Hugging Face, GitHub, stablecoins, DeFi TVL, German power price)
- Money levers calculator, financial fitness check & daily quiz
- Encrypted backup (AES-256-GCM); daily history archive in the `data` branch

## 🔜 2.1 – AI bubble & personal plan
- AI bubble monitor with action plan
- "My portfolio & income" (optional, local, encrypted) + diversification/concentration check
- Automatic encrypted sync across devices (own cloud / WebDAV)
- Track record: public hit rate of the radar's own signals (data collected since 2.0)
- More sources: Bluesky, Reddit mentions, more investors, events calendar, EIA forecasts, futures curves
- Details & order: docs/TASKS.md

## 🔜 3.0 – Regional & native
- Real estate location check by address (OpenStreetMap: transit, shops, schools, doctors, parks within 1 km)
- Official regional real-estate data (Census 2022 / Regionalstatistik via GENESIS API; free registration needed)
- Watchlist price alerts (push notifications)
- Native desktop app (Tauri) with code-signing certificate so Windows shows no warning (~€200–400/year)
- Long-run expected returns from valuation (e.g. CAPE → 10-year expected return)

## 💡 4.0 – Idea backlog (not scheduled)
Portfolio import (broker CSV), more markets/countries, English UI.
