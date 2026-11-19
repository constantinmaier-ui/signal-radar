// Vertrauen & Persönliches: Quellen/Beweislage je Bereich, Anpassen, eigene KI, Trend-Radar,
// Was nachweislich Geld vermehrt (Kosten-Rechner), Finanz-Fitness-Check & Quiz.
import { $, $$, esc, fmt, pct, ok, ago, safeUrl, state, store, toast, spark } from "./ui.js";
import { LEX } from "./extras.js";
import { hypeInfo } from "./signals.js";

// ---------- Quellen & Beweislage je Bereich ----------
// level: 3 = stark belegt, 2 = mittel, 1 = schwach, 0 = reine Fakten/Daten (keine Prognose)
const META = {
  check: [2, "Eigene Regeln, gespeist aus allen Quellen dieser Seite", "Die Regeln folgen belegten Mustern. Eine Prognose sind sie nicht."],
  signals: [2, "Signal-Leser über alle Quellen", "Jedes Signal nennt seine Quelle. Die Beweislage unterscheidet sich je Signal."],
  newsImpact: [2, "Google News + 10 Nachrichtenportale; Wirkung aus Studien je Ereignis-Art", "Die typischen Wirkungen sind historische Durchschnitte, im Einzelfall kann es anders laufen."],
  lage: [1, "Yahoo Finance, alternative.me, GDELT", "Extreme Werte gingen oft Rücksetzern voraus (Greenwood, Shleifer & You 2019). Den Zeitpunkt sagt das Meter nicht voraus."],
  plan: [3, "Langfristige Durchschnittsrenditen, 2.000 Simulationen", "Breit streuen und niedrige Kosten sind die am besten belegten Regeln der Finanzforschung."],
  hebel: [3, "Morningstar „Mind the Gap“, Zinseszins-Rechnung", "Kosten, Sparrate und Durchhalten sind nachweislich die größten Hebel."],
  frueh: [2, "FRED (US-Notenbank St. Louis)", "Gut erforscht, aber es gab nur wenige Rezessionen. Fehlalarme kommen vor."],
  anlagen: [0, "Yahoo Finance, Stooq, EZB", "Fakten und Kennzahlen, keine Prognose."],
  rohstoffe: [0, "Terminbörsen über Yahoo Finance; Prognosen: Weltbank, IWF, EIA, USDA", "Fakten. Rohstoffpreise sind kurzfristig kaum vorhersagbar."],
  immobilien: [0, "EZB, Eurostat, amtliche Mietspiegel", "Fakten und Faustregeln, keine Bewertung im Einzelfall."],
  stimmung: [1, "CNN Fear & Greed, alternative.me, Analysten-Ton, FRED, VIX, Polymarket", "Stimmung hilft am ehesten bei Extremen und vor allem bei spekulativen Aktien. Der Effekt ist in Studien eher klein (Baker & Wurgler 2006)."],
  trends: [2, "Kurse, Wikipedia-Aufrufe, GitHub, Hugging Face, PyPI, npm, DefiLlama, Energy-Charts", "Kurs-Trends über 3–12 Monate sind gut belegt (Momentum). Kurzfristige Ausschläge drehen oft wieder."],
  karte: [2, "Wikipedia-Aufrufe, Nachrichten, Hacker News, Themen-ETFs", "Momentum ist stark belegt. Viel Aufmerksamkeit geht eher schwächeren Renditen voraus (Barber & Odean 2008)."],
  perlen: [1, "Yahoo-Finance-Analystenkonsens, Kurse", "Analysten-Kursziele treffen selten (Bradshaw, Brown & Huang 2013). Ideen zum Prüfen, mehr nicht."],
  ipo: [2, "Nachrichten, Wikipedia, Polymarket", "Hype-Börsengänge laufen langfristig im Schnitt schwächer (Ritter 1991)."],
  profis: [2, "US-Börsenaufsicht SEC (13F, Form 4), Yahoo-Konsens, Nachrichten", "Insider-Käufe sind gut belegt (Cohen, Malloy & Pomorski 2012). Das Nachbilden von 13F-Depots zeigt gemischte Ergebnisse."],
  feed: [0, "~40 Quellen, siehe „Unsere Quellen“", "Rohe Meldungen. Erst im Signal-Leser werden sie eingeordnet."],
  forschung: [3, "Begutachtete Fachzeitschriften und Arbeitspapiere", "Arbeitspapiere sind noch nicht begutachtet und deshalb gekennzeichnet."],
};
const LEVEL = { 3: ["stark belegt", "ev3"], 2: ["mittel belegt", "ev2"], 1: ["schwach belegt", "ev1"], 0: ["Fakten & Daten", "ev0"] };
export function renderMeta() {
  for (const [id, [lvl, src, note]] of Object.entries(META)) {
    const sec = document.getElementById(id); if (!sec) continue;
    let el = sec.querySelector(":scope > .meta-line, :scope > article > .meta-line");
    const host = sec.matches(".grid-hero, .grid-2") ? sec.querySelector("article") : sec;
    if (!el) { el = document.createElement("div"); el.className = "meta-line"; host.appendChild(el); }
    const [word, cls] = LEVEL[lvl];
    el.innerHTML = `<span class="ev ${cls}" data-tip="${esc(`<b>Beweislage: ${word}</b><br>${esc(note)}`)}">${"●".repeat(lvl)}${"○".repeat(3 - lvl)} ${word}</span><span class="src">Quelle: ${esc(src)}</span>`;
  }
}

