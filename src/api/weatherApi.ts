import { GeocodingResult, WeatherForecast, AirPollutionData } from '../types/weather';

const API_KEY = 'ed5c8465886fe949f21255a7426c7bed';
const BASE_URL = 'https://api.openweathermap.org';

// ============================================================
// Реальные API-запросы
// ============================================================

export async function fetchForecast(lat: number, lon: number): Promise<WeatherForecast> {
  const url = `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка прогноза: ${res.status}`);
  return res.json();
}

export async function fetchAirPollution(lat: number, lon: number): Promise<AirPollutionData> {
  const url = `${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка загрязнения: ${res.status}`);
  return res.json();
}

export async function searchCity(query: string): Promise<GeocodingResult[]> {
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка геокодирования: ${res.status}`);
  return res.json();
}

// ============================================================
// Моки (закомментированы — раскомментируйте для оффлайн-режима)
// ============================================================

/*
import { mockForecast, mockAirPollution, mockGeocoding } from '../mocks/weatherMocks';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchForecast(_lat: number, _lon: number): Promise<WeatherForecast> {
  await delay(300);
  return mockForecast as unknown as WeatherForecast;
}

export async function fetchAirPollution(_lat: number, _lon: number): Promise<AirPollutionData> {
  await delay(300);
  return mockAirPollution as unknown as AirPollutionData;
}

export async function searchCity(query: string): Promise<GeocodingResult[]> {
  await delay(300);
  const filtered = mockGeocoding.filter(
    (city) =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(city.name.toLowerCase())
  );
  return filtered.length > 0 ? filtered : mockGeocoding;
}
*/
