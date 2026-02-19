/**
 * КОМПОНЕНТ КАРТОЧКИ ЗАНЯТИЯ
 * Отображает одно занятие с оценками нечёткой логики
 */

import styles from './ScheduleCard.module.css';

function ScheduleCard({ lesson }) {
  // Определяем цвет для типа занятия
  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'лекция':
        return 'var(--type-lecture)';
      case 'практика':
        return 'var(--type-practice)';
      case 'лабораторная':
        return 'var(--type-lab)';
      default:
        return 'var(--type-other)';
    }
  };

  return (
    <div className={styles.card}>
      {/* Верхняя часть: Время и тип */}
      <div className={styles.header}>
        <div className={styles.time}>{lesson.time}</div>
        <div
          className={styles.type}
          style={{ backgroundColor: getTypeColor(lesson.type) }}
        >
          {lesson.type}
        </div>
      </div>

      {/* Основная информация */}
      <div className={styles.body}>
        <h3 className={styles.subject}>{lesson.subject}</h3>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.icon}>👨‍🏫</span>
            <span>{lesson.teacher}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.icon}>📍</span>
            <span>{lesson.building}, ауд. {lesson.room}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ScheduleCard;
