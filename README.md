<p align="center">
  <img src="assets/icons/icon-192.svg" alt="Ambr3Weather" width="120" height="120">
</p>

<h1 align="center">Ambr3Weather</h1>

<p align="center">
  <em>A privacy-first weather PWA — zero tracking, no accounts, no API keys.</em>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-blue.svg"></a>
  <a href="https://github.com/ambr3/Ambr3Weather/releases"><img alt="Release" src="https://img.shields.io/github/v/release/ambr3/Ambr3Weather"></a>
  <a href="https://github.com/ambr3/Ambr3Weather/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/ambr3/Ambr3Weather"></a>
  <img alt="Vanilla JS" src="https://img.shields.io/badge/built%20with-vanilla%20JS-f7df1e.svg">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-installable-5a67d8.svg">
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-4caf50.svg">
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#weather-icons">Weather Icons</a> ·
  <a href="#privacy">Privacy</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#license">License</a>
</p>

---

> Whether it's the daily commute, a weekend hike, or just watering the plants — Ambr3Weather gives you a beautiful, honest forecast with none of the privacy baggage.

Ambr3Weather is a **pure static, open-source weather app**. Everything runs in your browser: preferences and a cached forecast live only on your device, and the only outbound requests are to the [Open-Meteo](https://open-meteo.com/) API and OpenStreetMap tiles. Installable, offline-capable, and auditable end-to-end.

---

## ✨ Features

### 🌡️ Forecast
- **Current conditions** — temperature, feels-like, humidity, pressure, wind, precipitation, UV, visibility
- **Hourly forecast** — scrollable 24h / all-day view with a multi-metric chart
  *(Temp & Dew · Rain · Wind · Humidity · Cloud · Pressure · Sun strength)*
- **Daily forecast** — 7-day or 14-day cards with a toggle
- **Sunrise/sunset arc** — a live SVG that shows the sun *and* moon arcing across your sky
- **Auto-refresh** — silently stays fresh every 30 minutes

### 🌍 Air & Environment
- **Air quality index** — EU or US AQI with PM2.5, PM10, NO₂, O₃, SO₂, CO breakdown
- **Pollen forecast** — alder, birch, grass, mugwort, olive, and ragweed levels
- **UV index** — color-coded badge with risk level

### 🗺️ Location
- **Static map** — OpenStreetMap tile with a location pin
- **Geolocation** — "use my location", fully opt-in, on button tap only

### 🎨 Interface
- **Dark / light themes** with dynamic weather backgrounds at sunrise, rain, snow, thunder, fog, and night
- **Inline SVG weather icons** — distinct day/night variants for every WMO code
- **Metric / imperial toggle** — saved between visits
- **Touch & mouse drag gestures** on the hourly forecast
- Smooth fade-in animations, fully responsive

---

## ☀️ Weather Icons

Weather icons are drawn from accurate WMO weather codes, with **day and night variants**, and a few honest touches:

| WMO code | Condition | Day | Night |
|---|---|---|---|
| 0 | Clear sky | 🌞 | 🌙 |
| 1 | Mainly clear | 🌞 + small cloud | 🌙 + small cloud |
| 2 | Partly cloudy | ⛅ cloud with sun peeking | cloud with moon |
| 3 | Overcast | ☁️ full cloud | ☁️ full cloud |
| 45–48 | Fog / rime | fog lines | fog lines |
| 51–57 | Drizzle | light drops | light drops |
| 61–67, 80–82 | Rain / showers | raindrops | raindrops |
| 71–77, 85–86 | Snow / snow showers | snowflakes | snowflakes |
| 95+ | Thunderstorm | lightning bolt | lightning bolt |

> **Honest rain icons** — the daily forecast only shows a rain icon when the *chance* **and** the *amount* justify it (`≥ 30 %` chance **and** `≥ 1 mm`, or `≥ 50 %` chance). A 25 % chance of 0.2 mm won't rain on your parade.

---

## 🔒 Privacy

Your data is your business. That's the whole point.

| | |
|---|---|
| 🚫 **Zero tracking** | No analytics, no cookies, no fingerprinting, no third-party scripts |
| 🖥️ **No server** | Pure static site — nothing runs server-side |
| 🔑 **No API key** | Powered by free open-source [Open-Meteo](https://open-meteo.com/), no account needed |
| 🏠 **Stays on device** | Preferences, last location, and cached forecast live in your browser's `localStorage`/cache — never sent anywhere |
| 📤 **What leaves** | Forecasts (with coordinates) go to Open-Meteo on load/auto-refresh; the map loads tiles from OpenStreetMap. *That's it.* No tracking headers attached |
| 🧹 **Cache pruning** | Service-worker API cache self-destructs after 7 days |
| 📍 **Geolocation opt-in** | Only on button tap, sent only to Open-Meteo + OpenStreetMap |
| 🛡️ **CSP locked down** | `script-src 'self'`, `base-uri 'self'`, `form-action 'self'` — connects only to Open-Meteo and OSM |
| 🕵️ **No referrer leakage** | `no-referrer` on every request |
| 🚫 **Capabilities blocked** | Camera, microphone, sensors, and payment disabled via `Permissions-Policy` |
| 🖼️ **Clickjacking protection** | `X-Frame-Options: DENY` / `frame-ancestors 'none'` enforced via server headers — sample [`.htaccess`](.htaccess) and [Netlify `_headers`](_headers) included |
| 📜 **Auditable** | GPL-3.0 open source — read every line |

> ⚠️ **Geolocation note:** your coordinates *are* sent to the weather API when you view a forecast or the map. It's the only way to get a local forecast — but it's disclosed, opt-in, and never logged or shared.

---

## 📦 Installation

### Use it
Just open the live site in your browser. On Android with **Vanadium (GrapheneOS)** or **Brave**, install it as a PWA:

1. Open the site
2. Tap **Install** / **Add to Home screen**
3. Done — it works offline too

> 💡 Want maximum security? Use a hardened browser like **Vanadium** or **Brave** for any PWA.



PRs welcome for anything that keeps it private, fast, or beautiful.

---

## ⚠️ Disclaimer

> This project was **vibe-coded**. All code is reviewed before each release, but it's still recommended to audit for security flaws before use, especially when self-hosting. Use at your own risk.

---

## 📄 License

[GPL-3.0](LICENSE) — free to use, modify, and share, with the same freedom preserved for derivatives.

---
