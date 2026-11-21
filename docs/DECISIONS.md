# Decision log

Every important decision with its reason, so it stays traceable.

| Date | Decision | Why |
|---|---|---|
| 2026-11-18 | Static site on GitHub Pages instead of an own server | Free, no server to hack, anyone opens the link without login |
| 2026-11-18 | Data is collected by a GitHub Action, not the browser | Many sources block browser requests (CORS); keeps the site fast |
| 2026-11-19 | Separate public repo `signal-radar` | Pages and Actions are free for public repos; the private repo had run out of artifact storage |
| 2026-11-19 | Collector every 15 min; crypto/news live in the browser every minute | GitHub doesn't allow minute-level schedules; free stock quotes are delayed ~15 min anyway |
| 2026-11-19 | No large third-party frameworks (e.g. OpenBB) | Fewer dependencies = fewer outages and security risks |
| 2026-11-19 | App first as a PWA, native app later | Windows trusts PWAs immediately; an unsigned .exe triggers SmartScreen warnings |
| 2026-11-19 | No invented regional rent data | Without official data: input fields + links to official rent indices (regional data → 3.0) |
| 2026-11-19 | Every claim has a source or is labelled as a historical pattern; evidence level per section | No hallucinations, no promises; builds trust |
| 2026-11-19 | Personal data only local + encrypted backup file (AES-256-GCM, PBKDF2 310k) | No server that can be breached; user keeps control (same principle as Super Productivity) |
| 2026-11-19 | History also archived in git branch `data` | Otherwise history would be lost if a deployment failed; git keeps every version |
| 2026-11-19 | Own AI via deep link instead of API keys in the app | No secrets in the browser; everyone uses their own AI account |
| 2026-11-19 | Gamification only for good habits | Research: gamified trading apps encourage risky trading |
| 2026-11-19 | GitHub in English, app in German | International-friendly repository, German-speaking target users |
| 2026-11-19 | Daily verdict depends on the user's goal and horizon | Research: optimal risk share depends on horizon and risk tolerance (Merton 1969); one-size-fits-all caution leaves money on the table for long-horizon investors |
| 2026-11-19 | Lump sum "invest now" for growth/bold profiles with ≥ 10 years | Lump sum beat dollar-cost averaging in ~2 of 3 historical cases (Vanguard 2012); staggering is offered as regret insurance |
| 2026-11-21 | Automatic backup to a user-chosen file + encrypted transfer link instead of an own sync server | No server, no account, no running costs; Dropbox/OneDrive/iCloud only store ciphertext (end-to-end). Same idea as Super Productivity's "bring your own storage" sync |
| 2026-11-21 | No use of Super Productivity's SuperSync server | It is their service for their app; running our own would need a server (costs, maintenance, attack surface). The MIT-licensed code may be reused with attribution if needed |
| 2026-11-21 | Passkey unlock (WebAuthn PRF) postponed | Best practice for passwordless end-to-end encryption, but browser/password-manager support is still uneven in 2026 (Safari, Firefox); password + PBKDF2 works everywhere |
| 2026-11-21 | Core + satellite as the guiding model | Evidence: costs, overtrading and hype-chasing destroy more wealth than any signal adds (Barber & Odean 2000; Ben-David et al. 2023); trends belong in a small, rule-bound part |
| 2026-11-21 | Profiles instead of one dashboard for all | A crypto investor, an AI-trend hunter, a commodity buyer and a homeowner need different first lines; interests alone only sorted sections |
| 2026-11-21 | "Ask your AI" hands search + context to the user's own Claude/ChatGPT | Dynamic answers without an API key in the browser and without storing questions |
| 2026-11-21 | Only free, official or openly licensed early signals | Paid alternative data (card spending, satellites) is out of reach; Google Trends API is still a limited alpha; X only via the official paid API |
| 2026-11-21 | Readiness before returns: expensive debt and a missing emergency fund are shown before any "invest" line | Paying off a 10 %+ loan is a certain return; without a cash buffer people sell in a crash. This is the clearest "when not to invest" signal that is well founded |
| 2026-11-21 | Situation data (age, spending, cash) optional and local only | Customization without collecting personal data; the app works without it |
| 2026-11-21 | Not using the SuperSync token | SuperSync is Super Productivity's private service with its own data format; using it for another app is unsupported, could break any time and means sharing an account token |
| 2026-11-21 | Count distinct outlets per story (clustered by shared words), not repeated headlines | "5 portals report it" is a meaningful breadth signal; the old count also counted the same outlet found by several searches. Research: heavy coverage means the news is mostly priced in (Fang & Peress 2009) |
| 2026-11-21 | Exact age instead of age bands | Years to retirement and the pension gap need the exact number; stored as birth year so it stays right next year |
| 2026-11-21 | Pension gap with the 4 % rule (×25) in today's money, real return by profile | Simple, widely known and explainable; the card states its limits (longer retirements need less withdrawal) |
| 2026-11-21 | Portfolio prices: curated list in the collector + CoinGecko in the browser | Browsers cannot call Yahoo directly (CORS); CoinGecko allows it, so every coin is available live; other instruments keep a manual value |
| 2026-11-21 | Sub-pages per tab instead of one long scrolling page | Tapping "Immobilien" must show real estate only; mixing areas confused users. Interests now order the sub-pages instead of folding sections |
| 2026-11-21 | Explanations on tap ("ⓘ") instead of more text on the page | Progressive disclosure: short first, details for those who want them; every gauge states how it is made, how well it is backed and when it was updated |
| 2026-11-21 | A tap on an item explains that item first; navigation to an area is an explicit second step | Jumping straight to a whole dashboard felt random; the explanation answers "what is this, what does it mean for me" in place |
| 2026-11-21 | Guided next steps instead of a long settings page | Users should always see what is missing and what to do next, one tap each |
| 2026-11-21 | Per-holding rule checks ("Passt / Beobachten / Prüfen") instead of buy/sell calls | The owner wants "where to get in, where to get out"; fixed, sourced rules give that orientation without individual investment advice, which the app must not give. Every line names the rule and the next step |
| 2026-11-21 | Early signal = attention rising for two independent reasons (or a weekly jump) while the price is still flat | One noisy source (e.g. a Hacker News spike) produced too many hits; a falling price with rising attention is often bad news, not an early trend. Research: rising attention precedes short-term gains that partly reverse (Da, Engelberg & Gao 2011), very high attention precedes weaker returns (Barber & Odean 2008), so early signals are for watching, marked as weak evidence |

| 2026-11-21 | No pop-ups for news; a quiet "new since your last visit" line instead | Pop-ups interrupt, get dismissed unread and feel like advertising; the owner also doubted them. Important changes belong where the user looks anyway (Heute) |
| 2026-11-21 | Drafts stay local and outside the backup | They are unfinished by definition; mixing them into a backup could overwrite good data on another device |
| 2026-11-21 | One central scroll lock driven by which window is open | Six places locked and unlocked scrolling by hand; one missed unlock froze the page. Back closes the open window, like a native app |
