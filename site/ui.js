// Gemeinsame Bausteine: Format, SVG-Diagramme, Tooltip, Toast.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const store = {
  get(k, d) { try { const v = localStorage.getItem("radar:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("radar:" + k, JSON.stringify(v)); } catch { /* privat-modus */ } },
};

export const state = {
  data: null, history: [], sort: "hype", theme: "all", q: "", onlySignals: false, shown: innerWidth < 620 ? 20 : 40,
  watch: new Set(store.get("watch", [])), live: [], liveKeys: new Set(), liveBtc: null, lastLoad: 0,
};

export const QUAD = {
  quiet: { label: "Stiller Aufstieg", icon: "🌱", cls: "b-quiet", tint: "--q-quiet", desc: "Kurs steigt, kaum Aufmerksamkeit. Oft die interessanteste Phase zum Hinschauen." },
  hot: { label: "Heißes Momentum", icon: "🔥", cls: "b-hot", tint: "--q-hot", desc: "Kurs und Aufmerksamkeit steigen. Trend intakt, Einstieg wird teurer." },
  noise: { label: "Hype ohne Kurs", icon: "📣", cls: "b-noise", tint: "--q-noise", desc: "Viel Lärm, aber der Kurs folgt nicht. Vorsicht vor Erzählungen." },
  forgotten: { label: "Vergessen", icon: "🧊", cls: "b-forgotten", tint: "--q-forgot", desc: "Kurs schwach, kein Interesse. Antizyklische Chance oder Falle." },
  overheated: { label: "Überhitzt", icon: "⚠️", cls: "b-overheated", desc: "Weit über der 200-Tage-Linie und viel Hype. Rücksetzer werden wahrscheinlicher." },
  unknown: { label: "Zu wenig Daten", icon: "…", cls: "b-unknown", desc: "Für dieses Thema fehlen gerade Daten." },
};
export const FNG_DE = { "Extreme Fear": "Extreme Angst", Fear: "Angst", Neutral: "Neutral", Greed: "Gier", "Extreme Greed": "Extreme Gier" };
export const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';

// ---------- Format ----------
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? esc(u) : "#");
export const ok = (x) => typeof x === "number" && Number.isFinite(x);
export const nf = (d) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmt = (x, d = 0) => (ok(x) ? nf(d).format(x) : "–");
export const pct = (x, d = 1) => (ok(x) ? (x > 0 ? "+" : x < 0 ? "−" : "±") + nf(d).format(Math.abs(x * 100)) + "\u00A0%" : "–");
export const dirCls = (x) => (!ok(x) ? "flat" : x > 0.0005 ? "up" : x < -0.0005 ? "down" : "flat");
export const arrow = (x) => (!ok(x) ? "" : x > 0.0005 ? "▲ " : x < -0.0005 ? "▼ " : "");
export const compact = (x) => (ok(x) ? new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 }).format(x) : "–");
export function ago(ms) {
  if (!ms) return "";
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}
export function priceFmt(m, x) {
  if (!ok(x)) return "–";
  if (m.kind === "fx") return fmt(x, 4);
  if (x < 50) return fmt(x, 2);
  if (x < 1000) return fmt(x, 1);
  return fmt(x, 0);
}
export const themeById = (id) => state.data?.themes.find((t) => t.id === id);

