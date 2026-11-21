// Drafts: half-finished inputs are kept on this device, so nothing is lost when a window
// is closed, the phone locks or the app reloads. Drafts are never part of the backup.
import { store } from "./ui.js";

const PREFIX = "draft:";
const MAX_AGE = 30 * 864e5;

/** Store a draft with its time. */
export function saveDraft(key, value) { store.set(PREFIX + key, { at: Date.now(), value }); }
/** The draft value if one exists and is younger than 30 days, else null. Pure given storage and time. */
export function loadDraft(key, now = Date.now()) {
  const d = store.get(PREFIX + key, null);
  return d && d.value !== undefined && now - (d.at || 0) < MAX_AGE ? { at: d.at, value: d.value } : null;
}
export function clearDraft(key) { try { localStorage.removeItem("radar:" + PREFIX + key); } catch { /* private mode */ } }
export const isDraftKey = (k) => String(k || "").startsWith(PREFIX);

/** "vor 5 Minuten", "gestern" … for "Entwurf von …". Pure. */
export function draftAge(at, now = Date.now()) {
  const m = Math.round((now - at) / 6e4);
  if (m < 2) return "gerade eben";
  if (m < 60) return `vor ${m} Minuten`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Stunde${h === 1 ? "" : "n"}`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

/** Named fields of a form as a plain object (no passwords or files). Pure given the form. */
export function formValues(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.type === "password" || el.type === "file" || el.type === "submit") continue;
    if (el.type === "radio") { if (el.checked) out[el.name] = el.value; continue; }
    if (el.type === "checkbox") { out[el.name] = el.checked; continue; }
    out[el.name] = el.value;
  }
  return out;
}

/** Calculator forms keep their last inputs: restored on start, saved while typing. */
export function initFormDrafts(ids) {
  for (const id of ids) {
    const f = document.getElementById(id); if (!f) continue;
    const d = loadDraft(id);
    if (d && d.value && typeof d.value === "object") {
      for (const el of f.elements) {
        if (!el.name || !(el.name in d.value)) continue;
        const v = d.value[el.name];
        if (el.type === "radio") el.checked = el.value === v;
        else if (el.type === "checkbox") el.checked = !!v;
        else if (el.type !== "password" && el.type !== "file") { el.value = String(v ?? ""); if (el.hasAttribute("data-auto")) el.dataset.touched = "1"; }
      }
      f.dispatchEvent(new Event("input", { bubbles: true }));
    }
    let t;
    // Fields with data-auto get a live default (e.g. today's mortgage rate): kept only once the user changed them
    const save = () => { const v = formValues(f); for (const el of f.elements) if (el.name && el.hasAttribute("data-auto") && !el.dataset.touched) delete v[el.name]; saveDraft(id, v); };
    f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(save, 400); });
    f.addEventListener("change", save);
  }
}
