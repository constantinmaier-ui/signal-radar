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

## Now (version 3.0) – guided, personal UX (owner request 2026-11-21)
- [x] **Personal start (optional, editable)**: interests, goal + horizon (short risk-tolerance question, Grable & Lytton 1999 / MiFID II style), experience, optional portfolio
- [x] **Clear path, fewer tabs**: Heute · Mein Geld · Entdecken · Profis & News · Menü; sections outside the user's interests collapsed under "Weitere Bereiche"; bottom navigation adapts to interests
- [x] **Menu with everything**, grouped, jumps straight to each section
- [x] **My portfolio (local only)**: allocation vs. plan, concentration warnings, what the radar says about each holding
- [x] **Everything clickable**: market tiles, asset cards and commodity rows open detail views with chart, key points and related news
- [x] **Executive summary "Das Wichtigste heute"**: situation, what fits you / your portfolio, top chance, top risk, news situation; every line links to its details; quick-access chips ordered by interests
- [x] **Value made clear**: short intro on the first onboarding screen
- [x] **Data every 15 minutes**: each workflow run starts the next one (~15 min), the schedule restarts the chain; failing sources are listed in the workflow log (audit)
- [x] **Faster start**: first view from the stored copy, fresh data right after
- [x] **Transparency**: source table shows how often each source updates
- [x] **Start screen explains sources, update frequency and the edge over other portals/apps** (expandable, also under Wissen → Über das Radar; honest limits included)
- [x] **Source audit 2026-11-21** (109/128 ok): SEC (13F + insiders) rejected the User-Agent without e-mail → fixed default; Reddit blocks cloud servers → removed; Yahoo RSS moved (404) → removed; GDELT rate limit → hourly refresh + retry + last value kept
- [ ] 👤 Optional: secret `SEC_USER_AGENT` with a real contact e-mail (SEC fair-access policy)
- [ ] Next: every chart point and news item opens context; guided tour

## Now (version 5.3) – answers, not just data (owner request 2026-11-21)
- [x] **SEC secret set by the owner**: 145/146 sources ok (insider buys and superinvestors back)
- [x] **Short answers to questions** ("Lohnt sich Gold?"): fit with the profile (planned share), state now (trend, distance from high, overheating), timing hint, what research says, link to details
- [x] **Feed filters that never contradict**: area → theme (themes belong to an area), counts on every chip, tap again = off, active filters with ✕ and reset
- [x] **Visual news situation**: stories per area (24 h vs. usual), themes with most news and their tempo; tap filters
- [x] **Risk profile one tap away** on "Heute"; onboarding no longer changes the profile before "Speichern"
- [x] **Arrows explained** (legend under the market tiles, glossary entry)
- [ ] Short answers also inside every detail and theme view ("Lohnt sich das für mich?")
- [ ] Trend map: themes on a chart over time (attention vs. price), not just today

## Now (version 5.2) – everything works, everything means something (owner request 2026-11-21), by value ÷ effort
- [x] **Backup fixed for phones**: iPhone/Android open the share sheet (Files, iCloud, Dropbox, Google Drive) instead of a download that silently does nothing; clear steps (1. password, 2. how); every action gives visible feedback
- [x] **All navigation checked automatically**: 38 menu targets, 14 quick links, 4 menu actions land on a visible target; Profi-only targets switch the view on
- [x] **Commodities profile for private investors** (not procurement): gold/silver in euro, how to invest (ETC, Xetra-Gold, 5–10 %), research fact
- [x] **Every click explains first** (owner: "redirects are illogical"): lines in "Dein Radar", summary chance/risk, signals and trends open an explanation of exactly that item (history, what it is, what it means for you, source) with "Mehr dazu: <area> →" below; no more jumps to unrelated pages; IPO rows go to that company's card; 34 clicks verified automatically
- [x] **"Dein nächster Schritt"**: progress of the personal setup and the next 2 useful steps (use, risk profile, age & goal, portfolio, backup, install), each one tap away
- [x] **Commodities for both**: "Rohstoffe & Edelmetalle als Anlage" and "Rohstoffe beruflich (Einkauf)" as separate profiles; procurement tips as an optional box
- [ ] **"Was heißt das für dich?" in every section** (charts, commodities, markets): one line based on profile, horizon and portfolio
- [ ] **Signal-Aggregator v1** (see STRATEGY.md): evidence-weighted, horizon-matched, agreement as confidence, hype brake, historical check before display
- [ ] **Sync across devices via Dropbox** – 👤 owner creates a Dropbox app (3 clicks) and sends the app key
- [ ] Official outlooks and reports (IMF, ECB, Bundesbank, BIS, World Bank) summarised with links; company filings via SEC once the secret is set

