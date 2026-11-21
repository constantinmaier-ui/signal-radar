// "Bist du bereit zu investieren?" – a personal readiness check from the user's own (optional) situation.
// Rules of thumb and research, shown short first; details on tap. No advice, everything stays on the device.
import { $, esc, fmt, store } from "./ui.js";

export const AGES = [["u25", "unter 25"], ["25", "25–34"], ["35", "35–44"], ["45", "45–54"], ["55", "55–64"], ["65", "65+"]];
export const FAMILY = [["allein", "Allein"], ["partner", "Mit Partner/in"], ["kinder", "Mit Kindern"]];
export const HOME = [["miete", "Zur Miete"], ["eigentum", "Eigentum"]];
export const LEARN = [["basics", "Grundlagen: ETF & Zinseszins"], ["aktien", "Aktien verstehen"], ["krypto", "Krypto verstehen"], ["immo", "Immobilien"], ["steuern", "Steuern beim Anlegen"], ["profis", "Wie die Großen investieren"], ["trends", "Trends früh erkennen"]];

const num = (x, max = 1e7) => { const v = Number(x); return Number.isFinite(v) && v >= 0 ? Math.min(v, max) : null; };
const pick = (x, list) => (list.some(([k]) => k === x) ? x : null);
/** Cleans whatever is stored or restored. Pure. */
export function cleanSituation(o) {
  const s = o && typeof o === "object" && !Array.isArray(o) ? o : {};
  return { age: pick(s.age, AGES), family: pick(s.family, FAMILY), home: pick(s.home, HOME), spend: num(s.spend), cash: num(s.cash, 1e9), save: num(s.save), debt: typeof s.debt === "boolean" ? s.debt : null };
}
export const situation = () => cleanSituation(store.get("situation", {}));

/**
 * Readiness check. Pure. Every item: state "ok" | "todo" | "info" | "open" (not entered yet),
 * a short title, a longer text and where the rule comes from.
 */
