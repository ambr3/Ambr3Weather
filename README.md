# Ambr3Weather — Private Weather PWA

[v0.3.5] - 2026-08-15
A privacy-first, open-source Weather web app. All data stays on your device — no servers, no accounts, no tracking.

Why PWA? I hate loads of installed apps on my phone, that simple.

Why make this? I could not find any open source PWA apps that suited me.

This is partially Vibe-Coded, I can code but not well, there's currently around 4000 odd lines of code, something i could not do on my own. AI helps me allot to get my ideas into real things, without AI by the time Ive coded something, I've either got bored or i just cant get the code to work.

I would always recommend using Vanadium (GrapheneOS) or Brave Browser to install PWA's for max security. Please use at your own risk, as stated this has been vibe-coded and always check for security flaws before using.


## Privacy

- **Zero tracking** — no analytics, no cookies, no fingerprinting, no third-party scripts
- **No server** — pure static site, nothing runs server-side
- **No API key required** — powered by [Open-Meteo](https://open-meteo.com/), a free open-source weather API with no account needed
- **Everything stays on your device** — preferences (units, theme, wind speed), the last viewed location, and a cached forecast are stored only in your browser's `localStorage`/cache and are never sent to third parties
- **What does leave your device** — opening the app (or the 30-minute auto-refresh) fetches the forecast for the last viewed location, including its coordinates, from Open-Meteo; viewing the map loads tiles from OpenStreetMap. These are the only outbound requests, and no tracking headers are sent with them
- **Cached API data is pruned** — forecast/search responses cached by the service worker are automatically removed after 7 days
- **Geolocation is opt-in** — used only when you tap "Use my location", and sent only to Open-Meteo (forecast) and OpenStreetMap (map tiles)
- **Open source** — GPL-3.0 licensed, fully auditable
- **CSP locked down** — `script-src 'self'`, `base-uri 'self'`, `form-action 'self'`. Only connects to Open-Meteo APIs and OpenStreetMap tiles
- **No Google Fonts** — system font stack only, zero external font requests
- **No referrer leakage** — `no-referrer` sent on every request
- **Unused capabilities disabled** — camera, microphone, sensors, and payment are blocked via `Permissions-Policy`
- **Clickjacking** — the CSP meta tag cannot enforce `frame-ancestors`; the hosting server must send `X-Frame-Options: DENY` (and/or a `frame-ancestors 'none'` CSP header). A sample [`.htaccess`](.htaccess) is included for Apache hosts

## Features

- Current weather (temp, feels-like, humidity, pressure, wind, precipitation, UV index, visibility)
- **Air quality index** — EU/US AQI with PM2.5, PM10, NO₂, O₃, SO₂, CO breakdown
- **Pollen forecast** — levels for alder, birch, grass, mugwort, olive, and ragweed
- **Weather alerts** — severe weather warnings from Open-Meteo
- **Sunrise/sunset arc** — live SVG visualization showing the sun and moon position throughout the day
- **Static map** — OpenStreetMap tile with location pin and local temperatures
- UV index with color-coded badge
- 7-day or 14-day forecast with daily cards (tab toggle)
- Hourly scroll with 24h / All tab toggle, plus a temperature/rain/wind/humidity chart with tab toggle
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