## Now (version 5.1) – clear structure, everything editable and explained (owner request 2026-11-21)
- [x] **Sub-pages instead of one long page**: each tab is split into areas (e.g. Entdecken: Anlagen · Trends & Chancen · Rohstoffe · Immobilien · Konjunktur & Stimmung); only the chosen area is shown; links, menu, search and back button land on the right one; order follows the user's interests
- [x] **"👤 Mein Profil"**: everything entered in one place, each part editable on its own (save without going through the whole setup); risk profile explained with real numbers (share in stocks, crash test) and a comparison table
- [x] **"ⓘ Wie entsteht das?"** on every gauge and section: how it is made, evidence level, what it means now for the user's profile, update time and frequency, further reading
- [x] **News by area** (Wirtschaft, Tech & KI, Krypto, Energie, Rohstoffe, Gesundheit, Politik, Amtlich) and 7 more trusted specialist sources (heise, Golem, MIT Technology Review, pv magazine, Electrek, The Block, DW)
- [x] **New themes**: renewable energy (ICLN), India (INDA)
- [x] **Einsteiger/Profi switch**: visible feedback on what changes
- [ ] Profi mode with more visible differences on every page (key figures inline, charts expanded)
- [ ] Audit of the event categories (e.g. "Politik"): split into narrower, research-backed types (central bank decisions, tariffs, sanctions, elections, fiscal policy) with event-study evidence each
- [ ] Cautious, aggregated outlook per theme ("Nischen-Scanner") with an honest historical check

## Now (version 5.0) – fully personal (owner request 2026-11-21), by value ÷ effort
- [x] **Exact age** instead of ranges, retirement age (default 67), years to retirement
- [x] **Goal**: build wealth, close the pension gap, financial freedom, home, children, own goal (amount + year)
- [x] **"Dein Ziel & Rentenlücke"** card: gap per month, capital needed (4 % rule, Bengen 1994), monthly saving at the profile's real return; editable in place
- [x] **Detailed portfolio**: pick a real ETF (name, ticker or ISIN), DAX/US stock or **any crypto coin** (CoinGecko), enter units; value follows the live price (ETFs/stocks every 15 min, crypto live); total change today
- [x] **More topics at the start**: all 16 trend themes selectable (watchlist) plus **own topics** as free text; own topics in "Dein Radar", a feed filter "Meine Themen", and "remember as topic" in search
- [ ] Portfolio import from a broker CSV (e.g. Trade Republic, Scalable, ING export)
- [ ] Any stock or ETF worldwide with a live price (needs a quote source the browser may call; today: 35 popular instruments + all theme stocks, others with a manual value)
- [ ] Alerts for own topics and holdings (price move, news spike)

