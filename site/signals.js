// Signal-Leser: übersetzt Rohdaten in wenige, verständliche Hinweise mit Handlungsvorschlag.
// Reine Funktionen ohne DOM – im Browser genutzt und mit Node getestet.

const ok = (x) => typeof x === "number" && Number.isFinite(x);
const p0 = (x) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x * 100))} %`;

/**
 * Ein Signal: { id, kind: "chance"|"warnung"|"info", title, text, todo, weight (0–100), view, source }
 * weight = Wichtigkeit für die Sortierung; view = Bereich, in dem es Details gibt.
 */
export function buildSignals(d, history = []) {
  if (!d) return [];
  const s = [];
  const add = (o) => s.push({ view: "heute", ...o });

  // 1) Gesamtmarkt: Ampel & Blasen-Meter
  const b = d.bubble?.score, r = d.risk;
  const old = [...history].reverse().find((h) => ok(h.bubble) && Date.parse(h.date) <= Date.now() - 7 * 864e5)?.bubble;
  if (ok(b) && b >= 75) add({ id: "bubble-high", kind: "warnung", weight: 95, title: "Der Markt ist in Euphorie", text: `Das Blasen-Meter steht bei ${b} von 100. So hohe Werte gab es meist kurz vor größeren Rücksetzern, wann genau, weiß niemand.`, todo: "Sparplan weiterlaufen lassen, große Beträge über mehrere Monate verteilen, keine Hype-Käufe.", source: "Blasen-Meter" });
  else if (ok(b) && b <= 25) add({ id: "bubble-low", kind: "chance", weight: 85, title: "Angst im Markt, oft eine gute Kaufzeit", text: `Das Blasen-Meter steht nur bei ${b} von 100. Wenn viele Angst haben, waren Aktien historisch oft günstig.`, todo: "Sparplan auf keinen Fall stoppen. Wer Geld übrig hat, kann jetzt breit gestreut nachkaufen.", source: "Blasen-Meter" });
  if (ok(b) && ok(old) && Math.abs(b - old) >= 10) add({ id: "bubble-move", kind: b > old ? "warnung" : "info", weight: 70, title: b > old ? "Die Stimmung heizt sich schnell auf" : "Die Euphorie kühlt ab", text: `Das Blasen-Meter ist in einer Woche von ${old} auf ${b} ${b > old ? "gestiegen" : "gefallen"}.`, todo: b > old ? "Nicht von der Begeisterung mitreißen lassen." : "Kein Grund zur Panik: Abkühlung ist gesund.", source: "Blasen-Meter" });
  if (r?.stress >= 65) add({ id: "stress", kind: "warnung", weight: 90, title: "Der Markt ist gestresst", text: `Das Angstbarometer VIX steht bei ${ok(r.vix) ? r.vix.toFixed(0) : "–"}, und nur ${ok(r.breadth) ? Math.round(r.breadth * 100) : "–"} % der großen Aktien liegen im Aufwärtstrend.`, todo: "Ruhe bewahren. Panikverkäufe sind der teuerste Fehler. Notgroschen prüfen.", source: "Markt-Ampel" });

  // 2) Themen: Chancen und Warnungen
  for (const t of d.themes || []) {
    const sc = t.scores || {}, pr = t.price || {};
    if (sc.quadrant === "quiet" && ok(sc.momentum) && sc.momentum >= 60) add({ id: `quiet-${t.id}`, kind: "chance", weight: 60 + sc.momentum / 5, view: "chancen", title: `${t.name}: steigt leise`, text: `Der Themen-ETF ${t.etf} liegt in 3 Monaten bei ${ok(pr.chg3m) ? p0(pr.chg3m) : "–"}, aber kaum jemand redet darüber. Das ist oft die interessanteste Phase.`, todo: "Gut für eine kleine Beimischung (wenige Prozent) im Themen-Anteil deines Plans.", source: "Hype-Karte" });
    if (sc.quadrant === "overheated") add({ id: `hot-${t.id}`, kind: "warnung", weight: 70 + (sc.heat || 0) / 5, view: "chancen", title: `${t.name}: überhitzt`, text: `${ok(pr.ext200) ? p0(pr.ext200) + " über dem Durchschnitt der letzten 200 Tage" : "Weit über dem Durchschnitt"}, dazu viel Aufmerksamkeit. Nach solchen Phasen kommen oft Rücksetzer.`, todo: "Jetzt nicht neu einsteigen. Wer schon drin ist, kann einen Teil des Gewinns sichern.", source: "Hype-Karte" });
    if (sc.quadrant === "noise" && ok(sc.hype) && sc.hype >= 70) add({ id: `noise-${t.id}`, kind: "warnung", weight: 50 + sc.hype / 10, view: "chancen", title: `${t.name}: viel Lärm, wenig Kurs`, text: "Alle reden darüber, aber der Kurs zieht nicht mit. Typisches Muster bei Hype-Themen.", todo: "Nicht von Schlagzeilen leiten lassen.", source: "Hype-Karte" });
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
    add({ id: `cons-${c.name}`, kind: "info", weight: 50 + c.buy.length * 3, view: "profis", title: `${c.buy.length} Top-Investoren kaufen ${prettyName(c.name)}`, text: `Gemeldet von ${c.buy.slice(0, 4).join(", ")}${c.buy.length > 4 ? " u. a." : ""}. Die Meldungen sind bis zu 45 Tage alt.`, todo: "Eine Idee zum Selbst-Prüfen, kein Kaufsignal.", source: "SEC 13F" });
  }

  // 6) Versteckte Perlen: nur die stärkste
  const g = (d.gems || [])[0];
  if (g && g.score >= 60) add({ id: `gem-${g.sym}`, kind: "chance", weight: 55, view: "chancen", title: `Perle: ${g.name}`, text: `${g.analysts} Analysten sehen ${p0(g.upside)} bis zum Kursziel. Im Aufwärtstrend, aber nicht überhitzt.`, todo: "Nur als Einzelwert im kleinen Themen-Anteil, nach eigener Recherche.", source: "Perlen-Suche" });

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
  if (mc.sahm && ok(mc.sahm.value) && mc.sahm.value >= 0.5) add({ id: "sahm", kind: "warnung", weight: 85, view: "maerkte", title: "Rezessions-Signal (Sahm-Regel) ausgelöst", text: `Die US-Arbeitslosigkeit steigt schnell (Sahm-Wert ${mc.sahm.value.toFixed(2).replace(".", ",")}, Schwelle 0,5). Das zeigte bisher jede US-Rezession seit 1970 früh an.`, todo: "Notgroschen sichern, Plan beibehalten. Rezessionen sind für Sparer oft gute Kaufzeiten.", source: "FRED (US-Notenbank)" });

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

/** Ein Satz zur Lage + „Sinnvoll“ / „Lieber lassen“ für diese Woche. */
export function dailyVerdict(d) {
  const lvl = d?.risk?.level || "gelb";
  const b = d?.bubble?.score;
  const themes = d?.themes || [];
  const quiet = themes.filter((t) => t.scores?.quadrant === "quiet").map((t) => t.name);
  const hot = themes.filter((t) => t.scores?.quadrant === "overheated").map((t) => t.name);
  const head = {
    "grün": "Normales Börsenwetter. Ein guter Zeitpunkt, um ganz normal weiter zu investieren.",
    "gelb": "Gemischte Lage. Weiter sparen, aber keine großen Wetten und keinem Hype hinterherlaufen.",
    "rot": "Unruhige Zeit. Plan beibehalten, Ruhe bewahren, nichts überstürzen.",
  }[lvl];
  const doList = [
    "Sparplan auf einen breiten Welt-ETF weiterlaufen lassen. Das ist das Wichtigste.",
    lvl === "grün" ? "Einmalbeträge darfst du direkt anlegen." : "Größere Einmalbeträge auf 6–12 Monate verteilen.",
    quiet.length ? `Für eine kleine Beimischung anschauen: ${quiet.slice(0, 2).join(", ")}.` : "Notgroschen (3 Monatsgehälter) auf dem Tagesgeld sichern.",
  ];
  const dontList = [
    hot.length ? `Jetzt nicht neu einsteigen in: ${hot.slice(0, 3).join(", ")} (überhitzt).` : "Keine Aktien kaufen, nur weil gerade alle darüber reden.",
    ok(b) && b >= 65 ? "Keine Kredite und keine Hebel-Produkte. In Euphorie-Phasen ist das besonders gefährlich." : "Keine Kredite, keine Hebel-Produkte, keine Tipps aus Chatgruppen.",
    "Nicht in Panik verkaufen, wenn es mal 10–20 % runtergeht.",
  ];
  return { level: lvl, head, doList, dontList };
}
