// Kuchenrechner - Datenmodelle / Konstanten
//
// Hinweis: Anzeigenamen (z. B. Kuchen- und Fahrertypen) liegen bewusst NICHT
// hier, sondern in den i18n-Dateien unter locales/*.json (Keys:
// cake.<id>.name bzw. rider.<id>.name). Diese Datei enthält nur die
// fachlichen/physikalischen Werte.

// Kalorienangaben (kcal) sind grobe Richtwerte pro Stück (Durchschnittswerte
// gängiger Rezepte/Nährwerttabellen), keine exakten Messwerte.
const CAKES = [
  { id: "apfelkuchen", kcal: 220, icon: "🍎" },
  { id: "kaesekuchen", kcal: 350, icon: "🍰" },
  { id: "schwarzwaelderkirsch", kcal: 450, icon: "🍒" },
  { id: "sachertorte", kcal: 450, icon: "🍫" },
  { id: "bienenstich", kcal: 260, icon: "🐝" },
  { id: "pflaumenkuchen", kcal: 250, icon: "🍑" },
  { id: "moehrenkuchen", kcal: 380, icon: "🥕" },
  { id: "donauwelle", kcal: 300, icon: "🌊" },
  // "custom": kcal wird nicht fix vorgegeben, sondern über einen Slider
  // frei gewählt (Bereich 100-800 kcal, Schrittweite 10).
  { id: "custom", kcal: null, icon: "✏️", min: 100, max: 800, step: 10 },
];

// Fahrertypen mit typischer Dauerleistung in Watt. Grobe Einordnung, keine
// wissenschaftlich exakte Klassifizierung - dient nur als Ausgangswert für
// die Berechnung.
const RIDER_TYPES = [
  { id: "gemuetlich", watt: 110 },
  { id: "zuegig", watt: 160 },
  { id: "ambitioniert", watt: 220 },
];

// Geländefaktoren: reduzieren die effektive Fahrleistung/-geschwindigkeit,
// um den Mehraufwand durch Steigungen näherungsweise abzubilden
// (1.0 = flach/kein Abschlag, sinkend mit zunehmender Steigung).
const TERRAIN_FACTORS = {
  flach: 1.0,
  huegelig: 0.75,
  berg: 0.45,
};

// Physikalische Konstanten für die Leistungsberechnung.
//
// Grundlage:
// - Faustregel Energieumsatz: 1 kcal Nahrungsenergie ≈ 4,184 kJ; beim
//   Radfahren liegt der Wirkungsgrad (mechanische Arbeit / verbrauchte
//   Energie) bei ca. 20-25%. D.h. von 1 kcal kommen nur ca. 20-25% als
//   tatsächliche Fahrleistung an ("1 kcal ≈ 1 kJ Bewegungsenergie" ist eine
//   verbreitete, vereinfachte Faustregel für Alltagsrechner).
// - CRR (Rollwiderstandskoeffizient), CdA (aerodynamischer Widerstandswert)
//   und die Formel P = CRR * m * g * v + 0.5 * CdA * AIR_DENSITY * v^3
//   (Rollwiderstand + Luftwiderstand) sind Standardgrößen/-formeln, wie sie
//   in gängigen Radsport-Leistungsrechnern (z. B. bikecalculator.com) genutzt
//   werden.
const PHYSICS_CONSTANTS = {
  CRR: 0.005, // Rollwiderstandskoeffizient (Asphalt, Rennradreifen)
  CDA: 0.32, // aerodynamischer Widerstandswert (m^2), aufrechte Rennradhaltung
  AIR_DENSITY: 1.225, // Luftdichte auf Meereshöhe bei 15°C (kg/m^3)
  GRAVITY: 9.81, // Erdbeschleunigung (m/s^2)
  BIKE_WEIGHT_KG: 10, // angenommenes Standardgewicht Rennrad + Ausrüstung (kg)
};
