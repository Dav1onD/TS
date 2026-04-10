import { ForecastItem } from '../types/weather';
import { formatHour } from '../utils/weatherUtils';
import styles from './HourlyForecast.module.css';

interface HourlyForecastProps {
  items: ForecastItem[];
}

export function HourlyForecast({ items }: HourlyForecastProps) {
  return (
    <div className={styles.container}>
      <div className={styles.label}>Прогноз на 24 часа</div>
      <div className={styles.scroll}>
        {items.map((item) => {
          const weather = item.weather[0];
          const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
          return (
            <div key={item.dt} className={styles.hourItem}>
              <div className={styles.hour}>{formatHour(item.dt_txt)}</div>
              <img src={iconUrl} alt={weather.description} className={styles.hourIcon} />
              <div className={styles.hourTemp}>{Math.round(item.main.temp)}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
