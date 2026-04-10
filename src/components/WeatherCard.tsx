import { ForecastItem, WeatherCondition } from '../types/weather';
import styles from './WeatherCard.module.css';

interface WeatherCardProps {
  item: ForecastItem;
}

function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function formatTime(dtTxt: string): string {
  const date = new Date(dtTxt + ' UTC');
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(dtTxt: string): string {
  const date = new Date(dtTxt + ' UTC');
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getWeatherMain(condition: WeatherCondition['main']): string {
  const map: Record<string, string> = {
    Clear: 'Ясно',
    Clouds: 'Облачно',
    Rain: 'Дождь',
    Snow: 'Снег',
    Drizzle: 'Морось',
    Thunderstorm: 'Гроза',
    Mist: 'Туман',
    Fog: 'Туман',
    Haze: 'Дымка',
  };
  return map[condition] || condition;
}

export function WeatherCard({ item }: WeatherCardProps) {
  const weather = item.weather[0];
  const iconUrl = getWeatherIconUrl(weather.icon);

  return (
    <div className={styles.card}>
      <div className={styles.date}>{formatDay(item.dt_txt)}</div>
      <div className={styles.time}>{formatTime(item.dt_txt)}</div>
      <img src={iconUrl} alt={weather.description} className={styles.icon} />
      <div className={styles.temp}>{Math.round(item.main.temp)}°C</div>
      <div className={styles.description}>
        {getWeatherMain(weather.main)}
      </div>
      <div className={styles.details}>
        <span>Ощущается: {Math.round(item.main.feels_like)}°</span>
        <span>Влажность: {item.main.humidity}%</span>
        <span>Ветер: {item.wind.speed.toFixed(1)} м/с</span>
        {item.pop > 0 && <span>Осадки: {Math.round(item.pop * 100)}%</span>}
      </div>
    </div>
  );
}