// ---------- SVG-Bausteine ----------
export function scaleFn(d0, d1, r0, r1) { const k = (r1 - r0) / ((d1 - d0) || 1); return (v) => r0 + (v - d0) * k; }
export function linePath(vals, w, h, pad = 2, lo, hi) {
  const v = vals.map((x) => (ok(x) ? x : null));
  const f = v.filter((x) => x !== null);
  if (f.length < 2) return { d: "", area: "", pts: [] };
  const min = lo ?? Math.min(...f), max = hi ?? Math.max(...f);
  const sx = scaleFn(0, v.length - 1, pad, w - pad), sy = scaleFn(min, max === min ? min + 1 : max, h - pad, pad);
  const pts = v.map((y, i) => (y === null ? null : [sx(i), sy(y)]));
  let d = "", started = false;
  pts.forEach((p) => { if (!p) { started = false; return; } d += (started ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); started = true; });
  const first = pts.find(Boolean), last = [...pts].reverse().find(Boolean);
  const area = `${d}L${last[0].toFixed(1)} ${h}L${first[0].toFixed(1)} ${h}Z`;
  return { d, area, pts, sy };
}
export function spark(vals, { w = 110, h = 28, color = "var(--s1)", area = true, cls = "spark", label = "" } = {}) {
  const { d, area: a } = linePath(vals || [], w, h, 2);
  if (!d) return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true"></svg>`;
  const id = "g" + Math.random().toString(36).slice(2, 8);
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    ${area ? `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${a}" fill="url(#${id})"/>` : ""}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/** Interaktiver Linienverlauf mit Fadenkreuz-Tooltip. labels[i] = Text für Punkt i. */
export function lineChart(el, vals, { labels = [], fmtV = (v) => fmt(v), color = "var(--s1)", h = 150, mid = null, axis = true } = {}) {
  const w = Math.max(240, el.clientWidth || 480);
  const padL = axis ? 44 : 2, padB = axis ? 18 : 2;
  const f = vals.filter(ok);
  if (f.length < 2) { el.innerHTML = '<div class="empty">Keine Daten.</div>'; return; }
  let lo = Math.min(...f), hi = Math.max(...f);
  if (mid !== null) { lo = Math.min(lo, mid); hi = Math.max(hi, mid); }
  const span = hi - lo || 1; lo -= span * 0.06; hi += span * 0.06;
  const iw = w - padL - 4, ih = h - padB - 6;
  const sx = scaleFn(0, vals.length - 1, padL, padL + iw), sy = scaleFn(lo, hi, 6 + ih, 6);
  const pts = vals.map((v, i) => (ok(v) ? [sx(i), sy(v)] : null));
  const d = pts.reduce((s, p, i) => (p ? s + (s && pts[i - 1] ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) : s), "");
  const ticks = axis ? [hi - span * 0.06, (hi + lo) / 2, lo + span * 0.06] : [];
  const id = "a" + Math.random().toString(36).slice(2, 8);
  const lastP = [...pts].reverse().find(Boolean);
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="height:${h}px">
    <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".18"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((t) => `<line x1="${padL}" x2="${padL + iw}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--grid)" stroke-width="1"/><text x="${padL - 6}" y="${sy(t) + 4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${esc(fmtV(t))}</text>`).join("")}
    ${mid !== null ? `<line x1="${padL}" x2="${padL + iw}" y1="${sy(mid)}" y2="${sy(mid)}" stroke="var(--axis)" stroke-dasharray="3 3"/>` : ""}
    <path d="${d}L${lastP[0]} ${6 + ih}L${pts.find(Boolean)[0]} ${6 + ih}Z" fill="url(#${id})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${axis && labels.length ? `<text x="${padL}" y="${h - 3}" font-size="10.5" fill="var(--muted)">${esc(labels[0])}</text><text x="${padL + iw}" y="${h - 3}" text-anchor="end" font-size="10.5" fill="var(--muted)">${esc(labels[labels.length - 1])}</text>` : ""}
    <circle cx="${lastP[0]}" cy="${lastP[1]}" r="4" fill="${color}" stroke="var(--surface)" stroke-width="2"/>
    <g class="xh" visibility="hidden"><line y1="6" y2="${6 + ih}" stroke="var(--ink-2)" stroke-width="1"/><circle r="4.5" fill="${color}" stroke="var(--surface)" stroke-width="2"/></g>
    <rect x="${padL}" y="0" width="${iw}" height="${h}" fill="transparent"/></svg>`;
  const svg = el.querySelector("svg"), xh = svg.querySelector(".xh");
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * w;
    let i = Math.round(((x - padL) / iw) * (vals.length - 1));
    i = Math.max(0, Math.min(vals.length - 1, i));
    if (!pts[i]) return;
    xh.setAttribute("visibility", "visible");
    xh.querySelector("line").setAttribute("x1", pts[i][0]); xh.querySelector("line").setAttribute("x2", pts[i][0]);
    xh.querySelector("circle").setAttribute("cx", pts[i][0]); xh.querySelector("circle").setAttribute("cy", pts[i][1]);
    showTip(ev, `<b>${esc(fmtV(vals[i]))}</b>${labels[i] ? "<br>" + esc(labels[i]) : ""}`);
  };
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerdown", move);
  svg.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); hideTip(); });
}
export const dayLabels = (n, endMs = Date.now(), step = 1) => Array.from({ length: n }, (_, i) => new Date(endMs - (n - 1 - i) * step * 86400000).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }));

// ---------- Tooltip & Toast ----------
export const tipEl = () => $("#tooltip");
export function showTip(ev, html) {
  const t = tipEl(); t.innerHTML = html; t.hidden = false;
  const pad = 14, r = t.getBoundingClientRect();
  let x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
  t.style.left = Math.max(8, x) + "px"; t.style.top = Math.max(8, y) + "px";
}
export function hideTip() { tipEl().hidden = true; }
let toastTimer;
export function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

