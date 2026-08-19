const API = {
  async fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400) throw new Error('Invalid request. Check your search.');
      if (res.status === 404) throw new Error('City not found. Check the spelling.');
      if (res.status === 429) throw new Error('Too many requests. Wait a moment.');
      throw new Error('Unable to fetch weather data.');
    }
    return res.json();
  },

  async searchCities(query) {
    const url = `${CONFIG.GEOCODING_BASE}/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const data = await this.fetchJSON(url);
    if (!data.results) return [];
    return data.results.map(r => ({
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      country: r.country_code,
      admin1: r.admin1 || '',
      tz: r.timezone,
    }));
  },

  async getWeather(lat, lon, units, windUnit, forecastDays) {
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const precipUnit = units === 'imperial' ? 'inch' : 'mm';
    const days = forecastDays === 14 ? 14 : 8;
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation,visibility,dew_point_2m`,
      `hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,is_day`,
      `daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,moonrise,moonset,moon_phase,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunshine_duration,daylight_duration`,
      `temperature_unit=${tempUnit}`,
      `wind_speed_unit=${windUnit || 'kmh'}`,
      `precipitation_unit=${precipUnit}`,
      `forecast_days=${days}`,
      `timezone=auto`,
    ];
    return this.fetchJSON(`${CONFIG.WEATHER_BASE}/v1/forecast?${params.join('&')}`);
  },

  async getAlerts(lat, lon) {
    const url = `${CONFIG.WEATHER_BASE}/v1/forecast?latitude=${lat}&longitude=${lon}&forecast_days=3&alerts=true&timezone=auto`;
    const data = await this.fetchJSON(url);
    return data.alerts && data.alerts.length ? data.alerts : [];
  },

  async getAirQuality(lat, lon) {
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `current=european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`,
      `timezone=auto`,
    ];
    return this.fetchJSON(`${CONFIG.AIR_QUALITY_BASE}/v1/air-quality?${params.join('&')}`);
  },

  async getHistoric(lat, lon, units) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const month = yesterday.getMonth();
    const day = yesterday.getDate();

    const years = [];
    for (let y = yesterday.getFullYear() - 10; y <= yesterday.getFullYear(); y++) {
      years.push(y);
    }
    const firstYear = years[0];
    const lastYear = years[years.length - 1];

    const archiveStart = `${firstYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const archiveEnd = `${lastYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const precipUnit = units === 'imperial' ? 'inch' : 'mm';
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `start_date=${archiveStart}`,
      `end_date=${archiveEnd}`,
      `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max`,
      `temperature_unit=${tempUnit}`,
      `precipitation_unit=${precipUnit}`,
      `timezone=auto`,
    ];

    const data = await this.fetchJSON(`https://archive-api.open-meteo.com/v1/archive?${params.join('&')}`);
    if (!data || !data.daily || !data.daily.time) return null;

    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const precipVals = data.daily.precipitation_sum;
    const windVals = data.daily.wind_speed_10m_max;

    const avgMax = maxTemps.filter(v => v != null);
    const avgMin = minTemps.filter(v => v != null);
    const avgPrecip = precipVals.filter(v => v != null);
    const avgWind = windVals.filter(v => v != null);

    const mean = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
    const max = arr => arr.length ? Math.round(Math.max(...arr)) : null;
    const min = arr => arr.length ? Math.round(Math.min(...arr)) : null;

    const lastIdx = maxTemps.length - 1;
    const actualHigh = maxTemps[lastIdx] != null ? Math.round(maxTemps[lastIdx]) : null;
    const actualLow = minTemps[lastIdx] != null ? Math.round(minTemps[lastIdx]) : null;
    const actualPrecip = precipVals[lastIdx] != null ? (Math.round(precipVals[lastIdx] * 10) / 10) : null;
    const actualWind = windVals[lastIdx] != null ? Math.round(windVals[lastIdx]) : null;

    return {
      date: yStr,
      actualHigh,
      actualLow,
      actualPrecip,
      actualWind,
      avgHigh: mean(avgMax),
      avgLow: mean(avgMin),
      recordHigh: max(avgMax),
      recordLow: min(avgMin),
      avgPrecip: avgPrecip.length ? (Math.round(avgPrecip.reduce((s, v) => s + v, 0) / avgPrecip.length * 10) / 10) : null,
      avgWind: mean(avgWind),
    };
  },
};
