/**
 * Weather routes — fetch local weather and generate alerts
 */
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600 }); // cache 10 minutes

// GET /api/weather?lat=&lng=
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required.' });

  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      // Return mock data if API key not configured
      const mockData = getMockWeather();
      cache.set(cacheKey, mockData);
      return res.json(mockData);
    }

    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    const alerts = generateAlerts(data);
    const result = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0]?.description ?? 'N/A',
      windSpeed: data.wind?.speed ?? 0,
      alerts,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[weather]', err.message);
    const mockData = getMockWeather();
    res.json(mockData);
  }
});

function generateAlerts(weatherData) {
  const alerts = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const wind = weatherData.wind?.speed ?? 0;
  const condition = weatherData.weather[0]?.main ?? '';

  if (condition === 'Thunderstorm') {
    alerts.push({ id: 'thunderstorm', message: '⚡ Thunderstorm warning. Secure equipment and cover harvests.', severity: 'high', timestamp: Date.now() });
  }
  if (condition === 'Rain' && wind > 10) {
    alerts.push({ id: 'rain_wind', message: '🌧️ Heavy rain with strong winds. Delay spraying operations.', severity: 'medium', timestamp: Date.now() });
  }
  if (temp > 40) {
    alerts.push({ id: 'heat', message: `🌡️ Extreme heat (${Math.round(temp)}°C). Water crops early morning.`, severity: 'medium', timestamp: Date.now() });
  }
  if (humidity > 85 && (condition === 'Clouds' || condition === 'Drizzle')) {
    alerts.push({ id: 'fungal', message: '🍄 High humidity alert. Watch for fungal disease outbreaks.', severity: 'low', timestamp: Date.now() });
  }

  return alerts;
}

function getMockWeather() {
  return {
    temperature: 28,
    humidity: 72,
    description: 'partly cloudy',
    windSpeed: 12,
    alerts: [
      {
        id: 'mock1',
        message: '🌦️ Scattered showers expected this afternoon. Plan field work accordingly.',
        severity: 'low',
        timestamp: Date.now(),
      },
    ],
  };
}

module.exports = router;
