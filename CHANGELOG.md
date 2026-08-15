# Changelog

All notable changes to Ambr3Weather are documented here.

## [v0.3.5] - 2026-08-15

### Added
- Hourly chart type tabs — **Temp / Rain / Wind / Humidity** (selection is saved between visits)
- Wind chart shows a dashed **gust** line; `relative_humidity_2m` and `wind_gusts_10m` were added to the hourly API request to support the new tabs
- Map card now shows a **wind pill** (top-left) with a direction arrow rotated to the wind bearing and the speed in the selected wind unit
- Hourly forecast **24h / All** toggle with day separators (Today / Tomorrow / date)

### Fixed
- Drag-to-scroll on the hourly and forecast strips — scroll-snap was fighting mouse drag, so snap is now disabled while dragging
- Rain bars in the chart rendered on top of the temperature area with a white halo (they were washed out by the area gradient)
- Timezone correctness: weather-alert active-window filtering and the chart's day-end axis label now use the city timezone instead of the device timezone
- Missing data no longer renders misleading values — wind/humidity/pressure/temperature previously showed `0 km/h`, `null%`, `0 hPa` or `NaN°C`; they now show `—`
- Crash guards added to all renderers (`renderCurrentWeather`, `renderForecast`, `renderHourly`, `renderWeather`) so malformed or corrupt cached data cannot abort the app
- Unhandled-rejection guard on unit-toggle reloads
- Service worker no longer caches cross-origin map tiles (kept storage bounded; static cache remains versioned)
- Latitude clamping for the local temperature probes

### Security
- Full privacy/security audit: CSP verified (no `unsafe-eval`, no wildcard hosts), every external URL accounted for and matching `connect-src`/`img-src`, no hardcoded secrets, no XSS surfaces, `no-referrer` on all requests, `Permissions-Policy` blocks unused capabilities

### Notes
- Earlier releases (up to v0.3.3) were deployed to GitHub Pages and are not tracked here.
- GitHub Pages ignores `.htaccess`; server-sent headers (CSP, `frame-ancestors`, `X-Frame-Options`) require Apache or a host that supports custom headers.
