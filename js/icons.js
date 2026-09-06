const WeatherIcons = {
  get(code, isDay = true) {
    const n = isDay ? 'day' : 'night';
    const key = `${n}_${this._group(code)}`;
    const icons = {
      day_clear: this._sun,
      night_clear: this._moon,
      day_clearsome: this._sunFewCloud,
      night_clearsome: this._moonFewCloud,
      day_clouds: this._cloudSun,
      night_clouds: this._cloudMoon,
      day_overcast: this._cloudOvercast,
      night_overcast: this._cloudOvercast,
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
    if (code === 1) return 'clearsome';
    if (code === 2) return 'clouds';
    if (code === 3) return 'overcast';
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

  // Daily forecast: the day's WMO code can be rain/drizzle even when only a
  // brief spell occurred. Never show a precip icon unless the chance AND the
  // amount justify it; otherwise fall back to a partly-cloudy look.
  dailyIcon(code, pop, rainSum, snowSum) {
    const g = this._group(code);
    if (g === 'thunder' || g === 'fog' || g === 'clear' || g === 'clouds') return code;
    const p = pop != null ? pop : 0;
    const rain = rainSum != null ? rainSum : 0;
    const snow = snowSum != null ? snowSum : 0;
    const hasSnow = snow > 0 && p >= 30;
    const hasRain = rain >= 1 && p >= 30;
    const highChance = p >= 50;
    if (g === 'snow') return (hasSnow || highChance) ? 71 : 2;
    if (g === 'rain' || g === 'drizzle') return (hasRain || highChance) ? 61 : 2;
    return code;
  },

  _svg(body, viewBox = '0 0 64 64') {
    return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
  },

  // Cloud silhouette: a solid WHITE cloud. A slightly-larger grey duplicate
  // offset 2px below gives it a soft edge so it still reads on pale cards —
  // without splitting the body into two visible tones.
  _cloud: (fill = '#FFFFFF') => `
    <g transform="translate(0,1.5)" opacity="0.55">
      <ellipse cx="32" cy="40" rx="20" ry="10.5" fill="#9FB3C4"/>
      <circle cx="17" cy="30" r="10" fill="#9FB3C4"/>
      <circle cx="31" cy="24.5" r="12" fill="#9FB3C4"/>
      <circle cx="44" cy="30.5" r="8.5" fill="#9FB3C4"/>
    </g>
    <ellipse cx="32" cy="40" rx="20" ry="10.5" fill="${fill}"/>
    <circle cx="17" cy="30" r="10" fill="${fill}"/>
    <circle cx="31" cy="24.5" r="12" fill="${fill}"/>
    <circle cx="44" cy="30.5" r="8.5" fill="${fill}"/>
  `,

  // Small cloud used on "mainly clear" icons, tucked in the lower-right.
  _smallCloud: () => `
    <g transform="translate(0,1.5)" opacity="0.55">
      <ellipse cx="50" cy="47" rx="9" ry="5" fill="#9FB3C4"/>
      <circle cx="44" cy="42" r="5.5" fill="#9FB3C4"/>
      <circle cx="52" cy="40.5" r="6" fill="#9FB3C4"/>
      <circle cx="58" cy="44" r="4" fill="#9FB3C4"/>
    </g>
    <ellipse cx="50" cy="47" rx="9" ry="5" fill="#FFFFFF"/>
    <circle cx="44" cy="42" r="5.5" fill="#FFFFFF"/>
    <circle cx="52" cy="40.5" r="6" fill="#FFFFFF"/>
    <circle cx="58" cy="44" r="4" fill="#FFFFFF"/>
  `,

  // Sun with optional rays. Rays are omitted when the sun is peeking from
  // behind a cloud so only the disc shows.
  _sunBody: (cx = 32, cy = 32, r = 13, withRays = true) => {
    const ray = withRays ? 6 : 0;
    const s = Math.round(r * 0.7071);
    const e = Math.round((r + ray) * 0.7071);
    const rays = withRays ? `
      <line x1="${cx}" y1="${cy - r - ray}" x2="${cx}" y2="${cy - r}"/>
      <line x1="${cx}" y1="${cy + r}" x2="${cx}" y2="${cy + r + ray}"/>
      <line x1="${cx - r - ray}" y1="${cy}" x2="${cx - r}" y2="${cy}"/>
      <line x1="${cx + r}" y1="${cy}" x2="${cx + r + ray}" y2="${cy}"/>
      <line x1="${cx - e}" y1="${cy - e}" x2="${cx - s}" y2="${cy - s}"/>
      <line x1="${cx + e}" y1="${cy - e}" x2="${cx + s}" y2="${cy - s}"/>
      <line x1="${cx - e}" y1="${cy + e}" x2="${cx - s}" y2="${cy + s}"/>
      <line x1="${cx + e}" y1="${cy + e}" x2="${cx + s}" y2="${cy + s}"/>
    ` : '';
    return `
      <g stroke="#FFC93C" stroke-width="2.4" stroke-linecap="round">${rays}</g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFD93D" stroke="#F0A520" stroke-width="1.4"/>
    `;
  },

  // True crescent moon: two arcs, no hand-drawn bezier wobble.
  _crescent: (s = 2.3, cx = 32, cy = 32) => {
    const off = 11.5 * s;
    return `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F6E78B" stroke="#D9B94A" stroke-width="0.7" transform="translate(${(cx - off).toFixed(1)}, ${(cy - off).toFixed(1)}) scale(${s})"/>`;
  },

  _sun: () => WeatherIcons._svg(`${WeatherIcons._sunBody(32, 32, 13, true)}`),

  _moon: () => WeatherIcons._svg(`${WeatherIcons._crescent(2.3, 32, 32)}`),

  // Code 1 - mainly clear: sun/moon prominent, small cloud in the corner.
  _sunFewCloud: () => WeatherIcons._svg(`
    ${WeatherIcons._sunBody(30, 30, 13, true)}
    ${WeatherIcons._smallCloud()}
  `),

  _moonFewCloud: () => WeatherIcons._svg(`
    ${WeatherIcons._crescent(1.6, 30, 30)}
    ${WeatherIcons._smallCloud()}
  `),

  // Code 2 - partly cloudy: sun/moon peeks from BEHIND the cloud.
  _cloudSun: () => WeatherIcons._svg(`
    ${WeatherIcons._sunBody(45, 16, 8, true)}
    ${WeatherIcons._cloud()}
  `),

  _cloudMoon: () => WeatherIcons._svg(`
    ${WeatherIcons._crescent(1.3, 24, 14)}
    ${WeatherIcons._cloud()}
  `),

  // Code 3 - overcast: a plain cloud with no sun/moon, clearly distinct from
  // the "partly cloudy" icons and visible on pale backgrounds.
  _cloudOvercast: () => WeatherIcons._svg(`${WeatherIcons._cloud()}`),

  // Heavy rain: three long, slim drops. Each has a soft outer glow underneath
  // so the streak pops off any card without needing to be thick.
  _rainLines: () => `
    <line x1="19" y1="47" x2="13" y2="66" stroke="#4D9CE0" stroke-width="6" opacity="0.35" stroke-linecap="round"/>
    <line x1="19" y1="47" x2="13" y2="66" stroke="#2E7FD9" stroke-width="3" stroke-linecap="round"/>
    <line x1="32" y1="47" x2="26" y2="66" stroke="#4D9CE0" stroke-width="6" opacity="0.35" stroke-linecap="round"/>
    <line x1="32" y1="47" x2="26" y2="66" stroke="#2E7FD9" stroke-width="3" stroke-linecap="round"/>
    <line x1="45" y1="47" x2="39" y2="66" stroke="#4D9CE0" stroke-width="6" opacity="0.35" stroke-linecap="round"/>
    <line x1="45" y1="47" x2="39" y2="66" stroke="#2E7FD9" stroke-width="3" stroke-linecap="round"/>
  `,

  // Drizzle: three long dotted streaks (small blue dots stacked) — clearly finer
  // than snow flakes and dashed vs the solid rain streaks.
  _drizzleLines: () => `
    <circle cx="24" cy="55" r="1.7" fill="#5C9BD6"/>
    <circle cx="23" cy="59.5" r="1.7" fill="#5C9BD6"/>
    <circle cx="24" cy="64" r="1.7" fill="#5C9BD6"/>
    <circle cx="36" cy="55" r="1.6" fill="#5C9BD6"/>
    <circle cx="35" cy="59.5" r="1.6" fill="#5C9BD6"/>
    <circle cx="36" cy="64" r="1.6" fill="#5C9BD6"/>
    <circle cx="48" cy="55" r="1.7" fill="#5C9BD6"/>
    <circle cx="47" cy="59.5" r="1.7" fill="#5C9BD6"/>
    <circle cx="48" cy="64" r="1.7" fill="#5C9BD6"/>
  `,

  _snowDots: () => `
    <circle cx="23" cy="57" r="3" fill="#FFFFFF"/>
    <circle cx="33" cy="60" r="2.6" fill="#FFFFFF"/>
    <circle cx="42" cy="56" r="3.1" fill="#FFFFFF"/>
    <circle cx="51" cy="59.5" r="2.4" fill="#FFFFFF"/>
  `,

  _bolt: () => `
    <polygon points="33,47 26,57 31,57 28,62 42,54 36,54 39,47" fill="#FFC93C" stroke="#E8A10E" stroke-width="0.8"/>
  `,

  _moonPeek: () => `${WeatherIcons._crescent(1.2, 22, 15)}`,

  // Precipitation icons use a taller viewBox so long drops/dots are never clipped.
  _precipSvg: (body) => WeatherIcons._svg(body, '0 0 64 72'),

  _drizzleDay: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._cloud()}
    ${WeatherIcons._drizzleLines()}
  `),

  _drizzleNight: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._moonPeek()}
    ${WeatherIcons._cloud()}
    ${WeatherIcons._drizzleLines()}
  `),

  _rainDay: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._cloud()}
    ${WeatherIcons._rainLines()}
  `),

  _rainNight: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._moonPeek()}
    ${WeatherIcons._cloud()}
    ${WeatherIcons._rainLines()}
  `),

  _snowDay: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._cloud()}
    ${WeatherIcons._snowDots()}
  `),

  _snowNight: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._moonPeek()}
    ${WeatherIcons._cloud()}
    ${WeatherIcons._snowDots()}
  `),

  _thunderDay: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._cloud()}
    ${WeatherIcons._bolt()}
  `),

  _thunderNight: () => WeatherIcons._precipSvg(`
    ${WeatherIcons._moonPeek()}
    ${WeatherIcons._cloud()}
    ${WeatherIcons._bolt()}
  `),

  _fogDay: () => WeatherIcons._svg(`
    <circle cx="32" cy="15" r="9" fill="#FFD93D" opacity="0.5"/>
    <line x1="10" y1="31" x2="54" y2="31" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <line x1="14" y1="38" x2="50" y2="38" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <line x1="10" y1="45" x2="54" y2="45" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="18" y1="52" x2="46" y2="52" stroke="#D8E0EA" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
  `),

  _fogNight: () => WeatherIcons._svg(`
    <line x1="10" y1="29" x2="54" y2="29" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
    <line x1="14" y1="36" x2="50" y2="36" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
    <line x1="10" y1="43" x2="54" y2="43" stroke="#D8E0EA" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>
    <line x1="18" y1="50" x2="46" y2="50" stroke="#D8E0EA" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
    <line x1="14" y1="56" x2="50" y2="56" stroke="#D8E0EA" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
  `),
};