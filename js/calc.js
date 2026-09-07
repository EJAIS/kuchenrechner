// Kuchenrechner - Berechnungslogik
//
// Reine Funktionen ohne DOM-Zugriff, damit sie unabhängig von der Oberfläche
// getestet werden können (siehe js/calc.test.js).

/**
 * Berechnet die benötigte Fahrzeit, um eine bestimmte Kalorienmenge bei
 * gegebener Dauerleistung zu "verfahren".
 *
 * Faustregel: 1 kcal ≈ 1 kJ (vereinfachte Alltagsrechnung, siehe
 * PHYSICS_CONSTANTS-Kommentar in data.js für die genaue Herleitung).
 *
 * t(s) = kcalTarget * 1000 / watt
 *
 * @param {number} kcalTarget - Ziel-Kalorienmenge (kcal)
 * @param {number} watt - Dauerleistung (Watt)
 * @returns {number} Zeit in Sekunden
 */
function calculateTimeSeconds(kcalTarget, watt) {
  return (kcalTarget * 1000) / watt;
}

/**
 * Löst die Leistungsgleichung
 *   watt = CRR * totalMass * GRAVITY * v + 0.5 * AIR_DENSITY * CDA * v^3
 * numerisch per Bisektion nach v (m/s) auf und gibt das Ergebnis in km/h
 * zurück. Die Funktion ist für v >= 0 streng monoton steigend, daher ist
 * Bisektion ein stabiles und einfaches Lösungsverfahren.
 *
 * @param {number} watt - verfügbare Dauerleistung (Watt)
 * @param {number} riderWeightKg - Fahrergewicht (kg)
 * @param {{CRR:number, CDA:number, AIR_DENSITY:number, GRAVITY:number, BIKE_WEIGHT_KG:number}} physicsConstants
 * @returns {number} Geschwindigkeit auf flachem Terrain in km/h
 */
function solveFlatSpeedKmh(watt, riderWeightKg, physicsConstants) {
  const { CRR, CDA, AIR_DENSITY, GRAVITY, BIKE_WEIGHT_KG } = physicsConstants;
  const totalMass = riderWeightKg + BIKE_WEIGHT_KG;

  function powerAtSpeed(v) {
    return CRR * totalMass * GRAVITY * v + 0.5 * AIR_DENSITY * CDA * v ** 3;
  }

  let lo = 0;
  let hi = 25; // m/s (= 90 km/h), plausible Obergrenze für Rennrad-Leistungsbereich

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (powerAtSpeed(mid) < watt) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const speedMs = (lo + hi) / 2;
  return speedMs * 3.6;
}

/**
 * Berechnet die zurückgelegte Distanz aus Zeit, Flachstrecken-Geschwindigkeit
 * und einem Geländefaktor (siehe TERRAIN_FACTORS in data.js).
 *
 * effectiveSpeed = flatSpeedKmh * terrainFactor
 * distanceKm = effectiveSpeed * (timeSeconds / 3600)
 *
 * @param {number} timeSeconds - Fahrzeit in Sekunden
 * @param {number} flatSpeedKmh - Geschwindigkeit auf flachem Terrain (km/h)
 * @param {number} terrainFactor - Abschlagsfaktor für das Gelände (0-1)
 * @returns {number} Distanz in km
 */
function calculateDistanceKm(timeSeconds, flatSpeedKmh, terrainFactor) {
  const effectiveSpeed = flatSpeedKmh * terrainFactor;
  return effectiveSpeed * (timeSeconds / 3600);
}

/**
 * Kombiniert calculateTimeSeconds, solveFlatSpeedKmh und calculateDistanceKm
 * zu einem Gesamtergebnis.
 *
 * @param {{kcalTarget:number, watt:number, riderWeightKg:number, terrainFactor:number, physicsConstants:object}} params
 * @returns {{timeSeconds:number, distanceKm:number, flatSpeedKmh:number}}
 */
function calculateResult({ kcalTarget, watt, riderWeightKg, terrainFactor, physicsConstants }) {
  const timeSeconds = calculateTimeSeconds(kcalTarget, watt);
  const flatSpeedKmh = solveFlatSpeedKmh(watt, riderWeightKg, physicsConstants);
  const distanceKm = calculateDistanceKm(timeSeconds, flatSpeedKmh, terrainFactor);

  return { timeSeconds, distanceKm, flatSpeedKmh };
}

// Kompatibilitäts-Export für Node (z. B. Tests), ohne den Browser-Einsatz als
// einfaches <script>-Tag (globale Funktionen, kein Build-Step) zu stören.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateTimeSeconds,
    solveFlatSpeedKmh,
    calculateDistanceKm,
    calculateResult,
  };
}
