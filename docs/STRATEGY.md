# Strategy: real added value for every kind of investor

North star: **help users grow their wealth through better decisions**. We never give buy recommendations. The evidence says the largest, most reliable wealth effects for private investors come from:
- avoiding costly mistakes: high fees, overtrading, chasing hype, panic selling, no diversification;
- staying invested with a plan;
- spotting real trends early and sizing them sensibly.

The radar is built around that (see "What few know" in the app).

The guiding model is **core + satellite**:
- **The core** is a cheap, broad plan that does the heavy lifting.
- **The satellite** is a small, rule-bound part where trends and early signals live, with hype and evidence shown side by side.

## Why this beats portals and apps

| Others | Signal-Radar |
|---|---|
| Show prices and news; the user has to interpret | Translates data into "what does this mean for *my* goal / portfolio / job" |
| One asset class per app (broker, crypto app, property portal, commodity terminal) | Stocks, ETFs, crypto, AI trends, commodities (in euro), real estate, macro in one place |
| Hype is part of the business model (trading volume, ads) | Hype is labelled; every section shows source and evidence level |
| Early signals cost money (alt data vendors) | Free, official early signals: hiring, developer adoption, insider clusters, prediction markets, attention |
| Account, tracking, ads | No account, data stays on the device, open source, encrypted backup |

## Profiles ("Dein Radar")

Each profile gets live lines, a research fact and, over time, its own tools.

| Profile | Excites them today | Next |
|---|---|---|
| ETF & wealth building | Plan, crash test, cost effect, bubble meter, MSCI World | Savings-plan tracker vs. plan, tax allowance helper (Sparerpauschbetrag), rebalancing reminder |
| Crypto | BTC/ETH, crypto fear & greed, stablecoin inflows, trending coins | Funding rates and open interest (derivatives positioning), on-chain valuation (MVRV), ETF flows, halving/supply calendar |
| AI & early trends | AI share of job postings, fastest-growing AI software (PyPI/npm), GitHub, AI bubble check | Hyperscaler capex from SEC XBRL filings, TSMC monthly revenue, arXiv paper counts, Hugging Face downloads by org, IPO pipeline |
| Commodities / procurement | Prices **in euro** (FX effect), biggest movers, TTF gas, German power | Futures curve (backwardation/contango), CFTC positioning (who is long/short), price alerts per commodity, monthly averages for budgeting |
| Real estate: entry | Mortgage rate + 1-year change, monthly payment example, house prices | Buy-vs-rent calculator (price-to-rent), affordability by city, regional prices (Destatis) |
| Real estate: owner | Rate change, follow-up financing effect, house prices | Follow-up financing planner (forward loan), value estimate via regional index, rent yield vs. Bund yield |

## Early signals: what is free, official and backed by research

Status: ✅ in the app · 🟡 next · ⚪ later or blocked.

| Signal | Why it's early | Source | Status |
|---|---|---|---|
| Hiring: share of AI job postings (DE, US) | Firms hire before products and revenue show up | Indeed Hiring Lab, CC BY 4.0 | ✅ |
| Developer adoption (downloads) | Real usage, not talk | PyPI, npm | ✅ |
| GitHub stars / Hugging Face downloads | What builders adopt now | GitHub, Hugging Face | ✅ |
| Insider buying clusters | Opportunistic buys predict returns (Cohen, Malloy & Pomorski 2012) | SEC Form 4 | ✅ |
| Attention (Wikipedia, news acceleration) | Attention predicts short-term moves and reversals (Da, Engelberg & Gao 2011) | Wikimedia, GDELT, Google News | ✅ |
| Prediction markets | Crowd probabilities for events | Polymarket | ✅ (Kalshi 🟡) |
| Superinvestor portfolios | What long-term professionals hold | SEC 13F | ✅ (quarterly, delayed) |
| Futures positioning | Speculators at extremes often precede reversals | CFTC Commitments of Traders (public API) | 🟡 |
| Nowcasts (economy now, not last quarter) | Official real-time estimates | NY Fed Weekly Economic Index, Atlanta Fed GDPNow, Chicago Fed NFCI (FRED); Bundesbank weekly activity index | 🟡 |
| Hyperscaler capex | The money behind the AI boom | SEC XBRL company facts (free) | 🟡 |
| TSMC monthly revenue | Earliest hard number on AI chip demand | TSMC investor relations (monthly) | 🟡 |
| Research output | Where science moves before products | arXiv, OpenAlex | 🟡 |
| Short interest | Among the strongest predictors of aggregate returns (Rapach, Ringgenberg & Zhou 2016) | FINRA (twice monthly) | ⚪ |
| Google Trends | Classic attention measure | Official API is still a limited alpha (apply) | ⚪ |
| Card spending, satellite images, app downloads | Used by hedge funds | Paid vendors | ⚪ not free |
| X (Twitter) posts | Fast, noisy | Official paid API only, no scraping | ⚪ |

## What top investors and institutions do (public, documented)

- **Warren Buffett**: cheap, safe, high-quality companies, held for decades, with modest cheap leverage from insurance float (Frazzini, Kabiller & Pedersen 2018). The hard part is patience: long stretches behind the market.
- **Large banks (e.g. Goldman Sachs)** publish nowcasts, financial-conditions indices, positioning data and "crowding" baskets (most popular hedge-fund holdings). The free equivalents are official nowcasts (FRED, Bundesbank), CFTC positioning and SEC 13F.
- **Quant funds** combine many weak signals (momentum, value, quality, carry) across asset classes, size positions by risk and cut costs. The radar uses the same documented building blocks (12-1 momentum, time-series momentum, carry, bubble signs) but explains them instead of trading them.
- Learning units on how great investors got there are planned (Buffett, Bogle, Lynch, Dalio, Simons), with documented facts only and no invented quotes.

## Search and AI

- ✅ Search understands synonyms (KI/AI, Öl/Brent, Bauzins/mortgage), filler words ("Lohnt sich Gold gerade?"), short words as whole words and one typo.
- ✅ Every search can be handed to the user's own AI (Claude or ChatGPT) together with what the radar knows. No API key in the app, nothing stored.
- 🟡 Natural-language answers inside the app, generated by the collector (Claude API, already used for the briefing) for the top 50 questions per profile, refreshed every few hours. This is cheap, cached and needs no key in the browser.

## Further customization

Everything is optional and changeable:
- profiles;
- watchlist with alerts (price, insider buy, news spike);
- own commodities and currencies (procurement);
- own city (real estate);
- portfolio (already there);
- risk profile (already there);
- level of detail (already there).

## Priorities (value ÷ effort)

1. ✅ Profiles + "Dein Radar", research facts, search 2.0 + ask-your-AI, AI hiring signal (v4.0 part 1)
2. 🟡 Commodities: futures curve + CFTC positioning + price alerts in euro
3. 🟡 Nowcasts (WEI, GDPNow, NFCI, Bundesbank WAI) in "Heute"
4. 🟡 AI: hyperscaler capex (SEC XBRL) + TSMC monthly revenue
5. 🟡 Crypto: funding rates / open interest (a public source reachable from GitHub's US servers)
6. 🟡 Real estate tools: buy-vs-rent, follow-up financing planner
7. 🟡 Learning units "How the greats invest" (gamified, documented facts only)
8. 🟡 Precomputed AI answers for common questions per profile
9. ⚪ Dropbox two-way sync, passkey unlock (see v3.2)
