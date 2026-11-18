# 📡 Signal-Radar

Ein Dashboard, das jeden Tag zeigt, **wo der Markt heiß läuft**. Es ist eine öffentliche Webseite: Der Link funktioniert in WhatsApp für alle, ohne Login, ohne App und ohne Claude.

| Bereich | Was du siehst |
|---|---|
| **Blasen-Meter** | 0–100 aus 7 Bausteinen: Krypto-Gier, Nasdaq- und Nvidia-Überdehnung, Spekulation (ARKK), Sorglosigkeit (VIX), IPO-Fieber, Blasen-Berichterstattung. Mit Tagesverlauf. |
| **Heute in 30 Sekunden** | 5 Kernaussagen des Tages. Mit API-Schlüssel schreibt sie Claude, sonst werden sie automatisch aus den Daten erzeugt. Teilen per WhatsApp-Text oder als fertiges Bild (1080×1350) für Gruppen und Status. |
| **Hype-Karte** | 13 Themen (KI, Chips, Strom, Uran, Rüstung, Krypto, Gold, Quanten, Robotik, Raumfahrt, Biotech, Cyber, IPOs) nach Aufmerksamkeit × Kurs-Momentum, mit der Bewegung der letzten 7 Tage. |
| **Themen-Ranking** | Hype, Momentum, Überhitzung, News-Tempo. Merkliste ☆. Detailansicht mit Kursen, Aufmerksamkeit und Schlagzeilen. Jedes Thema hat einen eigenen Teilen-Link. |
| **IPO-Radar** | Anthropic (Claude), OpenAI, SpaceX, Databricks, xAI, Stripe: Schlagzeilen, Aufmerksamkeit, Wettquoten. Ein Mega-IPO gilt als Spätzyklus-Signal. |
| **Wetten & Krypto** | Polymarket-Wahrscheinlichkeiten, Fear & Greed, gesuchte Coins. |
| **Markt-Ampel** | Grün/Gelb/Rot aus Euphorie (Blasen-Meter) und Stress (VIX, Marktbreite, CNN Fear & Greed), mit 3 klaren Verhaltensregeln. |
| **Mein Plan** | Eingabemaske: Einmalbetrag, Sparrate, Anlagedauer, Notgroschen und 3 Fragen zur Risikobereitschaft. Ergebnis: Beispiel-Aufteilung in € (Kern-Satellit), Risikoklasse, Prognose-Spanne aus 2.000 Simulationen, Crash-Test wie 2008 und Anti-Hype-Regeln, die sich nach der Marktlage richten. Teilbar ohne Beträge. |
| **Anlageklassen** | Welt-ETF, USA, Europa, DAX, Schwellenländer, Nasdaq, Anleihen, Gold, Silber, Öl, Immobilien, Bitcoin, Ethereum, dazu EZB- und US-Zins. Jeweils mit Erklärung, EU-Risikoklasse 1–7, größtem Verlust und Trend. |
| **Versteckte Perlen** | Regel-Suche: Aufwärtstrend ohne Überhitzung, stärker als der Markt, ≥ 5 Analysten mit ≥ 12 % Kursziel-Potenzial, vernünftiges KGV. Jede Begründung steht im Klartext dabei. |
| **Was die Profis machen** | 13F-Meldungen von Buffett, Burry, Ackman, Dalio, Druckenmiller, Tepper, Klarman, Li Lu, Loeb, Einhorn, Cathie Wood und Tiger Global: Top-Positionen, Käufe und Verkäufe, gemeinsame Käufe mehrerer Investoren. Dazu Analysten-Stimmen live (optimistisch/vorsichtig, mit Claude ins Deutsche übersetzt) und Kursziele. |
| **Lexikon** | 30 Börsenbegriffe in einfachen Worten. Unterstrichene Wörter auf der Seite lassen sich antippen. |
| **Signal-Feed** | Meldungen aus Google News (DE + EN), tagesschau, Handelsblatt, FAZ, Spiegel, CNBC, MarketWatch, Yahoo, TechCrunch, CoinDesk, Reddit und Hacker News. Dubletten sind entfernt, jede Meldung ist nach Thema und Signal (IPO, Rekord, Blase, Übernahme …) markiert. |

**Live:** Ein Sammler holt jede Stunde alle Quellen. Die Seite lädt alle 5 Minuten neu und holt Bitcoin-Kurs und Tech-Meldungen jede Minute direkt.

> Keine Anlageberatung. Das Radar misst Aufmerksamkeit und Kursdynamik und gibt keine Empfehlungen.

## Online stellen (einmalig, ca. 3 Minuten)

1. Auf GitHub: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
2. **Actions → Signal-Radar → Run workflow** starten. Nach ca. 2 Minuten ist die Seite unter `https://<dein-name>.github.io/<repo>/` erreichbar. Diesen Link in WhatsApp teilen.
3. *(Optional)* **Settings → Secrets and variables → Actions → New repository secret** `ANTHROPIC_API_KEY` anlegen. Dann schreibt Claude alle 6 Stunden das Tagesbriefing und übersetzt englische Analysten-Zitate (Kosten: wenige Cent pro Tag).
4. *(Optional)* Secret `SEC_USER_AGENT` mit `Dein Name deine@mail.de` anlegen. Die US-Börsenaufsicht verlangt bei automatischen Abfragen einen Absender. Ohne das Secret wird die Repo-Adresse verwendet.

Danach läuft alles von selbst, jede Stunde.

## Lokal ausprobieren

```bash
npm ci
npm run demo      # Beispieldaten (deutlich als Demo markiert)
# oder: npm run collect   # echte Daten, braucht Internet
npm run serve     # http://localhost:8080
npm test          # Rechenlogik + Sammler-Lauf mit simuliertem Netz
```

## Anpassen

Alle Themen, Schlagwörter, ETFs, Feeds und IPO-Kandidaten stehen in `collector/config.mjs`. Ein neues Thema ist ein neuer Eintrag in der Liste.

## Aufbau

```
collector/config.mjs   Themen, Quellen, Ticker
collector/lib.mjs      Parser + Kennzahlen (getestet)
collector/collect.mjs  holt alles, schreibt site/data/*.json
collector/extra.mjs    SEC 13F, Analysten, CNN, EZB, Anlageklassen, Perlen-Suche
collector/demo.mjs     Demo-Daten (Sammler gegen simuliertes Netz)
site/app.js            Lage, Hype-Karte, Themen, IPO, Feed
site/plan.js           Eingabemaske, Aufteilung, Simulation, Crash-Test
site/extras.js         Ampel, Anlageklassen, Perlen, Profis, Lexikon, Bild-Teilen
site/ui.js             gemeinsame Diagramm- und Format-Bausteine
.github/workflows/radar.yml   stündlicher Lauf + Veröffentlichung
```

Die Historie (Blasen-Meter und Themen-Werte pro Tag) übernimmt jeder Lauf von der Live-Seite und schreibt sie fort. Dafür braucht es keine Datenbank und keine Commits.
