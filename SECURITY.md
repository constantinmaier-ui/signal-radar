# Sicherheit

**Kurz:** Das Signal-Radar ist eine statische Webseite. Es gibt keinen Server, keine Datenbank, keinen Login und keine gespeicherten Nutzerdaten. Damit fehlt die übliche Angriffsfläche.

| Schutz | Wie |
|---|---|
| Keine Nutzerdaten auf Servern | Eingaben (Plan, Merkliste, Immobilien-Rechner) bleiben im Browser (localStorage) |
| Fremder Code blockiert | Content-Security-Policy: Skripte nur von der eigenen Seite, Verbindungen nur zu freigegebenen Datenquellen |
| Keine eingeschleusten Inhalte | Alle Texte aus fremden Quellen werden vor der Anzeige maskiert; Links nur `http(s)` |
| Verschlüsselung | GitHub Pages liefert ausschließlich über HTTPS |
| Geheimnisse | API-Schlüssel nur als GitHub-Secret im Sammler, nie im Browser oder im Code |
| Lieferkette | Webseite ohne Fremdbibliotheken; Sammler nutzt nur das offizielle Anthropic-SDK (optional) |
| App-Installation | Als PWA im Browser-Sandkasten, ohne Systemrechte; kein unsigniertes `.exe` |

**Sicherheitslücke gefunden?** Bitte nicht öffentlich als Issue posten, sondern den Besitzer des Repos direkt kontaktieren.
