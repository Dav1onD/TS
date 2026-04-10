import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentWeather } from '../components/CurrentWeather';
import { mockForecast } from '../mocks/weatherMocks';

describe('CurrentWeather', () => {
  it('отображает город, температуру и описание', () => {
    const item = mockForecast.list[0];
    render(<CurrentWeather item={item} cityName="Москва" />);

    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('16°')).toBeInTheDocument();
    expect(screen.getByText('ясное небо')).toBeInTheDocument();
  });

  it('отображает детали погоды', () => {
    const item = mockForecast.list[0];
    render(<CurrentWeather item={item} cityName="Москва" />);

    expect(screen.getByText(/Ощущается как 15°/)).toBeInTheDocument();
    expect(screen.getByText(/Ветер 3.5 м\/с/)).toBeInTheDocument();
    expect(screen.getByText(/Влажность 65%/)).toBeInTheDocument();
  });
});
