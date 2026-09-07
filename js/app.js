// Kuchenrechner - Einstiegspunkt / App-Initialisierung
//
// Verdrahtet die Eingabe-Karte mit calc.js/data.js und aktualisiert die
// Ergebnis-Karte live bei jeder Änderung (kein "Berechnen"-Button nötig).
//
// Event-Handling nach dem Muster aus github.com/EJAIS/jettingcalc:
// delegierte Listener auf den jeweiligen Container statt vieler einzelner
// Listener pro Kachel/Button, Ziel-Element über data-*-Attribute + closest()
// identifiziert.

// ── State ─────────────────────────────────────────────────────────────────
// cakeId ist bewusst anfangs null: die Ergebnis-Karte bleibt ausgeblendet,
// bis der Nutzer einen Kuchen gewählt hat. Fahrertyp, Gewicht, Gelände und
// Ergebnis-Modus haben sinnvolle Vorbelegungen.
const state = {
  cakeId: null,
  customKcal: 400,
  riderId: "zuegig",
  weightKg: 75,
  terrainId: "flach",
  resultMode: "both",
};

// ── DOM-Referenzen ───────────────────────────────────────────────────────
const inputCardEl = document.getElementById("input-card");
const resultCardEl = document.getElementById("result-card");

const cakeTilesEl = document.getElementById("cake-tiles");
const customKcalControlEl = document.getElementById("custom-kcal-control");
const customKcalSliderEl = document.getElementById("custom-kcal-slider");
const customKcalValueEl = document.getElementById("custom-kcal-value");

const riderTilesEl = document.getElementById("rider-tiles");

const weightSliderEl = document.getElementById("weight-slider");
const weightNumberEl = document.getElementById("weight-number");

const terrainToggleEl = document.getElementById("terrain-toggle");
const resultModeToggleEl = document.getElementById("result-mode-toggle");

const statDistanceEl = document.getElementById("stat-distance");
const statTimeEl = document.getElementById("stat-time");
const resultDistanceValueEl = document.getElementById("result-distance-value");
const resultTimeValueEl = document.getElementById("result-time-value");
const resultSpeedEl = document.getElementById("result-speed");
const resultQuoteEl = document.getElementById("result-quote");

const WEIGHT_MIN = 40;
const WEIGHT_MAX = 140;

// ── Hilfsfunktionen ──────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Formatiert eine Zahl locale-bewusst (Komma in DE, Punkt in EN) mit fester
 * Nachkommastellenzahl.
 */
