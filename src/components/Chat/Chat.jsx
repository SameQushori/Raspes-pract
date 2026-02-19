/**
 * ГЛАВНЫЙ КОМПОНЕНТ ЧАТА
 * Управляет состоянием чата и обрабатывает команды
 */

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import commandParser from '../../services/commandParser';
import scheduleService from '../../services/scheduleService';
import { scheduleService as apiService } from '../../services/scheduleApi';
import ScheduleList from '../Schedule/ScheduleList';
import QuickButtons from './QuickButtons';
import Autocomplete from './Autocomplete';
import WelcomeScreen from './WelcomeScreen';
import styles from './Chat.module.css';

// ── Вспомогательная функция: извлечь массив из любого ответа API ──────────────
function toArray(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  // Ищем массив в известных ключах, потом в любом ключе
  for (const key of ['data', 'items', 'groups', 'teachers', 'cabs', 'list']) {
    if (Array.isArray(response[key])) return response[key];
  }
  for (const val of Object.values(response)) {
    if (Array.isArray(val)) return val;
  }
  return [];
}

// ── Адаптер для преобразования ответа API в массив пар ────────────────────────
// Структура ответа: { success, schedules: [...], ... }
// Каждая пара: { number, type, time:{start,end}, discipline:{name}, teacher:{name}, cab:{cab,name} }

function adaptApiLessons(rawData) {
  if (!rawData) return [];
  // Прямой массив пар
  if (Array.isArray(rawData)) return rawData;
  // Основной ключ от API колледжа
  if (Array.isArray(rawData.schedules)) return rawData.schedules;
  // Запасные варианты на случай изменения API
  for (const key of ['lessons', 'pairs', 'schedule', 'timetable', 'items', 'data']) {
    if (Array.isArray(rawData[key])) return rawData[key];
  }
  return [];
}

// Нормализуем пару к единому виду по реальной структуре API
function normalizeLesson(lesson) {
  // Время: объект {start, end} или строки
  const timeObj = lesson.time;
  const time = typeof timeObj === 'object' && timeObj
    ? `${timeObj.start} – ${timeObj.end}`
    : (lesson.time_start && lesson.time_end
        ? `${lesson.time_start} – ${lesson.time_end}`
        : String(timeObj || ''));

  // Предмет: объект {name} или строка
  const discObj = lesson.discipline;
  const subject = typeof discObj === 'object' && discObj
    ? discObj.name
    : (discObj || lesson.subject || lesson.name || lesson.pair || '');

  // Преподаватель: объект {name, link} или строка
  const teachObj = lesson.teacher;
  const teacher = typeof teachObj === 'object' && teachObj
    ? teachObj.name
    : (teachObj || lesson.teacher_name || '');
  const link = typeof teachObj === 'object' && teachObj ? (teachObj.link || '') : '';

  // Кабинет: объект {cab, name} — берём короткое название
  const cabObj = lesson.cab;
  const room = typeof cabObj === 'object' && cabObj
    ? (cabObj.cab && cabObj.cab.trim() ? cabObj.cab : cabObj.name || '')
    : (lesson.room || lesson.cabinet || String(cabObj || ''));

  // Тип пары (Лекции, Практика и т.д.)
  const type = lesson.type || lesson.pair_type || '';

  // Номер пары
  const number = lesson.number != null ? lesson.number : null;

  // Группа (полезна в расписании преподавателя)
  const groupObj = lesson.group;
  const group = typeof groupObj === 'object' && groupObj
    ? (groupObj.name || '')
    : (groupObj || '');

  // Онлайн: только явный флаг do=true от API
  const isOnline = lesson.do === true;
  // Ссылка для подключения — только если это реально конференц-ссылка
  const meetingLink = link && /zoom\.us|meet\.|teams\.|bigbluebutton|conf\.|maks|MAX/i.test(link) ? link : '';

  return { time, subject, teacher, room, type, number, group, link: meetingLink, isOnline };
}

const WEEK_DAY_NAMES = {
  0: 'Воскресенье',
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
};

