# Ambr3Weather — Testing Checklist

Tested in Brave, opened locally via `index.html` (file://). After deployment, re-verify
on the live site. **v0.3.16**

## A. Drag scrolling
- [ ] Forecast cards: click+hold on a card with the mouse, drag left/right — strip scrolls smoothly with the pointer (no snapping, no judder)
- [ ] Hourly cards: same drag works
- [ ] Release mid-drag — strip settles gently to nearest card (proximity snap restored)
- [ ] Dragging starting on a weather icon (not just card body) still works
- [ ] Scrollbar still works on both strips
- [ ] Wheel/trackpad scrolling still works on both strips
- [ ] On a narrow window, drag only engages when content actually overflows (no accidental drag on short strips)

## B. Hourly cards + range tabs
- [ ] Default view shows 24h (starts at current hour)
- [ ] All tab shows every hour to end of forecast (192h in 7-day, 336h in 14-day)
- [ ] Choice persists after reload
- [ ] Date labels appear on first hour of each new day: Today, Tomorrow, then weekday+date
- [ ] Rain stat always shows a value (pop% / mm / cm), never blank
- [ ] Times/dates use the searched city's timezone (try a city in a far-off timezone)

## C. Chart tabs
- [ ] Temp: gradient temp line + dots, no rain bars, no legend
- [ ] Rain: full-height blue bars with white halo + "chance of rain" legend
- [ ] Wind: solid orange line + dashed gusts line + legend showing both
- [ ] Humidity: blue line visible against the card + legend
- [ ] Y-axis labels change per tab (degrees, %, plain numbers)
- [ ] Tab selection persists after reload
- [ ] Switching tabs re-renders instantly (uses cached data, no refetch)
- [ ] Chart appears/hides with the weather (hidden until data loads)

## D. Map card
- [ ] Map tiles load and center on the searched city
- [ ] Temp label shows current temp at center; colored temp badges around it
- [ ] Wind pill (top-left): arrow points in the direction the wind blows toward, speed in the chosen unit (km/h or mph)
- [ ] Wind pill updates when units change

## E. Layout / responsive
- [ ] Desktop (>1024px): forecast cards centered, detail grid, map hero centered
- [ ] Manually resize to ~380px wide: mobile layout applies correctly (reliable check; F12 device toolbar on Brave can mislead)
- [ ] Mobile: detail grid 2-col, hourly cards narrower, no horizontal page overflow
- [ ] Dark theme toggle still works and affects chart/legend colors

## F. Core functionality
- [ ] Search a city — works with autocomplete dropdown
- [ ] Geolocation button works (or permission prompt appears)
- [ ] 7-day / 14-day tabs refresh with correct card count
- [ ] C/F toggle updates everything (current, forecast, hourly, chart, map temps, wind arrow speed)
- [ ] Wind unit toggle (km/h <-> mph) updates cards + chart + map pill
- [ ] Reload page with a city already searched — weather restores from cache
- [ ] Theme choice persists

## G. Offline / PWA (only when served via localhost or https, not file://)
- [ ] Service worker registers, offline.html loads when offline
- [ ] After first load, JS/CSS served from cache (check versioned `?v=` URLs)

## H. Before any push
- [ ] Footer shows v0.3.14
- [ ] All `?v=` asset refs, `sw.js` CACHE_NAME, `offline.html` say v0.3.14 (bump together)
- [ ] No leftover 0.3.3 / 0.3.4 strings
- [ ] Deploy all files from `ver 0.3.2/` (index.html, sw.js, offline.html, manifest.json, js/*, css/*, assets/*)
- [ ] Verify live footer shows the new version before testing the live site
