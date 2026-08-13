const UI = {
  $: (id) => document.getElementById(id),
  windUnit: 'kmh',
  visUnit: 'km',

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

  renderAlerts(alerts) {
    const bar = this.$('alertsBar');
    if (!bar) return;
    const list = Array.isArray(alerts) ? alerts : [];
    const current = list.filter((a) => {
      if (!a.start || !a.end) return true;
      const now = Date.now();
      return now >= new Date(a.start).getTime() && now <= new Date(a.end).getTime();
    });
    if (!current.length) {
      bar.classList.add('hidden');
      bar.innerHTML = '';
      return;
    }
    const rows = current.map((a) => {
      const title = this._esc(a.event || a.event_code || 'Weather alert');
      const desc = a.description ? this._esc(a.description) : '';
      const severity = (a.severity || '').toLowerCase();
      return `
        <div class="alerts-bar__item alerts-bar__item--${severity || 'info'}">
          <svg class="alerts-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div class="alerts-bar__text">
            <span class="alerts-bar__title">${title}</span>
            ${desc ? `<span class="alerts-bar__desc">${desc}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    bar.innerHTML = `<div class="alerts-bar__inner">${rows}</div>`;
    bar.classList.remove('hidden');
  },

  renderCurrentWeather(data, units) {
    const c = data.current;
    const d = data.daily || {};
    const icon = WeatherIcons.get(c.weather_code, c.is_day);
    const temp = Utils.formatTemp(c.temperature_2m, units);
    const feels = Utils.formatTemp(c.apparent_temperature, units);
    const desc = Utils.getWeatherDescription(c.weather_code);

    const sunrise = d.sunrise && d.sunrise[0] ? Utils.formatTime(d.sunrise[0]) : '—';
    const sunset = d.sunset && d.sunset[0] ? Utils.formatTime(d.sunset[0]) : '—';
    const moonrise = d.moonrise && d.moonrise[0] ? Utils.formatTime(d.moonrise[0]) : '—';
    const moonset = d.moonset && d.moonset[0] ? Utils.formatTime(d.moonset[0]) : '—';
    const phase = d.moon_phase && d.moon_phase[0];
    const phaseRow = phase != null
      ? `${Utils.getMoonPhaseName(phase)} · ${Utils.getMoonIllumination(phase)}% illuminated`
      : '';

    const ARC = [[0,100],[10,78],[20,58],[30,42],[40,31],[50,28],[60,31],[70,42],[80,58],[90,78],[100,100]];
    this._arc = { ARC, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0], moonrise: d.moonrise && d.moonrise[0], moonset: d.moonset && d.moonset[0] };

    const arcPos = (t) => {
      const seg = ARC.length - 1;
      const i = Math.max(0, Math.min(seg - 1, Math.floor(t * seg)));
      const f = Math.max(0, Math.min(1, t * seg - i));
      const a = ARC[i];
      const b = ARC[i + 1];
      return { left: a[0] + (b[0] - a[0]) * f, top: a[1] + (b[1] - a[1]) * f };
    };
    const arcFor = (rise, set) => {
      if (!rise || !set) return null;
      const r = new Date(rise).getTime();
      const s = new Date(set).getTime();
      if (isNaN(r) || isNaN(s) || s <= r) return null;
      const t = (Date.now() - r) / (s - r);
      return { pos: arcPos(Math.max(0, Math.min(1, t))), below: t < 0 || t > 1 };
    };
    const sunArc = arcFor(d.sunrise && d.sunrise[0], d.sunset && d.sunset[0]);
    const moonArc = arcFor(d.moonrise && d.moonrise[0], d.moonset && d.moonset[0]);

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
      <div class="current-weather__temp">${temp}</div>
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
        <div class="current-weather__arc-orb current-weather__arc-sun${sunArc && sunArc.below ? ' is-below' : ''}" style="${sunArc ? `left:${sunArc.pos.left}%;top:${sunArc.pos.top}%` : 'display:none'}">${WeatherIcons._sun()}</div>
        <div class="current-weather__arc-orb current-weather__arc-moon${moonArc && moonArc.below ? ' is-below' : ''}" style="${moonArc ? `left:${moonArc.pos.left}%;top:${moonArc.pos.top}%` : 'display:none'}">${WeatherIcons._moon()}</div>
      </div>
    `;

    const theme = Utils.getThemeClass(c.weather_code, c.is_day);
    const isDark = document.body.classList.contains('theme-dark');
    document.body.className = theme;
    document.body.classList.toggle('theme-dark', isDark);

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
    const { ARC, sunrise, sunset, moonrise, moonset } = this._arc;
    const arcPos = (t) => {
      const seg = ARC.length - 1;
      const i = Math.max(0, Math.min(seg - 1, Math.floor(t * seg)));
      const f = Math.max(0, Math.min(1, t * seg - i));
      const a = ARC[i];
      const b = ARC[i + 1];
      return { left: a[0] + (b[0] - a[0]) * f, top: a[1] + (b[1] - a[1]) * f };
    };
    const arcFor = (rise, set) => {
      if (!rise || !set) return null;
      const r = new Date(rise).getTime();
      const s = new Date(set).getTime();
      if (isNaN(r) || isNaN(s) || s <= r) return null;
      const t = (Date.now() - r) / (s - r);
      return { pos: arcPos(Math.max(0, Math.min(1, t))), below: t < 0 || t > 1 };
    };
    const sun = arcFor(sunrise, sunset);
    const moon = arcFor(moonrise, moonset);
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
    const container = this.$('detailGrid');
    if (!container || !data || !data.current) return;

    const c = data.current;
    const d = data.daily || {};
    const windUnit = Utils.getWindUnit(UI.windUnit);

    const boxes = [];

    const precipNow = Utils.formatPrecip(c.precipitation, units) || (units === 'imperial' ? '0 in' : '0 mm');
    const popToday = d.precipitation_probability_max ? Math.round(d.precipitation_probability_max[0] || 0) : null;
    const rainToday = d.rain_sum ? Math.round(d.rain_sum[0] * 10) / 10 : null;
    const snowToday = d.snowfall_sum ? Math.round(d.snowfall_sum[0] * 10) / 10 : null;
    const precipSub = [];
    if (popToday != null) precipSub.push(`${popToday}% chance today`);
    if (rainToday > 0) precipSub.push(`${rainToday}${units === 'imperial' ? '"' : ' mm'} rain`);
    if (snowToday > 0) precipSub.push(`${snowToday}cm snow`);

    const windArrow = `<svg class="detail-box__arrow" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform:rotate(${c.wind_direction_10m}deg)"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`;

    const uv = d.uv_index_max ? d.uv_index_max[0] : null;
    const uvInfo = uv != null ? Utils.getUVLevel(uv) : null;

    const conditions = [
      { label: 'Precipitation', value: precipNow, sub: precipSub.length ? precipSub.join(' · ') : 'Dry today' },
      { label: 'Wind', value: `${Math.round(c.wind_speed_10m)} ${windUnit}`, sub: `${windArrow}<span class="detail-box__dir">${Utils.getWindDirection(c.wind_direction_10m)}</span> · gusts ${Math.round(c.wind_gusts_10m)} ${windUnit}` },
      { label: 'Humidity', value: `${c.relative_humidity_2m}%`, sub: `Dew point ${Utils.formatTemp(c.dew_point_2m, units)}` },
      { label: 'UV Index', value: uv != null ? `<span class="uv-badge" style="background:${uvInfo.color}">${Math.round(uv)}</span>` : '—', sub: uv != null ? uvInfo.label : 'Not available' },
      { label: 'Visibility', value: Utils.formatVisibility(c.visibility, UI.visUnit), sub: 'Current visibility' },
      { label: 'Pressure', value: `${Math.round(c.surface_pressure)} hPa`, sub: 'Surface pressure' },
    ];

    const aqC = aq && aq.current;
    let aqiBlock = `
      <div class="conditions-item conditions-item--wide">
        <span class="conditions-item__label">Air Quality</span>
        <span class="conditions-item__value">—</span>
        <span class="conditions-item__sub">Not available</span>
      </div>
    `;
    if (aqC) {
      const aqi = aqC.european_aqi || aqC.us_aqi || 0;
      const aqLevel = Utils.getAQILevel(aqi);
      const isEU = !!aqC.european_aqi;
      const chips = [
        ['PM2.5', aqC.pm2_5], ['PM10', aqC.pm10], ['NO₂', aqC.nitrogen_dioxide],
        ['O₃', aqC.ozone], ['SO₂', aqC.sulphur_dioxide], ['CO', aqC.carbon_monoxide],
      ].filter(([, v]) => v != null).map(([label, v]) =>
        `<span class="detail-box__chip">${label} ${Math.round(v)}</span>`
      ).join('');
      aqiBlock = `
        <div class="conditions-item conditions-item--wide">
          <span class="conditions-item__label">Air Quality · ${isEU ? 'European' : 'US'} AQI</span>
          <span class="conditions-item__value"><span class="uv-badge" style="background:${aqLevel.color}">${aqi}</span> <span style="color:${aqLevel.color}">${aqLevel.label}</span></span>
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
        <span class="conditions-item__value">Low</span>
        <span class="conditions-item__sub">Little to no pollen</span>
      </div>
    `;
    if (pollenPresent.length && pollenPresent.some(([, v]) => v > 0)) {
      const top = pollenPresent.sort((a, b) => b[1] - a[1]);
      const maxVal = top[0][1];
      const pLevel = Utils.getPollenLevel(maxVal);
      const bars = top.slice(0, 3).map(([label, v]) => {
        const pct = Math.max(4, Math.round((v / maxVal) * 100));
        return `
          <div class="pollen-row">
            <span class="pollen-row__label">${label}</span>
            <span class="pollen-row__bar"><span class="pollen-row__fill" style="width:${pct}%"></span></span>
            <span class="pollen-row__value">${Math.round(v)}</span>
          </div>
        `;
      }).join('');
      pollenBlock = `
        <div class="conditions-item conditions-item--wide">
          <span class="conditions-item__label">Pollen</span>
          <span class="conditions-item__value"><span style="color:${pLevel.color}">${pLevel.label}</span></span>
          <span class="conditions-item__sub">${top[0][0]} is highest</span>
          <div class="pollen-bars">${bars}</div>
        </div>
      `;
    }

    const conditionsGrid = conditions.map((s) => `
      <div class="conditions-item">
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
  },

  renderMap(lat, lon, tempLabel, tempValue, units, temps) {
    const container = this.$('mapContainer');
    const section = this.$('mapSection');
    if (!container || !section) return;

    const tempColor = tempValue != null ? Utils.getTempColor(tempValue, units) : '';

    const tileSize = 256;
    const maxWidth = container.clientWidth || 600;
    const padH = 16;
    const padV = 36;
    const budgetW = Math.max(300, maxWidth - padH * 2);
    const budgetH = 728;

    const latRad = (lat * Math.PI) / 180;
    const lonScale = Math.max(0.7, Math.min(1.5, 1 / Math.cos(latRad)));
    const dLat = CONFIG.TEMP_SPREAD;
    const dLon = dLat * lonScale;

    const merc = (la) => Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180));
    const kH = (((merc(lat + dLat) - merc(lat - dLat)) / Math.PI) / 2) * tileSize;
    const kW = ((2 * dLon) / 360) * tileSize;

    const zW = Math.floor(Math.log2(budgetW / kW));
    const zH = Math.floor(Math.log2(budgetH / kH));
    const zoom = Math.max(8, Math.min(14, Math.min(zW, zH)));
    const n = Math.pow(2, zoom);

    const xt = ((lon + 180) / 360) * n;
    const yt = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

    const centerTx = Math.floor(xt);
    const centerTy = Math.floor(yt);
    const fx = xt - centerTx;
    const fy = yt - centerTy;

    const toX = (lo) => ((lo + 180) / 360) * n;
    const toY = (la) => ((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) * n;

    const tempPoints = temps && temps.length ? temps : null;
    const probe = tempPoints || [
      { lat: lat - dLat, lon: lon - dLon }, { lat: lat - dLat, lon: lon }, { lat: lat - dLat, lon: lon + dLon },
      { lat, lon: lon - dLon }, { lat, lon: lon + dLon },
      { lat: lat + dLat, lon: lon - dLon }, { lat: lat + dLat, lon: lon }, { lat: lat + dLat, lon: lon + dLon },
    ];

    let minDy = 0, maxDy = 0;
    probe.forEach((p) => {
      const dy = (toY(p.lat) - yt) * tileSize;
      minDy = Math.min(minDy, dy);
      maxDy = Math.max(maxDy, dy);
    });

    const mapWidth = maxWidth;
    const mapHeight = Math.max(200, Math.min(Math.ceil(maxDy - minDy) + padV * 2, 800));

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
        const ty = ((startTy + r) % n + n) % n;
        tiles += `<img src="https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png" alt="" loading="lazy" width="${tileSize}" height="${tileSize}">`;
      }
    }

    let tempBadges = '';
    if (tempPoints) {
      tempPoints.forEach((p) => {
        const px = (toX(p.lon) - startTx) * tileSize + offX;
        const py = (toY(p.lat) - startTy) * tileSize + offY;
        if (px < -10 || py < -10 || px > mapWidth + 10 || py > mapHeight + 10) return;
        tempBadges += `<div class="map-temp map-temp--small" style="left:${px.toFixed(1)}px; top:${py.toFixed(1)}px; --temp-bg:${p.color}">${p.label}</div>`;
      });
    }

    container.innerHTML = `
      <div class="map-view" style="height:${mapHeight}px">
        <div class="map-tiles" style="grid-template-columns:repeat(${cols}, ${tileSize}px); left:${offX}px; top:${offY}px">
          ${tiles}
        </div>
        <div class="map-temp" style="--temp-bg:${tempColor}" aria-hidden="true">${tempLabel || ''}</div>
        ${tempBadges}
        <div class="map-attribution">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
        </div>
      </div>
    `;
  },

  hideMap() {
    const section = this.$('mapSection');
    if (section) section.classList.add('hidden');
  },

  renderForecast(daily, units, days) {
    const start = days >= 14 ? 0 : 1;
    const end = days >= 14 ? 14 : 8;
    const windUnit = Utils.getWindUnit(UI.windUnit);
    const cards = daily.time.slice(start, end).map((date, i) => {
      const idx = start + i;
      const max = Math.round(daily.temperature_2m_max[idx]);
      const min = Math.round(daily.temperature_2m_min[idx]);
      const pop = daily.precipitation_probability_max ? Math.round(daily.precipitation_probability_max[idx] || 0) : 0;
      const windMax = daily.wind_speed_10m_max ? Math.round(daily.wind_speed_10m_max[idx]) : null;
      const gustMax = daily.wind_gusts_10m_max ? Math.round(daily.wind_gusts_10m_max[idx]) : null;
      const rainSum = daily.rain_sum ? daily.rain_sum[idx] : null;
      const snowSum = daily.snowfall_sum ? daily.snowfall_sum[idx] : null;
      const precipHours = daily.precipitation_hours ? daily.precipitation_hours[idx] : null;
      const sunshine = daily.sunshine_duration ? daily.sunshine_duration[idx] : null;
      const weatherCode = daily.weather_code[idx];
      const icon = WeatherIcons.get(weatherCode, true);

      const d = new Date(date + 'T00:00:00');
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const windStat = windMax != null
        ? `<div class="forecast-card__stat">
             <span class="forecast-card__stat-label">Wind</span>
             <div class="forecast-card__stat-info">
               <span class="forecast-card__stat-value">${windMax} ${windUnit}</span>
               ${gustMax != null ? `<span class="forecast-card__stat-sub">gusts ${gustMax}</span>` : ''}
             </div>
           </div>`
        : `<div class="forecast-card__stat"><span class="forecast-card__stat-label">Wind</span><div class="forecast-card__stat-info"><span class="forecast-card__stat-value">—</span></div></div>`;

      let precipVal = '—';
      let precipSub = 'dry';
      if (snowSum != null && snowSum > 0) { precipVal = `${snowSum}cm`; precipSub = 'snow'; }
      else if (rainSum != null && rainSum > 0) { precipVal = Utils.formatPrecip(rainSum, units) || '—'; precipSub = 'rain'; }
      else if (precipHours != null && precipHours > 0) { precipVal = `${Math.round(precipHours)}h`; precipSub = 'wet'; }

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
                <span class="forecast-card__high">${max}°</span>
              </div>
              <div class="forecast-card__temp-block">
                <span class="forecast-card__temp-label">Low</span>
                <span class="forecast-card__low">${min}°</span>
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
    const now = Date.now();
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
      if (new Date(hourly.time[i]).getTime() >= now) { startIdx = i; break; }
    }
    const windUnit = Utils.getWindUnit(UI.windUnit);
    const cards = hourly.time.slice(startIdx, startIdx + 12).map((time, i) => {
      const idx = startIdx + i;
      const temp = Utils.formatTemp(hourly.temperature_2m[idx], units);
      const timeLabel = i === 0 ? 'Now' : Utils.formatHourShort(time);
      const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
      const precip = hourly.precipitation ? hourly.precipitation[idx] : 0;
      const snow = hourly.snowfall ? hourly.snowfall[idx] : 0;
      const wind = hourly.wind_speed_10m ? Math.round(hourly.wind_speed_10m[idx]) : null;
      const icon = WeatherIcons.get(hourly.weather_code[idx], hourly.is_day ? hourly.is_day[idx] : 1);

      let precipVal = '—';
      if (snow > 0) precipVal = `${snow}cm`;
      else if (pop > 0) precipVal = `${pop}%`;
      else if (precip > 0) precipVal = Utils.formatPrecip(precip, units) || '—';

      const windVal = wind != null ? `${wind} ${windUnit}` : '—';

      return `
        <div class="hourly-card" role="listitem">
          <div class="hourly-card__time">${timeLabel}</div>
          <div class="hourly-card__icon">${icon}</div>
          <div class="hourly-card__temp">${temp}</div>
          <div class="hourly-card__stats">
            <div class="hourly-card__stat">
              <span class="hourly-card__stat-label">Rain</span>
              <span class="hourly-card__stat-value">${precipVal}</span>
            </div>
            <div class="hourly-card__stat">
              <span class="hourly-card__stat-label">Wind</span>
              <span class="hourly-card__stat-value">${windVal}</span>
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
    const W = Math.max(320, container.clientWidth || 600);
    const H = 320;
    const padL = 58, padR = 16, padT = 30, padB = 48;
    const iw = W - padL - padR;
    const ih = H - padT - padB;

    const times = hourly.time.slice(0, 24);
    const temps = hourly.temperature_2m.slice(0, 24);
    const pops = hourly.precipitation_probability ? hourly.precipitation_probability.slice(0, 24) : null;

    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const span = Math.max(1, maxT - minT);
    const y = (t) => padT + ih - ((t - minT) / span) * ih;
    const x = (i) => padL + (i / times.length) * iw;

    const points = temps.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');
    const area = `${padL},${(padT + ih).toFixed(1)} ${points} ${x(times.length - 1).toFixed(1)},${(padT + ih).toFixed(1)}`;

    let grid = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const t = minT + (span * i) / ticks;
      const yy = y(t).toFixed(1);
      grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="currentColor" stroke-opacity="0.12"/>
               <text x="${padL - 12}" y="${+yy + 6}" text-anchor="end" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Math.round(t)}°</text>`;
    }

    let xlabels = '';
    const minGap = 76;
    const labelStep = [6, 8, 12, 24].find((s) => (iw * s) / times.length >= minGap) || 24;
    for (let i = 0; i < times.length; i += labelStep) {
      xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Utils.formatHourShort(times[i])}</text>`;
    }
    if (labelStep < 24) {
      const dayEnd = new Date(new Date(times[0]).getTime() + 86400000);
      xlabels += `<text x="${x(times.length).toFixed(1)}" y="${H - 12}" text-anchor="end" font-size="18" font-weight="600" fill="currentColor" fill-opacity="0.9">${Utils.formatHourShort(dayEnd)}</text>`;
    }

    let bars = '';
    if (pops) {
      const barW = (iw / times.length) * 0.55;
      pops.forEach((p, i) => {
        if (p > 0) {
          const bh = (p / 100) * ih * 0.4;
          bars += `<rect x="${(x(i) - barW / 2).toFixed(1)}" y="${(H - padB - bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="#7EC8E3" fill-opacity="0.7"/>`;
        }
      });
    }

    const gradStops = [1, 0.75, 0.5, 0.25, 0].map((f) => {
      const t = minT + span * f;
      return `<stop offset="${Math.round(f * 100)}%" stop-color="${Utils.getTempColor(t, units)}"/>`;
    }).join('');

    const dots = temps.map((t, i) =>
      `<circle cx="${x(i).toFixed(1)}" cy="${y(t).toFixed(1)}" r="4" fill="${Utils.getTempColor(t, units)}" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"/>`
    ).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="hourly-chart__svg" role="img"
           aria-label="24-hour temperature trend with precipitation probability">
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">${gradStops}</linearGradient>
        </defs>
        ${grid}
        ${xlabels}
        ${bars}
        <polygon points="${area}" fill="url(#tempGrad)" fill-opacity="0.22"/>
        <polyline points="${points}" fill="none" stroke="url(#tempGrad)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>`;
  },

  renderWeather(weatherData, aqData, units, cityName, country, lat, lon, forecastDays) {
    this.hideLoading();
    this.hideError();
    weatherData._cityName = cityName;
    weatherData._country = country;
    this.$('weatherContent').classList.remove('hidden');
    this.$('weatherContent').classList.add('weather-content--visible');
    this.renderCurrentWeather(weatherData, units);
    this.renderForecast(weatherData.daily, units, forecastDays);
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
    if (lat != null && lon != null) {
      UI._mapTemps = [];
      this.renderMap(lat, lon, tempLabel, tempValue, units, []);
      API.getLocalTemps(lat, lon, units)
        .then((temps) => {
          if (!temps || !temps.length) return;
          UI._mapTemps = temps;
          UI.renderMap(lat, lon, tempLabel, tempValue, units, temps);
        })
        .catch(() => {});
    } else {
      UI._mapTemps = [];
      this.hideMap();
    }
  },

  setUnitLabel(units) {
    this.$('unitLabel').textContent = units === 'imperial' ? '°F' : '°C';
    this.setUnitMenuLabel(units);
  },

  setUnitMenuLabel(units) {
    const el = this.$('unitMenuLabel');
    if (el) el.textContent = units === 'imperial' ? '°F' : '°C';
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

  initThemeToggle() {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    const icon = this.$('themeIcon');
    if (icon) icon.textContent = isDark ? '\u2600' : '\u263E';
  },

  toggleTheme() {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.$('themeIcon').textContent = isDark ? '\u2600' : '\u263E';
  },

  _esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  },
};
