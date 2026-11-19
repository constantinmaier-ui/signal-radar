# Security

**In short:** Signal-Radar is a static website. There is no server, no database, no login and no stored user data – which removes the usual attack surface.

| Protection | How |
|---|---|
| No user data on servers | Inputs (plan, watchlist, calculators) stay in the browser (localStorage) |
| Encrypted backup | Optional export encrypted client-side: PBKDF2-SHA256 (600,000 iterations, OWASP 2023) → AES-256-GCM; older 310,000-round files still open. A restored file is treated as untrusted: only known keys with validated values are kept |
| Foreign code blocked | Content-Security-Policy: scripts only from the site itself, network requests only to whitelisted data sources |
| No injected content | All third-party text is escaped before rendering; links restricted to `http(s)` |
| Transport | GitHub Pages serves HTTPS only |
| Privacy | Fonts are self-hosted, no visitor IP goes to Google; the only third-party requests from the browser are the live crypto/news APIs (CoinGecko, Binance, Hacker News), without any user data |
| Least privilege in CI | The collector (npm dependencies, untrusted external data) runs with read-only repository access; only a small separate job without third-party code may write the daily history archive |
| Fresh app after releases | Service worker revalidates every file (`cache: "no-cache"`) and stores only successful responses |
| Secrets | API keys only as GitHub Actions secrets in the collector, never in the browser or the code |
| Supply chain | Web app has no third-party libraries; the collector uses only the official Anthropic SDK (optional) |
| App install | PWA inside the browser sandbox, no system permissions, no unsigned `.exe` |

**Audits:** independent reviews in November 2026 (KPI correctness and browser security). The security audit injected HTML/JS into all ~2,100 strings of the data file and found no way to execute script; the fixes for its findings are in PR #7.

**Found a vulnerability?** Please don't open a public issue – contact the repository owner directly.
