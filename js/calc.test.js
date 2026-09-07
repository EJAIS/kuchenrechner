// Kuchenrechner - Tests für calc.js
//
// Nutzt ausschließlich Node's eingebauten Test-Runner (node:test / node:assert),
// keine zusätzlichen Dependencies. Ausführen mit: node js/calc.test.js

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateTimeSeconds,
  solveFlatSpeedKmh,
  calculateDistanceKm,
  calculateResult,
} = require("./calc.js");

// Referenzwerte aus der Video-Quelle: 400 kcal Kuchen bei unterschiedlicher
// Dauerleistung. Dient als Regressionstest für die Kernformel
// t(s) = kcalTarget * 1000 / watt.
test("calculateTimeSeconds(400, 110) ≈ 3636s (~60min)", () => {
  const t = calculateTimeSeconds(400, 110);
  assert.ok(Math.abs(t - 3636.36) < 1, `erwartet ~3636s, erhalten ${t}`);
});

test("calculateTimeSeconds(400, 160) ≈ 2500s (~42min)", () => {
  const t = calculateTimeSeconds(400, 160);
  assert.ok(Math.abs(t - 2500) < 1, `erwartet ~2500s, erhalten ${t}`);
});

test("calculateTimeSeconds(400, 220) ≈ 1818s (~30min)", () => {
  const t = calculateTimeSeconds(400, 220);
  assert.ok(Math.abs(t - 1818.18) < 1, `erwartet ~1818s, erhalten ${t}`);
});

// Sanity-Check statt exaktem Fixwert: Flachstrecken-Geschwindigkeit soll für
// realistische Watt-/Gewichtskombinationen in einem plausiblen Bereich liegen.
test("solveFlatSpeedKmh liefert plausible Werte zwischen 15 und 45 km/h", () => {
  const physicsConstants = {
    CRR: 0.005,
    CDA: 0.32,
    AIR_DENSITY: 1.225,
    GRAVITY: 9.81,
    BIKE_WEIGHT_KG: 10,
  };
  const wattValues = [110, 160, 220];
  const weightValues = [60, 80, 100];

  for (const watt of wattValues) {
    for (const riderWeightKg of weightValues) {
      const speedKmh = solveFlatSpeedKmh(watt, riderWeightKg, physicsConstants);
      assert.ok(
        speedKmh > 15 && speedKmh < 45,
        `watt=${watt}, weight=${riderWeightKg}kg: erwartet 15-45 km/h, erhalten ${speedKmh}`
      );
    }
  }
});

// Ergänzender Test: solveFlatSpeedKmh soll die Leistungsgleichung tatsächlich
// erfüllen (Rücksubstitution), unabhängig vom Sanity-Bereich oben.
test("solveFlatSpeedKmh erfüllt die Leistungsgleichung (Rücksubstitution)", () => {
  const physicsConstants = {
    CRR: 0.005,
    CDA: 0.32,
    AIR_DENSITY: 1.225,
    GRAVITY: 9.81,
    BIKE_WEIGHT_KG: 10,
  };
  const watt = 160;
  const riderWeightKg = 75;
  const totalMass = riderWeightKg + physicsConstants.BIKE_WEIGHT_KG;

  const speedKmh = solveFlatSpeedKmh(watt, riderWeightKg, physicsConstants);
  const speedMs = speedKmh / 3.6;
  const wattBack =
    physicsConstants.CRR * totalMass * physicsConstants.GRAVITY * speedMs +
    0.5 * physicsConstants.AIR_DENSITY * physicsConstants.CDA * speedMs ** 3;

  assert.ok(Math.abs(wattBack - watt) < 0.01, `erwartet ~${watt}W, erhalten ${wattBack}W`);
});

test("calculateDistanceKm kombiniert Zeit, Geschwindigkeit und Geländefaktor", () => {
  // 1h bei 30 km/h auf flachem Terrain (Faktor 1.0) = 30km
  const d1 = calculateDistanceKm(3600, 30, 1.0);
  assert.ok(Math.abs(d1 - 30) < 1e-9, `erwartet 30km, erhalten ${d1}`);

  // gleiche Zeit/Geschwindigkeit, aber "berg" (Faktor 0.45) = 13.5km
  const d2 = calculateDistanceKm(3600, 30, 0.45);
  assert.ok(Math.abs(d2 - 13.5) < 1e-9, `erwartet 13.5km, erhalten ${d2}`);
});

test("calculateResult kombiniert calculateTimeSeconds, solveFlatSpeedKmh und calculateDistanceKm", () => {
  const physicsConstants = {
    CRR: 0.005,
    CDA: 0.32,
    AIR_DENSITY: 1.225,
    GRAVITY: 9.81,
    BIKE_WEIGHT_KG: 10,
  };

  const params = {
    kcalTarget: 400,
    watt: 160,
    riderWeightKg: 75,
    terrainFactor: 1.0,
    physicsConstants,
  };

  const result = calculateResult(params);
  const expectedTimeSeconds = calculateTimeSeconds(params.kcalTarget, params.watt);
  const expectedFlatSpeedKmh = solveFlatSpeedKmh(
    params.watt,
    params.riderWeightKg,
    physicsConstants
  );
  const expectedDistanceKm = calculateDistanceKm(
    expectedTimeSeconds,
    expectedFlatSpeedKmh,
    params.terrainFactor
  );

  assert.equal(result.timeSeconds, expectedTimeSeconds);
  assert.equal(result.flatSpeedKmh, expectedFlatSpeedKmh);
  assert.equal(result.distanceKm, expectedDistanceKm);
});
