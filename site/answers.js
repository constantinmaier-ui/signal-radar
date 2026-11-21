// Short, direct answers to questions like "Lohnt sich Gold?": what fits your profile, where it stands now,
// what research says, what you could do. Rule-based from the collected data, no advice, every claim sourced.
import { esc, fmt, pct, ok, fold, store, state } from "./ui.js";
import { profileWeight } from "./plan.js";
import { GOALS } from "./signals.js";

// Words that point to an asset (folded), its plan bucket and the research line behind the answer
const TARGETS = [
  { id: "gold", words: ["gold", "goldpreis", "xetra-gold"], bucket: "gold", ref: "asset:gold",
    research: "Gold schützte in Krisen oft, brachte langfristig aber deutlich weniger als Aktien und schützt kurzfristig nur unzuverlässig vor Inflation (Erb & Harvey 2013, Financial Analysts Journal)." },
  { id: "silver", words: ["silber", "silver"], bucket: null, ref: "asset:silver",
    research: "Silber schwankt stärker als Gold, weil es zu einem großen Teil in der Industrie verbraucht wird. Eine eigene Schutzfunktion wie bei Gold ist schwächer belegt." },
  { id: "world", words: ["msci world", "welt-etf", "weltaktien", "etf", "all-world", "aktien"], bucket: "world", ref: "asset:world",
    research: "Breit gestreute, günstige Aktien-ETFs sind der am besten belegte Weg zum Vermögensaufbau: Streuung senkt das Risiko (Markowitz 1952), die meisten aktiven Fonds schlagen den Index nicht (SPIVA)." },
  { id: "em", words: ["schwellenland", "schwellenlaender", "emerging", "china", "indien"], bucket: "em", ref: "asset:em",
    research: "Schwellenländer streuen das Depot, schwanken aber stärker. In einem All-World-ETF sind sie schon mit etwa einem Zehntel enthalten." },
  { id: "bonds", words: ["anleihe", "anleihen", "staatsanleihe", "bund", "renten"], bucket: "bonds", ref: "asset:bonds",
    research: "Hochwertige Staatsanleihen dämpfen Verluste in Aktien-Crashs meist, aber nicht immer (2022 fielen beide)." },
  { id: "btc", words: ["bitcoin", "btc", "krypto", "crypto", "ethereum"], bucket: "btc", ref: "asset:btc",
    research: "Krypto-Renditen hängen vor allem an Momentum und Aufmerksamkeit, kaum an klassischen Faktoren (Liu & Tsyvinski 2021, Review of Financial Studies). Verluste von 70 % und mehr kamen mehrfach vor." },
  { id: "cash", words: ["tagesgeld", "geldmarkt", "festgeld", "sparbuch"], bucket: "cash", ref: "asset:moneymarket",
    research: "Tagesgeld und Geldmarkt-ETFs sind sicher und flexibel, verlieren nach Inflation aber oft an Kaufkraft. Richtig für Notgroschen und kurzfristiges Geld." },
  { id: "oil", words: ["oel", "rohoel", "brent", "oil"], bucket: null, ref: "asset:oil",
    research: "Breit gestreute Rohstoffe brachten über Jahrzehnte ähnliche Renditen wie Aktien, einzelne Rohstoffe wie Öl schwanken aber extrem (Gorton & Rouwenhorst 2006)." },
  { id: "realestate", words: ["immobilie", "immobilien", "wohnung", "haus", "reit"], bucket: null, ref: null, goto: "entdecken:immobilien",
    research: "Wohnimmobilien brachten über 145 Jahre ähnliche Renditen wie Aktien bei weniger Schwankung, ein einzelnes Objekt ist aber kaum gestreut und teuer zu kaufen und zu verkaufen (Jordà u. a. 2019)." },
];

/** Finds what a question is about: a fixed target or a trend theme. Pure. */
export function questionTarget(q, d = {}) {
  const f = ` ${fold(q).replace(/[?!.,]/g, " ")} `;
  const t = TARGETS.find((x) => x.words.some((w) => f.includes(` ${fold(w)} `) || f.includes(` ${fold(w)}`)));
  if (t) return t;
  const th = (d.themes || []).find((x) => [x.name, x.short, ...(x.tickers || []).map((k) => k.sym)].some((w) => w && f.includes(` ${fold(w)}`)));
  return th ? { id: `theme:${th.id}`, theme: th, bucket: "themes", research: "Themen-Investments laufen oft schon heiß, bevor es Fonds dafür gibt; Themen-ETFs schnitten nach dem Start im Schnitt schwächer ab als breite Fonds (Ben-David u. a. 2023, Review of Financial Studies)." } : null;
}

