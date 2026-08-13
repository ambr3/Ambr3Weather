const Utils = {
  formatTemp(value, units) {
    const rounded = Math.round(value);
    return units === 'imperial' ? `${rounded}°F` : `${rounded}°C`;
  },

  formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  formatHourShort(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  },

  getWindDirection(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  },

  getWindUnit(code) {
    const map = { kmh: 'km/h', mph: 'mph', kn: 'kn', ms: 'm/s' };
    return map[code] || 'km/h';
  },

  formatVisibility(metres, unit) {
    if (metres == null) return '—';
    if (unit === 'mi') {
      const miles = metres / 1609.34;
      if (miles >= 10) return `${Math.round(miles)} mi`;
      return `${miles.toFixed(1)} mi`;
    }
    const km = metres / 1000;
    if (km >= 10) return `${Math.round(km)} km`;
    return `${km.toFixed(1)} km`;
  },

  formatPrecip(value, units) {
    if (value == null || value <= 0) return null;
    const v = Math.round(value * 10) / 10;
    return units === 'imperial' ? `${v} in` : `${v} mm`;
  },

  formatClock(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  },

  formatDuration(seconds) {
    if (seconds == null) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  },

  getAQILevel(aqi) {
    if (aqi <= 20) return { label: 'Good', color: '#4caf50' };
    if (aqi <= 40) return { label: 'Fair', color: '#8bc34a' };
    if (aqi <= 60) return { label: 'Moderate', color: '#ff9800' };
    if (aqi <= 80) return { label: 'Poor', color: '#f44336' };
    if (aqi <= 100) return { label: 'Very Poor', color: '#9c27b0' };
    return { label: 'Extremely Poor', color: '#880e4f' };
  },

  getUVLevel(uvi) {
    if (uvi <= 2) return { label: 'Low', color: '#4caf50' };
    if (uvi <= 5) return { label: 'Moderate', color: '#ff9800' };
    if (uvi <= 7) return { label: 'High', color: '#f44336' };
    if (uvi <= 10) return { label: 'Very High', color: '#9c27b0' };
    return { label: 'Extreme', color: '#880e4f' };
  },

  getTempColor(value, units) {
    const c = units === 'imperial' ? ((value - 32) * 5) / 9 : value;
    if (c <= -15) return '#5b6ee1';
    if (c <= -5) return '#3b7dd8';
    if (c <= 3) return '#4aa3df';
    if (c <= 10) return '#34a0a4';
    if (c <= 16) return '#52b788';
    if (c <= 21) return '#f2a541';
    if (c <= 27) return '#e76f2e';
    if (c <= 33) return '#d0342c';
    return '#a4161a';
  },

  getMoonPhaseName(phase) {
    const p = phase % 1;
    if (p < 0.0625 || p >= 0.9375) return 'New Moon';
    if (p < 0.1875) return 'Waxing Crescent';
    if (p < 0.3125) return 'First Quarter';
    if (p < 0.4375) return 'Waxing Gibbous';
    if (p < 0.5625) return 'Full Moon';
    if (p < 0.6875) return 'Waning Gibbous';
    if (p < 0.8125) return 'Last Quarter';
    return 'Waning Crescent';
  },

  getMoonIllumination(phase) {
    const p = phase % 1;
    return Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
  },

  getPollenLevel(value) {
    if (value == null) return null;
    if (value < 5) return { label: 'Low', color: '#4caf50' };
    if (value < 30) return { label: 'Moderate', color: '#ff9800' };
    if (value < 100) return { label: 'High', color: '#f44336' };
    return { label: 'Very High', color: '#880e4f' };
  },

  getWeatherDescription(code) {
    const descriptions = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      66: 'Light freezing rain', 67: 'Heavy freezing rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
    };
    return descriptions[code] || 'Unknown';
  },

  getThemeClass(weatherCode, isDay) {
    if (isDay === 0) return 'theme-clear-night';
    if (weatherCode === 0) return 'theme-clear';
    if (weatherCode <= 2) return 'theme-clouds';
    if (weatherCode === 3) return 'theme-clouds';
    if (weatherCode >= 45 && weatherCode <= 48) return 'theme-mist';
    if (weatherCode >= 51 && weatherCode <= 57) return 'theme-drizzle';
    if (weatherCode >= 61 && weatherCode <= 67) return 'theme-rain';
    if (weatherCode >= 71 && weatherCode <= 77) return 'theme-snow';
    if (weatherCode >= 80 && weatherCode <= 82) return 'theme-rain';
    if (weatherCode >= 85 && weatherCode <= 86) return 'theme-snow';
    if (weatherCode >= 95) return 'theme-thunder';
    return 'theme-clear';
  },

  debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  saveWeatherCache(entry) {
    try {
      localStorage.setItem('weatherCache', JSON.stringify(entry));
    } catch (err) {
      // storage full or unavailable — cache is best-effort
    }
  },

  loadWeatherCache() {
    try {
      const raw = localStorage.getItem('weatherCache');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  },
};
