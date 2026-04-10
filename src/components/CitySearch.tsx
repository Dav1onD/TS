import { useState, useRef, useEffect, useCallback } from 'react';
import { GeocodingResult } from '../types/weather';
import { searchCity } from '../api/weatherApi';
import styles from './CitySearch.module.css';

interface CitySearchProps {
  onSelect: (city: GeocodingResult) => void;
}

export function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchCity(query);
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 500);
  }, [query]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShowResults(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (city: GeocodingResult) => {
    setQuery(`${city.name}, ${city.country}`);
    setShowResults(false);
    onSelect(city);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        placeholder="Введите город..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
      />
      {showResults && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((city, i) => (
            <li
              key={`${city.lat}-${city.lon}-${i}`}
              onClick={() => handleSelect(city)}
            >
              {city.name}, {city.country}
              {city.state ? `, ${city.state}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
