import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AirQuality } from '../components/AirQuality';
import { mockAirPollution } from '../mocks/weatherMocks';

describe('AirQuality', () => {
  it('отображает индекс AQI и label', () => {
    const item = mockAirPollution.list[0];
    render(<AirQuality item={item} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Удовлетворительное')).toBeInTheDocument();
  });

  it('отображает компоненты загрязнения', () => {
    const item = mockAirPollution.list[0];
    render(<AirQuality item={item} />);

    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(screen.getByText('PM10')).toBeInTheDocument();
    expect(screen.getByText('O₃')).toBeInTheDocument();
    expect(screen.getByText('NO₂')).toBeInTheDocument();
    expect(screen.getByText('12.4')).toBeInTheDocument();
  });
});