## Now (version 4.1) – one guided path, fully personal (owner request 2026-11-21), by value ÷ effort
- [x] **Situation step in onboarding** (optional): age, family, rent/own, expensive debts, monthly spending, cash, monthly savings; plus "what do you want to learn"
- [x] **"Bist du bereit zu investieren?"**: personal readiness check (expensive debts first, emergency fund 3–6 months, horizon, savings, life cycle, family); if basics are missing it leads "Das Wichtigste heute" and no "invest" line is shown
- [x] **Less text at once**: short line first, details on tap; smooth open/close and tab transitions (View Transitions, `interpolate-size`)
- [x] **Load more everywhere** (owner request): news feed loads on scroll and links to Google News at the end; theme, detail, IPO, event and superinvestor lists grow in place; the collector keeps 800 headlines, 12 per theme and event
- [x] **Niche themes** (owner request): rare earths & critical minerals (REMX), batteries & lithium (LIT), gene editing (ARKG) in the theme/hype radar
- [x] **Google News 429s**: 5 requests at a time instead of 8, one retry after a short pause
- [x] **More news sources + "how many outlets report it"** (owner request): 12 more direct feeds (Zeit, SZ, n-tv, manager magazin, BBC, Guardian, NYT, WSJ, Ars Technica, The Verge, Cointelegraph, Decrypt) and ECB/Fed press releases; same story under different headlines is clustered; badge "📰 n Portale" and where it has spread (specialist only / specialist + mainstream / official); box "Worüber gerade viele berichten" with the research on media coverage
- [ ] Story patterns over time: spreading speed (outlets per hour), first-seen in specialist press → mainstream, tone of coverage (Tetlock 2007)
- [ ] **Own "Nischen-Scanner"**: ranks niche themes by early signals (hiring, developer adoption, insider buys, attention) against hype and valuation; honest historical check before it is shown as a signal
- [ ] **Next sources, by value ÷ effort**: SEC filings (13D stakes, S-1 IPO filings, 8-K) once the SEC secret is set · CFTC positioning · nowcasts (NY Fed WEI, Atlanta Fed GDPNow, Chicago Fed NFCI) · Shiller CAPE · hyperscaler capex (SEC XBRL) · TSMC monthly revenue · Bundesbank/Destatis (regional house prices) · ECB/Fed speeches · Kalshi · Bluesky · crypto derivatives (funding, open interest) · Bundeskartellamt merger list · arXiv counts
- [ ] 👤 **SEC_USER_AGENT secret with a real e-mail** (owner provided an address on 2026-11-21; it goes only into the secret, never into the repo) – the SEC answers HTTP 403 to the noreply address (insider buys, superinvestors are empty until then)
- [ ] **Guided setup wizard** for every connection (Dropbox, own AI key, later X): one button, ≤3 steps, deep links, copy buttons, "Verbindung testen" with ✓
- [ ] **Sync across devices via Dropbox** (end-to-end encrypted, PKCE, no server) – 👤 owner creates a free Dropbox app and sends the app key
- [ ] **"Wann investieren, wann nicht?" market panel**: valuation (CAPE, Shiller data), trend (200-day), stress (VIX, credit spreads), euphoria; evidence and limits per indicator
- [ ] **Events calendar**: ECB/Fed meetings, earnings, IPO filings (SEC S-1), takeover early signs (SEC 13D stakes, tender offers, Bundeskartellamt merger list) – needs the SEC fix
- [ ] **Interactive maps**: rents and house prices by city (incl. Leipzig, Dresden), self-hosted map, no tracking
- [ ] **Monthly budget** by category → savings potential (optional, local)
- [ ] **Learning paths** from the "what do you want to learn" answers, incl. curated videos (youtube-nocookie, verified official channels only)
- [ ] **"Wer sagt was" person check** (e.g. Michael Saylor): role, conflicts of interest, documented track record
- [ ] **Own AI key (optional)**: Gemini/Claude/OpenAI key stored only in the browser for answers inside the app; watch "Sign in with ChatGPT" (partner program)
- [ ] **X posts** via the official pay-per-use API (~$0.005 per post read) – 👤 owner decides on a budget; Bluesky (free API) first
- [ ] **Startups & business angels (Munich)**: networks, crowdinvesting rules, evidence on angel returns and failure rates

