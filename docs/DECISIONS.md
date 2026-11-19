# Entscheidungen & Begründungen

Jede wichtige Entscheidung mit dem „Warum“, damit sie später nachvollziehbar bleibt.

| Datum | Entscheidung | Warum |
|---|---|---|
| 18.11.2026 | Statische Webseite auf GitHub Pages statt eigenem Server | Kostenlos, kein Server, der gehackt werden kann, jeder öffnet den Link ohne Login |
| 18.11.2026 | Daten sammelt eine GitHub Action, nicht der Browser | Viele Quellen erlauben keinen direkten Abruf aus dem Browser; so bleibt die Seite schnell |
| 19.11.2026 | Eigenes öffentliches Repo `signal-radar` | Pages und Actions sind für öffentliche Repos gratis; das private Repo hatte keinen Speicher mehr |
| 19.11.2026 | Sammler alle 15 Minuten, Krypto/News im Browser minütlich | GitHub erlaubt keine minütlichen Läufe; Aktienkurse aus freien Quellen sind ohnehin 15 Min. verzögert |
| 19.11.2026 | Keine großen Fremdbibliotheken (z. B. OpenBB) | Weniger Abhängigkeiten = weniger Ausfälle und Sicherheitsrisiken |
| 19.11.2026 | App zuerst als PWA, Desktop-App später | Windows vertraut PWAs sofort; ein .exe ohne teures Zertifikat löst Warnungen aus |
| 19.11.2026 | Keine erfundenen Regionaldaten für Mieten | Ohne amtliche Daten lieber Eingabefelder + Links zu offiziellen Mietspiegeln (Regionaldaten → V3) |
| 19.11.2026 | Jede Aussage mit Quelle oder als „historisches Muster“ gekennzeichnet | Keine Halluzinationen, keine Versprechen |
| 19.11.2026 | Persönliche Daten nur lokal + verschlüsselte Sicherungsdatei (AES-256-GCM, PBKDF2 310.000) | Kein Server, der gehackt werden kann; Nutzer behält die Kontrolle (Prinzip wie Super Productivity) |
| 19.11.2026 | Verlauf zusätzlich im Git-Zweig `data` | Sonst ginge die Historie bei einer fehlgeschlagenen Veröffentlichung verloren; Git speichert jede Version |
| 19.11.2026 | Eigene KI per Link statt API-Schlüssel in der App | Kein Geheimnis im Browser, jeder nutzt seine eigene KI und sein eigenes Konto |
| 19.11.2026 | Spielerische Elemente nur für gute Gewohnheiten | Studien: verspielte Trading-Apps fördern riskantes Handeln |
