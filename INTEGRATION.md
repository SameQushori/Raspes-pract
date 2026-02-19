# 🔧 Быстрая интеграция в Vite проект

## Шаг 1: Установка зависимостей

```bash
cd ваш-vite-проект
npm install react-router-dom date-fns uuid
```

## Шаг 2: Копирование готовых модулей

### Вариант А: Вручную
1. Скопируйте папку `services/` в `src/`
2. Скопируйте папку `data/` в `src/`

### Вариант Б: Через команду (Linux/Mac)
```bash
cp -r путь/к/schedule-chatbot/src/services ./src/
cp -r путь/к/schedule-chatbot/src/data ./src/
```

### Вариант В: Через команду (Windows)
```cmd
xcopy путь\к\schedule-chatbot\src\services .\src\services /E /I
xcopy путь\к\schedule-chatbot\src\data .\src\data /E /I
```

## Шаг 3: Проверка импортов

Создайте тестовый файл для проверки:

```javascript
// src/test-imports.js
import fuzzyEngine from './services/fuzzyLogic';
import scheduleService from './services/scheduleService';
import commandParser from './services/commandParser';
import scheduleData from './data/scheduleData';

console.log('✅ fuzzyEngine:', fuzzyEngine);
console.log('✅ scheduleService:', scheduleService);
console.log('✅ commandParser:', commandParser);
console.log('✅ scheduleData:', scheduleData);

// Тест нечёткой логики
const result = fuzzyEngine.evaluateTimeConvenience('11:00', 'Среда');
console.log('🧠 Тест fuzzy logic:', result);
```

Импортируйте его в `App.jsx`:
```javascript
import './test-imports'; // Временно для проверки
```

Запустите:
```bash
npm run dev
```

Откройте консоль браузера — должны увидеть логи.

## Шаг 4: Структура папок (финальная)

```
ваш-vite-проект/
├── src/
│   ├── components/        # Создайте эту папку
│   │   ├── Chat/
│   │   ├── Schedule/
│   │   └── Layout/
│   │
│   ├── services/          # ✅ Скопировано
│   │   ├── fuzzyLogic.js
│   │   ├── scheduleService.js
│   │   └── commandParser.js
│   │
│   ├── data/              # ✅ Скопировано
│   │   └── scheduleData.js
│   │
│   ├── hooks/             # Создайте эту папку
│   ├── utils/             # Создайте эту папку
│   ├── styles/            # Создайте эту папку
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── vite.config.js
```

## Шаг 5: Настройка CSS переменных

Создайте `src/styles/variables.css`:

```css
:root {
  /* Светлая тема */
  --background: #f5f5f5;
  --surface: #ffffff;
  --primary: #2196F3;
  --text-primary: #212121;
  --text-secondary: #757575;
  --border: #e0e0e0;
  
  /* Оценки */
  --score-excellent: #4CAF50;
  --score-good: #8BC34A;
  --score-neutral: #FFC107;
  --score-poor: #FF5722;
  
  /* Типографика */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 16px;
  
  /* Отступы */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

[data-theme="dark"] {
  --background: #121212;
  --surface: #1e1e1e;
  --primary: #64B5F6;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border: #333333;
}
```

Импортируйте в `main.jsx`:
```javascript
import './styles/variables.css';
```

## Шаг 6: Готово к разработке! 🎉

Теперь можете начинать создавать компоненты:

```javascript
// src/components/Chat/Chat.jsx
import React, { useState } from 'react';
import commandParser from '../../services/commandParser';
import scheduleService from '../../services/scheduleService';
import { v4 as uuid } from 'uuid';

function Chat() {
  const [messages, setMessages] = useState([]);

  const handleSend = (text) => {
    // Добавить сообщение пользователя
    const userMsg = { id: uuid(), type: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    // Парсить команду
    const command = commandParser.parse(text);
    
    // Обработать и ответить
    // ...
  };

  return (
    <div>
      {/* Ваш UI */}
    </div>
  );
}

export default Chat;
```

---

## ✅ Чек-лист готовности

- [ ] `npm install` выполнен
- [ ] Папки `services/` и `data/` в `src/`
- [ ] Импорты работают (проверено в консоли)
- [ ] CSS переменные настроены
- [ ] Структура папок создана
- [ ] Готов к созданию компонентов

---

## 🆘 Если что-то не работает

### Ошибка импорта
```
Cannot find module './services/fuzzyLogic'
```
**Решение:** Проверьте, что папка `services/` находится в `src/`

### Ошибка с uuid
```
uuid is not a function
```
**Решение:** 
```javascript
import { v4 as uuid } from 'uuid'; // Правильно
// НЕ: import uuid from 'uuid';
```

### Ошибка с date-fns
```javascript
import { format } from 'date-fns'; // Правильно
import { ru } from 'date-fns/locale'; // Для русского языка

// Использование
format(new Date(), 'dd.MM.yyyy', { locale: ru });
```

---

## 📞 Готов к запуску Claude Code

После выполнения всех шагов, откройте проект в Claude Code и используйте промпт:

```
Привет! У меня настроен Vite проект с React.

Готовые модули:
- src/services/fuzzyLogic.js (3 модели нечёткой логики)
- src/services/scheduleService.js (работа с расписанием)
- src/services/commandParser.js (парсинг команд)
- src/data/scheduleData.js (данные)

Прочитай SETUP.md для деталей.

Помоги создать UI чат-бота согласно плану:
1. Базовый чат (ввод/вывод)
2. Отображение расписания с оценками
3. Быстрые кнопки, автодополнение, темы

Начнём с Chat.jsx?
```

---

**Статус:** 🟢 Готово к интеграции!
