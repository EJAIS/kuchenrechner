// Kuchenrechner - Internationalisierung (i18n)
//
// Muster analog zu github.com/EJAIS/jettingcalc (js/i18n.js): data-i18n-
// Attributsystem im HTML, t()/getLang()/setLang()/applyTranslations() als
// zentrale API, Sprachumschalter-Button, Sprachwahl in localStorage.
//
// Unterschied zu JettingCalc: Übersetzungen liegen hier nicht als
// eingebettete JS-Objekte in dieser Datei, sondern werden als JSON aus
// locales/*.json nachgeladen (fetch). Das erfordert einen Webserver (kein
// file://-Aufruf, da Browser dort keine fetch()-Requests auf lokale Dateien
// erlauben) - passt zum geplanten Server-Deployment dieses Projekts.
//
// Wie in data.js/calc.js: reines <script>-Tag ohne Module/Build-Step, alle
// Funktionen/Konstanten sind globale Bezeichner, die von app.js direkt
// genutzt werden können.

const SUPPORTED_LANGS = ["de", "en"];
const DEFAULT_LANG = "de";
const LANG_STORAGE_KEY = "kuchenrechner_lang";

// Cache der bereits geladenen Sprachdateien: { de: {...}, en: {...} }
const _translationsCache = {};

// Aktuell aktive Sprache. Wird von initI18n()/setLang() aktualisiert.
let _currentLang = DEFAULT_LANG;

// Fortlaufender Zähler für die rotierende Anzeige der Ergebnis-Sprüche
// (siehe getRotatingResultQuote()).
let _quoteIndex = 0;

/**
 * Ermittelt die Startsprache:
 * 1. bereits gespeicherte Wahl in localStorage (falls unterstützt)
 * 2. Browsersprache, falls unterstützt (navigator.languages/navigator.language)
 * 3. sonst Deutsch als Standard
 *
 * @returns {string} Sprachcode aus SUPPORTED_LANGS
 */
function detectDefaultLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage kann z. B. im Privatmodus einzelner Browser blockiert
    // sein - dann einfach mit der Spracherkennung fortfahren.
  }

  const browserLangs =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ""];

  for (const bl of browserLangs) {
    const primary = String(bl || "").toLowerCase().split("-")[0];
    if (SUPPORTED_LANGS.includes(primary)) {
      return primary;
    }
  }

  return DEFAULT_LANG;
}

/**
 * Lädt (und cached) die Übersetzungsdatei für eine Sprache.
 *
 * @param {string} lang
 * @returns {Promise<object>}
 */
async function loadLocale(lang) {
  if (_translationsCache[lang]) {
    return _translationsCache[lang];
  }

  const response = await fetch(`./locales/${lang}.json`);
  if (!response.ok) {
    throw new Error(
      `i18n: Sprachdatei für "${lang}" konnte nicht geladen werden (HTTP ${response.status}).`
    );
  }

  const data = await response.json();
  _translationsCache[lang] = data;
  return data;
}

/**
 * Löst einen Punkt-getrennten Schlüsselpfad (z. B. "cake.apfelkuchen.name")
 * gegen ein verschachteltes Objekt auf.
 */
function _resolvePath(obj, path) {
  return path.split(".").reduce((acc, part) => {
    return acc && typeof acc === "object" && part in acc ? acc[part] : undefined;
  }, obj);
}

/**
 * Übersetzt einen Schlüssel in die aktuell aktive Sprache. Fällt auf
 * DEFAULT_LANG und zuletzt auf den Schlüssel selbst zurück, falls die
 * Übersetzung fehlt.
 *
 * Platzhalter im Text (z. B. "Du musst {distance} km fahren") werden ersetzt,
 * wenn `params` ein Objekt mit passenden Feldern ist. Liefert der Schlüssel
 * ein Array (z. B. result.quotes), wird `params` ignoriert.
 *
 * @param {string} key
 * @param {Object<string, string|number>} [params]
 * @returns {string|Array|undefined}
 */
function t(key, params) {
  let value = _resolvePath(_translationsCache[_currentLang], key);
  if (value === undefined) {
    value = _resolvePath(_translationsCache[DEFAULT_LANG], key);
  }
  if (value === undefined) {
    return key;
  }

  if (typeof value === "string" && params) {
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    );
  }

  return value;
}

