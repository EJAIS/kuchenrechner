# kuchenrechner

Roadbike Cake Calculator

## Über das Projekt

Ein reines Vanilla HTML/CSS/JS-Projekt ohne Build-Step. Es lässt sich direkt
öffnen oder auf einem beliebigen Server in einem Unterordner deployen
(z. B. `domain.de/kuchenrechner`), da alle Pfade zu CSS/JS/Assets relativ
sind (`./css/...`, `./js/...`).

## Projektstruktur

```
kuchenrechner/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js      # Einstiegspunkt / App-Initialisierung
│   ├── data.js     # Datenmodelle / Konstanten
│   ├── calc.js      # Berechnungslogik
│   └── i18n.js      # Internationalisierung
├── locales/
│   ├── de.json
│   └── en.json
├── README.md
└── LICENSE
```

## Verwendung

Da kein Build-Step nötig ist, reicht es, `index.html` in einem Browser zu
öffnen oder das Verzeichnis von einem beliebigen Webserver ausliefern zu
lassen.

## Lizenz

MIT, siehe [LICENSE](./LICENSE).
