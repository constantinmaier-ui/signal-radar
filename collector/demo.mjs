#!/usr/bin/env node
// Erzeugt DEMO-Daten ohne Internet: Der echte Sammler läuft gegen ein simuliertes Netz.
// Alle Inhalte sind als „Demo“ markiert; die Seite zeigt einen Demo-Hinweis.
process.env.RADAR_DEMO = "1";
delete process.env.ANTHROPIC_API_KEY;
delete process.env.PAGES_URL;
await import("../test/mock-fetch.mjs");
await import("./collect.mjs");
