# Security

**In short:** Signal-Radar is a static website. There is no server, no database, no login and no stored user data – which removes the usual attack surface.

| Protection | How |
|---|---|
| No user data on servers | Inputs (plan, watchlist, calculators) stay in the browser (localStorage) |
| Encrypted backup | Optional export encrypted client-side: PBKDF2-SHA256 (310,000 iterations) → AES-256-GCM |
| Foreign code blocked | Content-Security-Policy: scripts only from the site itself, network requests only to whitelisted data sources |
| No injected content | All third-party text is escaped before rendering; links restricted to `http(s)` |
| Transport | GitHub Pages serves HTTPS only |
| Secrets | API keys only as GitHub Actions secrets in the collector, never in the browser or the code |
| Supply chain | Web app has no third-party libraries; the collector uses only the official Anthropic SDK (optional) |
| App install | PWA inside the browser sandbox, no system permissions, no unsigned `.exe` |

**Found a vulnerability?** Please don't open a public issue – contact the repository owner directly.