// ---------- Anpassen: Interessen & Bereiche ----------
export const TOPICS = [["stocks", "Aktien & ETFs"], ["themes", "Trend-Themen"], ["crypto", "Krypto"], ["commodities", "Rohstoffe"], ["realestate", "Immobilien"], ["macro", "Konjunktur & Zinsen"], ["news", "Politik & Nachrichten"], ["pros", "Profis & Insider"]];
const SECTIONS = [["ipo", "IPO-Radar"], ["rohstoffe", "Rohstoff-Monitor"], ["immobilien", "Immobilien"], ["stimmung", "Stimmung & Wettmärkte"], ["perlen", "Versteckte Perlen"], ["weitere", "Weitere Anlageformen"], ["trends", "Trend-Radar"]];
export const prefs = () => store.get("prefs", { off: [], hide: [] });
export function applyPrefs() {
  const p = prefs();
  for (const [id] of SECTIONS) { const el = document.getElementById(id); if (el) el.classList.toggle("user-hidden", p.hide.includes(id)); }
}
export function renderPrefs(onChange) {
  const p = prefs();
  $("#prefsBody").innerHTML = `
    <h3>Was interessiert dich?</h3><p class="fine">Signale zu abgewählten Themen werden auf „Heute“ ausgeblendet.</p>
    <div class="pref-grid">${TOPICS.map(([k, l]) => `<label class="radio"><input type="checkbox" data-topic="${k}" ${p.off.includes(k) ? "" : "checked"}> ${l}</label>`).join("")}</div>
    <h3>Welche Bereiche willst du sehen?</h3>
    <div class="pref-grid">${SECTIONS.map(([k, l]) => `<label class="radio"><input type="checkbox" data-sec="${k}" ${p.hide.includes(k) ? "" : "checked"}> ${l}</label>`).join("")}</div>
    <p class="fine">Gespeichert nur auf diesem Gerät.</p>`;
  $("#prefsBody").onchange = (e) => {
    const q = prefs(), t = e.target;
    if (t.dataset.topic) q.off = t.checked ? q.off.filter((x) => x !== t.dataset.topic) : [...new Set([...q.off, t.dataset.topic])];
    if (t.dataset.sec) q.hide = t.checked ? q.hide.filter((x) => x !== t.dataset.sec) : [...new Set([...q.hide, t.dataset.sec])];
    store.set("prefs", q); applyPrefs(); onChange?.();
  };
}

