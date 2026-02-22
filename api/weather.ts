
import { WeatherData } from '../types';

// Default coordinates for Ottawa, Canada
const DEFAULT_LAT = 45.4215;
const DEFAULT_LON = -75.6972;

export const fetchWeather = async (lat = DEFAULT_LAT, lon = DEFAULT_LON): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather API failure');
  const data = await response.json();
  
  if (!data.daily) {
    throw new Error('Invalid weather data format');
  }
  
  return data;
};

export const getWeatherIcon = (code: number) => {
  // WMO Weather interpretation codes
  if (code === 0) return '☀️'; // Clear
  if (code >= 1 && code <= 3) return '🌤️'; // Part cloudy
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 67) return '🌧️'; // Drizzle/Rain
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 82) return '🌦️'; // Showers
  if (code >= 95) return '⛈️'; // Thunder
  return '☁️';
};
