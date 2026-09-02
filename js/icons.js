const WeatherIcons = {
  get(code, isDay = true) {
    const n = isDay ? 'day' : 'night';
    const key = `${n}_${this._group(code)}`;
    const icons = {
      day_clear: this._sun,
      night_clear: this._moon,
      day_clouds: this._cloudSun,
      night_clouds: this._cloudMoon,
      day_fog: this._fogDay,
      night_fog: this._fogNight,
      day_drizzle: this._drizzleDay,
      night_drizzle: this._drizzleNight,
      day_rain: this._rainDay,
      night_rain: this._rainNight,
      day_snow: this._snowDay,
      night_snow: this._snowNight,
      day_thunder: this._thunderDay,
      night_thunder: this._thunderNight,
    };
    return (icons[key] || icons.day_clear)();
  },

  _group(code) {
    if (code === 0) return 'clear';
    if (code <= 3) return 'clouds';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
    if (code >= 95) return 'thunder';
    return 'clear';
  },

  // Show a rain/snow icon when there is actual precipitation or a high chance
  // of it, even if the dominant WMO code only describes clouds/clear sky.
  adjustForPrecip(code, pop, precip, snow) {
    const g = this._group(code);
    if (g === 'rain' || g === 'drizzle' || g === 'snow' || g === 'thunder') return code;
    if (snow > 0 && pop >= 30) return 71;
    if (precip > 0 && pop >= 30) return 61;
    if (pop != null && pop >= 50) return 61;
    return code;
  },

  _svg(body, viewBox = '0 0 64 64') {
    return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
  },

  _sun: () => WeatherIcons._svg(`
    <circle cx="32" cy="32" r="12" fill="#FFD93D" stroke="#F5A623" stroke-width="1.5"/>
    <g stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round">
      <line x1="32" y1="6" x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6" y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13.6" y1="13.6" x2="19.3" y2="19.3"/>
      <line x1="44.7" y1="44.7" x2="50.4" y2="50.4"/>
      <line x1="13.6" y1="50.4" x2="19.3" y2="44.7"/>
      <line x1="44.7" y1="19.3" x2="50.4" y2="13.6"/>
    </g>
  `),

  _moon: () => WeatherIcons._svg(`
    <path d="M36 14c-10 0-18 8-18 18s8 18 18 18c3 0 5.8-.7 8.3-1.8C40.5 50.1 35.5 52 30 52c-11 0-20-9-20-20s9-20 20-20c1.5 0 3 .2 4.3.5C38.4 8 37.3 8 36 14z" fill="#E8D44D" stroke="#C9A830" stroke-width="1"/>
    <circle cx="40" cy="18" r="1.5" fill="rgba(255,255,255,0.5)"/>
    <circle cx="46" cy="24" r="1" fill="rgba(255,255,255,0.4)"/>
    <circle cx="43" cy="30" r="1.2" fill="rgba(255,255,255,0.3)"/>
  `),

  _cloudBase: () => `
    <ellipse cx="26" cy="38" rx="16" ry="10" fill="rgba(255,255,255,0.95)" stroke="rgba(200,210,220,0.5)" stroke-width="1"/>
    <circle cx="20" cy="30" r="10" fill="rgba(255,255,255,0.95)"/>
    <circle cx="32" cy="28" r="12" fill="rgba(255,255,255,0.95)"/>
    <circle cx="40" cy="32" r="8" fill="rgba(255,255,255,0.95)"/>
  `,

  _cloudSun: () => WeatherIcons._svg(`
    <circle cx="44" cy="20" r="9" fill="#FFD93D" stroke="#F5A623" stroke-width="1"/>
    <g stroke="#FFD93D" stroke-width="2" stroke-linecap="round">
      <line x1="44" y1="7" x2="44" y2="10"/>
      <line x1="44" y1="30" x2="44" y2="33"/>
      <line x1="31" y1="20" x2="34" y2="20"/>
      <line x1="54" y1="20" x2="57" y2="20"/>
    </g>
    ${WeatherIcons._cloudBase()}
  `),

  _cloudMoon: () => WeatherIcons._svg(`
    <path d="M46 12c-6 0-11 4-12.5 9.5C35.5 19.5 37 18 39 18c5.5 0 10 4.5 10 10 0 2-.6 3.8-1.5 5.3C49.3 29.5 50 27.8 50 26c0-7-4-13-10-14h6z" fill="#E8D44D" stroke="#C9A830" stroke-width="0.8" transform="translate(4,-2) scale(0.8)"/>
    ${WeatherIcons._cloudBase()}
  `),

  _rainDrops: (offsetX = 0) => `
    <line x1="${18 + offsetX}" y1="50" x2="${16 + offsetX}" y2="56" stroke="#C6EEFF" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${28 + offsetX}" y1="50" x2="${26 + offsetX}" y2="56" stroke="#C6EEFF" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${38 + offsetX}" y1="50" x2="${36 + offsetX}" y2="56" stroke="#C6EEFF" stroke-width="2.5" stroke-linecap="round"/>
  `,

  _drizzleDay: () => WeatherIcons._svg(`
    ${WeatherIcons._cloudBase()}
    <line x1="20" y1="50" x2="19" y2="54" stroke="#C6EEFF" stroke-width="2" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="29" y2="54" stroke="#C6EEFF" stroke-width="2" stroke-linecap="round"/>
  `),

  _drizzleNight: () => WeatherIcons._svg(`
    <path d="M48 10c-4 0-7 3-8 6.5 1-.3 2-.5 3-.5 3.5 0 6.5 3 6.5 6.5 0 1.5-.4 2.8-1 3.8.8-.5 1.5-1.5 1.5-2.8 0-4.5-3-8-7-8.5h5z" fill="#E8D44D" transform="translate(4,-2) scale(0.7)"/>
    ${WeatherIcons._cloudBase()}
    <line x1="20" y1="50" x2="19" y2="54" stroke="#C6EEFF" stroke-width="2" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="29" y2="54" stroke="#C6EEFF" stroke-width="2" stroke-linecap="round"/>
  `),

  _rainDay: () => WeatherIcons._svg(`
    ${WeatherIcons._cloudBase()}
    ${WeatherIcons._rainDrops(2)}
  `),

  _rainNight: () => WeatherIcons._svg(`
    <path d="M48 10c-4 0-7 3-8 6.5 1-.3 2-.5 3-.5 3.5 0 6.5 3 6.5 6.5 0 1.5-.4 2.8-1 3.8.8-.5 1.5-1.5 1.5-2.8 0-4.5-3-8-7-8.5h5z" fill="#E8D44D" transform="translate(4,-2) scale(0.7)"/>
    ${WeatherIcons._cloudBase()}
    ${WeatherIcons._rainDrops(2)}
  `),

  _snowFlakes: (offsetX = 0) => `
    <circle cx="${20 + offsetX}" cy="52" r="2" fill="white" opacity="0.9"/>
    <circle cx="${30 + offsetX}" cy="55" r="1.8" fill="white" opacity="0.8"/>
    <circle cx="${38 + offsetX}" cy="51" r="2.2" fill="white" opacity="0.85"/>
  `,

  _snowDay: () => WeatherIcons._svg(`
    ${WeatherIcons._cloudBase()}
    ${WeatherIcons._snowFlakes(2)}
  `),

  _snowNight: () => WeatherIcons._svg(`
    <path d="M48 10c-4 0-7 3-8 6.5 1-.3 2-.5 3-.5 3.5 0 6.5 3 6.5 6.5 0 1.5-.4 2.8-1 3.8.8-.5 1.5-1.5 1.5-2.8 0-4.5-3-8-7-8.5h5z" fill="#E8D44D" transform="translate(4,-2) scale(0.7)"/>
    ${WeatherIcons._cloudBase()}
    ${WeatherIcons._snowFlakes(2)}
  `),

  _thunderDay: () => WeatherIcons._svg(`
    <circle cx="46" cy="14" r="7" fill="#FFD93D"/>
    <ellipse cx="26" cy="34" rx="16" ry="10" fill="rgba(180,190,200,0.95)"/>
    <circle cx="20" cy="26" r="10" fill="rgba(180,190,200,0.95)"/>
    <circle cx="32" cy="24" r="12" fill="rgba(180,190,200,0.95)"/>
    <circle cx="40" cy="28" r="8" fill="rgba(180,190,200,0.95)"/>
    <polygon points="30,40 26,50 31,50 27,60 36,47 31,47 35,40" fill="#FFD93D" stroke="#F5A623" stroke-width="0.5"/>
  `),

  _thunderNight: () => WeatherIcons._svg(`
    <path d="M48 8c-4 0-7 3-8 6.5 1-.3 2-.5 3-.5 3.5 0 6.5 3 6.5 6.5 0 1.5-.4 2.8-1 3.8.8-.5 1.5-1.5 1.5-2.8 0-4.5-3-8-7-8.5h5z" fill="#E8D44D" transform="translate(4,-4) scale(0.7)"/>
    <ellipse cx="26" cy="34" rx="16" ry="10" fill="rgba(160,170,180,0.95)"/>
    <circle cx="20" cy="26" r="10" fill="rgba(160,170,180,0.95)"/>
    <circle cx="32" cy="24" r="12" fill="rgba(160,170,180,0.95)"/>
    <circle cx="40" cy="28" r="8" fill="rgba(160,170,180,0.95)"/>
    <polygon points="30,40 26,50 31,50 27,60 36,47 31,47 35,40" fill="#FFD93D" stroke="#F5A623" stroke-width="0.5"/>
  `),

  _fogDay: () => WeatherIcons._svg(`
    <circle cx="32" cy="16" r="8" fill="#FFD93D" opacity="0.6"/>
    <line x1="10" y1="32" x2="54" y2="32" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="38" x2="50" y2="38" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="10" y1="44" x2="54" y2="44" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="18" y1="50" x2="46" y2="50" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round"/>
  `),

  _fogNight: () => WeatherIcons._svg(`
    <line x1="10" y1="28" x2="54" y2="28" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="34" x2="50" y2="34" stroke="rgba(255,255,255,0.45)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="10" y1="40" x2="54" y2="40" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="18" y1="46" x2="46" y2="46" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="52" x2="50" y2="52" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round"/>
  `),
};
