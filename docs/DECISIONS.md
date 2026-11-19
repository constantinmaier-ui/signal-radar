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