export function readiness(s, years) {
  const items = [];
  if (s.debt === true) items.push({ id: "debt", state: "todo", title: "Teure Kredite zuerst tilgen",
    text: "Dispo- und Ratenkredite kosten meist mehr Zinsen, als Aktien im Schnitt bringen. Jeder getilgte Euro bringt dir den Kreditzins sicher, Aktien bringen ihre Rendite nur unsicher.", src: "Rechenregel: sicherer Zins schlägt unsichere Rendite" });
  else if (s.debt === false) items.push({ id: "debt", state: "ok", title: "Keine teuren Kredite", text: "Gut: Du zahlst keine hohen Kreditzinsen, die deine Rendite auffressen würden.", src: "Rechenregel" });
  else items.push({ id: "debt", state: "open", title: "Teure Kredite?", text: "Sag unter „Persönlich einrichten“, ob du Dispo- oder Ratenkredite hast.", src: "" });

  if (s.spend > 0 && s.cash !== null) {
    const months = s.cash / s.spend, gap = Math.max(0, 3 * s.spend - s.cash);
    items.push(months >= 3
      ? { id: "cash", state: "ok", title: `Notgroschen: ${fmt(months, 1)} Monatsausgaben`, text: "Gut: Ein Notfall (Waschmaschine, Jobverlust) zwingt dich nicht, Anlagen im falschen Moment zu verkaufen.", src: "Faustregel von Verbraucherschützern: 3 bis 6 Monatsausgaben auf Tagesgeld" }
      : { id: "cash", state: "todo", title: `Notgroschen aufbauen: noch ${fmt(gap)} €`, text: `Ziel sind mindestens 3 Monatsausgaben (bei dir ${fmt(3 * s.spend)} €) auf Tagesgeld. Sonst musst du im Notfall vielleicht genau dann verkaufen, wenn die Kurse unten sind.`, src: "Faustregel von Verbraucherschützern: 3 bis 6 Monatsausgaben auf Tagesgeld" });
  } else items.push({ id: "cash", state: "open", title: "Notgroschen?", text: "Trag deine monatlichen Ausgaben und dein Tagesgeld ein, dann rechnet das Radar nach, ob dein Puffer reicht.", src: "" });

  if (Number.isFinite(years)) items.push(years < 3
    ? { id: "horizon", state: "todo", title: "Kurzer Zeitraum: keine Aktien", text: "Geld, das du in weniger als 3 Jahren brauchst, gehört auf Tagesgeld oder in kurze Anleihen. Aktien können in so kurzer Zeit deutlich fallen.", src: "Kursverläufe: Verluste über kurze Zeiträume sind häufig, über lange selten" }
    : years < 5 ? { id: "horizon", state: "info", title: `${years} Jahre: eher vorsichtig`, text: "Für 3 bis 5 Jahre passt eine Mischung mit kleinerem Aktienanteil. Je länger der Zeitraum, desto seltener endeten breite Aktienanlagen historisch im Minus.", src: "Kursverläufe breiter Aktienindizes" }
    : { id: "horizon", state: "ok", title: `${years} Jahre Zeit`, text: "Langer Zeitraum: Zwischenzeitliche Verluste kannst du aussitzen. Wichtig ist, dabeizubleiben.", src: "Kursverläufe breiter Aktienindizes" });

  if (s.save > 0) items.push({ id: "save", state: "ok", title: `${fmt(s.save)} € im Monat sparbar`, text: "Regelmäßig sparen ist der stärkste Hebel, den du selbst in der Hand hast, stärker als jeder gute Zeitpunkt.", src: "Zinseszins-Rechnung" });

  if (s.age) {
    const young = ["u25", "25", "35"].includes(s.age);
    items.push({ id: "age", state: "info", title: young ? "Jung: Zeit ist dein Vorteil" : s.age === "65" ? "Im Ruhestand: Entnahmen planen" : "Lebensmitte: Mischung prüfen",
      text: young ? "Dein künftiges Arbeitseinkommen wirkt wie eine sichere Anlage. Darum können Jüngere meist einen höheren Aktienanteil tragen. Mit dem Alter sinkt der sinnvolle Anteil typischerweise."
        : s.age === "65" ? "Plane, wie viel du jährlich entnimmst. Ein Teil in sicheren Anlagen für die nächsten Jahre verhindert, dass du nach einem Crash verkaufen musst."
        : "Je näher der Ruhestand, desto mehr zählt Sicherheit. Prüfe, ob deine Aufteilung noch zu deinem Zeitraum passt.",
      src: "Lebenszyklus-Forschung: Cocco, Gomes & Maenhout (2005), Review of Financial Studies" });
  }
  if (s.family === "kinder") items.push({ id: "family", state: "info", title: "Mit Kindern: Absicherung zuerst",
    text: "Prüfe, ob deine Familie abgesichert ist, falls dir etwas passiert oder du nicht mehr arbeiten kannst. Das geht vor Rendite.", src: "Grundregel der Finanzplanung" });

  const todo = items.filter((i) => i.state === "todo").length, open = items.filter((i) => i.state === "open").length;
  const verdict = todo ? { level: "rot", head: `Erst die Grundlagen – ${items.find((i) => i.state === "todo").title}.` }
    : open ? { level: "gelb", head: "Fast fertig: Ergänze deine Situation, dann ist der Check vollständig." }
    : { level: "grün", head: "Grundlagen stehen. Investieren nach deinem Plan ergibt Sinn." };
  return { items, verdict };
}

const ICON = { ok: "✅", todo: "⛔", info: "ℹ️", open: "❔" };
export function renderReadiness() {
  const box = $("#bereitBody"); if (!box) return;
  const plan = store.get("plan", {}) || {};
  const { items, verdict } = readiness(situation(), Number(plan.years) || 15);
  box.innerHTML = `<p class="rd-head rd-${verdict.level}"><b>${esc(verdict.head)}</b></p>
    <ul class="rd-list">${items.map((i) => `<li><details><summary>${ICON[i.state]} ${esc(i.title)}</summary><p>${esc(i.text)}</p>${i.src ? `<p class="fine">Grundlage: ${esc(i.src)}</p>` : ""}</details></li>`).join("")}</ul>
    <div class="bk-btns"><button type="button" class="btn btn-ghost" data-act="onboard">Situation ändern</button></div>`;
}
/** One line for "Das Wichtigste heute" when something basic is missing. */
export function readinessLine() {
  const plan = store.get("plan", {}) || {};
  const { verdict } = readiness(situation(), Number(plan.years) || 15);
  return verdict.level === "rot" ? verdict.head : null;
}
