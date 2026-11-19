// Signal-Leser: übersetzt Rohdaten in wenige, verständliche Hinweise mit Handlungsvorschlag.
// Reine Funktionen ohne DOM – im Browser genutzt und mit Node getestet.

const ok = (x) => typeof x === "number" && Number.isFinite(x);
const p0 = (x) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x * 100))} %`;

/**
 * Ein Signal: { id, kind: "chance"|"warnung"|"info", title, text, todo, weight (0–100), view, source }
 * weight = Wichtigkeit für die Sortierung; view = Bereich, in dem es Details gibt.
 */
/** One lump-sum rule everywhere (Vanguard 2012: investing at once beat staggering in about 2 of 3 historical cases; timing by market mood is not reliable). */
export const LUMP_SUM_RULE = "Einmalbeträge: Rechnerisch ist sofort anlegen meist besser (in etwa 2 von 3 historischen Fällen, Vanguard 2012). Verteilen über 3–6 Monate ist eine Versicherung gegen Reue: sinnvoll, wenn dich ein Rückgang direkt nach dem Kauf zum Verkaufen bringen würde.";

export function buildSignals(d, history = []) {
  if (!d) return [];
  const s = [];
  const add = (o) => s.push({ view: "heute", ...o });

  // 1) Gesamtmarkt: Ampel & Blasen-Meter
  const b = d.bubble?.score, r = d.risk;
  const old = [...history].reverse().find((h) => ok(h.bubble) && Date.parse(h.date) <= Date.now() - 7 * 864e5)?.bubble;
  if (ok(b) && b >= 75) add({ id: "bubble-high", kind: "warnung", weight: 95, title: "Der Markt ist in Euphorie", text: `Das Blasen-Meter steht bei ${b} von 100: Viele Zeichen von Überschwang treten gleichzeitig auf. Ob und wann ein Rücksetzer folgt, kann niemand vorhersagen. Das Messgerät ist neu und hat noch keine geprüfte Trefferquote.`, todo: "Sparplan weiterlaufen lassen, keine Hype-Käufe, keine Kredite.", source: "Blasen-Meter" });
  else if (ok(b) && b <= 25) add({ id: "bubble-low", kind: "chance", weight: 85, title: "Angst im Markt", text: `Das Blasen-Meter steht nur bei ${b} von 100. Angst ist für langfristige Sparer kein Grund auszusteigen: Wer in Panikphasen verkauft, verpasst oft die Erholung.`, todo: "Sparplan auf keinen Fall stoppen.", source: "Blasen-Meter" });
  if (ok(b) && ok(old) && Math.abs(b - old) >= 10) add({ id: "bubble-move", kind: b > old ? "warnung" : "info", weight: 70, title: b > old ? "Die Stimmung heizt sich schnell auf" : "Die Euphorie kühlt ab", text: `Das Blasen-Meter ist in einer Woche von ${old} auf ${b} ${b > old ? "gestiegen" : "gefallen"}.`, todo: b > old ? "Nicht von der Begeisterung mitreißen lassen." : "Kein Grund zur Panik: Abkühlung ist gesund.", source: "Blasen-Meter" });
  if (r?.stress >= 65) add({ id: "stress", kind: "warnung", weight: 90, title: "Der Markt ist gestresst", text: `Das Angstbarometer VIX steht bei ${ok(r.vix) ? r.vix.toFixed(0) : "–"}, und nur ${ok(r.breadth) ? Math.round(r.breadth * 100) : "–"} % der großen Aktien liegen im Aufwärtstrend.`, todo: "Ruhe bewahren. Panikverkäufe sind der teuerste Fehler. Notgroschen prüfen.", source: "Markt-Ampel" });

  // 2) Themen: Chancen und Warnungen
  for (const t of d.themes || []) {
    const sc = t.scores || {}, pr = t.price || {};
    if (sc.quadrant === "quiet" && ok(sc.momentum) && sc.momentum >= 60) add({ id: `quiet-${t.id}`, kind: "chance", weight: 60 + sc.momentum / 5, view: "chancen", title: `${t.name}: steigt leise`, text: `Der Themen-ETF ${t.etf} liegt in 3 Monaten bei ${ok(pr.chg3m) ? p0(pr.chg3m) : "–"}, aber kaum jemand redet darüber: ein Trend ohne Rummel. Ob er hält, ist offen.`, todo: "Kandidat für eine kleine Beimischung (wenige Prozent) im Themen-Anteil deines Plans. Trends können jederzeit drehen.", source: "Hype-Karte" });
    if (sc.quadrant === "overheated") add({ id: `hot-${t.id}`, hype: hypeInfo(t), kind: "warnung", weight: 70 + (sc.heat || 0) / 5, view: "chancen", title: `${t.name}: überhitzt`, text: `${ok(pr.ext200) ? p0(pr.ext200) + " über dem Durchschnitt der letzten 200 Tage" : "Weit über dem Durchschnitt"}, dazu viel Aufmerksamkeit. Nach steilen Anstiegen steigt vor allem das Absturzrisiko; dass danach die Renditen verlässlich schlechter sind, ist nicht belegt (Greenwood, Shleifer & You 2019).`, todo: "Kein neuer Einstieg auf diesem Niveau. Nicht hektisch verkaufen (das kostet Steuern), sondern den Anteil beim jährlichen Rebalancing auf das Plan-Maß zurückführen.", source: "Hype-Karte" });
    if (sc.quadrant === "noise" && ok(sc.hype) && sc.hype >= 70) add({ id: `noise-${t.id}`, hype: hypeInfo(t), kind: "warnung", weight: 50 + sc.hype / 10, view: "chancen", title: `${t.name}: viel Lärm, wenig Kurs`, text: "Alle reden darüber, aber der Kurs zieht nicht mit. Typisches Muster bei Hype-Themen.", todo: "Nicht von Schlagzeilen leiten lassen.", source: "Hype-Karte" });
  }

  // 3) Krypto-Stimmung
  const fng = d.fearGreed?.value;
  if (ok(fng) && fng >= 80) add({ id: "crypto-greed", kind: "warnung", weight: 75, view: "maerkte", title: "Krypto: extreme Gier", text: `Der Krypto-Stimmungsindex steht bei ${fng} von 100. In solchen Phasen kaufen viele zu Höchstpreisen.`, todo: "Kein Bitcoin auf Pump kaufen. Höchstens den kleinen geplanten Anteil per Sparplan.", source: "Fear & Greed" });
  if (ok(fng) && fng <= 20) add({ id: "crypto-fear", kind: "chance", weight: 65, view: "maerkte", title: "Krypto: extreme Angst", text: `Der Krypto-Stimmungsindex steht nur bei ${fng} von 100. Historisch waren das eher günstige Einstiegsphasen, aber mit hohem Risiko.`, todo: "Nur Spielgeld, nur kleiner Anteil, in Raten.", source: "Fear & Greed" });

  // 4) Anlageklassen mit starken Bewegungen
  for (const a of d.assets || []) {
    if (a.missing) continue;
    if (ok(a.chg1w) && Math.abs(a.chg1w) >= (a.group === "Krypto" ? 0.12 : 0.05)) add({ id: `move-${a.id}`, kind: "info", weight: 55 + Math.min(20, Math.abs(a.chg1w) * 100), view: "maerkte", title: `${a.name} ${a.chg1w > 0 ? "springt" : "fällt"} ${p0(a.chg1w)} in einer Woche`, text: a.chg1w > 0 ? "Starke Wochen verleiten zum Hinterherkaufen. Das ist selten klug." : "Starke Verluste machen Angst. Für Langfrist-Anleger sind sie oft Nachkauf-Gelegenheiten.", todo: a.chg1w > 0 ? "Nicht hinterherlaufen, beim Plan bleiben." : "Nicht verkaufen, wenn es zum Plan gehört.", source: "Anlageklassen" });
    if (a.id === "world" && ok(a.ext200) && a.ext200 < -0.03) add({ id: "world-down", kind: "chance", weight: 80, view: "maerkte", title: "Welt-Aktien unter ihrem Durchschnitt", text: "Der breite Weltmarkt liegt unter seinem 200-Tage-Durchschnitt. Für Sparer heißt das: günstiger einkaufen.", todo: "Sparplan weiterlaufen lassen, eventuell eine Extra-Rate.", source: "Anlageklassen" });
  }

  // 5) Superinvestoren: gemeinsame Käufe
  for (const c of (d.superinvestors?.consensusBuys || []).slice(0, 2)) {
    if (c.buy.length < 3) continue;
    add({ id: `cons-${c.name}`, kind: "info", weight: 50 + c.buy.length * 3, view: "profis", title: `${c.buy.length} Top-Investoren kaufen ${prettyName(c.name)}`, text: `Gemeldet von ${c.buy.slice(0, 4).join(", ")}${c.buy.length > 4 ? " u. a." : ""}. Die Meldungen kommen bis zu 45 Tage nach Quartalsende, die Positionen können also bis zu 4,5 Monate alt sein.`, todo: "Eine Idee zum Selbst-Prüfen, kein Kaufsignal.", source: "SEC 13F" });
  }

  // 6) Versteckte Perlen: nur die stärkste
  const g = (d.gems || [])[0];
  if (g && g.score >= 60) add({ id: `gem-${g.sym}`, kind: "chance", weight: 55, view: "chancen", title: `Aktien-Idee: ${g.name}`, text: `${g.analysts} Analysten sehen ${p0(g.upside)} bis zum Kursziel. Im Aufwärtstrend, aber nicht überhitzt.`, todo: "Nur als Einzelwert im kleinen Themen-Anteil, nach eigener Recherche.", source: "Aktien-Ideen" });

  // 7) IPO-Fieber / Claude-Börsengang
  const ipo = (d.ipoWatch || []).find((w) => w.id === "anthropic");
  if (ipo && ipo.ipoNews7d >= 5) add({ id: "ipo-anthropic", kind: "info", weight: 60, view: "chancen", title: "Claude-Hersteller Anthropic: Börsengang im Gespräch", text: `${ipo.ipoNews7d} Schlagzeilen zu Börsengang oder Bewertung in 7 Tagen. Ein großer KI-IPO wäre ein Zeichen für späte Euphorie.`, todo: "Bei Hype-IPOs nicht am ersten Tag kaufen. Erste Kurse sind oft überzogen.", source: "IPO-Radar" });

  // 8) Analysten-Stimmung
  const v = d.voices;
  if (v && v.bull + v.bear >= 10) {
    const share = v.bull / (v.bull + v.bear);
    if (share >= 0.75) add({ id: "voices-bull", kind: "info", weight: 45, view: "profis", title: "Analysten sind sehr optimistisch", text: `${v.bull} von ${v.bull + v.bear} Stimmen der letzten Tage sind positiv. Wenn alle gleicher Meinung sind, ist Vorsicht angebracht.`, todo: "Nicht vom Optimismus anstecken lassen.", source: "Analysten-Stimmen" });
    if (share <= 0.3) add({ id: "voices-bear", kind: "info", weight: 45, view: "profis", title: "Analysten sind pessimistisch", text: `${v.bear} von ${v.bull + v.bear} Stimmen der letzten Tage sind vorsichtig. Schlechte Stimmung ist oft schon im Kurs.`, todo: "Langfrist-Plan beibehalten.", source: "Analysten-Stimmen" });
  }

  // 8b) Insider-Käufe: mehrere Vorstände kaufen gleichzeitig
  for (const b of (d.insiders?.buys || []).filter((x) => x.cluster).slice(0, 2)) {
    add({ id: `insider-${b.sym}`, kind: "chance", weight: 62, view: "profis", title: `Mehrere Insider kaufen ${b.sym}`, text: `${b.buyers.length} Vorstände oder Aufsichtsräte von ${b.name} haben in den letzten 30 Tagen mit eigenem Geld gekauft. Gemeinsame Insider-Käufe gelten als eines der stärksten öffentlichen Signale.`, todo: "Eine Idee zum Selbst-Prüfen, kein Kaufsignal: Warum kaufen sie? Wie ist die Bewertung?", source: "SEC Form 4" });
  }

  // 8c) Konjunktur-Frühwarnsystem (FRED)
  const mc = d.macro || {};
  if (mc.curve && ok(mc.curve.value) && mc.curve.value < 0) add({ id: "curve-inverted", kind: "warnung", weight: 72, view: "maerkte", title: "Zinskurve ist umgekehrt (invertiert)", text: `Kurzfristige US-Zinsen liegen ${Math.abs(mc.curve.value).toFixed(2).replace(".", ",")} Prozentpunkte über den langfristigen. Das kündigte historisch oft eine Rezession 6–18 Monate später an, aber nicht immer.`, todo: "Kein Grund zum Verkaufen, aber ein guter Moment, Notgroschen und Anleihen-Anteil zu prüfen.", source: "FRED (US-Notenbank)" });
  else if (mc.curve && ok(mc.curve.min1y) && mc.curve.min1y < 0 && mc.curve.value > 0) add({ id: "curve-steepening", kind: "info", weight: 60, view: "maerkte", title: "Zinskurve normalisiert sich wieder", text: "Im letzten Jahr war die Zinskurve umgekehrt und ist jetzt wieder positiv. Historisch begannen Rezessionen oft genau in dieser Phase.", todo: "Plan beibehalten, keine zusätzlichen Risiken eingehen.", source: "FRED (US-Notenbank)" });
  if (mc.hy && ok(mc.hy.value) && ok(mc.hy.ago3m) && mc.hy.value - mc.hy.ago3m >= 1) add({ id: "credit-stress", kind: "warnung", weight: 78, view: "maerkte", title: "Kreditmärkte werden nervös", text: `Der Risikoaufschlag für riskante Firmenanleihen stieg in 3 Monaten von ${mc.hy.ago3m.toFixed(1).replace(".", ",")} auf ${mc.hy.value.toFixed(1).replace(".", ",")} Prozentpunkte. Profis verlangen mehr Sicherheit. Das ist ein frühes Stresssignal.`, todo: "Keine Hebel, keine riskanten Einzelwetten. Sparplan weiter.", source: "FRED (US-Notenbank)" });
  if (mc.sahm && ok(mc.sahm.value) && mc.sahm.value >= 0.5) add({ id: "sahm", kind: "warnung", weight: 85, view: "maerkte", title: "Rezessions-Signal (Sahm-Regel) ausgelöst", text: `Die US-Arbeitslosigkeit steigt schnell (Sahm-Wert ${mc.sahm.value.toFixed(2).replace(".", ",")}, Schwelle 0,5). Bisher wurde die Schwelle bei jeder US-Rezession seit 1970 erreicht, meist kurz nach deren Beginn, nicht Monate vorher. Es gab auch Fehlalarme, etwa 2024.`, todo: "Notgroschen sichern, Plan beibehalten, Sparplan weiterlaufen lassen.", source: "FRED (US-Notenbank)" });

  // 8d) Rohstoffe: starke Monatsbewegungen und Extreme in der Jahresspanne
  for (const c of (d.commodities || []).filter((x) => !x.missing && ok(x.chg1m) && Math.abs(x.chg1m) >= 0.12).sort((a, b2) => Math.abs(b2.chg1m) - Math.abs(a.chg1m)).slice(0, 2)) {
    const up = c.chg1m > 0;
    add({ id: `com-${c.id}`, kind: "info", weight: 50 + Math.min(15, Math.abs(c.chg1m) * 50), view: "maerkte", title: `${c.name} ${up ? "steigt" : "fällt"} ${p0(c.chg1m)} in einem Monat`, text: up ? "Starke Preisanstiege bei Rohstoffen landen oft mit Verzögerung bei Herstellern und Verbrauchern." : "Deutlich gefallene Preise entlasten Firmen, die diesen Rohstoff einkaufen.", todo: up ? "Für Einkäufer: Absicherung des künftigen Bedarfs prüfen. Für Anleger: nicht hinterherkaufen." : "Für Einkäufer: Gelegenheit, Preise festzuschreiben. Für Anleger: kein Grund zur Panik.", source: "Rohstoff-Monitor" });
  }

  // 8e) Geldfluss in Krypto & Strompreis
  const sc = d.cryptoFlows?.stablecoins;
  if (sc && ok(sc.chg30) && Math.abs(sc.chg30) >= 0.05) add({ id: "stablecoin-flow", kind: "info", weight: 48, view: "chancen", title: sc.chg30 > 0 ? "Frisches Geld fließt in Krypto" : "Geld fließt aus Krypto ab", text: `Die Menge an Stablecoins (digitale Dollar) hat sich in 30 Tagen um ${p0(sc.chg30)} verändert. Das gilt als Hinweis auf Kaufkraft im Kryptomarkt, die Forschung dazu ist aber jung.`, todo: "Nur relevant für den kleinen Krypto-Anteil deines Plans.", source: "DefiLlama" });
  const pw = d.power;
  if (pw && ok(pw.avg) && ok(pw.avg30) && pw.avg30 > 0 && pw.avg / pw.avg30 - 1 >= 0.4) add({ id: "power-spike", kind: "info", weight: 46, view: "chancen", title: `Strompreis deutlich über dem Schnitt: ${Math.round(pw.avg)} €/MWh`, text: `Der Börsenstrompreis liegt ${p0(pw.avg / pw.avg30 - 1)} über dem 30-Tage-Schnitt. Das belastet energieintensive Branchen wie Chemie und Stahl.`, todo: "Für Einkäufer: Absicherung prüfen. Für Anleger: kurzfristige Spitzen nicht überbewerten.", source: "Energy-Charts" });

  // 9) Nachrichtenlage: Ereignis-Arten, über die gerade auffällig viel berichtet wird
  const TODO = {
    rates: "Zinsänderungen wirken über Monate. Plan nicht hektisch umbauen. Bei Senkungen profitieren Anleihen und Immobilien.",
    tariffs: "Breit gestreute ETFs gleichen das aus. Nicht wegen einzelner Zoll-Schlagzeilen verkaufen.",
    geopolitics: "Historisch erholten sich Märkte meist schnell. Panikverkäufe vermeiden, Gold-Anteil hilft.",
    inflation: "Sachwerte wie Aktien und Gold schützen langfristig besser als Bargeld.",
  };
  for (const e of (d.events || []).slice(0, 4)) {
    if (!(e.n48h >= 6 && ok(e.accel) && e.accel >= 1.5)) continue;
    add({ id: `event-${e.id}`, kind: e.id === "geopolitics" || e.id === "tariffs" ? "warnung" : "info", weight: 58 + Math.min(20, e.n48h / 2), view: "news",
      title: `${e.name}: ungewöhnlich viele Meldungen`, text: `${e.n48h} Meldungen in 48 Stunden, mehr als sonst. ${e.why}`,
      todo: TODO[e.id] || "Solche Nachrichten bewegen oft nur kurz die Kurse. Beim Plan bleiben.", source: "Nachrichten-Analyse" });
  }

  // 10) Immobilien: Bauzinsen deutlich verändert
  const m = d.realEstate?.mortgage;
  if (m && ok(m.rate) && ok(m.yearAgo) && Math.abs(m.rate - m.yearAgo) >= 0.005) {
    const up = m.rate > m.yearAgo;
    add({ id: "mortgage-move", kind: up ? "warnung" : "chance", weight: 52, view: "maerkte", title: `Bauzinsen ${up ? "gestiegen" : "gesunken"}: ${(m.rate * 100).toFixed(2).replace(".", ",")} %`, text: `Vor einem Jahr lagen sie bei ${(m.yearAgo * 100).toFixed(2).replace(".", ",")} %. ${up ? "Höhere Zinsen verteuern Kredite und bremsen die Hauspreise." : "Günstigere Kredite machen Kaufen wieder attraktiver."}`, todo: "Mit dem Immobilien-Rechner unter „Märkte“ durchrechnen, bevor du dich entscheidest.", source: "EZB-Statistik" });
  }

  return s.sort((a, b2) => b2.weight - a.weight);
}

const prettyName = (n) => String(n || "").toLowerCase().replace(/\b(inc|corp|co|ltd|plc|com|new|cl a|cl b)\b\.?/g, "").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());

/** Risk profiles. Research: the sensible equity share depends mainly on horizon and risk tolerance
 *  (Merton 1969, life-cycle models); over the long run risk was rewarded (Dimson, Marsh & Staunton). */
export const GOALS = {
  sicherheit: { label: "Sicherheit", short: "Kapital erhalten, wenig Schwankung" },
  ausgewogen: { label: "Ausgewogen", short: "Mischung aus Wachstum und Sicherheit" },
  wachstum: { label: "Wachstum", short: "Langfristig Vermögen aufbauen, Schwankungen aushalten" },
  mutig: { label: "Mutig", short: "Maximale Rendite, große Schwankungen okay" },
};

/** When is something hype? Lots of attention, but the price isn't following – or far above average plus a flood of attention. */
export function hypeInfo(t) {
  const sc = t?.scores || {}, pr = t?.price || {}, at = t?.attention || {};
  if (sc.quadrant === "overheated" && ok(sc.hype) && sc.hype >= 60) return `Viel Aufmerksamkeit und ${ok(pr.ext200) ? p0(pr.ext200) : "weit"} über dem 200-Tage-Durchschnitt: Begeisterung statt Fundament.`;
  if (sc.quadrant === "noise" && ok(sc.hype) && sc.hype >= 65) return "Alle reden darüber, aber der Kurs zieht nicht mit. Die Aufmerksamkeit ist größer als die Substanz.";
  if (ok(at.mom) && at.mom >= 0.6 && ok(pr.chg1m) && pr.chg1m < 0.02) return `Aufmerksamkeit ${p0(at.mom)} in einem Monat, Kurs kaum bewegt: Hype ohne Bestätigung.`;
  return null;
}

/** Concrete ideas that fit the chosen goal – each with a reason. Suggestions, not recommendations. */
export function ideasFor(d, goal = "ausgewogen") {
  const out = [], themes = d?.themes || [];
  if (goal === "sicherheit") {
    const ecb = d?.rates?.ecb;
    out.push({ title: "Tagesgeld oder Geldmarkt-ETF", why: ok(ecb) ? `Der EZB-Einlagenzins liegt bei ${(ecb * 100).toFixed(2).replace(".", ",")} %. Gute Tagesgeld-Konten und Geldmarkt-ETFs bewegen sich in dieser Nähe, fast ohne Schwankung.` : "Fast ohne Schwankung, täglich verfügbar.", tag: "sicher" });
    out.push({ title: "Kurzlaufende Staatsanleihen", why: "Planbare Zinsen, geringe Kursschwankung. Gut für Geld, das in 1–3 Jahren gebraucht wird.", tag: "sicher" });
    out.push({ title: "Kleiner Welt-ETF-Anteil (20–30 %)", why: "Auch vorsichtige Anleger profitieren langfristig von Aktien. Ein kleiner Anteil schlägt meist die Inflation.", tag: "Kern" });
    return out;
  }
  const fit = themes.filter((t) => ["quiet", "hot"].includes(t.scores?.quadrant) && ok(t.scores?.heat) && t.scores.heat < 70 && !hypeInfo(t))
    .sort((a, b) => (b.scores.momentum || 0) - (a.scores.momentum || 0)).slice(0, goal === "ausgewogen" ? 1 : goal === "wachstum" ? 2 : 3);
  for (const t of fit) out.push({ title: `${t.name} (z. B. ETF ${t.etf})`, why: t.scores.quadrant === "quiet" ? `Kurs steigt (3 Monate ${ok(t.price?.chg3m) ? p0(t.price.chg3m) : "–"}), aber noch wenig Aufmerksamkeit. Trends halten im Schnitt eine Weile an (Momentum, Jegadeesh & Titman 1993).` : `Kurs-Trend und Aufmerksamkeit steigen, aber noch nicht überhitzt (${Math.round(t.scores.heat)}/100).`, tag: "Trend" });
  if (goal !== "ausgewogen") {
    const ins = (d?.insiders?.buys || []).find((b) => b.cluster);
    if (ins) out.push({ title: `${ins.sym}: mehrere Insider kaufen`, why: `${ins.buyers.length} Insider (Vorstände, Aufsichtsräte oder Großaktionäre) haben mit eigenem Geld gekauft. Insider-Käufe gingen im Schnitt besseren Kursen voraus, am stärksten bei kleinen Firmen (Lakonishok & Lee 2001).`, tag: "Insider" });
    const g = (d?.gems || [])[0];
    if (g) out.push({ title: `${g.name} (${g.sym})`, why: `Aktien-Ideen: Aufwärtstrend ohne Überhitzung, ${g.analysts} Analysten sehen ${p0(g.upside)} Luft. Kursziele treffen allerdings selten, also selbst prüfen.`, tag: "Einzelwert" });
  }
  if (goal === "mutig") {
    const fng = d?.fearGreed?.value;
    out.push({ title: "Bitcoin als kleine Beimischung (bis 5–10 %)", why: ok(fng) && fng >= 75 ? `Achtung: Krypto-Stimmung gerade gierig (${fng}/100). Wenn überhaupt, dann in Raten.` : "Hohe Chancen, aber Abstürze von 70 % kommen vor. Nur Geld, das du entbehren kannst.", tag: "riskant" });
  }
  return out;
}

/** One sentence on the situation + "sensible now" / "better avoid", depending on market AND the user's goal. */
export function dailyVerdict(d, goal = "ausgewogen", years = 15) {
  const lvl = d?.risk?.level || "gelb";
  const b = d?.bubble?.score;
  const themes = d?.themes || [];
  const quiet = themes.filter((t) => t.scores?.quadrant === "quiet").map((t) => t.name);
  const hot = themes.filter((t) => t.scores?.quadrant === "overheated").map((t) => t.name);
  const bold = goal === "wachstum" || goal === "mutig";
  // Red can mean euphoria OR stress – the advice differs
  const euphoriaRed = lvl === "rot" && !((d?.risk?.stress ?? 0) >= 70);
  const EUPHORIA = {
    sicherheit: "Euphorie am Markt. Gut, dass dein Geld überwiegend sicher liegt. Jetzt nicht die Aktienquote erhöhen, weil alles steigt.",
    ausgewogen: "Euphorie am Markt. Plan beibehalten, Mischung halten, nichts nachkaufen, nur weil es stark gestiegen ist.",
    wachstum: "Euphorie am Markt. Investiert bleiben, aber keinen heiß gelaufenen Themen hinterherlaufen.",
    mutig: "Euphorie am Markt. Trend-Positionen begrenzen, keine neuen Wetten auf überhitzte Themen.",
  };
  const head = euphoriaRed ? EUPHORIA[goal] || EUPHORIA.ausgewogen : {
    sicherheit: { "grün": "Ruhiges Umfeld. Für dich zählt: Kapital erhalten und Zinsen mitnehmen.", "gelb": "Gemischte Lage. Für dich ändert sich wenig: Zinsen sichern, Aktienanteil klein halten.", "rot": "Unruhige Märkte. Gut, dass dein Geld überwiegend sicher liegt. Nichts überstürzen." },
    ausgewogen: { "grün": "Normales Börsenwetter. Ein guter Zeitpunkt, um ganz normal weiter zu investieren.", "gelb": "Gemischte Lage. Weiter sparen, Mischung halten, keinem Hype hinterherlaufen.", "rot": "Unruhige Zeit. Plan beibehalten, Ruhe bewahren, nichts überstürzen." },
    wachstum: { "grün": "Rückenwind. Für langfristiges Wachstum heißt das: investiert bleiben und Chancen nutzen.", "gelb": "Gemischte Lage, aber für deinen langen Horizont kein Grund zu zögern. Investieren, Hype meiden.", "rot": "Unruhe drückt die Kurse. Für Langfrist-Anleger sind solche Phasen historisch oft günstige Einstiege." },
    mutig: { "grün": "Rückenwind für Risiko. Trends nutzen, aber Positionen begrenzen und Hype erkennen.", "gelb": "Gemischte Lage. Gezielt auf Trends setzen, die noch nicht überhitzt sind, Hype meiden.", "rot": "Stress im Markt. Mutige Anleger kaufen in solchen Phasen oft nach, aber nur mit Geld, das liegen bleiben kann." },
  }[goal]?.[lvl] || "Gemischte Lage.";
  const cause = lvl === "rot" ? (euphoriaRed ? "euphorie" : "stress") : null;
  let doList;
  if (goal === "sicherheit") doList = [
    "Notgroschen und kurzfristiges Geld auf Tagesgeld oder Geldmarkt-ETF: Zinsen mitnehmen.",
    "Einen kleinen Welt-ETF-Sparplan (20–30 %) laufen lassen, damit die Inflation nicht alles auffrisst.",
    "Anleihen mit kurzer Laufzeit für planbare Erträge.",
  ];
  else doList = [
    "Sparplan auf einen breiten Welt-ETF weiterlaufen lassen. Das ist das Fundament.",
    LUMP_SUM_RULE,
    bold ? (quiet.length ? `Trend-Anteil (${goal === "mutig" ? "bis 20 %" : "bis 10 %"}) gezielt einsetzen, z. B. ${quiet.slice(0, 2).join(", ")}: steigt, aber noch wenig Hype.` : `Trend-Anteil (${goal === "mutig" ? "bis 20 %" : "bis 10 %"}) nur in Themen, die steigen und nicht überhitzt sind.`)
      : quiet.length ? `Für eine kleine Beimischung anschauen: ${quiet.slice(0, 2).join(", ")}.` : "Notgroschen (3 Monatsgehälter) auf dem Tagesgeld sichern.",
  ];
  const dontList = [
    hot.length ? `Jetzt nicht neu einsteigen in: ${hot.slice(0, 3).join(", ")} (überhitzt).` : "Keine Aktien kaufen, nur weil gerade alle darüber reden.",
    ok(b) && b >= 65 ? "Keine Kredite und keine Hebel-Produkte. In Euphorie-Phasen ist das besonders gefährlich." : "Keine Kredite, keine Hebel-Produkte, keine Tipps aus Chatgruppen.",
    goal === "mutig" ? "Keine Einzelposition über 5–10 % des Depots: Mutig heißt nicht alles auf eine Karte." : "Nicht in Panik verkaufen, wenn es mal 10–20 % runtergeht.",
  ];
  return { level: lvl, cause, head, doList, dontList, goal };
}