## Now (version 4.0) – real added value per investor type (owner request 2026-11-21), by value ÷ effort
Full reasoning: [STRATEGY.md](STRATEGY.md)
- [x] **Profiles + "Dein Radar"**: ETF, crypto, AI trends, commodities/procurement, real estate entry/owner; live lines with links, daily research fact; chosen in onboarding or directly on the card
- [x] **"Was die wenigsten wissen"**: 15 research facts (peer-reviewed unless marked), what each means for the user, sources
- [x] **Search 2.0**: synonyms DE/EN, questions in plain language, typo tolerance, short words as whole words; "ask your AI" with radar context
- [x] **Early signal: AI share of job postings** (Indeed Hiring Lab, DE + US)
- [x] **Commodity moves in euro** (FX effect for buyers)
- [ ] Commodities: futures curve (backwardation/contango), CFTC positioning, price alerts in euro
- [ ] Nowcasts: NY Fed WEI, Atlanta Fed GDPNow, Chicago Fed NFCI, Bundesbank WAI
- [ ] AI: hyperscaler capex (SEC XBRL company facts), TSMC monthly revenue, arXiv counts
- [ ] Crypto: funding rates / open interest, on-chain valuation, ETF flows (source reachable from GitHub's US servers)
- [ ] Real estate: buy-vs-rent calculator, follow-up financing planner, regional prices (Destatis)
- [ ] Learning units "How the greats invest" (Buffett, Bogle, Lynch, Dalio, Simons), gamified, documented facts only
- [ ] Precomputed AI answers to common questions per profile (collector, cached)
- [ ] Watchlist alerts (price, insider buy, news spike)
- [ ] Apply for Google Trends API alpha (👤 owner, optional)

## Now (version 3.2) – keep personal data safely (owner request 2026-11-21), by value ÷ effort
- [x] **Ask the browser to keep the data** (`navigator.storage.persist()` after onboarding / backup setup) – tiny effort
- [x] **Automatic encrypted backup**: Chrome/Edge desktop write after every change into a chosen file (e.g. in the Dropbox/OneDrive folder → end-to-end encrypted cloud copy); iPhone/Firefox: key kept, reminder + one-tap backup via share sheet
- [x] **Transfer link to another device**: encrypted settings in the link fragment, password needed to open
- [ ] **Real two-way sync via Dropbox app folder** (end-to-end encrypted, OAuth PKCE, no server) – high value, larger effort; 👤 owner creates a free Dropbox app (app key is public, no secret)
- [ ] Google Drive / OneDrive the same way (`drive.file` scope, only files the app created) – after Dropbox
- [ ] Unlock with passkey instead of password (WebAuthn PRF) – when Safari/Firefox support is solid
- [ ] Not planned: own sync server, Super Productivity's SuperSync service (see DECISIONS)

## Done (version 2.1) – owner requests of 2026-11-19, in priority order
- [x] **App-wide search** (key `/` or Ctrl+K): sections, glossary, themes, prices, signals, rent indices, investors, insiders, AI software, studies, news
- [x] **"Show all" + ranks** instead of fixed cut-offs (trend radar, AI software with filter, studies, insiders, consensus, voices, prediction markets)
- [x] **Detail view for every trend item**: key points in plain language, chart, sources, further reading (assets, commodities, AI models/projects, studies)
- [x] **Peer-reviewed research, always current**: OpenAlex (12 top journals): most cited of 24 months + newest; DOI link, citations, field-weighted impact, free version; refreshed every 6 h
- [x] **Official sentiment measures**: EU Economic Sentiment Indicator (DE, euro area), EU consumer confidence DE, University of Michigan consumer sentiment (percentile since start), Gilchrist–Zakrajšek excess bond premium + recession probability (Fed)
- [x] **Plan sharing that makes sense**: link opens the same plan (adjustable), amounts optional, system share sheet / copy; nothing uploaded
- [x] **KPI audit (independent expert review)**: KPI catalog in the app (method, research, evidence, limits for 13 KPIs); fixed: wrong advice when red is caused by euphoria, invented track-record claim, misattributed citations, "take profits" advice, one lump-sum rule everywhere, crash test on the whole portfolio (2008/09 ≈ −50 %), costs + rough German tax in the plan, median label, 13F age (up to 4.5 months), split adjustment, index funds excluded, gem score bug + honest name, dividend-adjusted prices, robust attention z-score, non-overlapping news acceleration, 12-1 momentum, "overheated" only after a 2-year doubling, EU PRIIPs risk bands, no double counting in the sentiment barometer, bubble meter without crypto/chatter, Sahm rule wording, mobile header, "Wissen" in the navigation
- [ ] **KPI audit, part 2**: stress = St. Louis Fed Financial Stress Index (STLFSI4) or Chicago Fed NFCI; valuation = CAPE / excess CAPE yield by region; MSCI World US weight & top-10 concentration; event direction (rate hike vs cut) and German/English keyword lists ("war"); routine vs opportunistic insider trades; puts in 13F; track record of the app's own signals (history since 2.0)
- [x] **Security hardening (independent audit)**: validated backup restore, PBKDF2 600k, escaping gaps closed, CSP trimmed, service worker stores only successful responses, collector without write access, self-hosted fonts
- [ ] 👤 **Privacy of the owner's name**: rename GitHub account (Settings → Account → Change username) and set e-mail private (Settings → Emails); then Claude rewrites the 6 merge commits that contain the e-mail and updates all links
- [ ] **What investors say – per investment and theme, more current**: voices tagged to themes/assets (filter by interest); more current sources (company press releases, SEC 8-K, earnings-call quotes via Quartr-like transcripts where free, central-bank speeches, Bluesky); public X posts only via the official paid API or embedded posts linked from news – no scraping (X terms prohibit it)
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
