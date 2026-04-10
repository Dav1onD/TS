import { useEffect, useState, useCallback } from 'react';
import { GeocodingResult, WeatherForecast, AirPollutionItem } from './types/weather';
import { fetchForecast, fetchAirPollution } from './api/weatherApi';
import { CitySearch } from './components/CitySearch';
import { CurrentWeather } from './components/CurrentWeather';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { AirQualityCard } from './components/AirQualityCard';
import { getCurrentWeather } from './utils/weatherUtils';
import styles from './App.module.css';

const REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 часа

function getWeatherBackground(weatherMain?: string): string {
  switch (weatherMain) {
    case 'Clear':
      return 'linear-gradient(180deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)';
    case 'Clouds':
      return 'linear-gradient(180deg, #606c88 0%, #3f4c6b 100%)';
    case 'Rain':
    case 'Drizzle':
      return 'linear-gradient(180deg, #373b44 0%, #4286f4 100%)';
    case 'Thunderstorm':
      return 'linear-gradient(180deg, #141e30 0%, #243b55 100%)';
    case 'Snow':
      return 'linear-gradient(180deg, #e6dada 0%, #274046 100%)';
    case 'Mist':
    case 'Fog':
    case 'Haze':
      return 'linear-gradient(180deg, #636e72 0%, #b2bec3 100%)';
    default:
      return 'linear-gradient(180deg, #1e3c72 0%, #2a5298 50%, #6dd5fa 100%)';
  }
}

export function App() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [airPollution, setAirPollution] = useState<AirPollutionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);

  const loadWeather = useCallback(async (city: GeocodingResult) => {
    setLoading(true);
    setError(null);
    try {
      const [forecastData, airData] = await Promise.all([
        fetchForecast(city.lat, city.lon),
        fetchAirPollution(city.lat, city.lon),
      ]);
      setForecast(forecastData);
      setAirPollution(airData.list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    loadWeather(selectedCity);
    const timer = setInterval(() => loadWeather(selectedCity), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [selectedCity, loadWeather]);

  const currentWeather = forecast?.list[0]?.weather[0]?.main;
  const background = getWeatherBackground(currentWeather);

  return (
    <div className={styles.app} style={{ background }}>
      <div className={styles.content}>
        <CitySearch onSelect={setSelectedCity} />

        {loading && <div className={styles.message}>Загрузка...</div>}
        {error && <div className={styles.message}>Ошибка: {error}</div>}

        {!loading && !error && forecast && (
          <>
            <CurrentWeather
              item={getCurrentWeather(forecast.list)}
              cityName={forecast.city.name}
            />
            <HourlyForecast items={forecast.list.slice(0, 8)} />
            <DailyForecast list={forecast.list} />
            {airPollution && <AirQualityCard item={airPollution} />}
          </>
        )}

        {!loading && !error && !forecast && (
          <div className={styles.message}>Выберите город для просмотра погоды</div>
        )}
      </div>
    </div>
  );
}