// ---------- Mit eigener KI besprechen ----------
export function aiPrompt(d, signals) {
  const lines = [
    `Lage am ${new Date(d.generatedAt).toLocaleDateString("de-DE")} laut meinem Signal-Radar:`,
    `- Markt-Ampel: ${d.risk?.level ?? "–"}, Blasen-Meter ${d.bubble?.score ?? "–"}/100`,
    ...signals.slice(0, 6).map((s) => `- ${s.title}`),
    ...(d.events || []).filter((e) => e.n48h > 0).slice(0, 3).map((e) => `- Nachrichtenlage: ${e.name} (${e.n48h} Meldungen in 48 Std.)`),
    "",
    "Ich bin Privatanleger. Erkläre mir in einfachen Worten, was das für einen langfristigen, breit gestreuten Anleger bedeutet. Mache Vorschläge statt Empfehlungen, nenne Risiken und sage, was davon gut belegt ist und was nicht.",
  ];
  return lines.join("\n");
}
export function renderAskAi(signals) {
  const text = aiPrompt(state.data, signals);
  const enc = encodeURIComponent(text);
  $("#aiClaude").href = `https://claude.ai/new?q=${enc}`;
  $("#aiChatgpt").href = `https://chatgpt.com/?q=${enc}`;
  $("#aiCopy").onclick = async () => { try { await navigator.clipboard.writeText(text); toast("Kopiert – in deine KI einfügen"); } catch { toast("Kopieren nicht möglich"); } };
}

// ---------- Trend-Radar: Was gerade abhebt ----------
export function renderTrends() {
  const d = state.data, rows = [];
  // Kursbewegungen relativ zur eigenen Schwankung: „wie ungewöhnlich ist das?“
  const norm = (x) => (ok(x.chg1m) && ok(x.vol) && x.vol > 0 ? x.chg1m / (x.vol / Math.sqrt(12)) : null);
  for (const a of d.assets || []) if (!a.missing) rows.push({ name: a.name, kind: "Anlageklasse", chg: a.chg1m, z: norm(a), view: "maerkte" });
  for (const c of d.commodities || []) if (!c.missing) rows.push({ name: c.name, kind: "Rohstoff", chg: c.chg1m, z: norm(c), view: "maerkte" });
  for (const t of d.themes || []) if (t.price) rows.push({ name: t.name, kind: "Thema", chg: t.price.chg1m, z: norm({ chg1m: t.price.chg1m, vol: t.price.vol }), view: "chancen" });
  const up = rows.filter((r) => ok(r.z) && r.z >= 1).sort((a, b) => b.z - a.z).slice(0, 6);
  const down = rows.filter((r) => ok(r.z) && r.z <= -1).sort((a, b) => a.z - b.z).slice(0, 4);
  const attn = [...(d.themes || []).map((t) => ({ name: t.name, mom: t.attention?.mom, hype: hypeInfo(t) })), ...(d.ipoWatch || []).map((w) => ({ name: w.name, mom: w.attention?.mom }))]
    .filter((x) => ok(x.mom) && x.mom > 0.25).sort((a, b) => b.mom - a.mom).slice(0, 5);
  const row = (r) => `<li><a href="#${r.view}"><b>${esc(r.name)}</b><span class="fine">${esc(r.kind)}</span></a><span class="${r.chg >= 0 ? "up" : "down"}">${pct(r.chg, 0)}</span><span class="zbadge" title="So viele typische Monats-Schwankungen weit">${fmt(Math.abs(r.z), 1)}×</span></li>`;
  const t = d.tech || {};
  $("#trendsBody").innerHTML = `
    <div class="trend-col"><h3>🚀 Hebt ab (1 Monat)</h3><ul class="trend-list">${up.map(row).join("") || '<li class="empty">Nichts Außergewöhnliches.</li>'}</ul></div>
    <div class="trend-col"><h3>🪂 Stürzt ab (1 Monat)</h3><ul class="trend-list">${down.map(row).join("") || '<li class="empty">Nichts Außergewöhnliches.</li>'}</ul></div>
    <div class="trend-col"><h3>👀 Aufmerksamkeit explodiert</h3><ul class="trend-list">${attn.map((x) => `<li><b>${esc(x.name)}${x.hype ? ` <span class="hype" data-tip="${esc(`<b>Warum Hype?</b><br>${esc(x.hype)}`)}">⚡ Hype</span>` : ""}</b><span class="up">${pct(x.mom, 0)}</span><span class="fine">Aufrufe vs. Vormonat</span></li>`).join("") || '<li class="empty">Ruhig.</li>'}</ul></div>
    <div class="trend-col wide"><h3>🧠 KI-Software, die gerade explodiert</h3>
      <ul class="trend-list">${[...(t.models || []).slice(0, 4).map((m) => ({ ...m, kind: `KI-Modell · ${m.task || ""}`, metric: `${fmt(m.downloads)} Downloads` })), ...(t.repos || []).slice(0, 4).map((r) => ({ ...r, kind: `GitHub-Projekt · ${r.lang || ""}`, metric: `${fmt(r.stars)} ★ in 30 Tagen` }))]
        .map((x) => `<li><a href="${safeUrl(x.url)}" target="_blank" rel="noopener"><b>${esc(x.name)}</b><span class="fine">${esc(x.kind)}</span></a><span class="fine">${esc(x.metric)}</span>${x.ticker ? `<span class="chip" title="Börsennotierte Firma dahinter">${esc(x.ticker)}</span>` : ""}</li>`).join("") || '<li class="empty">Gerade keine Daten.</li>'}</ul>
      <p class="fine">Warum das spannend ist: Welche KI-Werkzeuge Entwickler gerade massenhaft nutzen, zeigt sich hier Wochen bevor es in Geschäftszahlen auftaucht. Ein Kürzel zeigt die börsennotierte Firma dahinter, wo es eine gibt.</p></div>`;
}

