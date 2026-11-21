// Automatic encrypted backup and transfer to another device.
// Everything is encrypted in the browser (AES-256-GCM). The password is never stored: the key derived from it
// (PBKDF2, 600,000 rounds) is kept as a non-extractable CryptoKey in IndexedDB, so it can encrypt but cannot be read out.
import { $, esc, store, toast, ago } from "./ui.js";
import { KEYS, collectBackup, applyBackup, deriveKey, encryptWithKey, encryptBackup, decryptBackup } from "./trust.js";

// ---------- pure helpers (tested) ----------
/** Encrypted backup text → URL-safe string for the part after "#import=". */
export const toLinkPart = (text) => btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromLinkPart = (s) => {
  if (!/^[\w-]{20,20000}$/.test(s)) throw new Error("Ungültiger Link");
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b + "=".repeat((4 - (b.length % 4)) % 4));
};
/** Should the app remind the user to back up? (no automatic file access, unsaved changes, last backup older than 7 days) */
export const needsReminder = ({ hasFile, dirty, at, now = Date.now() }) => !hasFile && !!dirty && (!at || now - Date.parse(at) > 7 * 864e5);

// ---------- small IndexedDB key-value store (CryptoKeys and file handles cannot live in localStorage) ----------
function idb(mode, fn) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("radar-sync", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("kv");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction("kv", mode), req = fn(tx.objectStore("kv"));
      tx.oncomplete = () => { db.close(); resolve(req?.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}
const kvGet = (k) => idb("readonly", (s) => s.get(k)).catch(() => null);
const kvSet = (k, v) => idb("readwrite", (s) => s.put(v, k));
const kvDel = (k) => idb("readwrite", (s) => s.delete(k));

const canFile = () => typeof window !== "undefined" && "showSaveFilePicker" in window;
const fileName = () => `signal-radar-${new Date().toISOString().slice(0, 10)}.radar`;
let paused = false, pendingImport = null, openPrefsFn = () => {};

async function shareOrDownload(text) {
  const file = new File([text], fileName(), { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Signal-Radar-Sicherung" }); return true; } catch (e) { if (e?.name === "AbortError") return false; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
  return true;
}

/** reason: "auto" (after a change, silent) or "click" (user tapped, may ask for permission / open the share sheet) */
async function backupNow(reason) {
  const a = await kvGet("auto"); if (!a?.key) return false;
  try {
    const text = await encryptWithKey(collectBackup(), a.key, a.salt);
    if (a.file) {
      let perm = await a.file.queryPermission?.({ mode: "readwrite" });
      if (perm !== "granted" && reason === "click") perm = await a.file.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") { paused = true; store.set("autoDirty", true); render(); return false; }
      const w = await a.file.createWritable(); await w.write(text); await w.close();
      paused = false;
    } else {
      if (reason !== "click") { store.set("autoDirty", true); render(); return false; } // this browser cannot write files on its own
      if (!(await shareOrDownload(text))) return false;
    }
    store.set("autoAt", new Date().toISOString()); store.set("autoDirty", false); render();
    return true;
  } catch { store.set("autoDirty", true); render(); return false; }
}

async function setup(pass) {
  if (pass.length < 10) return msg("Bitte oben ein Passwort mit mindestens 10 Zeichen eingeben.");
  let file = null;
  if (canFile()) { // must happen right after the tap, before the slow key derivation
    try { file = await window.showSaveFilePicker({ suggestedName: "signal-radar-auto.radar", types: [{ description: "Signal-Radar-Sicherung", accept: { "application/json": [".radar"] } }] }); }
    catch { return msg("Keine Datei gewählt, nichts eingerichtet."); }
  }
  msg("Schlüssel wird erzeugt …");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await kvSet("auto", { key: await deriveKey(pass, salt), salt, file });
  navigator.storage?.persist?.().catch(() => {});
  if (file) { await backupNow("auto"); msg("Eingerichtet. Ab jetzt wird nach jeder Änderung automatisch gesichert."); }
  else { store.set("autoDirty", true); render(); msg("Eingerichtet. Tipp auf „Jetzt sichern“, um die erste Sicherung abzulegen."); }
}

async function makeLink(pass) {
  const a = await kvGet("auto");
  let text;
  if (pass.length >= 10) text = await encryptBackup(collectBackup(), pass);
  else if (a?.key) text = await encryptWithKey(collectBackup(), a.key, a.salt);
  else return msg("Bitte oben ein Passwort mit mindestens 10 Zeichen eingeben.");
  const url = `${location.origin}${location.pathname}#import=${toLinkPart(text)}`;
  if (navigator.share) { try { await navigator.share({ title: "Signal-Radar: meine Einstellungen", url }); return msg("Link geteilt. Auf dem anderen Gerät öffnen und dasselbe Passwort eingeben."); } catch (e) { if (e?.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(url); msg("Link kopiert. Schick ihn dir selbst und öffne ihn auf dem anderen Gerät."); }
  catch { msg("Kopieren nicht möglich. Bitte über „Sicherung erstellen“ eine Datei übertragen."); }
}

async function importNow() {
  try {
    applyBackup(await decryptBackup(fromLinkPart(pendingImport), $("#bkPass").value));
    pendingImport = null; msg("Übernommen. Die Seite lädt neu …"); setTimeout(() => location.reload(), 900);
  } catch { msg("Das hat nicht geklappt: falsches Passwort oder beschädigter Link."); }
}

const msg = (t) => { const el = $("#autoMsg"); if (el) el.textContent = t; };

async function render() {
  const box = $("#autoBox"); if (!box) return;
  const a = await kvGet("auto"), keep = $("#autoMsg")?.textContent || "", at = store.get("autoAt", null), dirty = store.get("autoDirty", false);
  const status = !a?.key ? "" : paused
    ? `<p class="auto-status warn">⏸ Pausiert: Der Browser fragt nach einem Neustart einmal nach Erlaubnis. <button class="btn btn-ghost" type="button" data-auto="resume">Fortsetzen</button></p>`
    : `<p class="auto-status ok">✓ Aktiv${a.file ? `, speichert in „${esc(a.file.name)}“` : ""} · ${at ? `zuletzt gesichert ${ago(Date.parse(at))}` : "noch keine Sicherung"}${dirty && !a.file ? " · <b>neue Änderungen noch nicht gesichert</b>" : ""}</p>`;
  box.innerHTML = `${pendingImport ? `<div class="auto-import"><b>Du hast einen Übertragungs-Link geöffnet.</b> Gib oben das Passwort ein, mit dem er erstellt wurde, und tippe auf „Übernehmen“. Deine bisherigen Einstellungen auf diesem Gerät werden dabei ersetzt.<div class="bk-btns"><button class="btn btn-primary" type="button" data-auto="import">Übernehmen</button></div></div>` : ""}
    <h3>Automatisch sichern</h3>
    <p class="fine">${canFile()
      ? "Wähle einmal eine Datei, am besten in deinem Dropbox-, OneDrive- oder iCloud-Ordner. Danach legt das Radar nach jeder Änderung automatisch eine verschlüsselte Kopie dort ab. Der Cloud-Dienst lädt sie hoch, sieht aber nur Zeichensalat (Ende-zu-Ende-verschlüsselt)."
      : "Hier (z. B. iPhone oder Firefox) darf eine Webseite nicht selbst in Dateien schreiben. Das Radar merkt sich einen aus deinem Passwort erzeugten Schlüssel (nicht das Passwort) und zeigt, wenn es Neues zu sichern gibt. Ein Tipp auf „Jetzt sichern“ legt die verschlüsselte Datei z. B. in Dateien, iCloud oder Dropbox ab."}</p>
    ${status}
    <div class="bk-btns">${!a?.key ? `<button class="btn btn-primary" type="button" data-auto="setup">Automatische Sicherung einrichten</button>`
      : `${a.file ? "" : `<button class="btn btn-primary" type="button" data-auto="now">Jetzt sichern</button>`}<button class="btn btn-ghost" type="button" data-auto="off">Ausschalten</button>`}</div>
    <h3>Auf anderes Gerät übertragen</h3>
    <p class="fine">Erzeugt einen Link, in dem deine Einstellungen verschlüsselt stecken. Schick ihn dir selbst (WhatsApp, E-Mail), öffne ihn auf dem anderen Gerät und gib dasselbe Passwort ein. Der Inhalt steht im Teil hinter dem „#“, den Browser nie an unsere Seite senden. Wer den Link abfängt, braucht trotzdem dein Passwort.</p>
    <div class="bk-btns"><button class="btn btn-ghost" type="button" data-auto="link">Übertragungs-Link erstellen</button></div>
    <p class="fine" id="autoMsg"></p>`;
  msg(keep);
}

export function initSync({ openPrefs } = {}) {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  openPrefsFn = openPrefs || openPrefsFn;
  if (location.hash.startsWith("#import=")) {
    pendingImport = location.hash.slice(8);
    history.replaceState(null, "", location.pathname + location.search);
    setTimeout(() => { openPrefsFn(); render().then(() => $("#autoBox")?.scrollIntoView({ block: "start" })); }, 300);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-auto]"); if (!b) return;
    const act = b.dataset.auto, pass = $("#bkPass")?.value || "";
    if (act === "setup") await setup(pass);
    else if (act === "now" || act === "resume") { if (await backupNow("click")) msg("Gesichert."); }
    else if (act === "off") { await kvDel("auto"); store.set("autoAt", null); store.set("autoDirty", false); paused = false; render(); msg("Automatische Sicherung ausgeschaltet. Bereits gesicherte Dateien bleiben, wo sie sind."); }
    else if (act === "link") await makeLink(pass);
    else if (act === "import") await importNow();
  });
  let t;
  addEventListener("radar:store", (e) => {
    if (!KEYS.includes(e.detail)) return;
    clearTimeout(t); t = setTimeout(() => backupNow("auto"), 2000); // one write after a burst of changes
  });
  kvGet("auto").then(async (a) => {
    if (a?.file && (await a.file.queryPermission?.({ mode: "readwrite" })) !== "granted") paused = true;
    render();
    const dirty = store.get("autoDirty", false);
    if (a?.key && (paused ? dirty : needsReminder({ hasFile: !!a.file, dirty, at: store.get("autoAt", null) })))
      setTimeout(() => toast("Neue Einstellungen noch nicht gesichert: ⚙ Anpassen → Automatisch sichern"), 2500);
  });
}
