/**
 * КОМПОНЕНТ АВТОДОПОЛНЕНИЯ
 * Принимает готовый список подсказок от родителя и отображает их
 */

import { useState, useEffect } from 'react';
import styles from './Autocomplete.module.css';

function Autocomplete({ suggestions = [], onSelect, isVisible }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Сбросить выбор при смене списка
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Навигация клавиатурой
  useEffect(() => {
    if (!isVisible || suggestions.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(suggestions[selectedIndex].command);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, isVisible, onSelect]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={styles.autocomplete}>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(suggestion.command); }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className={styles.icon}>{suggestion.icon}</span>
          <div className={styles.content}>
            <div className={styles.command}>{suggestion.command}</div>
            <div className={styles.description}>{suggestion.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Autocomplete;
