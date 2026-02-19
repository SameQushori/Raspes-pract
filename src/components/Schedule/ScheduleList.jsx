/**
 * КОМПОНЕНТ СПИСКА ЗАНЯТИЙ
 * Отображает расписание на день или всю неделю
 */

import { useState } from 'react';
import ScheduleCard from './ScheduleCard';
import DaySelector from './DaySelector';
import styles from './ScheduleList.module.css';

function ScheduleList({ schedule, groupName, dayName }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDaySelect = (day, date) => {
    setSelectedDay(day);
    setSelectedDate(date);
  };

  const handleShowAll = () => {
    setSelectedDay(null);
    setSelectedDate(null);
  };
  // Если расписание на один день
  if (dayName && schedule.lessons) {
    return (
      <div className={styles.scheduleList}>
        <div className={styles.dayHeader}>
          <h3 className={styles.dayTitle}>{dayName}</h3>
          {schedule.workloadEvaluation && (
            <div className={styles.workload}>
              <span>{schedule.workloadEvaluation.label}</span>
              <span className={styles.workloadScore}>
                {schedule.workloadEvaluation.score}/10
              </span>
            </div>
          )}
        </div>
        {schedule.lessons.length > 0 ? (
          schedule.lessons.map(lesson => (
            <ScheduleCard key={lesson.id} lesson={lesson} />
          ))
        ) : (
          <div className={styles.noLessons}>Занятий нет</div>
        )}
      </div>
    );
  }

  // Если расписание на всю неделю
  // Фильтруем по выбранному дню или показываем всё
  const displaySchedule = selectedDay
    ? schedule.filter(day => day.day === selectedDay)
    : schedule;

  return (
    <div className={styles.scheduleList}>
      <div className={styles.weekHeader}>
        <h2 className={styles.groupTitle}>Расписание {groupName}</h2>
      </div>

      {/* Выбор дня */}
      <DaySelector onDaySelect={handleDaySelect} selectedDay={selectedDay} />

      {/* Кнопка "Показать всю неделю" */}
      {selectedDay && (
        <div className={styles.showAllButton}>
          <button onClick={handleShowAll} className={styles.button}>
            📅 Показать всю неделю
          </button>
        </div>
      )}

      {/* Расписание */}
      {displaySchedule.map((day, index) => (
        <div key={index} className={styles.daySection}>
          <div className={styles.dayHeader}>
            <h3 className={styles.dayTitle}>
              {day.day}
              {selectedDate && selectedDay === day.day && (
                <span className={styles.dateInfo}> • {selectedDate}</span>
              )}
            </h3>
            {day.workloadEvaluation && (
              <div className={styles.workload}>
                <span>{day.workloadEvaluation.label}</span>
                <span className={styles.workloadScore}>
                  {day.workloadEvaluation.score}/10
                </span>
              </div>
            )}
          </div>
          {day.lessons.length > 0 ? (
            day.lessons.map(lesson => (
              <ScheduleCard key={lesson.id} lesson={lesson} />
            ))
          ) : (
            <div className={styles.noLessons}>Занятий нет</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ScheduleList;
