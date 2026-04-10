import { describe, it, expect, vi } from 'vitest';
import { mockForecast, mockAirPollution, mockGeocoding } from '../mocks/weatherMocks';

// Мокаем API модуль
vi.mock('../api/weatherApi', () => ({
  fetchForecast: vi.fn().mockResolvedValue(mockForecast),
  fetchAirPollution: vi.fn().mockResolvedValue(mockAirPollution),
  searchCity: vi.fn().mockResolvedValue(mockGeocoding),
}));

import { fetchForecast, fetchAirPollution, searchCity } from '../api/weatherApi';

describe('weatherApi (mocks)', () => {
  it('fetchForecast возвращает данные прогноза', async () => {
    const data = await fetchForecast(55.75, 37.62);
    expect(data.list).toHaveLength(mockForecast.list.length);
    expect(data.city.name).toBe(mockForecast.city.name);
  });

  it('fetchAirPollution возвращает данные о загрязнении', async () => {
    const data = await fetchAirPollution(55.75, 37.62);
    expect(data.list).toHaveLength(mockAirPollution.list.length);
    expect(data.list[0].main.aqi).toBe(2);
  });

  it('searchCity возвращает результаты геокодирования', async () => {
    const data = await searchCity('Москва');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe('Москва');
  });
});
