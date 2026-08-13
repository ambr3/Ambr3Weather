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

  async geocode(city) {
    const url = `${CONFIG.GEOCODING_BASE}/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const data = await this.fetchJSON(url);
    if (!data.results || !data.results.length) throw new Error('City not found. Check the spelling.');
    const r = data.results[0];
    return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country_code, tz: r.timezone };
  },

  async getWeather(lat, lon, units, windUnit, forecastDays) {
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const precipUnit = units === 'imperial' ? 'inch' : 'mm';
    const days = forecastDays === 14 ? 14 : 8;
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation,visibility,dew_point_2m`,
      `hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,precipitation,snowfall,wind_speed_10m,is_day`,
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

  async getLocalTemps(lat, lon, units) {
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const latD = CONFIG.TEMP_SPREAD;
    const lonScale = Math.max(0.7, Math.min(1.5, 1 / Math.cos((lat * Math.PI) / 180)));
    const lonD = latD * lonScale;
    const offsets = [
      [-latD, -lonD], [-latD, 0], [-latD, lonD],
      [0, -lonD], [0, lonD],
      [latD, -lonD], [latD, 0], [latD, lonD],
    ];
    const lats = offsets.map(([dLat]) => (lat + dLat).toFixed(5)).join(',');
    const lons = offsets.map(([, dLon]) => (lon + dLon).toFixed(5)).join(',');
    const url = `${CONFIG.WEATHER_BASE}/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m&forecast_days=1&temperature_unit=${tempUnit}&timezone=auto`;
    const data = await this.fetchJSON(url);
    const list = Array.isArray(data) ? data : [data];
    return offsets.map(([dLat, dLon], i) => {
      const row = list[i];
      const temp = row && row.current ? row.current.temperature_2m : null;
      if (temp == null) return null;
      return {
        lat: lat + dLat,
        lon: lon + dLon,
        temp,
        label: `${Math.round(temp)}°`,
        color: Utils.getTempColor(temp, units),
      };
    }).filter(Boolean);
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
};
