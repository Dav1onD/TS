import { ForecastItem } from '../types/weather';
import {
  groupByDay,
  formatDayName,
  getDayMinMax,
  getGlobalMinMax,
} from '../utils/weatherUtils';
import styles from './DailyForecast.module.css';

interface DailyForecastProps {
  list: ForecastItem[];
}

export function DailyForecast({ list }: DailyForecastProps) {
  const days = groupByDay(list);
  const global = getGlobalMinMax(list);
  const range = global.max - global.min || 1;

  return (
    <div className={styles.container}>
      <div className={styles.label}>Прогноз на 5 дней</div>
      {Array.from(days.entries()).map(([dayKey, items], index) => {
        const { min, max } = getDayMinMax(items);
        const weather = items[0].weather[0];
        const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
        const leftPct = ((min - global.min) / range) * 100;
        const widthPct = ((max - min) / range) * 100;

        return (
          <div key={dayKey} className={styles.dayRow}>
            <div className={styles.dayName}>
              {index === 0 ? 'Сегодня' : formatDayName(items[0].dt_txt)}
            </div>
            <img src={iconUrl} alt={weather.description} className={styles.dayIcon} />
            <div className={styles.dayTemp}>{min}°</div>
            <div className={styles.barContainer}>
              <div
                className={styles.bar}
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 8)}%`,
                }}
              />
            </div>
            <div className={styles.dayTempMax}>{max}°</div>
          </div>
        );
      })}
    </div>
  );
}
