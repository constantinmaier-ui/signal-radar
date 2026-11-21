// "Bist du bereit zu investieren?" – a personal readiness check from the user's own (optional) situation.
// Rules of thumb and research, shown short first; details on tap. No advice, everything stays on the device.
import { $, esc, fmt, store } from "./ui.js";

export const FAMILY = [["allein", "Allein"], ["partner", "Mit Partner/in"], ["kinder", "Mit Kindern"]];
export const HOME = [["miete", "Zur Miete"], ["eigentum", "Eigentum"]];
export const LEARN = [["basics", "Grundlagen: ETF & Zinseszins"], ["aktien", "Aktien verstehen"], ["krypto", "Krypto verstehen"], ["immo", "Immobilien"], ["steuern", "Steuern beim Anlegen"], ["profis", "Wie die Großen investieren"], ["trends", "Trends früh erkennen"]];
export const GOAL_TYPES = [["vermoegen", "Vermögen aufbauen"], ["rente", "Rentenlücke schließen"], ["freiheit", "Finanziell frei sein"], ["eigenheim", "Eigenheim kaufen"], ["kinder", "Für Kinder sparen"], ["eigenes", "Eigenes Ziel"]];

const THIS_YEAR = new Date().getFullYear();
const num = (x, max = 1e7) => { const v = Number(x); return x !== null && x !== "" && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : null; };
const int = (x, lo, hi) => { const v = Math.round(Number(x)); return x !== null && x !== "" && Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
const pick = (x, list) => (list.some(([k]) => k === x) ? x : null);
/** Cleans whatever is stored or restored. Pure. */
export function cleanSituation(o) {
  const s = o && typeof o === "object" && !Array.isArray(o) ? o : {};
  return {
    birthYear: int(s.birthYear, THIS_YEAR - 100, THIS_YEAR - 14), retireAge: int(s.retireAge, 50, 80),
    family: pick(s.family, FAMILY), home: pick(s.home, HOME), spend: num(s.spend), cash: num(s.cash, 1e9), save: num(s.save), debt: typeof s.debt === "boolean" ? s.debt : null,
    goal: pick(s.goal, GOAL_TYPES), goalAmount: num(s.goalAmount, 1e9), goalYear: int(s.goalYear, THIS_YEAR, THIS_YEAR + 70), goalName: typeof s.goalName === "string" ? s.goalName.replace(/[<>"]/g, "").slice(0, 40) : null,
    net: num(s.net), pension: num(s.pension), want: num(s.want),
  };
}
export const ageOf = (s, year = THIS_YEAR) => (s.birthYear ? year - s.birthYear : null);
/** German statutory retirement age is 67 for everyone born 1964 or later. */
export const retireAgeOf = (s) => s.retireAge || 67;
// Assumed long-run return after inflation, by investor profile (see plan). Assumptions, not forecasts.
export const REAL_RETURN = { sicherheit: 0.01, ausgewogen: 0.025, wachstum: 0.035, mutig: 0.045 };
/** Monthly saving that grows to `target` in `years` at real return r, given what is already there. Pure. */
export function monthlyNeeded(target, years, r, already = 0) {
  if (!(target > 0) || !(years > 0)) return null;
  const rm = (1 + r) ** (1 / 12) - 1, n = Math.round(years * 12), fv = already * (1 + r) ** years, need = Math.max(0, target - fv);
  return rm > 0 ? (need * rm) / ((1 + rm) ** n - 1) : need / n;
}
/**
 * Pension gap in today's money. Desired income: own value or 80 % of today's net income.
 * Capital needed: gap × 12 × 25 (the "4 % rule", Bengen 1994). Pure.
 */
export function pensionGap(s, r = 0.025, already = 0) {
  const age = ageOf(s), years = age === null ? null : retireAgeOf(s) - age;
  const want = s.want || (s.net ? Math.round(s.net * 0.8) : null);
  if (!want || years === null) return null;
  const gap = Math.max(0, want - (s.pension || 0));
  const capital = gap * 12 * 25;
  return { years: Math.max(0, years), want, gap, capital, monthly: years > 0 ? monthlyNeeded(capital, years, r, already) : null, pensionKnown: s.pension !== null };
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

  const age = ageOf(s);
  if (age !== null) {
    const young = age < 45, toGo = retireAgeOf(s) - age;
    items.push({ id: "age", state: "info", title: toGo > 0 ? `${age} Jahre: noch ${toGo} Jahre bis zur Rente` : `${age} Jahre: im Ruhestand`,
      text: young ? "Dein künftiges Arbeitseinkommen wirkt wie eine sichere Anlage. Darum können Jüngere meist einen höheren Aktienanteil tragen. Mit dem Alter sinkt der sinnvolle Anteil typischerweise."
        : toGo <= 0 ? "Plane, wie viel du jährlich entnimmst. Ein Teil in sicheren Anlagen für die nächsten Jahre verhindert, dass du nach einem Crash verkaufen musst."
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

// ---------- "Dein Ziel & Rentenlücke" card (Mein Geld), editable in place ----------
const eur = (x) => `${fmt(Math.round(x / (x >= 10000 ? 100 : 1)) * (x >= 10000 ? 100 : 1))} €`;
const FIELDS = [["age", "Alter", "Jahre"], ["retireAge", "Rente mit", "Jahren"], ["net", "Netto heute", "€/Mon."], ["pension", "Gesetzliche Rente (Renteninformation)", "€/Mon."], ["want", "Wunsch-Einkommen im Alter", "€/Mon."], ["goalAmount", "Zielbetrag", "€"], ["goalYear", "Zieljahr", ""]];
export function renderGoal(depotTotal = 0) {
  const box = $("#zielBody"); if (!box) return;
  const s = situation(), goal = store.get("goal", "ausgewogen"), r = REAL_RETURN[goal] ?? 0.025;
  const g = pensionGap(s, r, s.goal === "rente" ? depotTotal : 0), label = GOAL_TYPES.find(([k]) => k === s.goal)?.[1];
  const lines = [];
  if (g) lines.push(g.gap > 0
    ? `<p class="goal-big">Rentenlücke: <b>${eur(g.gap)}</b> im Monat</p><p>Dafür brauchst du rund <b>${eur(g.capital)}</b> bis zur Rente. ${g.monthly ? `Das sind <b>${eur(g.monthly)} pro Monat</b> über ${g.years} Jahre${s.save ? `, du sparst ${eur(s.save)}` : ""}.` : ""}</p>`
    : `<p class="goal-big">Keine Rentenlücke ✓</p><p>Deine gesetzliche Rente deckt dein Wunsch-Einkommen von ${eur(g.want)}.</p>`);
  if (s.goalAmount && s.goalYear && s.goal !== "rente") {
    const years = s.goalYear - new Date().getFullYear(), m = monthlyNeeded(s.goalAmount, years, r, 0);
    lines.push(`<p class="goal-big">${esc(s.goalName || label || "Dein Ziel")}: <b>${eur(s.goalAmount)}</b> bis ${s.goalYear}</p><p>${m ? `Nötig: <b>${eur(m)} pro Monat</b>${s.save ? `, du sparst ${eur(s.save)}${s.save >= m ? " ✓" : ""}` : ""}.` : "Ziel liegt in diesem Jahr: Geld besser sicher halten (Tagesgeld)."}${years > 0 && years < 5 ? " Unter 5 Jahren lieber wenig Aktien." : ""}</p>`);
  }
  if (!lines.length) lines.push(`<p>Trag Alter und Einkommen ein, dann rechnet das Radar deine Rentenlücke aus, oder ein eigenes Ziel mit Betrag und Jahr.</p>`);
  const v = { ...s, age: ageOf(s) };
  box.innerHTML = `${label ? `<p class="fine">Ziel: <b>${esc(label)}</b></p>` : ""}${lines.join("")}
    <details class="goal-edit"><summary>Werte ändern</summary><div class="sit-grid">${FIELDS.filter(([k]) => !(s.goal === "rente" && (k === "goalAmount" || k === "goalYear"))).map(([k, l, u]) => `<label>${l}<span class="inp"><input data-goal-f="${k}" type="number" inputmode="decimal" min="0" value="${v[k] ?? ""}" placeholder="${k === "retireAge" ? 67 : k === "want" && s.net ? Math.round(s.net * 0.8) : ""}">${u ? `<em>${u}</em>` : ""}</span></label>`).join("")}</div>
      <div class="chips-wrap">${GOAL_TYPES.map(([k, l]) => `<button type="button" class="chip-btn ${s.goal === k ? "on" : ""}" data-goal-t="${k}">${l}</button>`).join("")}</div></details>
    <details class="evid"><summary>Wie wird gerechnet?</summary><p>Alles in heutiger Kaufkraft. Wunsch-Einkommen ohne Angabe: 80 % deines Nettos. Benötigtes Kapital: Lücke × 12 × 25, die „4-%-Regel“ (Bengen 1994): So viel lässt sich jährlich entnehmen, damit das Geld historisch rund 30 Jahre reichte. Für längere Ruhestände ist weniger Entnahme vorsichtiger. Angenommene Rendite nach Inflation für dein Profil: ${fmt(r * 100, 1)} % pro Jahr. Das ist eine Annahme, keine Prognose. Dein Depot zählt bei der Rentenlücke schon mit.</p></details>`;
}
export function initGoal(onChange) {
  let t;
  document.addEventListener("input", (e) => {
    const f = e.target.closest?.("[data-goal-f]"); if (!f) return;
    clearTimeout(t); t = setTimeout(() => {
      const s = situation(), k = f.dataset.goalF, v = f.value === "" ? null : Number(f.value);
      if (k === "age") s.birthYear = v ? new Date().getFullYear() - v : null; else s[k] = v;
      store.set("situation", cleanSituation(s));
      const open = document.activeElement?.dataset?.goalF;
      onChange?.();
      if (open) { const el = document.querySelector(`[data-goal-f="${open}"]`); el?.closest("details")?.setAttribute("open", ""); el?.focus(); const len = el?.value.length; try { el?.setSelectionRange(len, len); } catch { /* number inputs */ } }
    }, 500);
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-goal-t]"); if (!b) return;
    const s = situation(); s.goal = s.goal === b.dataset.goalT ? null : b.dataset.goalT;
    store.set("situation", cleanSituation(s)); onChange?.();
    document.querySelector("#zielBody .goal-edit")?.setAttribute("open", "");
  });
}
