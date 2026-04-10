import { AirPollutionItem, AQI_LABELS } from '../types/weather';
import styles from './AirQuality.module.css';

interface AirQualityProps {
  item: AirPollutionItem;
}

export function AirQuality({ item }: AirQualityProps) {
  const aqi = item.main.aqi;
  const info = AQI_LABELS[aqi] || { label: 'Неизвестно', color: '#999' };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Качество воздуха</h3>
      <div className={styles.aqiCircle} style={{ background: info.color }}>
        <span className={styles.aqiValue}>{aqi}</span>
      </div>
      <div className={styles.label} style={{ color: info.color }}>
        {info.label}
      </div>
      <div className={styles.components}>
        <div className={styles.component}>
          <span className={styles.compName}>PM2.5</span>
          <span className={styles.compValue}>{item.components.pm2_5.toFixed(1)}</span>
        </div>
        <div className={styles.component}>
          <span className={styles.compName}>PM10</span>
          <span className={styles.compValue}>{item.components.pm10.toFixed(1)}</span>
        </div>
        <div className={styles.component}>
          <span className={styles.compName}>O₃</span>
          <span className={styles.compValue}>{item.components.o3.toFixed(1)}</span>
        </div>
        <div className={styles.component}>
          <span className={styles.compName}>NO₂</span>
          <span className={styles.compValue}>{item.components.no2.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
