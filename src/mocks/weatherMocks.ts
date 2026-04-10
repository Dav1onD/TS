export const mockForecast = {
  cod: '200',
  message: 0,
  cnt: 8,
  list: [
    {
      dt: 1712764800,
      dt_txt: '2024-04-10 12:00:00',
      main: {
        temp: 15.5,
        feels_like: 14.8,
        temp_min: 14.2,
        temp_max: 15.5,
        pressure: 1015,
        humidity: 65,
      },
      weather: [
        { id: 800, main: 'Clear', description: 'ясное небо', icon: '01d' },
      ],
      wind: { speed: 3.5, deg: 180, gust: 5.2 },
      clouds: { all: 5 },
      pop: 0,
      sys: { pod: 'd' as const },
    },
    {
      dt: 1712775600,
      dt_txt: '2024-04-10 15:00:00',
      main: {
        temp: 13.2,
        feels_like: 12.5,
        temp_min: 12.0,
        temp_max: 13.2,
        pressure: 1016,
        humidity: 72,
      },
      weather: [
        { id: 802, main: 'Clouds', description: 'облачно', icon: '03n' },
      ],
      wind: { speed: 2.8, deg: 190 },
      clouds: { all: 40 },
      pop: 0.1,
      sys: { pod: 'n' as const },
    },
    {
      dt: 1712786400,
      dt_txt: '2024-04-10 18:00:00',
      main: {
        temp: 10.8,
        feels_like: 10.1,
        temp_min: 10.0,
        temp_max: 10.8,
        pressure: 1017,
        humidity: 80,
      },
      weather: [
        { id: 500, main: 'Rain', description: 'небольшой дождь', icon: '10n' },
      ],
      wind: { speed: 4.1, deg: 200, gust: 7.3 },
      clouds: { all: 75 },
      pop: 0.6,
      rain: { '3h': 1.2 },
      sys: { pod: 'n' as const },
    },
  ],
  city: {
    id: 524901,
    name: 'Москва',
    coord: { lat: 55.7522, lon: 37.6156 },
    country: 'RU',
    timezone: 10800,
    sunrise: 1712720400,
    sunset: 1712770800,
  },
};

export const mockAirPollution = {
  coord: [55.7522, 37.6156],
  list: [
    {
      dt: 1712764800,
      main: { aqi: 2 as const },
      components: {
        co: 250.5,
        no: 0.5,
        no2: 18.2,
        o3: 65.3,
        so2: 5.1,
        pm2_5: 12.4,
        pm10: 18.7,
        nh3: 1.2,
      },
    },
  ],
};

export const mockGeocoding = [
  {
    name: 'Москва',
    lat: 55.7522,
    lon: 37.6156,
    country: 'RU',
  },
  {
    name: 'London',
    lat: 51.5074,
    lon: -0.1278,
    country: 'GB',
  },
  {
    name: 'New York',
    lat: 40.7128,
    lon: -74.006,
    country: 'US',
  },
  {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    country: 'JP',
  },
  {
    name: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    country: 'FR',
  },
];
