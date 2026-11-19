# Aufgaben

Status: `[x]` erledigt · `[~]` in Arbeit · `[ ]` offen · 👤 = muss der Besitzer selbst tun

## Jetzt (Version 2.0)
- [x] Tages-Check & Signal-Leser
- [x] 6 Bereiche, App-Leiste am Handy, Einsteiger/Profi
- [x] Aktualisieren-Knopf + minütliche Live-Daten
- [x] Nachrichten-Wirkung (11 Ereignis-Arten)
- [x] Forschung + neue Studien
- [x] Immobilien-Daten + Rechner
- [x] App-Installation (PWA) + Offline
- [x] Sicherheits-Richtlinie (CSP) + SECURITY.md
- [x] Weitere/neuartige Anlageformen (7 neue Bausteine + 12 Erklärkarten)
- [x] Insider-Käufe (SEC Form 4)
- [x] Konjunktur-Frühwarnsystem (FRED: Zinskurve, Kredit-Aufschläge, Sahm-Regel)
- [x] Stimmungs-Barometer (eine Zahl aus 5 Stimmungsquellen + was es bedeutet)
- [x] Mietspiegel-Finder (amtliche Links je Stadt) + Mietspiegel-Check (Mietpreisbremse, Kappungsgrenze)
- [x] Rohstoff-Monitor (18 Rohstoffe, Lage in der Jahresspanne, Einkauf/Absicherung, Anleger, Teilen)
- [x] Beweislage & Quelle an jedem Bereich (stark / mittel / schwach / Fakten)
- [x] Anpassen: Interessen wählen, Bereiche ausblenden; „Vorschläge“ statt „Empfehlungen“
- [x] Mit eigener KI besprechen (Claude, ChatGPT, Kopieren für andere)
- [x] Trend-Radar „Was gerade abhebt“ + KI-Trends (GitHub, Hugging Face) mit börsennotierter Firma
- [x] „Was nachweislich Geld vermehrt“ mit Kosten-Rechner; Finanz-Fitness-Check & Tages-Quiz
- [x] Top-Fachzeitschriften (Journal of Finance, Journal of Financial Economics) bei den Studien
- [x] „Über das Radar“
- [x] Tägliche Sicherung von Signalen & Kursen für die spätere Trefferquote
- [ ] 👤 GitHub Pages einschalten: Settings → Pages → Source „GitHub Actions“
- [ ] 👤 Pull Request #1 zusammenführen („Merge“)
- [ ] Nach dem ersten echten Lauf: Quellen prüfen, Ausfälle beheben
- [ ] Version 2.0 als Git-Tag `v2.0` markieren
- [ ] 👤 Optional: Secret `ANTHROPIC_API_KEY` für Claude-Briefing & Übersetzungen

