const UI = {
  $: (id) => document.getElementById(id),

  _hourlyAll: false,
  _chartMode: 'temp',
  _measureCanvas: null,
  _measureCtx: null,

  _getMeasureCtx() {
    if (!this._measureCanvas) {
      this._measureCanvas = document.createElement('canvas');
      this._measureCtx = this._measureCanvas.getContext('2d');
    }
    this._measureCtx.font = '600 18px system-ui, sans-serif';
    return this._measureCtx;
  },

  _arcPos(ARC, t) {
    const seg = ARC.length - 1;
    const i = Math.max(0, Math.min(seg - 1, Math.floor(t * seg)));
    const f = Math.max(0, Math.min(1, t * seg - i));
    const a = ARC[i];
    const b = ARC[i + 1];
    return { left: a[0] + (b[0] - a[0]) * f, top: a[1] + (b[1] - a[1]) * f };
  },

  _arcFor(rise, set, tz) {
    if (!rise || !set) return null;
    const r = Utils.parseLocal(rise, tz).getTime();
    let s = Utils.parseLocal(set, tz).getTime();
    if (isNaN(r) || isNaN(s)) return null;
    if (s <= r) s += 24 * 60 * 60 * 1000;
    const duration = s - r;
    if (duration > 26 * 60 * 60 * 1000 || duration < 0) return null;
    const t = (Date.now() - r) / (s - r);
    return { pos: this._arcPos(this._arc.ARC, Math.max(0, Math.min(1, t))), below: t < 0 || t > 1 };
  },

  _hourlyStartIdx(hourly) {
    if (!hourly || !hourly.time) return 0;
    const now = Date.now();
    for (let i = 0; i < hourly.time.length; i++) {
      if (Utils.parseLocal(hourly.time[i], this._tz).getTime() >= now) return i;
    }
    return hourly.time.length;
  },

  setHourlyRange(all) {
    this._hourlyAll = all;
  },

  showLoading() {
    this.$('loading').classList.remove('hidden');
    this.$('errorMessage').classList.add('hidden');
    this.$('weatherContent').classList.add('hidden');
  },

  hideLoading() {
    this.$('loading').classList.add('hidden');
  },

  showError(msg) {
    this.hideLoading();
    this.$('weatherContent').classList.add('hidden');
    const el = this.$('errorMessage');
    el.textContent = msg;
    el.classList.remove('hidden');
  },

  hideError() {
    this.$('errorMessage').classList.add('hidden');
  },

  markOffline(show) {
    const el = this.$('offlineNotice');
    if (el) el.classList.toggle('hidden', !show);
  },

  markStale(show, message) {
    const el = this.$('staleNotice');
    if (el) {
      if (message) this.$('staleNoticeText').textContent = message;
      el.classList.toggle('hidden', !show);
    }
  },



  renderCurrentWeather(data, units) {
    if (!data || !data.current) return;
    const c = data.current;
    const d = data.daily || {};
    const currentPop = (d.time && d.time[0]) ? this.daytimeMaxPop(d.time[0], data.hourly) : null;
    const iconCode = WeatherIcons.adjustForPrecip(c.weather_code, currentPop, c.precipitation ?? 0, c.snowfall ?? 0);
    const icon = WeatherIcons.get(iconCode, c.is_day);
    const temp = Utils.formatTemp(c.temperature_2m, units);
    const feels = Utils.formatTemp(c.apparent_temperature, units);
    const desc = Utils.getWeatherDescription(iconCode);

    const sunrise = d.sunrise && d.sunrise[0] ? Utils.formatTime(d.sunrise[0], this._tz) : '—';
    const sunset = d.sunset && d.sunset[0] ? Utils.formatTime(d.sunset[0], this._tz) : '—';
    const moonrise = d.moonrise && d.moonrise[0] ? Utils.formatTime(d.moonrise[0], this._tz) : '—';
    const moonset = d.moonset && d.moonset[0] ? Utils.formatTime(d.moonset[0], this._tz) : '—';
    const phase = d.moon_phase && d.moon_phase.length ? d.moon_phase[0] : null;
    const phaseRow = phase != null
      ? `${Utils.getMoonPhaseName(phase)} · ${Utils.getMoonIllumination(phase)}% illuminated`
      : '';

    const dayHigh = d.temperature_2m_max && d.temperature_2m_max[0] != null ? Utils.formatTemp(d.temperature_2m_max[0], units) : null;
    const dayLow = d.temperature_2m_min && d.temperature_2m_min[0] != null ? Utils.formatTemp(d.temperature_2m_min[0], units) : null;
    const todayPop = (d.time && d.time[0]) ? this.daytimeMaxPop(d.time[0], data.hourly) : null;
    const dayPop = todayPop != null ? todayPop : (d.precipitation_probability_max != null ? Math.round(d.precipitation_probability_max[0] ?? 0) : null);
    const windUnit = Utils.getWindUnit(UI.windUnit);
    const dayWind = c.wind_speed_10m != null ? `${Math.round(c.wind_speed_10m)} ${windUnit}` : null;
    const summaryParts = [];
    if (dayHigh && dayLow) summaryParts.push(`High ${dayHigh} / Low ${dayLow}`);
    if (dayPop != null && dayPop > 0) summaryParts.push(`${dayPop}% rain`);
    if (dayWind) summaryParts.push(`Wind ${dayWind}`);
    const daySummary = summaryParts.length ? summaryParts.join(' · ') : '';

    const ARC = [[0,100],[10,78],[20,58],[30,42],[40,31],[50,28],[60,31],[70,42],[80,58],[90,78],[100,100]];
    this._arc = { ARC, tz: this._tz, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0], moonrise: d.moonrise && d.moonrise[0], moonset: d.moonset && d.moonset[0] };

    const sunArc = this._arcFor(d.sunrise && d.sunrise[0], d.sunset && d.sunset[0], this._tz);
    const moonArc = this._arcFor(d.moonrise && d.moonrise[0], d.moonset && d.moonset[0], this._tz);

    this.$('currentWeather').innerHTML = `
      <div class="current-weather__top">
        <div>
          <div class="current-weather__location">
            ${this._esc(data._cityName)}<span class="current-weather__country">${this._esc(data._country)}</span>
          </div>
          <div class="current-weather__desc">${desc}</div>
        </div>
        <div class="current-weather__icon${c.is_day === 0 ? ' is-night' : ''}">${icon}</div>
      </div>
      <div class="current-weather__temp-row">
        <div class="current-weather__temp">${temp}</div>
        ${daySummary ? `<div class="current-weather__summary">${daySummary}</div>` : ''}
      </div>
      <div class="current-weather__feels">Feels like ${feels}</div>
      <div class="current-weather__updated" id="currentUpdated">Updated ${Utils.formatClock(new Date())}</div>
      <div class="current-weather__celestial">
        <div class="celestial">
          <div class="celestial__title">Sun</div>
          <div class="celestial__times">
            <div class="celestial__row"><span class="celestial__label">Rise</span><span class="celestial__value">${sunrise}</span></div>
            <div class="celestial__row"><span class="celestial__label">Set</span><span class="celestial__value">${sunset}</span></div>
          </div>
        </div>
        <div class="celestial-divider" aria-hidden="true"></div>
        <div class="celestial">
          <div class="celestial__title">Moon</div>
          <div class="celestial__times">
            <div class="celestial__row"><span class="celestial__label">Rise</span><span class="celestial__value">${moonrise}</span></div>
            <div class="celestial__row"><span class="celestial__label">Set</span><span class="celestial__value">${moonset}</span></div>
          </div>
        </div>
      </div>
      ${phaseRow ? `<div class="current-weather__phase">${phaseRow}</div>` : ''}
      <div class="current-weather__arc" aria-hidden="true">
        <svg class="current-weather__arc-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline class="current-weather__arc-line" points="0,100 10,78 20,58 30,42 40,31 50,28 60,31 70,42 80,58 90,78 100,100"/>
        </svg>
        <div class="current-weather__arc-label current-weather__arc-label--rise">${sunrise !== '—' ? sunrise : ''}</div>
        <div class="current-weather__arc-label current-weather__arc-label--set">${sunset !== '—' ? sunset : ''}</div>
        <div class="current-weather__arc-orb current-weather__arc-sun${sunArc && sunArc.below ? ' is-below' : ''}" style="${sunArc ? `left:${sunArc.pos.left}%;top:${sunArc.pos.top}%` : 'display:none'}">${WeatherIcons._sun()}</div>
        <div class="current-weather__arc-orb current-weather__arc-moon${moonArc && moonArc.below ? ' is-below' : ''}" style="${moonArc ? `left:${moonArc.pos.left}%;top:${moonArc.pos.top}%` : 'display:none'}">${WeatherIcons._moon()}</div>
      </div>
    `;

    const theme = Utils.getThemeClass(iconCode, c.is_day);
    const isDark = document.body.classList.contains('theme-dark');
    const isDyn = document.body.classList.contains('dynamic-text');
    document.body.classList.remove('theme-clear', 'theme-clear-night', 'theme-clouds',
      'theme-rain', 'theme-snow', 'theme-thunder', 'theme-drizzle', 'theme-mist');
    document.body.classList.add(theme);
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('dynamic-text', isDyn);
    const themeColors = {
      'theme-clear': '#4facfe', 'theme-clear-night': '#1a1a3e',
      'theme-clouds': '#607d8b', 'theme-rain': '#4286f4',
      'theme-snow': '#90caf9', 'theme-thunder': '#5c6bc0',
      'theme-drizzle': '#78909c', 'theme-mist': '#b0bec5'
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = themeColors[theme] || '#4facfe';

    this.startLiveClock();
  },

  startLiveClock() {
    if (this._liveClockTimer) clearInterval(this._liveClockTimer);
    this._liveClockTimer = setInterval(() => this.updateLiveClock(), 60000);
  },

  updateLiveClock() {
    const updated = this.$('currentUpdated');
    if (updated) updated.textContent = `Updated ${Utils.formatClock(new Date())}`;
    if (!this._arc) return;
    const { tz, sunrise, sunset, moonrise, moonset } = this._arc;
    const sun = this._arcFor(sunrise, sunset, tz);
    const moon = this._arcFor(moonrise, moonset, tz);
    const sunEl = document.querySelector('.current-weather__arc-sun');
    const moonEl = document.querySelector('.current-weather__arc-moon');
    if (sunEl && sun) {
      sunEl.style.left = `${sun.pos.left}%`;
      sunEl.style.top = `${sun.pos.top}%`;
      sunEl.classList.toggle('is-below', sun.below);
    }
    if (moonEl && moon) {
      moonEl.style.left = `${moon.pos.left}%`;
      moonEl.style.top = `${moon.pos.top}%`;
      moonEl.classList.toggle('is-below', moon.below);
    }
  },

  renderDetailBoxes(data, aq, units) {
    this._lastWeather = data;
    this._lastAQ = aq;
    this._lastUnits = units;
    const container = this.$('detailGrid');
    if (!container || !data || !data.current) return;

    const c = data.current;
    const d = data.daily || {};
    const windUnit = Utils.getWindUnit(UI.windUnit);

    const boxes = [];

    const precipNow = Utils.formatPrecip(c.precipitation, units) || (units === 'imperial' ? '0 in' : '0 mm');
    const todayPop = (d.time && d.time[0]) ? this.daytimeMaxPop(d.time[0], data.hourly) : null;
    const popToday = todayPop != null ? todayPop : (d.precipitation_probability_max != null ? Math.round(d.precipitation_probability_max[0] ?? 0) : null);
    const rainToday = d.rain_sum && d.rain_sum[0] != null ? Math.round(d.rain_sum[0] * 10) / 10 : null;
    const snowToday = d.snowfall_sum && d.snowfall_sum[0] != null ? d.snowfall_sum[0] : null;
    const precipSub = [];
    if (popToday != null) precipSub.push(`${popToday}% chance today`);
    const snowLabel = Utils.formatSnow(snowToday, units);
    if (snowLabel) precipSub.push(`${snowLabel} snow`);
    if (rainToday > 0) precipSub.push(`${Utils.formatPrecip(rainToday, units)} rain`);

    const windDir = c.wind_direction_10m != null ? Math.round(c.wind_direction_10m) : null;
    const windArrow = windDir != null ? this._windArrowSVG(windDir, 'detail-box__arrow', 36) : '';

    const uv = d.uv_index_max && d.uv_index_max[0] != null ? d.uv_index_max[0] : null;
    const uvClear = d.uv_index_clear_sky_max && d.uv_index_clear_sky_max[0] != null ? d.uv_index_clear_sky_max[0] : null;
    const uvInfo = uv != null ? Utils.getUVLevel(uv) : null;

    const windSpeed = c.wind_speed_10m != null ? Math.round(c.wind_speed_10m) : null;
    const gustSpeed = c.wind_gusts_10m != null ? Math.round(c.wind_gusts_10m) : null;
    const humidity = c.relative_humidity_2m != null ? Math.round(c.relative_humidity_2m) : null;
    const pressure = c.surface_pressure != null ? Math.round(c.surface_pressure) : null;
    const pressureMsl = c.pressure_msl != null ? Math.round(c.pressure_msl) : null;
    const dewPoint = c.dew_point_2m != null ? Utils.formatTemp(c.dew_point_2m, units) : '—';

    const conditions = [
      { label: 'Precipitation', value: precipNow, sub: precipSub.length ? precipSub.join(' · ') : 'Dry today' },
      { label: 'Wind', value: windSpeed != null ? `${windSpeed} ${windUnit}` : '—', sub: `${windArrow}<span class="detail-box__dir">${Utils.getWindDirection(c.wind_direction_10m)}</span> · gusts ${gustSpeed != null ? `${gustSpeed} ${windUnit}` : '—'}` },
      { label: 'Humidity', value: humidity != null ? `${humidity}%` : '—', sub: `Dew point ${dewPoint}` },
      { label: 'UV Index', value: uv != null ? `<span class="uv-badge" style="background:${uvInfo.color}">${Math.round(uv)}</span>` : '—', sub: uv != null ? `${uvInfo.label}${uvClear != null ? ` · clear sky ${Math.round(uvClear)}` : ''}` : 'Not available' },
      { label: 'Visibility', value: Utils.formatVisibility(c.visibility, UI.visUnit), sub: 'Current visibility' },
      { label: 'Pressure', value: pressureMsl != null ? Utils.formatPressure(pressureMsl, UI.pressUnit) : pressure != null ? Utils.formatPressure(pressure, UI.pressUnit) : '—', sub: pressureMsl != null && pressure != null ? `MSL ${Utils.formatPressure(pressureMsl, UI.pressUnit)} · Surface ${Utils.formatPressure(pressure, UI.pressUnit)}` : 'Atmospheric pressure · tap to toggle', id: 'pressureBox' },
    ];

    const cape = c.cape != null ? Math.round(c.cape) : null;
    if (cape != null) {
      let capeInfo;
      if (cape < 300) capeInfo = { label: 'None', color: '#5fb84d', desc: 'Stable air, no thunderstorms' };
      else if (cape < 1000) capeInfo = { label: 'Low', color: '#5fb84d', desc: 'Weak thunderstorm potential' };
      else if (cape < 2000) capeInfo = { label: 'Moderate', color: '#ff9800', desc: 'Thunderstorms possible' };
      else if (cape < 3000) capeInfo = { label: 'High', color: '#f44336', desc: 'Strong storms likely' };
      else capeInfo = { label: 'Extreme', color: '#880e4f', desc: 'Severe storms expected' };
      conditions.push({ label: 'Thunderstorm risk', value: `<span style="color:${capeInfo.color}">${capeInfo.label}</span>`, sub: capeInfo.desc });
    }

    const aqC = aq && aq.current;
    let aqiBlock = `
      <div class="conditions-item conditions-item--wide">
        <span class="conditions-item__label">Air Quality</span>
        <span class="conditions-item__value">—</span>
        <span class="conditions-item__sub">Not available</span>
      </div>
    `;
    if (aqC) {
      const isEU = aqC.european_aqi != null;
      const rawAqi = isEU ? aqC.european_aqi : aqC.us_aqi;
      const aqi = rawAqi != null ? Math.round(Number(rawAqi)) : null;
      const aqLevel = aqi != null && Number.isFinite(aqi) ? Utils.getAQILevel(aqi, isEU ? 'eu' : 'us') : null;
      const chips = [
        ['PM2.5', aqC.pm2_5], ['PM10', aqC.pm10], ['NO₂', aqC.nitrogen_dioxide],
        ['O₃', aqC.ozone], ['SO₂', aqC.sulphur_dioxide], ['CO', aqC.carbon_monoxide],
      ].filter(([, v]) => v != null).map(([label, v]) =>
        `<span class="detail-box__chip">${label} ${Math.round(v)}</span>`
      ).join('');
      aqiBlock = `
        <div class="conditions-item conditions-item--wide">
          <span class="conditions-item__label">Air Quality · ${isEU ? 'European' : 'US'} AQI</span>
          <span class="conditions-item__value">${aqLevel ? `<span class="uv-badge" style="background:${aqLevel.color}">${aqi}</span> <span style="color:${aqLevel.color}">${aqLevel.label}</span>` : '<span class="uv-badge">—</span>'}</span>
          <div class="conditions-item__chips">${chips}</div>
        </div>
      `;
    }

    const pollenTypes = aqC ? [
      ['Alder', aqC.alder_pollen], ['Birch', aqC.birch_pollen], ['Grass', aqC.grass_pollen],
      ['Mugwort', aqC.mugwort_pollen], ['Olive', aqC.olive_pollen], ['Ragweed', aqC.ragweed_pollen],
    ] : [];
    const pollenPresent = pollenTypes.filter(([, v]) => v != null);
    let pollenBlock = `
      <div class="conditions-item conditions-item--wide">
        <span class="conditions-item__label">Pollen</span>
        <span class="conditions-item__value">—</span>
        <span class="conditions-item__sub">Not available</span>
      </div>
    `;
    if (pollenPresent.length && !pollenPresent.some(([, v]) => v > 0)) {
      pollenBlock = `
      <div class="conditions-item conditions-item--wide">
        <span class="conditions-item__label">Pollen</span>
        <span class="conditions-item__value">Low</span>
        <span class="conditions-item__sub">Little to no pollen</span>
      </div>
    `;
    } else if (pollenPresent.length && pollenPresent.some(([, v]) => v > 0)) {
      const top = [...pollenPresent].sort((a, b) => b[1] - a[1]);
      const pLevel = Utils.getPollenLevel(top[0][1]);
      const pollenColors = { Low: '#5fb84d', Moderate: '#ff9800', High: '#f44336', 'Very High': '#880e4f' };
      const barColor = pollenColors[pLevel.label] || '#5fb84d';
      const bars = top.slice(0, 3).map(([label, v]) => {
        const pct = Math.max(2, Math.min(100, Math.round(v)));
        return `
          <div class="pollen-row">
            <span class="pollen-row__label">${label}</span>
            <span class="pollen-row__bar"><span class="pollen-row__fill" style="width:${pct}%;background:${barColor}"></span></span>
            <span class="pollen-row__value">${Math.round(v)}</span>
          </div>
        `;
      }).join('');
      pollenBlock = `
        <div class="conditions-item conditions-item--wide">
          <span class="conditions-item__label">Pollen</span>
          <span class="conditions-item__value"><span style="color:${pLevel.color}">${pLevel.label}</span></span>
          <span class="conditions-item__sub">${top[0][0]} is highest · grains/m³</span>
          <div class="pollen-bars">${bars}</div>
          <div class="pollen-legend">Low &lt;5 · Moderate 5–30 · High 30–99 · Very High 100+</div>
        </div>
      `;
    }

    const conditionsGrid = conditions.map((s) => `
      <div class="conditions-item${s.id ? ` conditions-item--press` : ''}"${s.id ? ` id="${s.id}"` : ''}>
        <span class="conditions-item__label">${s.label}</span>
        <span class="conditions-item__value">${s.value}</span>
        <span class="conditions-item__sub">${s.sub || ''}</span>
      </div>
    `).join('');

    boxes.push(`
      <div class="detail-box detail-box--conditions" style="animation-delay:0s">
        <div class="detail-box__title">Conditions</div>
        <div class="conditions-grid">
          ${conditionsGrid}
          ${aqiBlock}
          ${pollenBlock}
        </div>
      </div>
    `);

    const mapBox = `
      <div class="detail-box detail-box--map" id="mapSection">
        <div class="detail-box__title">Location</div>
        <div class="map-container" id="mapContainer"></div>
      </div>
    `;

    boxes.push(mapBox);
    container.innerHTML = `<div class="detail-grid">${boxes.join('')}</div>`;
    container.classList.remove('hidden');

    const pressBox = document.getElementById('pressureBox');
    if (pressBox) {
      pressBox.style.cursor = 'pointer';
      pressBox.addEventListener('click', () => {
        UI.pressUnit = UI.pressUnit === 'inHg' ? 'hPa' : 'inHg';
        Utils.safeSet('pressUnit', UI.pressUnit);
        UI.renderDetailBoxes(UI._lastWeather, UI._lastAQ, UI._lastUnits);
        if (UI._lastWeather && UI._lastWeather.hourly) {
          UI.renderHourlyChart(UI._lastWeather.hourly, UI._lastUnits);
        }
      });
    }
  },

  renderMap(lat, lon, tempLabel, tempValue, units, temps, windLabel, windDir, weatherCode, isDay) {
    const container = this.$('mapContainer');
    const section = this.$('mapSection');
    if (!container || !section) return;

    lat = Math.max(-85, Math.min(85, lat));

    const tempColor = tempValue != null ? Utils.getTempColor(tempValue, units) : '';

    const tileSize = 256;
    const maxWidth = container.clientWidth || 600;

    const zoom = 12;
    const n = Math.pow(2, zoom);

    const latRad = (lat * Math.PI) / 180;
    const xt = ((lon + 180) / 360) * n;
    const yt = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

    const centerTx = Math.floor(xt);
    const centerTy = Math.floor(yt);
    const fx = xt - centerTx;
    const fy = yt - centerTy;

    const mapWidth = maxWidth;
    const mapHeight = Math.max(200, Math.min(400, maxWidth * 0.6));

    section.classList.remove('hidden');

    let cols = Math.ceil(mapWidth / tileSize) + 1;
    if (cols % 2 === 0) cols += 1;
    let rows = Math.ceil(mapHeight / tileSize) + 1;
    if (rows % 2 === 0) rows += 1;

    const startTx = centerTx - Math.floor(cols / 2);
    const startTy = centerTy - Math.floor(rows / 2);

    const pointX = (centerTx - startTx + fx) * tileSize;
    const pointY = (centerTy - startTy + fy) * tileSize;
    const offX = Math.round(mapWidth / 2 - pointX);
    const offY = Math.round(mapHeight / 2 - pointY);

    let tiles = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = ((startTx + c) % n + n) % n;
        const ty = startTy + r;
        if (ty < 0 || ty >= n) continue;
        tiles += `<img src="https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png" alt="" loading="lazy" width="${tileSize}" height="${tileSize}">`;
      }
    }

    const windDirDeg = windDir != null ? Math.round(windDir) : null;
    const windArrowSvg = windDirDeg != null ? this._windArrowSVG(windDirDeg, 'map-badge__arrow', 16, '#fff') : '';

    container.innerHTML = `
      <div class="map-view" style="height:${mapHeight}px">
        <div class="map-tiles" style="grid-template-columns:repeat(${cols}, ${tileSize}px); left:${offX}px; top:${offY}px">
          ${tiles}
        </div>
        <div class="map-badge" style="--temp-bg:${tempColor}" aria-hidden="true">
          <span class="map-badge__icon">${WeatherIcons.get(weatherCode || 0, isDay !== 0)}</span>
          <span class="map-badge__temp">${tempLabel || ''}</span>
          ${windLabel ? `<span class="map-badge__wind">${windLabel}</span>` : ''}
          ${windArrowSvg}
        </div>
        <div class="map-attribution">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">&copy; OpenStreetMap</a>
        </div>
      </div>
    `;
  },

  hideMap() {
    const section = this.$('mapSection');
    if (section) section.classList.add('hidden');
  },

  // Max precipitation probability across daytime hours (is_day === 1) for a date.
  daytimeMaxPop(dateStr, hourly) {
    if (!hourly || !hourly.time || !hourly.precipitation_probability || !hourly.is_day) return null;
    const prefix = dateStr + 'T';
    let max = 0;
    for (let k = 0; k < hourly.time.length; k++) {
      if (!hourly.time[k].startsWith(prefix)) continue;
      if (hourly.is_day[k] !== 1) continue;
      const p = hourly.precipitation_probability[k];
      if (p != null && p > max) max = p;
    }
    return max;
  },

  renderForecast(daily, units, days, hourly) {
    if (!daily || !daily.time || !daily.time.length) return;
    const end = days >= 14 ? 14 : 7;
    const windUnit = Utils.getWindUnit(UI.windUnit);
    const cards = daily.time.slice(0, end).map((date, i) => {
      const max = daily.temperature_2m_max && daily.temperature_2m_max[i] != null ? Math.round(daily.temperature_2m_max[i]) : '—';
      const min = daily.temperature_2m_min && daily.temperature_2m_min[i] != null ? Math.round(daily.temperature_2m_min[i]) : '—';
      const pop = this.daytimeMaxPop(date, hourly) ?? (daily.precipitation_probability_max != null ? Math.round(daily.precipitation_probability_max[i] ?? 0) : 0);
      const windMax = daily.wind_speed_10m_max && daily.wind_speed_10m_max[i] != null ? Math.round(daily.wind_speed_10m_max[i]) : null;
      const gustMax = daily.wind_gusts_10m_max && daily.wind_gusts_10m_max[i] != null ? Math.round(daily.wind_gusts_10m_max[i]) : null;
      const rainSum = daily.rain_sum ? daily.rain_sum[i] : null;
      const snowSum = daily.snowfall_sum ? daily.snowfall_sum[i] : null;
      const sunshine = daily.sunshine_duration ? daily.sunshine_duration[i] : null;
      const weatherCode = daily.weather_code[i];
      const iconCode = WeatherIcons.dailyIcon(weatherCode, pop, rainSum ?? 0, snowSum ?? 0);
      const icon = WeatherIcons.get(iconCode, true);

      const d = Utils.parseLocal(date + 'T00:00:00', this._tz);
      const weekday = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { timeZone: this._tz || undefined, weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', { timeZone: this._tz || undefined, month: 'short', day: 'numeric' });

      const windStat = windMax != null
        ? `<div class="forecast-card__stat">
             <span class="forecast-card__stat-label">Wind</span>
             <div class="forecast-card__stat-info">
               <span class="forecast-card__stat-value">${windMax} ${windUnit}</span>
               ${gustMax != null ? `<span class="forecast-card__stat-sub">gusts ${gustMax}</span>` : ''}
             </div>
           </div>`
        : `<div class="forecast-card__stat"><span class="forecast-card__stat-label">Wind</span><div class="forecast-card__stat-info"><span class="forecast-card__stat-value">—</span></div></div>`;

      const iconShowsPrecip = iconCode === 61 || iconCode === 71;
      let precipVal = '—';
      let precipSub = 'dry';
      const snowLabel = Utils.formatSnow(snowSum, units);
      if (iconShowsPrecip && snowLabel) { precipVal = snowLabel; precipSub = 'snow'; }
      else if (iconShowsPrecip && rainSum != null && rainSum > 0) { precipVal = Utils.formatPrecip(rainSum, units) || '—'; precipSub = 'rain'; }
      else if (snowLabel) { precipVal = snowLabel; precipSub = 'snow (trace)'; }
      else if (rainSum != null && rainSum > 0) { precipVal = Utils.formatPrecip(rainSum, units) || '—'; precipSub = 'trace'; }

      const sunStat = sunshine != null
        ? `<div class="forecast-card__stat">
             <span class="forecast-card__stat-label">Sun</span>
             <div class="forecast-card__stat-info">
               <span class="forecast-card__stat-value">${Utils.formatDuration(sunshine)}</span>
               <span class="forecast-card__stat-sub">sunshine</span>
             </div>
           </div>`
        : `<div class="forecast-card__stat"><span class="forecast-card__stat-label">Sun</span><div class="forecast-card__stat-info"><span class="forecast-card__stat-value">—</span></div></div>`;

      return `
        <div class="forecast-card" role="listitem">
          <div class="forecast-card__top">
            <div class="forecast-card__day">
              <span class="forecast-card__weekday">${weekday}</span>
              <span class="forecast-card__date">${dateLabel}</span>
            </div>
            <div class="forecast-card__rain">
              <span class="forecast-card__rain-value">${pop}%</span>
              <span class="forecast-card__rain-label">chance</span>
            </div>
          </div>
          <div class="forecast-card__main">
            <div class="forecast-card__icon">${icon}</div>
            <div class="forecast-card__temps">
              <div class="forecast-card__temp-block">
                <span class="forecast-card__temp-label">High</span>
                <span class="forecast-card__high">${max}${max === '—' ? '' : '°'}</span>
              </div>
              <div class="forecast-card__temp-block">
                <span class="forecast-card__temp-label">Low</span>
                <span class="forecast-card__low">${min}${min === '—' ? '' : '°'}</span>
              </div>
            </div>
          </div>
          <div class="forecast-card__stats">
            ${windStat}
            <div class="forecast-card__stat">
              <span class="forecast-card__stat-label">Precip</span>
              <div class="forecast-card__stat-info">
                <span class="forecast-card__stat-value">${precipVal}</span>
                <span class="forecast-card__stat-sub">${precipSub}</span>
              </div>
            </div>
            ${sunStat}
          </div>
        </div>
      `;
    }).join('');

    this.$('forecastCards').innerHTML = cards;
  },



  renderHourly(hourly, units) {
    if (!hourly || !hourly.time || !hourly.time.length) return;
    const startIdx = this._hourlyStartIdx(hourly);
    const windUnit = Utils.getWindUnit(UI.windUnit);
    const count = this._hourlyAll ? hourly.time.length - startIdx : 24;

    let todayKey = null;
    let tomorrowKey = null;
    const advanceDay = (dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const next = new Date(y, m - 1, d + 1);
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    };
    try {
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: this._tz, year: 'numeric', month: '2-digit', day: '2-digit',
      });
      todayKey = dtf.format(new Date());
      tomorrowKey = advanceDay(todayKey);
    } catch {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      tomorrowKey = advanceDay(todayKey);
    }

    let prevKey = '';
    const cards = hourly.time.slice(startIdx, startIdx + count).map((time, i) => {
      const idx = startIdx + i;
      const temp = hourly.temperature_2m && hourly.temperature_2m[idx] != null
        ? Utils.formatTemp(hourly.temperature_2m[idx], units)
        : '—';
      const timeLabel = i === 0 ? 'Now' : Utils.formatHourShort(time, this._tz);
      const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : null;
      const wind = hourly.wind_speed_10m && hourly.wind_speed_10m[idx] != null ? Math.round(hourly.wind_speed_10m[idx]) : null;
      const windDir = hourly.wind_direction_10m && hourly.wind_direction_10m[idx] != null ? Math.round(hourly.wind_direction_10m[idx]) : null;
      const precipNow = hourly.precipitation && hourly.precipitation[idx] != null ? hourly.precipitation[idx] : 0;
      const snowNow = hourly.snowfall && hourly.snowfall[idx] != null ? hourly.snowfall[idx] : 0;
      const iconCode = WeatherIcons.adjustForPrecip(hourly.weather_code[idx], pop, precipNow, snowNow);
      const icon = WeatherIcons.get(iconCode, hourly.is_day && hourly.is_day[idx] != null ? hourly.is_day[idx] : 1);

      const dateKey = time.slice(0, 10);
      const showDate = i === 0 || dateKey !== prevKey;
      prevKey = dateKey;
      let dateLabel = '';
      if (showDate) {
        if (dateKey === todayKey) dateLabel = 'Today';
        else if (dateKey === tomorrowKey) dateLabel = 'Tomorrow';
        else dateLabel = Utils.parseLocal(time, this._tz)
          .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }

      let precipVal = '—';
      if (pop != null) precipVal = `${pop}%`;

      const windVal = wind != null ? `${wind} ${windUnit}` : '—';
      const windDirLabel = windDir != null ? Utils.getWindDirection(windDir) : '';
      const humidity = hourly.relative_humidity_2m && hourly.relative_humidity_2m[idx] != null ? `${Math.round(hourly.relative_humidity_2m[idx])}%` : '—';
      const feelsLike = hourly.apparent_temperature && hourly.apparent_temperature[idx] != null
        ? Utils.formatTemp(hourly.apparent_temperature[idx], units)
        : null;
      const isFirst = i === 0;

      return `
        <div class="hourly-card${isFirst ? ' hourly-card--now' : ''}" role="listitem">
          <div class="hourly-card__date">${dateLabel}</div>
          <div class="hourly-card__time">${timeLabel}</div>
          <div class="hourly-card__icon">${icon}</div>
          <div class="hourly-card__temp${isFirst ? ' hourly-card__temp--solid' : ''}">${temp}</div>
          ${feelsLike ? `<div class="hourly-card__feels">Feels ${feelsLike}</div>` : ''}
          <div class="hourly-card__stats">
            <div class="hourly-card__stat">
              <span class="hourly-card__stat-label">Rain</span>
              <span class="hourly-card__stat-value">${precipVal}</span>
            </div>
            <div class="hourly-card__stat">
              <span class="hourly-card__stat-label">Wind</span>
              <span class="hourly-card__stat-value">${windVal}${windDirLabel ? ` ${windDirLabel}` : ''}</span>
            </div>
            <div class="hourly-card__stat">
              <span class="hourly-card__stat-label">Humidity</span>
              <span class="hourly-card__stat-value">${humidity}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.$('hourlyScroll').innerHTML = cards;
  },

  renderHourlyChart(hourly, units) {
    const container = this.$('hourlyChart');
    if (!container || !hourly || !hourly.time) return;

    container.classList.remove('hidden');
    const tabs = this.$('chartTabs');
    if (tabs) tabs.classList.remove('hidden');

    const W = Math.max(320, container.clientWidth || 600);
    const H = 320;
    const padR = 16, padT = 30, padB = 48;
    const ih = H - padT - padB;
    let padL = 58;

    const startIdx = this._hourlyStartIdx(hourly);
    const count = 24;
    const times = hourly.time.slice(startIdx, startIdx + count);
    if (!times.length) return;
    const mode = this._chartMode;
    const slice = (key) => hourly[key] ? hourly[key].slice(startIdx, startIdx + count) : null;

    const pops = slice('precipitation_probability');

    let cfg;
    if (mode === 'rain') {
      if (!pops) return;
      cfg = {
        min: 0, max: 100, suffix: '%',
        bars: pops, barH: 1,
        legend: [{ label: 'chance of rain', swatch: '#7EC8E3' }],
      };
    } else if (mode === 'wind') {
      const u = Utils.getWindUnit(this.windUnit);
      const vals = slice('wind_speed_10m');
      if (!vals) return;
      const gusts = slice('wind_gusts_10m');
      const all = gusts ? vals.concat(gusts) : vals;
      cfg = {
        values: vals, color: '#FFB74D', suffix: '',
        gusts: gusts, gustColor: '#E08A2E',
        min: Math.min(...all), max: Math.max(...all),
        legend: [
          { label: `Wind (${u})`, swatch: '#FFB74D' },
          ...(gusts ? [{ label: `Gusts (${u})`, swatch: '#E08A2E' }] : []),
        ],
      };
    } else if (mode === 'humidity') {
      const vals = slice('relative_humidity_2m');
      if (!vals) return;
      cfg = {
        values: vals, color: '#1E88E5', suffix: '%',
        legend: [{ label: 'Humidity (%)', swatch: '#1E88E5' }],
      };
    } else if (mode === 'cloud') {
      const vals = slice('cloud_cover');
      if (!vals) return;
      cfg = {
        min: 0, max: 100, suffix: '%',
        bars: vals, barH: 1,
        legend: [{ label: 'Cloud cover (%)', swatch: '#90A4AE' }],
      };
    } else if (mode === 'pressure') {
      const raw = slice('pressure_msl');
      const vals = raw ? (UI.pressUnit === 'inHg' ? raw.map((v) => v * 0.02953) : raw) : null;
      if (!vals) return;
      cfg = {
        values: vals, suffix: ` ${UI.pressUnit}`, color: '#AB47BC',
        legend: [{ label: `Pressure (${UI.pressUnit})`, swatch: '#AB47BC' }],
      };
    } else if (mode === 'solar') {
      const raw = slice('shortwave_radiation');
      if (!raw) return;
      const fullSun = 1000;
      const vals = raw.map((v) => Math.max(0, Math.min(100, Math.round((v / fullSun) * 100))));
      cfg = {
        min: 0, max: 100, values: vals, color: '#FFA726', suffix: '%',
        legend: [{ label: 'Sun strength (%)', swatch: '#FFA726' }],
      };
    } else {
      const vals = slice('temperature_2m');
      if (!vals) return;
      const suffix = units === 'imperial' ? '°F' : '°C';
      cfg = {
        values: vals, suffix: '°', tempGrad: true,
        second: slice('dew_point_2m') || [],
        legend: [
          { label: `Temperature (${suffix})`, swatch: '#FF7043' },
          { label: `Dew point (${suffix})`, swatch: '#26C6DA' },
        ],
      };
    }

    const minT = cfg.min != null ? cfg.min : Math.min(...cfg.values, ...(cfg.second || []));
    const maxT = cfg.max != null ? cfg.max : Math.max(...cfg.values, ...(cfg.second || []));
    const span = Math.max(1, maxT - minT);

    // Grow left padding so the widest y-axis label (e.g. "1013 hPa") isn't clipped.
    if (cfg.values) {
      try {
        const ctx = this._getMeasureCtx();
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
          const t = Math.round(minT + (span * i) / ticks);
          padL = Math.max(padL, ctx.measureText(`${t}${cfg.suffix}`).width + 16);
        }
      } catch (e) { /* measurement is best-effort */ }
    }
    const iw = W - padL - padR;

    const y = (t) => padT + ih - ((t - minT) / span) * ih;
    const x = (i) => padL + (i / times.length) * iw;

    let grid = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const t = minT + (span * i) / ticks;
      const yy = y(t).toFixed(1);
      grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="currentColor" stroke-opacity="0.12"/>
               <text x="${padL - 12}" y="${+yy + 6}" text-anchor="end" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Math.round(t)}${cfg.suffix}</text>`;
    }

    let xlabels = '';
    const minGap = 76;
    const labelStep = [6, 8, 12, 24].find((s) => (iw * s) / times.length >= minGap) || 24;
    for (let i = 0; i < times.length; i += labelStep) {
      xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Utils.formatHourShort(times[i], this._tz)}</text>`;
    }
    if (labelStep < 24) {
      const parts = times[0].slice(0, 10).split('-').map(Number);
      const next = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1)).toISOString().slice(0, 10) + 'T00:00:00';
      const dayEnd = Utils.parseLocal(next, this._tz);
      xlabels += `<text x="${x(times.length).toFixed(1)}" y="${H - 12}" text-anchor="end" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Utils.formatHourShort(dayEnd, this._tz)}</text>`;
    }

    let bars = '';
    if (cfg.bars) {
      const barW = (iw / times.length) * 0.55;
      cfg.bars.forEach((p, i) => {
        if (p > 0) {
          const bh = (p / 100) * ih * (cfg.barH || 0.4);
          bars += `<rect x="${(x(i) - barW / 2).toFixed(1)}" y="${(H - padB - bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="#7EC8E3" stroke="rgba(255,255,255,0.9)" stroke-width="1"/>`;
        }
      });
    }

    let line = '', dots = '', defs = '';
    if (cfg.values) {
      const points = cfg.values.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');
      const area = `${padL},${(padT + ih).toFixed(1)} ${points} ${x(times.length - 1).toFixed(1)},${(padT + ih).toFixed(1)}`;
      const gustPoints = cfg.gusts ? cfg.gusts.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ') : '';
      if (cfg.tempGrad) {
        const gradStops = [1, 0.75, 0.5, 0.25, 0].map((f) => {
          const t = minT + span * f;
          return `<stop offset="${Math.round(f * 100)}%" stop-color="${Utils.getTempColor(t, units)}"/>`;
        }).join('');
        defs = `<linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">${gradStops}</linearGradient>`;
        line = `<polygon points="${area}" fill="url(#tempGrad)" fill-opacity="0.22"/>
                <polyline points="${points}" fill="none" stroke="url(#tempGrad)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        dots = cfg.values.map((t, i) =>
          `<circle cx="${x(i).toFixed(1)}" cy="${y(t).toFixed(1)}" r="4" fill="${Utils.getTempColor(t, units)}" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"/>`
        ).join('');
      } else {
        line = `<polygon points="${area}" fill="${cfg.color}" fill-opacity="0.15"/>
                <polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="${points}" fill="none" stroke="${cfg.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
        if (gustPoints) {
          line += `<polyline points="${gustPoints}" fill="none" stroke="${cfg.gustColor}" stroke-width="3" stroke-dasharray="8 5" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        dots = cfg.values.map((t, i) =>
          `<circle cx="${x(i).toFixed(1)}" cy="${y(t).toFixed(1)}" r="4" fill="${cfg.color}" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"/>`
        ).join('');
      }
      if (cfg.second && cfg.second.length) {
        const dpPoints = cfg.second.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');
        line += `<polyline points="${dpPoints}" fill="none" stroke="#26C6DA" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 4"/>`;
        dots += cfg.second.map((t, i) =>
          `<circle cx="${x(i).toFixed(1)}" cy="${y(t).toFixed(1)}" r="3" fill="#26C6DA" stroke="rgba(255,255,255,0.85)" stroke-width="1"/>`
        ).join('');
      }
    }

    const modeLabel = mode === 'rain' ? 'Rain' : mode === 'wind' ? 'Wind' : mode === 'humidity' ? 'Humidity' : mode === 'cloud' ? 'Cloud Cover' : mode === 'pressure' ? 'Pressure' : mode === 'solar' ? 'Sun strength' : 'Temperature & dew point';
    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="hourly-chart__svg" role="img"
           aria-label="24-hour ${modeLabel} chart">
        <defs>${defs}</defs>
        ${grid}
        ${xlabels}
        ${line}
        ${dots}
        ${bars}
      </svg>
      ${cfg.legend && cfg.legend.length ? `
        <div class="hourly-chart__legend">
          ${cfg.legend.map((l) => `<span class="hourly-chart__legend-item"><span class="hourly-chart__legend-swatch" style="background:${l.swatch}"></span>${l.label}</span>`).join('')}
        </div>` : ''}`;
  },

  setChartMode(mode) {
    if (mode === 'dew') mode = 'temp';
    this._chartMode = ['temp', 'rain', 'wind', 'humidity', 'cloud', 'pressure', 'solar'].includes(mode) ? mode : 'temp';
    const map = { temp: 'chartTempBtn', rain: 'chartRainBtn', wind: 'chartWindBtn', humidity: 'chartHumidityBtn', cloud: 'chartCloudBtn', pressure: 'chartPressureBtn', solar: 'chartSolarBtn' };
    Object.keys(map).forEach((k) => {
      const btn = this.$(map[k]);
      if (!btn) return;
      const on = k === this._chartMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });
  },

  renderWeather(weatherData, aqData, units, cityName, country, lat, lon, forecastDays) {
    if (!weatherData) return;
    this.hideLoading();
    this.hideError();
    this._tz = weatherData.timezone ? weatherData.timezone : null;
    weatherData._cityName = cityName;
    weatherData._country = country;
    this.$('weatherContent').classList.remove('hidden');
    this.$('weatherContent').classList.add('weather-content--visible');
    this.renderCurrentWeather(weatherData, units);
    this.renderForecast(weatherData.daily, units, forecastDays, weatherData.hourly);
    this.renderHourly(weatherData.hourly, units);
    this.renderHourlyChart(weatherData.hourly, units);
    this.renderDetailBoxes(weatherData, aqData, units);
    const tempLabel = weatherData.current && weatherData.current.temperature_2m != null
      ? Utils.formatTemp(weatherData.current.temperature_2m, units)
      : '';
    UI._mapTemp = tempLabel;
    const tempValue = weatherData.current && weatherData.current.temperature_2m != null
      ? weatherData.current.temperature_2m
      : null;
    UI._mapTempValue = tempValue;
    const windUnit = Utils.getWindUnit(this.windUnit);
    const windSpeed = weatherData.current && weatherData.current.wind_speed_10m != null
      ? Math.round(weatherData.current.wind_speed_10m)
      : null;
    UI._mapWindLabel = windSpeed != null ? `${windSpeed} ${windUnit}` : '';
    UI._mapWindDir = weatherData.current && weatherData.current.wind_direction_10m != null
      ? Math.round(weatherData.current.wind_direction_10m)
      : null;
    if (lat != null && lon != null) {
      const weatherCode = weatherData.current && weatherData.current.weather_code != null ? weatherData.current.weather_code : 0;
      const isDay = weatherData.current && weatherData.current.is_day != null ? weatherData.current.is_day : 1;
      this.renderMap(lat, lon, tempLabel, tempValue, units, [], UI._mapWindLabel, UI._mapWindDir, weatherCode, isDay);
    } else {
      this.hideMap();
    }
  },

  setUnitLabel(units) {
    const label = units === 'imperial' ? '°F' : '°C';
    this.$('unitLabel').textContent = label;
    const el = this.$('unitMenuLabel');
    if (el) el.textContent = label;
  },

  setWindUnitLabel(code) {
    this.windUnit = code;
    const el = this.$('windLabel');
    if (el) el.textContent = Utils.getWindUnit(code);
  },

  setVisLabel(code) {
    this.visUnit = code;
    const el = this.$('visLabel');
    if (el) el.textContent = code === 'mi' ? 'mi' : 'km';
  },

  setPressUnit(code) {
    this.pressUnit = code === 'inHg' ? 'inHg' : 'hPa';
  },

  initThemeToggle() {
    const saved = Utils.safeGet('theme', null);
    const isDark = saved === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    const icon = this.$('themeIcon');
    if (icon) icon.textContent = isDark ? '\u2600' : '\u263E';
  },

  toggleTheme() {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    Utils.safeSet('theme', isDark ? 'dark' : 'light');
    const icon = this.$('themeIcon');
    if (icon) icon.textContent = isDark ? '\u2600' : '\u263E';
  },

  _esc(str) {
    if (str == null) return '';
    const el = document.createElement('span');
    el.textContent = String(str);
    return el.innerHTML;
  },

  _windArrowSVG(dir, className, size, stroke) {
    if (dir == null) return '';
    const safeClass = String(className).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeStroke = stroke && /^#[0-9a-fA-F]{3,8}$/.test(stroke) ? stroke : '';
    const s = safeStroke ? ` stroke="${safeStroke}" fill="none"` : '';
    return `<svg class="${safeClass}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform:rotate(${Math.round(dir)}deg)"><path d="M12 19V5"${s}/><path d="M5 12l7-7 7 7"${s}/></svg>`;
  },
};
