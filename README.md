# Ambr3Weather — Private Weather PWA

Version. 0.3.1 (Beta)

A privacy-first, open-source Weather web app. All data stays on your device — no servers, no accounts, no tracking.

Why PWA? I hate loads of installed apps on my phone, that simple.

Why make this? I could not find any open source PWA apps that suited me.

This is partially Vibe-Coded, I can code but not well, there's currently around 4000 odd lines of code, something i could not do on my own. AI helps me allot to get my ideas into real things, without AI by the time Ive coded something, I've either got bored or i just cant get the code to work.

I would always recommend using Vanadium (GrapheneOS) or Brave Browser to install PWA's for max security. Please use at your own risk, as stated this has been vibe-coded and always check for security flaws before using.

## Changelog

### 0.3.1 (Beta)

- **Local temperature map** — now samples and shows temperatures across a 20-mile radius around your location
- **Map zoom** — the map automatically zooms to fit the temperature ring and fills the full card width
- **Colour-coded temperature chart** — hotter temps in red, colder in blue (gradient line, gradient fill, and per-point coloured dots)
- **Bigger Sun & Moon titles** in the current weather card
- **Fixed** — map failing to render in some cases (NaN zoom calculation)

## Privacy

- **Zero tracking** — no analytics, no cookies, no fingerprinting, no third-party scripts
- **No server** — pure static site, nothing runs server-side
- **No API key required** — powered by [Open-Meteo](https://open-meteo.com/), a free open-source weather API with no account needed
- **Everything stays on your device** — preferences (units, theme, wind speed), the last viewed location, and a cached forecast are stored only in your browser's `localStorage`/cache and are never sent anywhere
- **Geolocation is opt-in** — used only when you tap "Use my location", and sent only to Open-Meteo (forecast) and OpenStreetMap (map tiles)
- **Open source** — GPL-3.0 licensed, fully auditable
- **CSP locked down** — `script-src 'self'`, `base-uri 'self'`, `form-action 'self'`. Only connects to Open-Meteo APIs and OpenStreetMap tiles
- **No Google Fonts** — system font stack only, zero external font requests
- **No referrer leakage** — `no-referrer` sent on every request
- **Unused capabilities disabled** — camera, microphone, sensors, and payment are blocked via `Permissions-Policy`

## Features

- Current weather (temp, feels-like, humidity, pressure, wind, precipitation, UV index, visibility)
- **Air quality index** — EU/US AQI with PM2.5, PM10, NO₂, O₃, SO₂, CO breakdown
- **Pollen forecast** — levels for alder, birch, grass, mugwort, olive, and ragweed
- **Weather alerts** — severe weather warnings from Open-Meteo
- **Sunrise/sunset arc** — live SVG visualization showing the sun and moon position throughout the day
- **Static map** — OpenStreetMap tile with location pin and local temperatures
- UV index with color-coded badge
- 7-day or 14-day forecast with daily cards (tab toggle)
- Hourly scroll (12 time slots, starts from current hour) with temperature chart
- **Auto-refresh** — silently updates every 30 minutes
- **Dark/light mode toggle** — saved between visits
- Dynamic weather backgrounds (sunny, rainy, snowy, night, thunder, mist, etc.)
- **Inline SVG weather icons** — day/night variants mapped from WMO weather codes
- Geolocation ("use my location" button)
- Unit toggle (metric / imperial) — saved between visits
- **PWA installable** on Android with proper PNG + maskable icons
- Offline fallback page
- Touch/mouse drag gestures on hourly forecast
- Smooth fade-in animations


## License

GPL-3.0 — see [LICENSE](LICENSE)
