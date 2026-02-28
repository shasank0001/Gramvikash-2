/**
 * Weather routes — fetch local weather, forecasts, and generate farming alerts & advisories
 */
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();
const weatherCache = new NodeCache({ stdTTL: 600 });   // current weather: 10 min TTL
const forecastCache = new NodeCache({ stdTTL: 1800 });  // forecast: 30 min TTL

// ─── GET /api/weather?lat=&lng= ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required.' });
  }

  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      const mockData = getMockWeather();
      weatherCache.set(cacheKey, mockData);
      return res.json(mockData);
    }

    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    const alerts = generateAlerts(data);
    const cropAdvisories = generateCropAdvisories(data);

    const result = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility ? +(data.visibility / 1000).toFixed(1) : null,
      description: data.weather[0]?.description ?? 'N/A',
      condition: data.weather[0]?.main ?? 'N/A',
      icon: data.weather[0]?.icon ?? '01d',
      windSpeed: data.wind?.speed ?? 0,
      sunrise: data.sys?.sunrise ?? null,
      sunset: data.sys?.sunset ?? null,
      alerts,
      cropAdvisories,
    };

    weatherCache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[weather]', err.message);
    const mockData = getMockWeather();
    res.json(mockData);
  }
});

// ─── GET /api/weather/forecast?lat=&lng= ────────────────────────────────────
router.get('/forecast', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required.' });
  }

  const cacheKey = `forecast_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = forecastCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      const mockData = getMockForecast();
      forecastCache.set(cacheKey, mockData);
      return res.json(mockData);
    }

    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    const dailyForecast = aggregateForecast(data.list);
    const result = { days: dailyForecast };

    forecastCache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[weather/forecast]', err.message);
    const mockData = getMockForecast();
    res.json(mockData);
  }
});

// ─── Aggregate 3-hour forecast entries into daily summaries ─────────────────
function aggregateForecast(list) {
  const dayMap = {};

  for (const entry of list) {
    const date = entry.dt_txt.split(' ')[0]; // "YYYY-MM-DD"
    if (!dayMap[date]) {
      dayMap[date] = {
        date,
        temps: [],
        conditions: [],
        rainChances: 0,
        totalEntries: 0,
        icons: [],
      };
    }
    const day = dayMap[date];
    day.temps.push(entry.main.temp);
    day.conditions.push(entry.weather[0]?.main ?? 'Clear');
    day.icons.push(entry.weather[0]?.icon ?? '01d');
    day.totalEntries += 1;

    // If rain or drizzle or thunderstorm is present, count as rain chance
    const cond = entry.weather[0]?.main ?? '';
    if (['Rain', 'Drizzle', 'Thunderstorm'].includes(cond)) {
      day.rainChances += 1;
    }
  }

  // Take up to 5 days
  return Object.values(dayMap).slice(0, 5).map((day) => {
    // Dominant condition = most frequently occurring condition
    const condFreq = {};
    for (const c of day.conditions) {
      condFreq[c] = (condFreq[c] || 0) + 1;
    }
    const dominantCondition = Object.entries(condFreq).sort((a, b) => b[1] - a[1])[0][0];

    // Pick the icon that appears most at midday-ish entries, fallback to most common
    const iconFreq = {};
    for (const ic of day.icons) {
      iconFreq[ic] = (iconFreq[ic] || 0) + 1;
    }
    const dominantIcon = Object.entries(iconFreq).sort((a, b) => b[1] - a[1])[0][0];

    return {
      date: day.date,
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      condition: dominantCondition,
      icon: dominantIcon,
      rainProbability: Math.round((day.rainChances / day.totalEntries) * 100),
    };
  });
}

// ─── Generate weather alerts ────────────────────────────────────────────────
function generateAlerts(weatherData) {
  const alerts = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const wind = weatherData.wind?.speed ?? 0;          // m/s from API
  const windKmh = wind * 3.6;                         // convert to km/h
  const condition = weatherData.weather[0]?.main ?? '';
  const visibility = weatherData.visibility ?? 10000;  // metres

  // Thunderstorm
  if (condition === 'Thunderstorm') {
    alerts.push({
      id: 'thunderstorm',
      message: '⚡ Thunderstorm warning. Secure equipment and cover harvests.',
      severity: 'high',
      timestamp: Date.now(),
    });
  }

  // Hail warning (thunderstorm + very cold upper air approximated by low temp)
  if (condition === 'Thunderstorm' && temp < 25) {
    alerts.push({
      id: 'hail',
      message: '🧊 Hail risk detected. Protect standing crops and move livestock to shelter.',
      severity: 'high',
      timestamp: Date.now(),
    });
  }

  // Heavy rain with strong winds
  if (condition === 'Rain' && windKmh > 10) {
    alerts.push({
      id: 'rain_wind',
      message: '🌧️ Heavy rain with strong winds. Delay spraying operations.',
      severity: 'medium',
      timestamp: Date.now(),
    });
  }

  // Extreme heat
  if (temp > 40) {
    alerts.push({
      id: 'heat',
      message: `🌡️ Extreme heat (${Math.round(temp)}°C). Water crops early morning and provide shade for livestock.`,
      severity: 'medium',
      timestamp: Date.now(),
    });
  }

  // Frost warning
  if (temp < 4) {
    alerts.push({
      id: 'frost',
      message: `🥶 Frost warning (${Math.round(temp)}°C). Cover sensitive crops and protect young seedlings.`,
      severity: 'high',
      timestamp: Date.now(),
    });
  }

  // Strong wind
  if (windKmh > 20) {
    alerts.push({
      id: 'strong_wind',
      message: `💨 Strong winds (${Math.round(windKmh)} km/h). Secure greenhouse covers and avoid spraying.`,
      severity: 'medium',
      timestamp: Date.now(),
    });
  }

  // Fog / mist advisory
  if (condition === 'Fog' || condition === 'Mist' || visibility < 1000) {
    alerts.push({
      id: 'fog',
      message: '🌫️ Dense fog / low visibility. Use caution on roads and delay transport of goods.',
      severity: 'low',
      timestamp: Date.now(),
    });
  }

  // Fungal disease risk
  if (humidity > 85 && ['Clouds', 'Drizzle', 'Mist'].includes(condition)) {
    alerts.push({
      id: 'fungal',
      message: '🍄 High humidity alert. Watch for fungal disease outbreaks on leaves and fruit.',
      severity: 'low',
      timestamp: Date.now(),
    });
  }

  // Good weather
  if (
    alerts.length === 0 &&
    temp >= 18 && temp <= 32 &&
    humidity >= 30 && humidity <= 75 &&
    windKmh < 15 &&
    ['Clear', 'Clouds'].includes(condition)
  ) {
    alerts.push({
      id: 'good_weather',
      message: '☀️ Perfect conditions for field work today. Make the most of it!',
      severity: 'info',
      timestamp: Date.now(),
    });
  }

  return alerts;
}

// ─── Generate crop-specific advisories ──────────────────────────────────────
function generateCropAdvisories(weatherData) {
  const advisories = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const wind = weatherData.wind?.speed ?? 0;
  const windKmh = wind * 3.6;
  const condition = weatherData.weather[0]?.main ?? '';

  // ── Irrigation advice ──
  if (['Rain', 'Drizzle', 'Thunderstorm'].includes(condition)) {
    advisories.push({
      category: 'irrigation',
      tip: 'Rain expected — skip manual irrigation today to conserve water.',
    });
  } else if (temp > 35 && humidity < 40) {
    advisories.push({
      category: 'irrigation',
      tip: 'Hot and dry conditions — irrigate during early morning or late evening to minimise evaporation.',
    });
  } else if (humidity < 50 && condition === 'Clear') {
    advisories.push({
      category: 'irrigation',
      tip: 'Dry and clear skies — check soil moisture levels; light irrigation may be needed.',
    });
  }

  // ── Spraying conditions ──
  if (windKmh > 15) {
    advisories.push({
      category: 'spraying',
      tip: `Wind speed is ${Math.round(windKmh)} km/h — avoid spraying pesticides or foliar feed; drift will waste chemicals.`,
    });
  } else if (windKmh <= 10 && !['Rain', 'Drizzle'].includes(condition)) {
    advisories.push({
      category: 'spraying',
      tip: 'Low wind and no rain — ideal conditions for spraying pesticides or foliar nutrients.',
    });
  }

  // ── Harvest timing ──
  if (humidity > 80) {
    advisories.push({
      category: 'harvest',
      tip: 'High humidity — delay grain harvesting to avoid moisture damage. Let produce dry first.',
    });
  } else if (humidity >= 40 && humidity <= 65 && temp >= 20 && temp <= 35) {
    advisories.push({
      category: 'harvest',
      tip: 'Good humidity and temperature — favourable conditions for harvesting and drying crops.',
    });
  }

  // ── Sowing conditions ──
  if (
    temp >= 15 && temp <= 30 &&
    humidity >= 50 && humidity <= 80 &&
    !['Thunderstorm', 'Rain'].includes(condition)
  ) {
    advisories.push({
      category: 'sowing',
      tip: 'Moderate temperature and humidity — good day for sowing seeds or transplanting seedlings.',
    });
  } else if (temp < 10) {
    advisories.push({
      category: 'sowing',
      tip: 'Cold conditions — avoid sowing warm-season crops; consider mulching to protect soil.',
    });
  }

  // ── General ──
  if (condition === 'Clear' && temp >= 18 && temp <= 32 && windKmh < 15) {
    advisories.push({
      category: 'general',
      tip: 'Excellent weather for all outdoor farm activities. Plan field operations today.',
    });
  }

  return advisories;
}

// ─── Mock current weather (realistic Indian conditions) ─────────────────────
function getMockWeather() {
  const now = Date.now();
  const baseSunrise = Math.floor(now / 1000) - 21600; // ~6 hours ago
  const baseSunset = Math.floor(now / 1000) + 21600;  // ~6 hours from now

  const mockData = {
    main: { temp: 31, feels_like: 34, humidity: 68, pressure: 1008 },
    weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '03d' }],
    wind: { speed: 3.5 },
    visibility: 8000,
    sys: { sunrise: baseSunrise, sunset: baseSunset },
  };

  const alerts = generateAlerts(mockData);
  const cropAdvisories = generateCropAdvisories(mockData);

  return {
    temperature: 31,
    feelsLike: 34,
    humidity: 68,
    pressure: 1008,
    visibility: 8.0,
    description: 'partly cloudy',
    condition: 'Clouds',
    icon: '03d',
    windSpeed: 3.5,
    sunrise: baseSunrise,
    sunset: baseSunset,
    alerts,
    cropAdvisories,
  };
}

// ─── Mock 5-day forecast (realistic Indian weather) ─────────────────────────
function getMockForecast() {
  const today = new Date();
  const days = [];

  const patterns = [
    { condition: 'Clouds', icon: '03d', minTemp: 24, maxTemp: 33, rainProb: 10 },
    { condition: 'Rain', icon: '10d', minTemp: 22, maxTemp: 29, rainProb: 75 },
    { condition: 'Rain', icon: '10d', minTemp: 21, maxTemp: 28, rainProb: 80 },
    { condition: 'Clouds', icon: '04d', minTemp: 23, maxTemp: 31, rainProb: 30 },
    { condition: 'Clear', icon: '01d', minTemp: 24, maxTemp: 35, rainProb: 5 },
  ];

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      minTemp: patterns[i].minTemp,
      maxTemp: patterns[i].maxTemp,
      condition: patterns[i].condition,
      icon: patterns[i].icon,
      rainProbability: patterns[i].rainProb,
    });
  }

  return { days };
}

module.exports = router;