// ---------- Was nachweislich Geld vermehrt + Kosten-Rechner ----------
export function renderLevers() {
  const p = store.get("plan", { once: 5000, monthly: 200, years: 15 });
  const r = 0.065, n = p.years || 15, once = +p.once || 0, m = +p.monthly || 0;
  const fv = (rate) => { const rm = rate / 12; let v = once; for (let i = 0; i < n * 12; i++) v = (v + m) * (1 + rm); return v; };
  const cheap = fv(r - 0.002), pricey = fv(r - 0.015), late = (() => { const rm = (r - 0.002) / 12; let v = once; for (let i = 0; i < (n - 5) * 12; i++) v = (v + m) * (1 + rm); return v; })();
  const gap = fv(r - 0.002 - 0.012);
  $("#leversBody").innerHTML = `
    <div class="lever"><b>Niedrige Kosten</b><span>Günstiger ETF (0,2 % pro Jahr) statt teurer Fonds (1,5 %): <em class="up">+${fmt(cheap - pricey)} €</em> mehr nach ${n} Jahren.</span></div>
    <div class="lever"><b>Früh anfangen</b><span>5 Jahre später starten kostet dich <em class="down">${fmt(cheap - late)} €</em>, weil der Zinseszins weniger Zeit hat.</span></div>
    <div class="lever"><b>Investiert bleiben</b><span>Anleger verlieren durch Rein-Raus im Schnitt rund 1–1,7 Prozentpunkte pro Jahr (Morningstar, „Mind the Gap“). Bei dir wären das etwa <em class="down">${fmt(cheap - gap)} €</em>.</span></div>
    <div class="lever"><b>Breit streuen</b><span>Ein Welt-ETF mit rund 1.400 Firmen schützt davor, dass eine Pleite oder eine Branche alles zerstört.</span></div>
    <div class="lever"><b>Mehr sparen</b><span>Jede 50 € mehr pro Monat ergeben nach ${n} Jahren etwa <em class="up">+${fmt(((v) => v)((() => { const rm = (r - 0.002) / 12; let v = 0; for (let i = 0; i < n * 12; i++) v = (v + 50) * (1 + rm); return v; })()))} €</em>.</span></div>
    <div class="lever"><b>Steuern nutzen</b><span>Freistellungsauftrag stellen: 1.000 € Erträge pro Jahr bleiben steuerfrei (2.000 € für Paare).</span></div>
    <p class="fine">Rechnung mit deinen Plan-Eingaben (${fmt(once)} € einmalig, ${fmt(m)} € pro Monat, ${n} Jahre) und angenommenen 6,5 % Rendite vor Kosten. Zum Ändern im Plan oben die Zahlen anpassen.</p>`;
}

