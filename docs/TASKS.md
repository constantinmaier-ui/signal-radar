# Tasks

Status: `[x]` done · `[~]` in progress · `[ ]` open · 👤 = owner has to do it

## Now (version 2.0)
- [x] Daily check & signal reader; six sections, mobile tab bar, beginner/pro mode
- [x] Refresh button + live data every minute; collector every 15 minutes
- [x] News impact (11 event types); research principles + latest papers (top journals, NBER, ECB, BIS, Fed, arXiv)
- [x] Real estate data + calculator; official rent indices of the 20 largest cities (edition, publisher, calculator yes/no, required inputs); rent-cap check
- [x] PWA install + offline; Content-Security-Policy + SECURITY.md
- [x] New asset classes (7) + 12 instrument explainers
- [x] Insider purchases (SEC Form 4); recession early-warning (FRED); sentiment barometer; commodity monitor (18 futures, share button)
- [x] Evidence level & source on every section; personalisation; "suggestions, not recommendations"
- [x] Ask your own AI (Claude, ChatGPT, copy for others)
- [x] Trend radar + AI trends (GitHub, Hugging Face); real-usage signals (PyPI/npm, DefiLlama, Energy-Charts)
- [x] Money levers with cost calculator; financial fitness check & daily quiz; "About the radar"
- [x] Daily archive of signals & prices for the later hit rate; history in branch `data`
- [x] Encrypted backup (AES-256-GCM) to move data between devices
- [x] docs/COMPETITORS.md; GitHub texts in English
- [x] Goal/risk profile on the daily check (safety, balanced, growth, bold) drives verdict, suggestions and plan; lump-sum advice follows research (Vanguard) instead of always staggering
- [x] "Ideas that fit your goal" (themes, insiders, gems, crypto share for bold) with reasons
- [x] Explicit "⚡ Hype" badge with reason on themes, signals and trend radar
- [ ] 👤 Enable GitHub Pages: Settings → Pages → Source "GitHub Actions" (desktop browser)
- [ ] Merge PR #1 (owner's approval needed)
- [ ] After the first real run: check sources, fix failures
- [ ] Tag version 2.0 as `v2.0`
- [ ] Translate code comments in older files to English
- [ ] 👤 Optional: secret `ANTHROPIC_API_KEY` for Claude briefing & translations

## Next (version 2.1) – prioritised by value ÷ effort
| # | Task | Value | Effort | Note |
|---|---|---|---|---|
| 1 | **AI bubble monitor** with action plan (equal-weight ETF, "picks & shovels", rebalancing) | very high | medium | Nvidia overextension, top-10 concentration, AI attention, valuations |
| 2 | **My portfolio & income** (optional, local, encrypted): emergency fund, savings rate, plan comparison, concentration warning | very high | medium | |
| 3 | **Track record**: how often were "overheated", "rising quietly" etc. right after 1/3 months? Public | very high | medium | Data archived since 2.0; evaluate after ≥ 4 weeks |
| 4 | **Automatic encrypted sync** across devices (WebDAV/Nextcloud, own cloud) | high | medium | Complements the manual backup |
| 5 | **Pattern statistics**: "When X happened, what followed?" from 10 years of prices | high | medium | Honest base rates instead of predictions |
| 6 | **Commodity forecasts**: EIA Short-Term Energy Outlook | high | small | 👤 free EIA key |
| 7 | **Futures curves** (contango/backwardation) for 3/6/12 months | high | medium | Very useful for procurement |
| 8 | **Bluesky signals** (open, free API) | medium | small | X/Twitter API costs ≥ $200/month and scraping is prohibited |
| 9 | **Crowd vs. contrarian**: Reddit mentions per stock | medium | small | Retail herding tends to underperform (Barber, Odean & Zhu 2009) |
| 10 | **More investors**: Terry Smith, Chuck Akre, Mohnish Pabrai … | medium | small | Past top returns rarely persist (Carhart 1997) |
| 11 | **Events calendar**: Fed/ECB meetings, earnings of top companies | medium | medium | 👤 free Finnhub key for earnings |
| 12 | **Kalshi** (regulated US prediction market) | small | small | |
| 13 | **Put/call ratio (CBOE)**, NAAIM, AAII survey for the sentiment barometer | medium | small | Sentiment evidence is weak → low priority |
| 14 | **More usage signals**: Docker pulls, app rankings, Google Trends, building permits (Destatis) | medium | medium | Check evidence per source |
| 15 | **World Bank Pink Sheet**, European power & CO₂ prices | medium | medium | |

## Later (version 3.0)
- [ ] Location check by address (OpenStreetMap)
- [ ] GENESIS access for regional data (👤 free registration at regionalstatistik.de)
- [ ] Price alerts
- [ ] Desktop app (Tauri) + code signing (👤 buy certificate)

## Reviewed & deliberately not (for now)
- **X/Twitter**: paid API, scraping prohibited → Bluesky, Reddit, Hacker News instead.
- **AI price predictions**: short-term price forecasts are not scientifically reliable → probabilities, patterns and risks instead.
- **Rents/prices per address from listing portals**: no free API, scraping prohibited → OpenStreetMap location check + official data (3.0).
- **DuckDB**: useful once years of history are stored (3.0/4.0); JSON is enough for now.
