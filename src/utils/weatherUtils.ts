import { ForecastItem } from '../types/weather';

/** Получить первый элемент (текущий/ближайший) */
export function getCurrentWeather(list: ForecastItem[]): ForecastItem {
  return list[0];
}

/** Сгруппировать по дням */
export function groupByDay(list: ForecastItem[]): Map<string, ForecastItem[]> {
  const map = new Map<string, ForecastItem[]>();
  for (const item of list) {
    const dayKey = item.dt_txt.split(' ')[0]; // "2024-04-10"
    if (!map.has(dayKey)) map.set(dayKey, []);
    map.get(dayKey)!.push(item);
  }
  return map;
}

/** Формат дня недели */
export function formatDayName(dtTxt: string, short = true): string {
  const date = new Date(dtTxt + ' UTC');
  const today = new Date();
  const isToday =
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate();

  if (isToday) return 'Сегодня';

  return date.toLocaleDateString('ru-RU', {
    weekday: short ? 'short' : 'long',
  });
}

/** Формат часа */
export function formatHour(dtTxt: string): string {
  const date = new Date(dtTxt + ' UTC');
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Формат полной даты */
export function formatDate(dtTxt: string): string {
  const date = new Date(dtTxt + ' UTC');
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** Мин/макс температура за день */
export function getDayMinMax(items: ForecastItem[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    if (item.main.temp_min < min) min = item.main.temp_min;
    if (item.main.temp_max > max) max = item.main.temp_max;
  }
  return { min: Math.round(min), max: Math.round(max) };
}

/** Глобальный мин/макс за все дни (для шкалы) */
export function getGlobalMinMax(list: ForecastItem[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const item of list) {
    if (item.main.temp_min < min) min = item.main.temp_min;
    if (item.main.temp_max > max) max = item.main.temp_max;
  }
  return { min: Math.round(min), max: Math.round(max) };
}
