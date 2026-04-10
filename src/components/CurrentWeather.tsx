import { ForecastItem } from '../types/weather';
import styles from './CurrentWeather.module.css';

interface CurrentWeatherProps {
  item: ForecastItem;
  cityName: string;
}

export function CurrentWeather({ item, cityName }: CurrentWeatherProps) {
  const weather = item.weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  return (
    <div className={styles.container}>
      <div className={styles.city}>{cityName}</div>
      <div className={styles.main}>
        <img src={iconUrl} alt={weather.description} className={styles.icon} />
        <div className={styles.temp}>{Math.round(item.main.temp)}°</div>
      </div>
      <div className={styles.description}>{weather.description}</div>
      <div className={styles.details}>
        <span>Ощущается как {Math.round(item.main.feels_like)}°</span>
        <span className={styles.separator}>·</span>
        <span>Ветер {item.wind.speed.toFixed(1)} м/с</span>
        <span className={styles.separator}>·</span>
        <span>Влажность {item.main.humidity}%</span>
      </div>
      <div className={styles.range}>
        Макс.: {Math.round(item.main.temp_max)}° Мин.: {Math.round(item.main.temp_min)}°
      </div>
    </div>
  );
}