## Als Nächstes (Version 2.1) – priorisiert nach Nutzen ÷ Aufwand
| # | Aufgabe | Nutzen | Aufwand | Notiz |
|---|---|---|---|---|
| 1 | **KI-Blasen-Monitor**: eigene Ansicht mit Nvidia-Überdehnung, Anteil der 10 größten Firmen am S&P 500, KI-Aufmerksamkeit, „ai bubble“-Presse, Bewertungen der KI-Riesen, Anthropic/OpenAI-Bewertungen | sehr hoch | mittel | Plus Handlungsplan: Wie profitiere ich, ohne alles zu riskieren (Gleichgewichts-ETF, „Schaufel-Verkäufer“ wie Strom/Netze, Rebalancing) |
| 2 | **Mein Depot & Einkommen (freiwillig, nur auf dem Gerät)**: Netto-Einkommen, Ausgaben → Notgroschen & Sparquote; aktuelle Positionen → Abgleich mit Plan, Klumpenrisiko-Warnung (z. B. zu viel Tech/KI) | sehr hoch | mittel | Daten bleiben verschlüsselt lokal |
| 3 | **Verschlüsselte Sicherung & Sync über Geräte** (wie Super Productivity): Ende-zu-Ende verschlüsselte Datei (AES-256 mit Passwort) → in eigene Cloud (OneDrive/Dropbox/iCloud-Ordner) oder WebDAV/Nextcloud | hoch | mittel | Kein fremder Server sieht die Daten |
| 4 | **Bluesky-Signale** (offene, kostenlose Schnittstelle): Erwähnungen von Aktien/Themen, Stimmung | mittel | klein | X/Twitter: offizielle Schnittstelle kostet ≥ 200 $/Monat, Abgreifen verboten → nur falls Budget |
| 5 | **KI-Trend-Signale**: Hugging Face (meistgeladene KI-Modelle), GitHub (am schnellsten wachsende KI-Projekte) | mittel | klein | Frühindikator, welche KI-Firmen/Themen gerade anziehen |
| 6 | **Was die Masse kauft**: Reddit-Erwähnungen je Aktie (r/wallstreetbets, r/Finanzen) als Gegenindikator | mittel | klein | Forschung: Herdenkäufe von Privatanlegern laufen danach oft schlechter (Barber, Odean & Zhu 2009) |
| 7 | **Weitere Investoren**: Terry Smith (Fundsmith), Chuck Akre, Mohnish Pabrai u. a.; Hinweis: vergangene Top-Rendite garantiert keine künftige (Carhart 1997) | mittel | klein | SEC-Namensprüfung verhindert Verwechslungen |
| 8 | **Termin-Kalender**: Zinsentscheide (Fed/EZB), Quartalszahlen der Top-Firmen diese Woche | mittel | mittel | Für Quartalszahlen braucht es einen kostenlosen Finnhub-Schlüssel (👤) |
| 9 | **Kalshi** (regulierter US-Prognosemarkt) zusätzlich zu Polymarket | klein | klein | |
| 10 | **Put/Call-Verhältnis (CBOE)** als Angst-Messer der Profis | klein | klein | |
| 11 | **Rohstoff-Prognosen**: EIA-Energieprognose (STEO) automatisch einlesen | hoch | klein | 👤 kostenloser EIA-Schlüssel nötig |
| 12 | **Terminkurven** (Contango/Backwardation): Was erwartet der Markt in 3/6/12 Monaten? | hoch | mittel | Für Einkauf sehr nützlich |
| 13 | **Weltbank Pink Sheet** (monatliche Rohstoffpreise, offizielle Reihe) + Strom/CO₂-Preise Europa | mittel | mittel | |
| 15 | **Trefferquote des Radars**: Wie oft lagen „überhitzt“, „steigt leise“ usw. nach 1/3 Monaten richtig? Öffentlich anzeigen | sehr hoch | mittel | Daten werden seit V2.0 täglich gesichert; Auswertung sobald ≥ 4 Wochen Daten |
| 16 | **Muster-Statistik**: „Wenn X passiert, was folgte historisch?“ aus 10 Jahren Kursdaten | hoch | mittel | Ehrliche Basisraten statt Vorhersagen |
| 17 | **Mehr Stimmungsquellen** (NAAIM, Put/Call, Google Trends) mit Beweislage-Etikett | mittel | mittel | Stimmung ist nur schwach belegt, daher niedrige Priorität |
| 14 | **AAII-Anlegerumfrage** (wöchentliche Bullen/Bären-Stimmung) ins Stimmungs-Barometer | mittel | klein | Nutzungsbedingungen prüfen |

## Später (Version 3.0)
- [ ] GENESIS-Zugang für Regionaldaten (👤 kostenlose Registrierung bei regionalstatistik.de)
- [ ] Kurs-Alarme
- [ ] Desktop-App (Tauri) + Code-Signing (👤 Zertifikat kaufen)

## Geprüft & bewusst nicht (vorerst)
- **X/Twitter**: Kostenpflichtige Schnittstelle, Abgreifen verstößt gegen Regeln → stattdessen Bluesky, Reddit, Hacker News.
- **Kurs-Vorhersagen per KI**: Kurzfristige Kursprognosen sind wissenschaftlich nicht verlässlich → das Radar zeigt Wahrscheinlichkeiten (Wettmärkte), Muster und Risiken statt erfundener Kursziele.
- **Mieten/Preise pro Adresse aus Immobilienportalen**: keine freie Schnittstelle, Abgreifen verboten → Lage-Check über OpenStreetMap + amtliche Daten (V3).
- **DuckDB (offene Analyse-Datenbank)**: sinnvoll, sobald wir Jahre an Verlaufsdaten speichern (V3/V4); jetzt reicht eine JSON-Datei.