// ---------- Finanz-Fitness-Check & Quiz (spielerisch, aber für gute Gewohnheiten) ----------
const FIT = [
  ["reserve", "Notgroschen: 3 Monatsgehälter auf dem Tagesgeld", "Schützt davor, im Crash verkaufen zu müssen."],
  ["debt", "Keine teuren Schulden (Dispo, Ratenkredit)", "Dispozinsen von über 10 % schlägt keine Geldanlage."],
  ["plan", "Plan steht: Aufteilung aufgeschrieben", "Wer einen Plan hat, verkauft seltener in Panik."],
  ["core", "Kern: breit gestreuter Welt-ETF", "Die am besten belegte Grundlage."],
  ["savings", "Sparplan läuft automatisch", "Automatik schlägt Willenskraft."],
  ["cost", "Kosten unter 0,3 % pro Jahr", "Jedes Prozent Kosten frisst über 30 Jahre ein Viertel des Endvermögens."],
  ["tax", "Freistellungsauftrag gestellt", "Bis zu 1.000 € Erträge pro Jahr steuerfrei."],
  ["rebal", "Jährlicher Termin zum Aufräumen (Rebalancing) im Kalender", "Verkauft automatisch teuer und kauft günstig."],
];
const LEVELS = [[0, "Startklar"], [3, "Auf Kurs"], [6, "Stark aufgestellt"], [8, "Finanz-Profi"]];
export function renderFitness() {
  const done = store.get("fit", []);
  const n = FIT.filter(([k]) => done.includes(k)).length, lvl = [...LEVELS].reverse().find(([min]) => n >= min)[1];
  const C = 2 * Math.PI * 34;
  $("#fitBody").innerHTML = `
    <div class="fit-head"><svg viewBox="0 0 80 80" class="fit-ring" aria-hidden="true"><circle cx="40" cy="40" r="34" class="bg"/><circle cx="40" cy="40" r="34" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - n / FIT.length)}"/><text x="40" y="46" text-anchor="middle">${n}/${FIT.length}</text></svg>
      <div><div class="eyebrow">Deine Stufe</div><div class="fit-level">${lvl}</div><p class="fine">Hake ab, was du schon erledigt hast. Gespeichert nur auf diesem Gerät.</p></div></div>
    <ul class="fit-list">${FIT.map(([k, t, why]) => `<li><label class="radio"><input type="checkbox" data-fit="${k}" ${done.includes(k) ? "checked" : ""}> <span><b>${esc(t)}</b><small>${esc(why)}</small></span></label></li>`).join("")}</ul>`;
  $("#fitBody").onchange = (e) => {
    const k = e.target.dataset.fit; if (!k) return;
    const cur = store.get("fit", []);
    store.set("fit", e.target.checked ? [...new Set([...cur, k])] : cur.filter((x) => x !== k));
    renderFitness();
    if (e.target.checked) toast("Stark! Ein Schritt mehr in Richtung Finanz-Profi");
  };
  renderQuiz();
}
function renderQuiz() {
  const terms = Object.keys(LEX), day = Math.floor(Date.now() / 864e5);
  const pick = (i) => terms[(day * 7 + i * 13) % terms.length];
  const answer = pick(0), opts = [answer, pick(1), pick(2)].filter((x, i, a) => a.indexOf(x) === i).sort();
  const st = store.get("quiz", { last: null, streak: 0 });
  const solved = st.last === day;
  $("#quizBody").innerHTML = `<div class="eyebrow">Quiz des Tages · Serie: ${st.streak} 🔥</div>
    <p class="quiz-q">„${esc(LEX[answer])}“</p>
    <div class="quiz-opts">${opts.map((o) => `<button type="button" class="btn ${solved && o === answer ? "btn-primary" : "btn-ghost"}" data-q="${esc(o)}" ${solved ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
    ${solved ? '<p class="fine">Gelöst. Morgen gibt es eine neue Frage.</p>' : '<p class="fine">Welcher Begriff passt?</p>'}`;
  $("#quizBody").onclick = (e) => {
    const b = e.target.closest("[data-q]"); if (!b || solved) return;
    if (b.dataset.q === answer) { store.set("quiz", { last: day, streak: st.last === day - 1 ? st.streak + 1 : 1 }); toast("Richtig! 🎉"); renderQuiz(); }
    else { b.classList.add("wrong"); toast("Leider nicht, versuch es nochmal"); }
  };
}

// ---------- Verschlüsselte Sicherung: auf andere Geräte übertragen ----------
// Passwort → Schlüssel (PBKDF2, 310.000 Runden, SHA-256) → AES-256-GCM. Alles lokal im Browser.
const KEYS = ["plan", "watch", "prefs", "fit", "quiz", "mode", "theme", "re", "goal"];
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encryptBackup(obj, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ app: "signal-radar", v: 1, kdf: "PBKDF2-SHA256-310000", cipher: "AES-256-GCM", salt: b64(salt), iv: b64(iv), data: b64(ct) });
}
export async function decryptBackup(text, pass) {
  const f = JSON.parse(text);
  if (f.app !== "signal-radar") throw new Error("Keine Signal-Radar-Sicherung");
  const key = await deriveKey(pass, unb64(f.salt));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(f.iv) }, key, unb64(f.data));
  return JSON.parse(new TextDecoder().decode(pt));
}
export function initBackup() {
  const box = $("#backupBox"); if (!box) return;
  box.innerHTML = `<h3>Sichern &amp; auf andere Geräte übertragen</h3>
    <p class="fine">Plan, Merkliste, Interessen und Fitness-Fortschritt werden mit deinem Passwort verschlüsselt (AES-256). Die Datei kannst du in deine Cloud legen (OneDrive, iCloud, Dropbox) oder dir selbst schicken. Ohne Passwort kann sie niemand lesen, auch nicht der Betreiber dieser Seite.</p>
    <label class="bk-label">Passwort (mind. 10 Zeichen)<input id="bkPass" type="password" autocomplete="new-password" minlength="10"></label>
    <div class="bk-btns"><button class="btn btn-primary" type="button" id="bkSave">Sicherung erstellen</button><label class="btn btn-ghost bk-file">Sicherung laden<input id="bkFile" type="file" accept=".radar,application/json" hidden></label></div>
    <p class="fine" id="bkMsg"></p>`;
  const msg = (t) => ($("#bkMsg").textContent = t);
  $("#bkSave").onclick = async () => {
    const pass = $("#bkPass").value; if (pass.length < 10) return msg("Bitte ein Passwort mit mindestens 10 Zeichen wählen.");
    const obj = Object.fromEntries(KEYS.map((k) => [k, store.get(k, null)]).filter(([, v]) => v !== null));
    const blob = new Blob([await encryptBackup(obj, pass)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `signal-radar-${new Date().toISOString().slice(0, 10)}.radar`; a.click();
    msg("Sicherung erstellt. Passwort gut merken: Ohne Passwort ist sie nicht wiederherstellbar.");
  };
  $("#bkFile").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const obj = await decryptBackup(await file.text(), $("#bkPass").value);
      for (const [k, v] of Object.entries(obj)) if (KEYS.includes(k)) store.set(k, v);
      msg("Sicherung geladen. Die Seite lädt neu …"); setTimeout(() => location.reload(), 900);
    } catch { msg("Das hat nicht geklappt: falsches Passwort oder keine gültige Sicherungsdatei."); }
    e.target.value = "";
  };
}

// ---------- Echte Nutzung & Geldflüsse (für das Trend-Radar) ----------
export function renderUsage() {
  const d = state.data, ad = d.adoption || [], cf = d.cryptoFlows || {}, pw = d.power;
  const big = (x) => (x >= 1e6 ? fmt(x / 1e6, 1) + " Mio." : fmt(x / 1e3) + " Tsd.");
  $("#usageBody").innerHTML = `
    <div class="trend-col"><h3>🧩 Welche KI bauen Firmen wirklich ein?</h3>
      <ul class="trend-list">${ad.map((a) => `<li><span><b>${esc(a.name)}</b><span class="fine">${esc(a.owner)}</span></span><span class="fine">${big(a.week)}/Woche</span>${ok(a.growth) ? `<span class="${a.growth >= 0 ? "up" : "down"}">${pct(a.growth, 0)}</span>` : "<span></span>"}${a.listed ? `<span class="chip">${esc(a.listed)}</span>` : ""}</li>`).join("") || '<li class="empty">Gerade keine Daten.</li>'}</ul>
      <p class="fine">Wöchentliche Downloads der Programmier-Bausteine (PyPI + npm), Veränderung zur Vorwoche. Wer die meisten Entwickler hat, hat oft bald die meisten Kunden. Die Zahlen enthalten auch automatische Downloads, deshalb ist die Entwicklung aussagekräftiger als die absolute Höhe.</p></div>
    <div class="trend-col"><h3>💧 Geldfluss in Krypto</h3>
      <ul class="trend-list">
        ${cf.stablecoins ? `<li><span><b>Stablecoins im Umlauf</b><span class="fine">digitale Dollar, „Trockenpulver“ für Käufe</span></span><span>${fmt(cf.stablecoins.value / 1e9)} Mrd. $</span><span class="${cf.stablecoins.chg30 >= 0 ? "up" : "down"}">${pct(cf.stablecoins.chg30, 1)} / 30 T</span></li>` : ""}
        ${cf.tvl ? `<li><span><b>Kapital in Krypto-Anwendungen (DeFi)</b><span class="fine">Total Value Locked</span></span><span>${fmt(cf.tvl.value / 1e9)} Mrd. $</span><span class="${cf.tvl.chg30 >= 0 ? "up" : "down"}">${pct(cf.tvl.chg30, 1)} / 30 T</span></li>` : ""}
      </ul>
      <p class="fine">Quelle: DefiLlama. Wachsende Stablecoin-Mengen gelten als Zufluss neuen Geldes in den Kryptomarkt. Die Forschung dazu ist jung und die Beweislage schwach.</p></div>
    ${pw ? `<div class="trend-col"><h3>⚡ Strom-Börsenpreis Deutschland</h3>
      <div class="pw"><b>${fmt(pw.avg, 1)} €/MWh</b><span class="fine">Tagesdurchschnitt ${esc(pw.day)} · Spanne ${fmt(pw.min)}–${fmt(pw.max)} · 30-Tage-Schnitt ${fmt(pw.avg30, 1)}</span>${spark(pw.series, { w: 280, h: 40, color: "var(--s2)", label: "Strompreis 45 Tage" })}</div>
      <p class="fine">Quelle: Energy-Charts (Fraunhofer ISE), Day-Ahead-Börse. Wichtig für energieintensive Branchen wie Chemie, Stahl und Rechenzentren.</p></div>` : ""}`;
}
