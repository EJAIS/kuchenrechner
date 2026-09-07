# kuchenrechner

Roadbike Cake Calculator

Ein kleiner Spaßrechner für Radfahrer: Wähle ein Stück Kuchen, deinen
Fahrertyp, dein Gewicht und das Gelände – der Kuchenrechner sagt dir, wie
lange und wie weit du radeln musst, um die Kalorien wieder abzustrampeln.
Reines Vanilla HTML/CSS/JS, kein Build-Step, komplett offline lauffähig,
zweisprachig (DE/EN).

> 📸 **Screenshot folgt** – hier entsteht bald ein Bild der App. Bis dahin:
> einfach `index.html` über einen lokalen Server öffnen, siehe
> [Verwendung](#verwendung).

## Features

- Kuchen-Auswahl per Kachel (8 Klassiker + "Eigene Wahl" mit freiem
  Kalorien-Slider)
- Fahrertyp (Gemütlich/Zügig/Ambitioniert), Gewicht und Gelände
  (Flach/Hügelig/Berg) als Eingabe
- Echtzeit-Ergebnis ohne "Berechnen"-Button: Distanz, Zeit und
  Durchschnittstempo aktualisieren sich bei jeder Eingabe sofort
- Rotierende Fun-Sprüche und eine kleine selbstgebaute SVG-Illustration
  (Kuchenstück, Straße, Rennradfahrer), die bei langen Strecken (> 50 km)
  sichtbar "erschöpft" wird
- Deutsch/Englisch umschaltbar (Sprache wird in `localStorage` gemerkt,
  Default folgt der Browsersprache)

## Wie es funktioniert

Die Berechnung läuft in drei Schritten (siehe [`js/calc.js`](js/calc.js)):

**1. Benötigte Kalorienmenge in Fahrzeit umrechnen**

Faustregel: 1 kcal ≈ 1 kJ (siehe [Quellenangabe](#quellenangabe-zur-1-kcal--1-kj-faustregel)).

```
t (s) = kcalTarget × 1000 / watt
```

**2. Geschwindigkeit auf flacher Strecke aus der Leistungsgleichung lösen**

Rollwiderstand + Luftwiderstand, wie in gängigen Radsport-Leistungsrechnern
üblich, numerisch nach `v` aufgelöst:

```
watt = CRR × (Fahrer + Rad) × g × v + 0,5 × cwA × Luftdichte × v³
```

**3. Distanz aus Zeit, Geschwindigkeit und Geländefaktor**

```
effektiveGeschwindigkeit = flatSpeedKmh × terrainFactor
distanceKm = effektiveGeschwindigkeit × (t / 3600)
```

Der Geländefaktor (`flach = 1,0`, `hügelig = 0,75`, `berg = 0,45`) ist eine
grobe Vereinfachung, keine physikalische Steigungsberechnung – siehe
[`js/data.js`](js/data.js) für alle verwendeten Konstanten und deren
Herleitung.

### Quellenangabe zur 1 kcal ≈ 1 kJ Faustregel

Physikalisch korrekt ist 1 kcal = 4,184 kJ. Die in vielen
Alltags-/Fitnessrechnern verbreitete Faustregel "1 kcal ≈ 1 kJ
Bewegungsenergie" funktioniert näherungsweise, weil der menschliche Körper
beim Radfahren nur etwa 20–25 % der Nahrungsenergie tatsächlich in Vortrieb
umsetzt (Wirkungsgrad) – 4,184 kJ × ~24 % ≈ 1 kJ nutzbare Energie pro kcal.
Das ist auch der Grund, warum die kJ-Anzeige auf vielen Fahrradcomputern
grob mit den verbrannten kcal übereinstimmt (siehe Hinweis-Kasten in der
App). Es handelt sich um eine bewusst vereinfachte Faustregel, keine exakte
physiologische Messgröße.

## ⚠️ Nur zum Spaß

Der Kuchenrechner ist ein Spaßprojekt. Alle Werte (Kalorienangaben,
Wattzahlen, Geländefaktoren, physikalische Konstanten) sind grobe
Richtwerte und keine sportmedizinische oder physiologisch exakte Beratung.
Der tatsächliche Kalorienverbrauch hängt von sehr vielen individuellen
Faktoren ab (Stoffwechsel, Fitnesslevel, Wetter, Ausrüstung, ...), die hier
nicht berücksichtigt werden. Iss den Kuchen einfach – die Ausrede fürs Rad
liefert dieses Tool gratis dazu.

## Projektstruktur

```
kuchenrechner/
├── index.html          Grundgerüst + Eingabe-/Ergebnis-Karte
├── css/
│   └── style.css        Design (Karamell-/Bike-Grün-Palette, responsive)
├── js/
│   ├── app.js            Event-Handling, Live-Berechnung, Rendering
│   ├── data.js            Kuchen/Fahrertypen/Gelände/Physik-Konstanten
│   ├── calc.js            reine Berechnungsfunktionen (kein DOM-Zugriff)
│   ├── calc.test.js       Tests für calc.js (node:test, keine Dependencies)
│   └── i18n.js            Sprachumschaltung (JSON-Sprachdateien, localStorage)
├── locales/
│   ├── de.json
│   └── en.json
├── README.md
└── LICENSE
```

## Verwendung

Da kein Build-Step nötig ist, reicht es, `index.html` direkt über einen
lokalen Server zu öffnen (die Sprachdateien werden per `fetch()` geladen,
das funktioniert aus Sicherheitsgründen nicht über `file://`):

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

Tests für die Berechnungslogik laufen mit Node's eingebautem Test-Runner,
keine zusätzlichen Dependencies nötig:

```bash
node js/calc.test.js
```

## Deployment

Das Projekt ist komplett statisch (kein Build-Step, keine Server-Logik) –
es reicht, den gesamten Ordnerinhalt in einen beliebigen Unterordner auf
einem Webserver zu kopieren, z. B. per `rsync`/`scp` auf einen Hetzner-VPS:

```bash
rsync -avz --exclude '.git' ./ user@server:/var/www/html/kuchenrechner/
```

Damit ist die App unter `domain.tld/kuchenrechner` erreichbar. Alle Pfade
zu CSS/JS/Sprachdateien in `index.html` sind bereits relativ (`./css/...`,
`./js/...`, `./locales/...`), daher ist **kein zusätzliches
Basis-Pfad-Handling** nötig – das Projekt funktioniert unverändert in
jedem beliebigen Unterordner oder auch im Root einer Domain.

## Lizenz

MIT, siehe [LICENSE](./LICENSE).
