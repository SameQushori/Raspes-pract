/**
 * КОМПОНЕНТ ВЫБОРА ДНЯ
 * Позволяет выбрать день недели для просмотра расписания
 */

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './DaySelector.module.css';

function DaySelector({ onDaySelect, selectedDay }) {
  const [weekDays, setWeekDays] = useState([]);

  // Генерируем дни недели с понедельника по субботу
  useEffect(() => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 }); // Начало недели с понедельника

    const days = [];
    for (let i = 0; i < 6; i++) { // Пн-Сб (6 дней)
      const day = addDays(monday, i);
      days.push({
        date: day,
        dayName: format(day, 'EEEE', { locale: ru }), // Понедельник, Вторник...
        dayNameShort: format(day, 'EEE', { locale: ru }), // Пн, Вт...
        dateFormatted: format(day, 'd MMMM', { locale: ru }), // 16 февраля
        dateShort: format(day, 'd MMM', { locale: ru }), // 16 фев
        isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      });
    }

    setWeekDays(days);
  }, []);

  // Капитализация первой буквы
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className={styles.daySelector}>
      <div className={styles.label}>Выбери день:</div>
      <div className={styles.days}>
        {weekDays.map((day, index) => {
          const isSelected = selectedDay === capitalize(day.dayName);
          return (
            <button
              key={index}
              className={`${styles.dayButton} ${isSelected ? styles.selected : ''} ${day.isToday ? styles.today : ''}`}
              onClick={() => onDaySelect(capitalize(day.dayName), day.dateFormatted)}
            >
              <div className={styles.dayName}>{day.dayNameShort}</div>
              <div className={styles.date}>{day.dateShort}</div>
              {day.isToday && <div className={styles.todayBadge}>Сегодня</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DaySelector;