/**
 * Liefert den nächsten Spruch aus result.quotes im Rotationsprinzip (statt
 * zufällig), sodass beim wiederholten Berechnen nach und nach alle Sprüche
 * durchlaufen werden.
 *
 * @returns {string}
 */
function getRotatingResultQuote() {
  const quotes = t("result.quotes");
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return "";
  }
  const quote = quotes[_quoteIndex % quotes.length];
  _quoteIndex += 1;
  return quote;
}

function getLang() {
  return _currentLang;
}

/**
 * Wechselt die aktive Sprache, persistiert die Wahl in localStorage und
 * wendet die Übersetzungen auf das DOM an.
 *
 * @param {string} lang
 */
async function setLang(lang) {
  const normalizedLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;

  await loadLocale(normalizedLang);
  _currentLang = normalizedLang;

  try {
    localStorage.setItem(LANG_STORAGE_KEY, normalizedLang);
  } catch (e) {
    // Speichern optional - Sprache bleibt für diese Sitzung trotzdem aktiv.
  }

  applyTranslations();
}

/**
 * Wendet Übersetzungen auf alle Elemente mit data-i18n(-*)-Attributen an:
 * - data-i18n            → textContent
 * - data-i18n-placeholder → placeholder-Attribut
 * - data-i18n-title       → title-Attribut
 *
 * Aktualisiert außerdem <html lang="...">, das Label des Sprachumschalters
 * und feuert ein "i18n:applied"-Event, auf das app.js reagieren kann (z. B.
 * um dynamisch gerenderte Ergebnistexte neu zu übersetzen).
 */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = t(el.getAttribute("data-i18n"));
    if (typeof value === "string") {
      el.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const value = t(el.getAttribute("data-i18n-placeholder"));
    if (typeof value === "string") {
      el.setAttribute("placeholder", value);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const value = t(el.getAttribute("data-i18n-title"));
    if (typeof value === "string") {
      el.setAttribute("title", value);
    }
  });

  document.documentElement.lang = _currentLang;

  const pageTitle = t("app.title");
  if (typeof pageTitle === "string") {
    document.title = pageTitle;
  }

  const langBtn = document.getElementById("btn-lang");
  if (langBtn) {
    // Button zeigt die Sprache, in die gewechselt wird (Muster wie in
    // JettingCalc: aktuell "de" aktiv → Button zeigt "EN" an, usw.).
    const nextLang = _currentLang === "de" ? "en" : "de";
    langBtn.textContent = nextLang.toUpperCase();
    langBtn.setAttribute(
      "aria-label",
      _currentLang === "de" ? "Switch to English" : "Auf Deutsch wechseln"
    );
  }

  document.dispatchEvent(new CustomEvent("i18n:applied", { detail: { lang: _currentLang } }));
}

/**
 * Initialisiert i18n: bestimmt die Startsprache, lädt die zugehörige (und
 * als Sicherheitsnetz die deutsche) Sprachdatei, wendet die Übersetzungen an
 * und verdrahtet den Sprachumschalter-Button.
 *
 * @returns {Promise<void>}
 */
async function initI18n() {
  const lang = detectDefaultLang();

  await loadLocale(lang);
  if (lang !== DEFAULT_LANG) {
    // Deutsch zusätzlich laden, damit t() bei fehlenden Schlüsseln in der
    // Fremdsprache zuverlässig auf Deutsch zurückfallen kann.
    try {
      await loadLocale(DEFAULT_LANG);
    } catch (e) {
      console.warn("i18n: Fallback-Sprachdatei (de) konnte nicht geladen werden.", e);
    }
  }

  _currentLang = lang;
  applyTranslations();

  const langBtn = document.getElementById("btn-lang");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      setLang(_currentLang === "de" ? "en" : "de");
    });
  }
}

// Sofortiger Start, sobald das DOM bereit ist. app.js kann auf
// I18N_READY.then(...) warten, bevor es i18n-abhängige Inhalte (z. B.
// Kuchen-/Fahrertyp-Namen aus data.js) rendert.
const I18N_READY =
  document.readyState === "loading"
    ? new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(initI18n()));
      })
    : initI18n();