function formatNumber(value, decimals) {
  const locale = getLang() === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatiert eine Sekundenangabe als "X Std. Y Min." (bzw. "X hr Y min" in
 * EN), ohne Stunden-Anteil, wenn dieser 0 ist.
 */
function formatDuration(timeSeconds) {
  const totalMinutes = Math.round(timeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return t("ui.durationHoursMinutes", { hours, minutes });
  }
  return t("ui.durationMinutesOnly", { minutes });
}

/**
 * Markiert innerhalb eines Containers das Element, dessen data-Attribut dem
 * aktiven Wert entspricht, als ausgewählt (Klasse + aria-pressed) und alle
 * anderen als nicht ausgewählt.
 */
function setActiveTile(container, attrSelector, datasetProp, activeValue) {
  container.querySelectorAll(attrSelector).forEach((el) => {
    const isActive = el.dataset[datasetProp] === activeValue;
    el.classList.toggle("is-selected", isActive);
    el.setAttribute("aria-pressed", String(isActive));
  });
}

function getSelectedRiderWatt() {
  const rider = RIDER_TYPES.find((r) => r.id === state.riderId);
  return rider ? rider.watt : RIDER_TYPES[0].watt;
}

/**
 * Liefert das Kalorienziel für die aktuelle Auswahl, oder null, falls noch
 * kein Kuchen gewählt wurde.
 */
function getKcalTarget() {
  if (!state.cakeId) {
    return null;
  }
  if (state.cakeId === "custom") {
    return state.customKcal;
  }
  const cake = CAKES.find((c) => c.id === state.cakeId);
  return cake ? cake.kcal : null;
}

// ── Rendering: Kacheln/Toggles ───────────────────────────────────────────

function renderCakeTiles() {
  cakeTilesEl.innerHTML = CAKES.map((cake) => {
    const isCustom = cake.id === "custom";
    const kcalMarkup = isCustom
      ? ""
      : `<span class="tile-kcal">${cake.kcal} kcal</span>`;

    return `
      <button type="button" class="tile cake-tile" data-cake-id="${cake.id}" aria-pressed="false">
        <span class="tile-icon" aria-hidden="true">${cake.icon}</span>
        <span class="tile-name" data-i18n="cake.${cake.id}.name">${t(`cake.${cake.id}.name`)}</span>
        ${kcalMarkup}
      </button>
    `;
  }).join("");
}

function renderRiderTiles() {
  riderTilesEl.innerHTML = RIDER_TYPES.map((rider) => {
    const isSelected = rider.id === state.riderId;
    return `
      <button type="button" class="tile rider-tile${isSelected ? " is-selected" : ""}" data-rider-id="${rider.id}" aria-pressed="${isSelected}">
        <span class="tile-name" data-i18n="rider.${rider.id}.name">${t(`rider.${rider.id}.name`)}</span>
        <span class="tile-watt">${rider.watt} W</span>
      </button>
    `;
  }).join("");
}

function renderTerrainToggle() {
  terrainToggleEl.innerHTML = Object.keys(TERRAIN_FACTORS)
    .map((terrainId) => {
      const isSelected = terrainId === state.terrainId;
      return `
        <button type="button" class="toggle-btn${isSelected ? " is-selected" : ""}" data-terrain-id="${terrainId}" aria-pressed="${isSelected}">
          <span data-i18n="terrain.${terrainId}">${t(`terrain.${terrainId}`)}</span>
        </button>
      `;
    })
    .join("");
}

function syncWeightInputs() {
  weightSliderEl.value = state.weightKg;
  weightNumberEl.value = state.weightKg;
}

// ── Event-Handler ────────────────────────────────────────────────────────

function handleCakeSelect(cakeId) {
  state.cakeId = cakeId;
  setActiveTile(cakeTilesEl, "[data-cake-id]", "cakeId", cakeId);
  customKcalControlEl.hidden = cakeId !== "custom";
  recalcAndRender();
}

function handleRiderSelect(riderId) {
  state.riderId = riderId;
  setActiveTile(riderTilesEl, "[data-rider-id]", "riderId", riderId);
  recalcAndRender();
}

function handleTerrainSelect(terrainId) {
  state.terrainId = terrainId;
  setActiveTile(terrainToggleEl, "[data-terrain-id]", "terrainId", terrainId);
  recalcAndRender();
}

function handleResultModeSelect(resultMode) {
  state.resultMode = resultMode;
  setActiveTile(resultModeToggleEl, "[data-result-mode]", "resultMode", resultMode);
  recalcAndRender();
}

function handleWeightInput(rawValue) {
  const value = clamp(Math.round(Number(rawValue)), WEIGHT_MIN, WEIGHT_MAX);
  if (!Number.isFinite(value)) {
    return;
  }
  state.weightKg = value;
  syncWeightInputs();
  recalcAndRender();
}

function handleCustomKcalInput(rawValue) {
  const stepped = Math.round(Number(rawValue) / 10) * 10;
  const value = clamp(stepped, 100, 800);
  if (!Number.isFinite(value)) {
    return;
  }
  state.customKcal = value;
  customKcalSliderEl.value = value;
  customKcalValueEl.textContent = `${value} kcal`;
  recalcAndRender();
}

// ── Delegierte Listener ──────────────────────────────────────────────────

inputCardEl.addEventListener("click", (event) => {
  const cakeTile = event.target.closest("[data-cake-id]");
  if (cakeTile) {
    handleCakeSelect(cakeTile.dataset.cakeId);
    return;
  }

  const riderTile = event.target.closest("[data-rider-id]");
  if (riderTile) {
    handleRiderSelect(riderTile.dataset.riderId);
    return;
  }

  const terrainBtn = event.target.closest("[data-terrain-id]");
  if (terrainBtn) {
    handleTerrainSelect(terrainBtn.dataset.terrainId);
    return;
  }

  const modeBtn = event.target.closest("[data-result-mode]");
  if (modeBtn) {
    handleResultModeSelect(modeBtn.dataset.resultMode);
  }
});

inputCardEl.addEventListener("input", (event) => {
  const field = event.target.closest("[data-field]");
  if (!field) {
    return;
  }

  if (field.dataset.field === "weight") {
    handleWeightInput(field.value);
  } else if (field.dataset.field === "customKcal") {
    handleCustomKcalInput(field.value);
  }
});

// ── Ergebnis berechnen & rendern ─────────────────────────────────────────

function recalcAndRender() {
  const kcalTarget = getKcalTarget();

  if (kcalTarget === null || !Number.isFinite(kcalTarget)) {
    resultCardEl.hidden = true;
    return;
  }

  const result = calculateResult({
    kcalTarget,
    watt: getSelectedRiderWatt(),
    riderWeightKg: state.weightKg,
    terrainFactor: TERRAIN_FACTORS[state.terrainId],
    physicsConstants: PHYSICS_CONSTANTS,
  });

  renderResult(result);
  resultCardEl.hidden = false;
}

function renderResult(result) {
  const distanceRounded = Math.round(result.distanceKm * 10) / 10;
  const speedRounded = Math.round(result.flatSpeedKmh * 10) / 10;
  const durationText = formatDuration(result.timeSeconds);

  const showDistance = state.resultMode === "distance" || state.resultMode === "both";
  const showTime = state.resultMode === "time" || state.resultMode === "both";

  statDistanceEl.hidden = !showDistance;
  statTimeEl.hidden = !showTime;

  const distanceLabel = `${formatNumber(distanceRounded, 1)} km`;
  resultDistanceValueEl.textContent = distanceLabel;
  statDistanceEl.setAttribute(
    "aria-label",
    t("result.distanceText", { distance: formatNumber(distanceRounded, 1) })
  );

  resultTimeValueEl.textContent = durationText;
  statTimeEl.setAttribute("aria-label", t("result.timeText", { time: durationText }));

  resultSpeedEl.textContent = t("result.speedText", { speed: formatNumber(speedRounded, 1) });
  resultQuoteEl.textContent = getRotatingResultQuote();
}

// ── Initialisierung ──────────────────────────────────────────────────────

async function init() {
  // Auf geladene Sprachdateien warten, damit Kacheln/Toggles direkt mit dem
  // richtigen Text gerendert werden (siehe js/i18n.js).
  await I18N_READY;

  renderCakeTiles();
  renderRiderTiles();
  renderTerrainToggle();
  syncWeightInputs();
}

// Bei jedem Sprachwechsel (Button oben rechts) müssen dynamisch gerenderte
// Texte neu berechnet werden: Zahlenformat (Komma/Punkt), Dauer-Einheiten,
// Ergebnis-Sätze und der aktuell angezeigte Spruch. Kuchen-/Fahrertyp-Namen
// und Gelände-Labels werden bereits automatisch über das data-i18n-System
// in applyTranslations() aktualisiert.
document.addEventListener("i18n:applied", () => {
  recalcAndRender();
});

init();
