export interface WeatherForecast {
  list: ForecastItem[];
  city: City;
}

export interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: WeatherCondition[];
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  pop: number;
  rain?: {
    '3h': number;
  };
  snow?: {
    '3h': number;
  };
  sys: {
    pod: 'd' | 'n';
  };
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface City {
  id: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  country: string;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface AirPollutionData {
  list: AirPollutionItem[];
}

export interface AirPollutionItem {
  dt: number;
  main: {
    aqi: 1 | 2 | 3 | 4 | 5;
  };
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
}

export const AQI_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Хорошее', color: '#4caf50' },
  2: { label: 'Удовлетворительное', color: '#8bc34a' },
  3: { label: 'Умеренное', color: '#ffeb3b' },
  4: { label: 'Плохое', color: '#ff9800' },
  5: { label: 'Очень плохое', color: '#f44336' },
};
