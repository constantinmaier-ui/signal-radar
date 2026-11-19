// Service Worker: macht die App installierbar und offline nutzbar.
// Strategie: App-Dateien aus dem Speicher (schnell), Daten immer zuerst frisch aus dem Netz.
const VERSION = "radar-v2.2a"; // bump on every release
const SHELL = ["./", "index.html", "styles.css", "app.js", "ui.js", "plan.js", "extras.js", "heute.js", "signals.js", "insights.js", "trust.js", "mietspiegel.js", "search.js", "detail.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // fremde Dienste nie zwischenspeichern
  if (url.pathname.includes("/data/")) {
    // Daten: Netz zuerst, bei Funkloch die letzte bekannte Version
    e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(url.pathname, copy)); return r; })
      .catch(() => caches.match(url.pathname)));
    return;
  }
  // App files: network first and always revalidate (cache: "no-cache" asks the server via ETag, so the
  // browser never mixes new and old module files after a release); offline: last stored copy
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
