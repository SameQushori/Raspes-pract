/**
 * КОМПОНЕНТ БЫСТРЫХ КНОПОК
 */

import styles from './QuickButtons.module.css';

function QuickButtons({ onSelect, disabled, lastGroup }) {
  const staticButtons = [
    { label: '👨‍🏫 Преподаватели', command: 'список преподавателей' },
    { label: '📋 Группы',          command: 'список групп' },
    { label: '❓ Помощь',           command: 'помощь' },
  ];

  const buttons = [
    ...(lastGroup
      ? [{ label: `📅 ${lastGroup}`, command: `расписание группа ${lastGroup}` }]
      : []),
    ...staticButtons,
  ];

  return (
    <div className={styles.quickButtons}>
      <div className={styles.label}>Быстрые команды:</div>
      <div className={styles.buttons}>
        {buttons.map((btn, index) => (
          <button
            key={index}
            className={styles.button}
            onClick={() => onSelect(btn.command)}
            disabled={disabled}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickButtons;
