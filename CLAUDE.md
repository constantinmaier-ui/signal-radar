# Signal-Radar – Hinweise für Claude

## Wie du mit dem Besitzer arbeitest (wichtig)
- **Immer erklären, was du baust, wie und warum**, auf Deutsch und in einfachen Worten. Der Besitzer ist Einsteiger bei Technik und Finanzen.
- Bei jedem Schritt kurz sagen: *Was* ändere ich, *warum* hilft das, *was* muss der Besitzer selbst tun (mit Klick-Anleitung).
- Keine Fachbegriffe ohne Erklärung. Lieber ein Beispiel als ein Fremdwort.

## Was das Projekt ist
Ein öffentliches Investment-Dashboard (GitHub Pages), das ohne Login per WhatsApp-Link geteilt wird.
- `collector/` sammelt alle 15 Minuten per GitHub Action Kurse, News, SEC-13F, Analysten usw. und schreibt `site/data/*.json`.
- `site/` ist die Webseite (reines HTML/CSS/JS, keine Abhängigkeiten). `signals.js` übersetzt Daten in verständliche Hinweise.
- Tests: `npm test` (Rechenlogik + Sammler gegen simuliertes Netz). Demo-Daten: `npm run demo`.

## Regeln für Inhalte
- Keine Anlageberatung versprechen. Beobachtungen und Regeln, keine Kauftipps. Immer den Hinweis „Keine Anlageberatung“ beibehalten.
- Nie erfundene Zahlen oder Zitate echten Personen zuschreiben. Demo-Daten immer als „Demo“ kennzeichnen.
- Einfach halten: lieber weniger, dafür verständlich. Neue Funktionen in den passenden Bereich einsortieren (Heute, Mein Plan, Märkte, Chancen, Profis, News).