/** Plain-language state of a price series (trend, distance from high, short-term heat). Pure. */
export function priceState(x) {
  if (!x) return null;
  const parts = [];
  if (ok(x.chg1y)) parts.push(`${pct(x.chg1y, 0)} in einem Jahr`);
  if (ok(x.ext200)) parts.push(x.ext200 >= 0 ? `über dem 200-Tage-Schnitt (Trend aufwärts)` : `unter dem 200-Tage-Schnitt (Trend abwärts)`);
  if (ok(x.fromHigh)) parts.push(x.fromHigh > -0.03 ? "nahe am Rekordhoch" : `${pct(x.fromHigh, 0)} unter dem Hoch`);
  const hot = (ok(x.rsi) && x.rsi >= 70) || (ok(x.ext200) && x.ext200 > 0.2);
  const weak = ok(x.ext200) && x.ext200 < -0.1;
  return { text: parts.join(", "), hot, weak };
}

/** The answer card for a question, or null if the question is not about an investment we know. */
export function quickAnswer(q, d = state.data || {}, goal = store.get("goal", "ausgewogen"), readyRed = false) {
  const t = questionTarget(q, d); if (!t) return null;
  const g = GOALS[goal] ? goal : "ausgewogen", label = GOALS[g].label;
  const asset = t.ref?.startsWith("asset:") ? (d.assets || []).find((a) => a.id === t.ref.slice(6)) : null;
  const theme = t.theme, x = asset || theme?.price || null, name = asset?.name || theme?.name || (t.id === "realestate" ? "Immobilien" : q);
  const w = t.bucket ? profileWeight(g, t.bucket) : null;
  // 1) fit with the profile
  let fit, level;
  if (t.bucket === "world") { fit = `Ja, als Kern: Für dein Profil „${label}“ sieht der Plan rund ${Math.round(w * 100)} % in breiten Welt-Aktien vor.`; level = "gut"; }
  else if (w > 0) { fit = `Als Beimischung ja: Für „${label}“ sieht der Plan etwa ${Math.round(w * 100)} % vor, nicht mehr.`; level = "klein"; }
  else if (t.bucket && w === 0) { fit = `Für dein Profil „${label}“ sieht der Plan dafür nichts vor. Wenn überhaupt, nur mit Geld, auf das du verzichten kannst.`; level = "vorsicht"; }
  else if (t.id === "realestate") { fit = "Kommt auf deine Lage an: Eigennutzung, Kapitalanlage oder Immobilien-ETF sind sehr verschiedene Dinge. Der Rechner im Bereich Immobilien vergleicht Kaufen und Mieten."; level = "klein"; }
  else { fit = `Kein Teil des Standard-Plans. Als kleine Beimischung (wenige Prozent) möglich, nicht als Hauptanlage.`; level = "vorsicht"; }
  if (readyRed) { fit = "Erst die Grundlagen: Dein Bereitschafts-Check zeigt noch offene Punkte (z. B. teure Kredite oder fehlender Notgroschen). Die gehen vor jeder Anlage."; level = "vorsicht"; }
  // 2) where it stands now
  const ps = priceState(x);
  const now = ps?.text ? `${name}: ${ps.text}.` : "";
  const timing = ps ? (ps.hot ? "Stark gestiegen: nicht hinterherjagen. Wer einsteigen will, besser in Raten über einige Monate." : ps.weak ? "Gerade schwach: Für Langfrist-Anleger kein Grund zur Panik, für Trend-Anleger ein Warnzeichen." : "Weder überhitzt noch eingebrochen: Einstieg nach Plan, gern per Sparplan.") : "";
  const hype = theme?.scores?.quadrant === "overheated" ? "Laut Hype-Karte überhitzt." : theme?.scores?.quadrant === "noise" ? "Laut Hype-Karte viel Aufmerksamkeit ohne Kurs (Hype)." : theme?.scores?.quadrant === "quiet" ? "Laut Hype-Karte steigt es still, ohne großen Hype." : "";
  return { name, level, fit, now: [now, hype].filter(Boolean).join(" "), timing, research: t.research,
    detail: t.ref || (theme ? null : null), open: theme?.id || null, goto: t.goto || null };
}

export function answerHtml(a) {
  if (!a) return "";
  const badge = { gut: ["passt", "ans-good"], klein: ["als Beimischung", "ans-mid"], vorsicht: ["mit Vorsicht", "ans-warn"] }[a.level];
  const more = a.detail ? `data-detail="${esc(a.detail)}"` : a.open ? `data-open="${esc(a.open)}"` : a.goto ? `data-goto="${esc(a.goto)}"` : "";
  return `<div class="sr-answer"><div class="ans-head"><b>Kurzantwort: ${esc(a.name)}</b><span class="ans-badge ${badge[1]}">${badge[0]}</span></div>
    <p><b>Für dich:</b> ${esc(a.fit)}</p>
    ${a.now ? `<p><b>Lage jetzt:</b> ${esc(a.now)} ${esc(a.timing)}</p>` : ""}
    <p><b>Was die Forschung sagt:</b> ${esc(a.research)}</p>
    ${more ? `<button type="button" class="btn btn-ghost btn-sm" ${more}>Details, Verlauf &amp; Quellen →</button>` : ""}
    <p class="fine">Einordnung nach Regeln und Studien, keine Anlageberatung. Ändert sich mit den Daten (alle 15 Min.).</p></div>`;
}
