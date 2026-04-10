import { AirPollutionItem, AQI_LABELS } from '../types/weather';
import styles from './AirQualityCard.module.css';

interface AirQualityCardProps {
  item: AirPollutionItem;
}

export function AirQualityCard({ item }: AirQualityCardProps) {
  const aqi = item.main.aqi;
  const info = AQI_LABELS[aqi] || { label: 'Неизвестно', color: '#999' };

  return (
    <div className={styles.container}>
      <div className={styles.label}>Качество воздуха</div>
      <div className={styles.content}>
        <div className={styles.aqiSection}>
          <div className={styles.aqiCircle} style={{ background: info.color }}>
            {aqi}
          </div>
          <div className={styles.aqiLabel} style={{ color: info.color }}>
            {info.label}
          </div>
        </div>
        <div className={styles.components}>
          <div className={styles.comp}>
            <span className={styles.compName}>PM2.5</span>
            <span className={styles.compValue}>{item.components.pm2_5.toFixed(1)}</span>
          </div>
          <div className={styles.comp}>
            <span className={styles.compName}>PM10</span>
            <span className={styles.compValue}>{item.components.pm10.toFixed(1)}</span>
          </div>
          <div className={styles.comp}>
            <span className={styles.compName}>O₃</span>
            <span className={styles.compValue}>{item.components.o3.toFixed(1)}</span>
          </div>
          <div className={styles.comp}>
            <span className={styles.compName}>NO₂</span>
            <span className={styles.compValue}>{item.components.no2.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
