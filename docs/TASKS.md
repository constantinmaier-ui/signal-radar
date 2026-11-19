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
- [x] 👤 Enable GitHub Pages; PR #1 merged; first real run: 95/116 sources ok
- [ ] Merge PR #2 (rest of 2.0 + 2.1 start; owner's approval needed)
- [ ] Fix the 21 failing sources (👤 screenshot of Wissen → Methodik → Quellen, or I read data.json once the network allows it)
- [ ] Tag version 2.0 as `v2.0`
- [ ] Translate code comments in older files to English
- [ ] 👤 Optional: secret `ANTHROPIC_API_KEY` for Claude briefing & translations

## Now (version 2.1) – owner requests of 2026-11-19, in priority order
- [x] **App-wide search** (key `/` or Ctrl+K): sections, glossary, themes, prices, signals, rent indices, investors, insiders, AI software, studies, news
- [x] **"Show all" + ranks** instead of fixed cut-offs (trend radar, AI software with filter, studies, insiders, consensus, voices, prediction markets)
- [x] **Detail view for every trend item**: key points in plain language, chart, sources, further reading (assets, commodities, AI models/projects, studies)
- [x] **Peer-reviewed research, always current**: OpenAlex (12 top journals): most cited of 24 months + newest; DOI link, citations, field-weighted impact, free version; refreshed every 6 h
- [x] **Official sentiment measures**: EU Economic Sentiment Indicator (DE, euro area), EU consumer confidence DE, University of Michigan consumer sentiment (percentile since start), Gilchrist–Zakrajšek excess bond premium + recession probability (Fed)
- [x] **Plan sharing that makes sense**: link opens the same plan (adjustable), amounts optional, system share sheet / copy; nothing uploaded
- [x] **KPI audit (independent expert review)**: KPI catalog in the app (method, research, evidence, limits for 13 KPIs); fixed: wrong advice when red is caused by euphoria, invented track-record claim, misattributed citations, "take profits" advice, one lump-sum rule everywhere, crash test on the whole portfolio (2008/09 ≈ −50 %), costs + rough German tax in the plan, median label, 13F age (up to 4.5 months), split adjustment, index funds excluded, gem score bug + honest name, dividend-adjusted prices, robust attention z-score, non-overlapping news acceleration, 12-1 momentum, "overheated" only after a 2-year doubling, EU PRIIPs risk bands, no double counting in the sentiment barometer, bubble meter without crypto/chatter, Sahm rule wording, mobile header, "Wissen" in the navigation
- [ ] **KPI audit, part 2**: stress = St. Louis Fed Financial Stress Index (STLFSI4) or Chicago Fed NFCI; valuation = CAPE / excess CAPE yield by region; MSCI World US weight & top-10 concentration; event direction (rate hike vs cut) and German/English keyword lists ("war"); routine vs opportunistic insider trades; puts in 13F; track record of the app's own signals (history since 2.0)
- [ ] **Investors & insiders by interest area**: pick areas → matching superinvestors (by style/sector), insider purchases filtered to those sectors; more investors; Germany: BaFin directors' dealings, short positions (Bundesanzeiger)
- [ ] **Germany focus + world**: DAX 40 movers, MDAX/SDAX/TecDAX, Euro Stoxx 50, Nikkei, emerging markets; tagesschau API; Bundesbank & Destatis data
- [ ] **Investor profile survey at the start** (always editable): risk tolerance (Grable & Lytton 1999), risk capacity, horizon, loss aversion, experience (as MiFID II suitability asks) → sets goal profile
- [ ] **Optional current portfolio** (local + encrypted, app works without it): ISIN lookup via OpenFIGI, import from Portfolio Performance/Ghostfolio CSV; concentration, costs, fit to goal
- [ ] **Learning units "How the greats got there"** (Buffett, Munger, Bogle, Lynch, Templeton, Graham, Simons, Dalio): short, gamified (streaks, badges, quiz), with sources; what is luck vs. method
- [ ] **AI bubble monitor data (free, official where possible)**: hyperscaler capex (Microsoft, Alphabet, Amazon, Meta) from SEC XBRL company facts; AI compute and model data (Epoch AI); MSCI World top-10 concentration from issuer holdings files; Nvidia share of index
- [ ] **ETF facts**: holdings, costs (TER), concentration from issuer files (iShares, Vanguard, Xtrackers); OpenFIGI for ISIN lookup
- [ ] **Bitcoin on-chain basics**: mempool.space (fees, hashrate; open source, free)
- [ ] **More little-known free APIs**: DBnomics (80+ statistics offices in one API), Metaculus (forecasts), bund.dev (German government APIs), OpenFIGI, GLEIF, OECD/IMF SDMX
- [ ] 👤 Optional: free OpenAlex key as secret `OPENALEX_API_KEY` (more daily budget)

## Next (version 2.2) – prioritised by value ÷ effort
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
- **Reuters as a source**: no free API (Reuters/LSEG data is paid, public RSS feeds were discontinued in 2020) → Reuters headlines arrive via Google News; tagesschau, Handelsblatt, FAZ, CNBC cover the same events.
- **DuckDB**: useful once years of history are stored (3.0/4.0); JSON is enough for now.