// ── Недельное расписание из реального API ─────────────────────────────────────
function ApiWeekScheduleView({ data }) {
  const { group, weekData, scheduleType = 'groups' } = data;
  const isTeacher = scheduleType === 'teachers';

  const dates = Object.keys(weekData).sort();
  // По умолчанию — сегодня (если есть в неделе), иначе первый день
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDate = dates.includes(todayStr) ? todayStr : (dates[0] ?? null);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const displayDates = selectedDate ? [selectedDate] : dates;

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <strong>{isTeacher ? '👨‍🏫' : '📅'} {group.label}</strong>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          🟢 данные с сайта колледжа
        </span>
      </div>

      {/* Выбор дня */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          onClick={() => setSelectedDate(null)}
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: !selectedDate ? 'var(--primary)' : 'var(--surface)',
            color: !selectedDate ? '#fff' : 'var(--text-primary)',
          }}
        >
          Вся неделя
        </button>

        {dates.map(date => {
          const d = new Date(date + 'T00:00:00');
          const dayName = WEEK_DAY_NAMES[d.getDay()];
          const lessons = adaptApiLessons(weekData[date].data);
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(isSelected ? null : date)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                opacity: weekData[date].error ? 0.5 : 1,
              }}
            >
              {dayName?.slice(0, 2)}&nbsp;{d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
              {lessons.length > 0 && (
                <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>{lessons.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Расписание */}
      {displayDates.map(date => {
        const d = new Date(date + 'T00:00:00');
        const dayName = WEEK_DAY_NAMES[d.getDay()];
        const entry = weekData[date];
        const lessons = adaptApiLessons(entry.data);
        const normalizedForDay = lessons.map(normalizeLesson);

        return (
          <div key={date} style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              {dayName} &bull;{' '}
              {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>

            {entry.error ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px' }}>
                ⚠️ {entry.error}
              </div>
            ) : lessons.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '6px' }}>
                — Нет занятий
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {normalizedForDay.map((lesson, i) => {
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        background: lesson.isOnline ? 'var(--surface)' : 'var(--surface)',
                        borderRadius: '8px',
                        border: `1px solid ${lesson.isOnline ? 'var(--primary)' : 'var(--border)'}`,
                        fontSize: '14px',
                      }}
                    >
                      {/* Шапка: время + бейдж онлайн */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        {lesson.time && (
                          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                            {lesson.number != null ? `${lesson.number} пара · ` : ''}⏱ {lesson.time}
                          </div>
                        )}
                        {lesson.isOnline && (
                          <span style={{
                            fontSize: '11px', fontWeight: '600',
                            padding: '2px 7px', borderRadius: '10px',
                            background: 'var(--primary)', color: '#fff',
                            whiteSpace: 'nowrap',
                          }}>
                            🌐 Онлайн
                          </span>
                        )}
                      </div>

                      {/* Предмет */}
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {lesson.subject || '—'}
                      </div>

                      {/* Для группы — преподаватель; для препода — группа */}
                      {isTeacher ? (
                        lesson.group && (
                          <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            👥 {lesson.group}
                          </div>
                        )
                      ) : (
                        lesson.teacher && (
                          <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            👨‍🏫 {lesson.teacher}
                          </div>
                        )
                      )}

                      {/* Аудитория (только если не онлайн) */}
                      {lesson.room && lesson.room !== ' - ' && !lesson.isOnline && (
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>
                          🚪 Ауд. {lesson.room}
                        </div>
                      )}

                      {/* Тип пары */}
                      {lesson.type && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: lesson.isOnline && lesson.link ? '6px' : '0' }}>
                          {lesson.type}
                        </div>
                      )}

                      {/* Кнопка подключения — только для онлайн-занятий со ссылкой */}
                      {lesson.isOnline && lesson.link && (
                        <a
                          href={lesson.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            marginTop: '6px', padding: '5px 12px',
                            background: 'var(--primary)', color: '#fff',
                            borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                            textDecoration: 'none',
                          }}
                        >
                          🔗 Подключиться
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Главный компонент ──────────────────────────────────────────────────────────
function Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chat-messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ id: uuidv4(), type: 'bot', contentType: 'welcome', timestamp: Date.now() }];
  });
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('chat-theme') || 'light');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [lastGroup, setLastGroup] = useState(() => localStorage.getItem('chat-last-group') || null);
  const [allGroups, setAllGroups] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Инициализация API колледжа
  useEffect(() => {
    apiService
      .init()
      .then(() => setApiReady(true))
      .catch(e => console.warn('[API] Недоступен, используются локальные данные:', e.message));
  }, []);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Применить тему к документу + сохранить в localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chat-theme', theme);
  }, [theme]);

  // Сохранить историю чата (последние 50 сообщений)
  useEffect(() => {
    try {
      localStorage.setItem('chat-messages', JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // Сохранить последнюю группу
  useEffect(() => {
    if (lastGroup) localStorage.setItem('chat-last-group', lastGroup);
  }, [lastGroup]);

  // Загрузить список групп и преподавателей после инициализации API
  useEffect(() => {
    if (!apiReady) return;
    apiService.getGroups().then(r => setAllGroups(toArray(r))).catch(() => {});
    apiService.getTeachers().then(r => setAllTeachers(toArray(r))).catch(() => {});
  }, [apiReady]);

  // Вычислять подсказки автокомплита при изменении ввода
  useEffect(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q || q.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    const results = [];

    // Статические команды
    const staticCmds = [
      { command: 'список групп',          description: 'Все группы колледжа',     icon: '📋' },
      { command: 'список преподавателей', description: 'Все преподаватели',        icon: '👥' },
      { command: 'помощь',                description: 'Список доступных команд', icon: '❓' },
    ];
    for (const cmd of staticCmds) {
      if (cmd.command.includes(q)) results.push(cmd);
    }

    // Группы из API
    for (const g of allGroups) {
      if (results.length >= 5) break;
      if (g.label.toLowerCase().includes(q)) {
        results.push({ command: `расписание группа ${g.label}`, description: 'Расписание группы', icon: '📅' });
      }
    }

    // Преподаватели из API
    for (const t of allTeachers) {
      if (results.length >= 5) break;
      if (t.label.toLowerCase().includes(q)) {
        results.push({ command: `расписание преподаватель ${t.label}`, description: 'Расписание преподавателя', icon: '👨‍🏫' });
      }
    }

    setAutocompleteSuggestions(results.slice(0, 5));
  }, [inputValue, allGroups, allTeachers]);

  // Автофокус на поле ввода
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Отправка сообщения ──────────────────────────────────────────────────────
  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isProcessing) return;

    const userMessage = {
      id: uuidv4(),
      type: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const command = commandParser.parse(text);
    const botResponse = await handleCommand(command);

    setMessages(prev => [...prev, botResponse]);
    setIsProcessing(false);
  };

  // ── Обработчик команд ───────────────────────────────────────────────────────
  const handleCommand = async (command) => {
    try {
      switch (command.type) {
        case 'GREETING':
          return createTextMessage('Привет! Чем могу помочь? Напиши "помощь" для списка команд.');

        case 'HELP':
          return createHelpMessage();

        case 'GROUP_SCHEDULE': {
          // Пробуем реальный API
          if (apiReady) {
            try {
              // findGroup внутри тоже вызывает getGroups — делаем поиск сами через toArray
              const allGroups = toArray(await apiService.getGroups());
              const q = command.groupName.toLowerCase();
              const group = allGroups.find(g => g.label.toLowerCase().includes(q));
              if (group) {
                const weekData = await apiService.getWeekSchedule(group);
                setLastGroup(group.label); // запоминаем для быстрой кнопки
                return {
                  id: uuidv4(),
                  type: 'bot',
                  contentType: 'api-week-schedule',
                  data: { group, weekData },
                  timestamp: Date.now(),
                };
              }
            } catch (e) {
              console.warn('[API] getWeekSchedule failed, fallback:', e.message);
            }
          }
          // Фолбэк на локальные данные
          const schedule = scheduleService.getGroupSchedule(command.groupName);
          if (schedule) {
            return {
              id: uuidv4(),
              type: 'bot',
              contentType: 'schedule',
              data: schedule,
              timestamp: Date.now(),
            };
          }
          return createErrorMessage(`Группа "${command.groupName}" не найдена`);
        }

        case 'TEACHER_SCHEDULE': {
          // Пробуем реальный API
          if (apiReady) {
            try {
              const allTeachers = toArray(await apiService.getTeachers());
              const q = command.teacherName.toLowerCase();
              const teacher = allTeachers.find(t => t.label.toLowerCase().includes(q));
              if (teacher) {
                const weekData = await apiService.getWeekSchedule(teacher, new Date(), 'teachers');
                return {
                  id: uuidv4(),
                  type: 'bot',
                  contentType: 'api-week-schedule',
                  data: { group: teacher, weekData, scheduleType: 'teachers' },
                  timestamp: Date.now(),
                };
              }
            } catch (e) {
              console.warn('[API] teacher schedule failed, fallback:', e.message);
            }
          }
          // Фолбэк на локальные данные
          const schedule = scheduleService.getTeacherSchedule(command.teacherName);
          if (schedule) {
            return {
              id: uuidv4(),
              type: 'bot',
              contentType: 'teacher-schedule',
              data: schedule,
              timestamp: Date.now(),
            };
          }
          return createErrorMessage(`Преподаватель "${command.teacherName}" не найден`);
        }

        case 'DAY_SCHEDULE': {
          const daySchedule = scheduleService.getScheduleForDay(command.groupName, command.dayName);
          if (daySchedule) {
            return {
              id: uuidv4(),
              type: 'bot',
              contentType: 'day-schedule',
              data: { groupName: command.groupName, day: daySchedule },
              timestamp: Date.now(),
            };
          }
          return createErrorMessage(
            `Расписание для группы "${command.groupName}" на ${command.dayName} не найдено`
          );
        }

        case 'TEACHER_FREE_SLOTS': {
          const freeSlots = scheduleService.findTeacherFreeSlots(
            command.teacherName,
            command.dayName || 'Понедельник'
          );
          if (freeSlots) {
            return {
              id: uuidv4(),
              type: 'bot',
              contentType: 'free-slots',
              data: freeSlots,
              timestamp: Date.now(),
            };
          }
          return createErrorMessage(`Информация о преподавателе "${command.teacherName}" не найдена`);
        }

        case 'LIST_GROUPS': {
          // Пробуем реальный API
          if (apiReady) {
            try {
              const groups = toArray(await apiService.getGroups());
              return {
                id: uuidv4(),
                type: 'bot',
                contentType: 'api-groups-list',
                data: groups,
                timestamp: Date.now(),
              };
            } catch (e) {
              console.warn('[API] getGroups failed, fallback:', e.message);
            }
          }
          const groups = scheduleService.getAllGroups();
          return {
            id: uuidv4(),
            type: 'bot',
            contentType: 'groups-list',
            data: groups,
            timestamp: Date.now(),
          };
        }

        case 'LIST_TEACHERS': {
          // Пробуем реальный API
          if (apiReady) {
            try {
              const teachers = toArray(await apiService.getTeachers());
              return {
                id: uuidv4(),
                type: 'bot',
                contentType: 'api-teachers-list',
                data: teachers,
                timestamp: Date.now(),
              };
            } catch (e) {
              console.warn('[API] getTeachers failed, fallback:', e.message);
            }
          }
          const teachers = scheduleService.getAllTeachers();
          return {
            id: uuidv4(),
            type: 'bot',
            contentType: 'teachers-list',
            data: teachers,
            timestamp: Date.now(),
          };
        }

        case 'UNKNOWN':
        default:
          return createErrorMessage('Команда не распознана. Напиши "помощь" для списка команд.');
      }
    } catch (error) {
      console.error('Error handling command:', error);
      return createErrorMessage('Произошла ошибка при обработке команды');
    }
  };

  // ── Вспомогательные функции ─────────────────────────────────────────────────
  const createTextMessage = (text) => ({
    id: uuidv4(),
    type: 'bot',
    text,
    timestamp: Date.now(),
  });

  const createErrorMessage = (text) => ({
    id: uuidv4(),
    type: 'bot',
    contentType: 'error',
    text,
    timestamp: Date.now(),
  });

  const createHelpMessage = () => {
    const groupExample = lastGroup || '9ИСП-1-25';
    const helpText = `Доступные команды:

📅 "расписание группа ${groupExample}"
   → расписание на неделю, открывается на сегодняшнем дне

📋 "список групп"
   → все группы колледжа (кликни на любую — сразу откроется расписание)

👥 "список преподавателей"
   → список преподавателей (тоже кликабельный)

👨‍🏫 "расписание преподаватель Иванова"
   → расписание конкретного преподавателя

🕐 "когда свободен Петров в четверг"
   → свободные окна для консультаций

Данные с сайта study.ukrtb.ru обновляются в реальном времени.`;
    return createTextMessage(helpText);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleCommandSelect = (command) => {
    setInputValue(command);
    setShowAutocomplete(false);
    handleSend(command);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowAutocomplete(value.trim().length > 0);
  };

  // ── Рендер расширенного контента ────────────────────────────────────────────
  // Определён внутри Chat, чтобы иметь доступ к handleCommandSelect
  const renderRichContent = (message) => {
    switch (message.contentType) {
      case 'welcome':
        return <WelcomeScreen onCommand={handleCommandSelect} />;

      case 'error':
        return <div className="error-message">❌ {message.text}</div>;

      case 'schedule':
        return (
          <ScheduleList
            schedule={message.data.schedule}
            groupName={message.data.name}
          />
        );

      case 'day-schedule':
        return (
          <ScheduleList
            schedule={message.data.day}
            groupName={message.data.groupName}
            dayName={message.data.day.day}
          />
        );

      case 'teacher-schedule':
        return (
          <div>
            <h3>👨‍🏫 {message.data.name}</h3>
            <p><strong>Кафедра:</strong> {message.data.department}</p>
            <p><strong>Предметы:</strong> {message.data.subjects.join(', ')}</p>
            <p><strong>Консультации:</strong> {message.data.consultationTime}</p>
            {message.data.availabilityEvaluation && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'var(--surface-hover)',
                  borderRadius: '8px',
                }}
              >
                <strong>{message.data.availabilityEvaluation.label}</strong>
                <p style={{ marginTop: '4px', fontSize: '14px' }}>
                  {message.data.availabilityEvaluation.recommendation}
                </p>
              </div>
            )}
            <ScheduleList
              schedule={message.data.schedule}
              groupName={message.data.shortName}
            />
          </div>
        );

      case 'free-slots':
        return (
          <div>
            <h3>🕐 Свободные окна: {message.data.teacher}</h3>
            <p><strong>День:</strong> {message.data.day}</p>
            {message.data.freeSlots && message.data.freeSlots.length > 0 ? (
              <ul>
                {message.data.freeSlots.map((slot, index) => (
                  <li key={index}>
                    {slot.start} – {slot.end} ({Math.round(slot.duration)} мин)
                  </li>
                ))}
              </ul>
            ) : (
              <p>{message.data.message || 'Нет свободных окон'}</p>
            )}
          </div>
        );

      case 'groups-list':
        return (
          <div>
            <strong>📋 Список групп:</strong>
            <ul>
              {message.data.map(g => (
                <li key={g.id}>
                  <strong>{g.name}</strong> – {g.specialty} ({g.course} курс)
                </li>
              ))}
            </ul>
          </div>
        );

      case 'teachers-list':
        return (
          <div>
            <strong>👥 Список преподавателей:</strong>
            <ul>
              {message.data.map(t => (
                <li key={t.id}>
                  <strong>{t.shortName}</strong> – {t.department}
                  <br />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Предметы: {t.subjects.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );

      // ── Данные с реального API ────────────────────────────────────────────────

      case 'api-groups-list':
        return (
          <div>
            <p style={{ marginBottom: '8px' }}>
              <strong>📋 Список групп</strong>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                🟢 с сайта колледжа
              </span>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {message.data.map(g => (
                <li
                  key={g.value}
                  onClick={() => handleCommandSelect(`расписание группа ${g.label}`)}
                  style={{
                    padding: '7px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  📚 {g.label}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'api-teachers-list':
        return (
          <div>
            <p style={{ marginBottom: '8px' }}>
              <strong>👥 Список преподавателей</strong>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                🟢 с сайта колледжа
              </span>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {message.data.map(t => (
                <li
                  key={t.value}
                  onClick={() => handleCommandSelect(`расписание преподаватель ${t.label}`)}
                  style={{
                    padding: '7px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  👨‍🏫 {t.label}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'api-week-schedule':
        return <ApiWeekScheduleView data={message.data} />;

      default:
        return <div>Контент типа {message.contentType}</div>;
    }
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.chat}>
      {/* Шапка */}
      <header className={styles.header}>
        <h1 className={styles.title}>Расписание Колледжа</h1>
        <div className={styles.headerRight}>
          <span
            className={styles.apiStatus}
            title={
              apiReady
                ? 'Подключено к API сайта колледжа'
                : 'API недоступен — используются локальные данные'
            }
          >
            {apiReady ? '🟢 API' : '🔴 Локально'}
          </span>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            title="Сменить тему"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Список сообщений */}
      <div className={styles.messagesContainer}>
        {messages.map(message => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.type]}`}
          >
            {message.contentType ? (
              <div className={styles.richContent}>{renderRichContent(message)}</div>
            ) : (
              <div className={styles.messageText}>{message.text}</div>
            )}
            <div className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.typing}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <Autocomplete
            suggestions={autocompleteSuggestions}
            onSelect={handleCommandSelect}
            isVisible={showAutocomplete && !isProcessing}
          />
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Напиши команду..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showAutocomplete) handleSend();
            }}
            onFocus={() => setShowAutocomplete(inputValue.trim().length > 0)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            disabled={isProcessing}
          />
          <button
            className={styles.sendButton}
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isProcessing}
          >
            ➤
          </button>
        </div>

        <QuickButtons onSelect={handleCommandSelect} disabled={isProcessing} lastGroup={lastGroup} />
      </div>
    </div>
  );
}

export default Chat;
