/**
 * ПРИВЕТСТВЕННЫЙ ЭКРАН
 * Показывает подсказки для новых пользователей
 */

import styles from './WelcomeScreen.module.css';

function WelcomeScreen({ onCommand }) {
  const features = [
    {
      icon: '📅',
      title: 'Расписание группы',
      description: 'Открой список всех групп колледжа и нажми на свою — сразу покажет расписание на сегодня',
      example: 'список групп'
    },
    {
      icon: '👨‍🏫',
      title: 'Расписание преподавателя',
      description: 'Список всех преподавателей — нажми на любого чтобы увидеть его расписание',
      example: 'список преподавателей'
    },
    {
      icon: '🔗',
      title: 'Онлайн-занятия',
      description: 'В расписании дистанционные пары помечены бейджем «Онлайн» с кнопкой подключения к Zoom или MAX',
      example: 'список групп'
    },
    {
      icon: '❓',
      title: 'Все команды',
      description: 'Узнай полный список доступных команд и примеры запросов',
      example: 'помощь'
    }
  ];

  return (
    <div className={styles.welcome}>
      <div className={styles.header}>
        <h1 className={styles.title}>Добро пожаловать! 👋</h1>
        <p className={styles.subtitle}>
          Расписание УКРТБ — данные в реальном времени с сайта колледжа
        </p>
      </div>

      <div className={styles.features}>
        {features.map((feature, index) => (
          <button
            key={index}
            className={styles.feature}
            onClick={() => onCommand?.(feature.example)}
            title={`Нажми, чтобы спросить: «${feature.example}»`}
          >
            <div className={styles.featureIcon}>{feature.icon}</div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
              <code className={styles.featureExample}>{feature.example}</code>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.hint}>
        <p>💬 Просто напиши команду в свободной форме или используй быстрые кнопки ниже!</p>
      </div>
    </div>
  );
}

export default WelcomeScreen;
