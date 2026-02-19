/**
 * ПАРСЕР КОМАНД ЧАТ-БОТА
 * Обрабатывает сообщения пользователя и определяет намерения
 */

export class CommandParser {
  /**
   * Основной метод парсинга команды
   */
  parse(userInput) {
    const normalized = userInput.toLowerCase().trim();

    // Приветствие
    if (this.isGreeting(normalized)) {
      return {
        type: 'GREETING',
        confidence: 1.0
      };
    }

    // Помощь
    if (this.isHelpRequest(normalized)) {
      return {
        type: 'HELP',
        confidence: 1.0
      };
    }

    // Расписание группы
    const groupMatch = this.parseGroupSchedule(normalized);
    if (groupMatch) {
      return groupMatch;
    }

    // Расписание преподавателя
    const teacherMatch = this.parseTeacherSchedule(normalized);
    if (teacherMatch) {
      return teacherMatch;
    }

    // Расписание на конкретный день
    const dayMatch = this.parseDaySchedule(normalized);
    if (dayMatch) {
      return dayMatch;
    }

    // Свободные окна преподавателя
    const freeSlotMatch = this.parseFreeSlots(normalized);
    if (freeSlotMatch) {
      return freeSlotMatch;
    }

    // Список групп
    if (this.isGroupListRequest(normalized)) {
      return {
        type: 'LIST_GROUPS',
        confidence: 1.0
      };
    }

    // Список преподавателей
    if (this.isTeacherListRequest(normalized)) {
      return {
        type: 'LIST_TEACHERS',
        confidence: 1.0
      };
    }

    // Команда не распознана
    return {
      type: 'UNKNOWN',
      originalInput: userInput,
      confidence: 0.0
    };
  }

  /**
   * Проверка приветствия
   */
  isGreeting(text) {
    const greetings = [
      'привет', 'здравствуй', 'добрый день', 'добрый вечер',
      'доброе утро', 'хай', 'hello', 'hi', 'hey'
    ];
    return greetings.some(greeting => text.includes(greeting));
  }

  /**
   * Проверка запроса помощи
   */
  isHelpRequest(text) {
    const helpKeywords = [
      'помощь', 'помоги', 'help', 'команды', 'что ты умеешь',
      'как пользоваться', 'инструкция', 'справка'
    ];
    return helpKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Парсинг запроса расписания группы
   * Поддерживает: ПИ-301, 9ССА-37-23, 10ИТ-22 и любые другие форматы групп колледжа
   */
  parseGroupSchedule(text) {
    const NAME = '[а-яa-zёА-ЯA-Z0-9][а-яa-zёА-ЯA-Z0-9-]+'

    // 1. Явно: "расписание группа НАЗВАНИЕ" — слово "группа" обязательно
    const withGroup = text.match(
      new RegExp(`(?:расписание|покажи|найди)\\s+групп[а-яё]*\\s+(${NAME})`, 'i')
    )
    if (withGroup) {
      return { type: 'GROUP_SCHEDULE', groupName: withGroup[1].toUpperCase(), confidence: 0.95 }
    }

    // 2. "группа НАЗВАНИЕ" без ведущего ключевого слова
    const groupWord = text.match(new RegExp(`групп[а-яё]*\\s+(${NAME})`, 'i'))
    if (groupWord) {
      return { type: 'GROUP_SCHEDULE', groupName: groupWord[1].toUpperCase(), confidence: 0.88 }
    }

    // 3. "расписание КОД" — только если КОД выглядит как шифр группы:
    //    начинается с цифры (9ССА-37-23) ИЛИ содержит буквы-дефис-цифры (ПИ-301)
    const codeAfterKeyword = text.match(
      /(?:расписание|покажи|найди)\s+(\d[а-яa-zёА-ЯA-Z0-9-]+|[а-яА-ЯёёA-Za-z]+-\d[\d-]*)/i
    )
    if (codeAfterKeyword) {
      return { type: 'GROUP_SCHEDULE', groupName: codeAfterKeyword[1].toUpperCase(), confidence: 0.85 }
    }

    // 4. Fallback: ПИ-301 / ПИ301 где угодно в строке
    const pi = text.match(/([пП][иИ]-?\d+)/i)
    if (pi) {
      let groupName = pi[1].toUpperCase()
      if (!groupName.includes('-')) groupName = groupName.replace(/([ПИ]{2})(\d+)/i, '$1-$2')
      return { type: 'GROUP_SCHEDULE', groupName, confidence: 0.85 }
    }

    return null
  }

  /**
   * Парсинг запроса расписания преподавателя
   */
  parseTeacherSchedule(text) {
    const patterns = [
      /(?:расписание|покажи|найди)\s+(?:преподавател[ья]|препода?)\s+(.+)/i,
      /(?:преподавател[ья]|препода?)\s+(.+)/i,
      /у\s+(.+)\s+(?:расписание|пары)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let teacherName = match[1].trim();
        
        // Удаляем лишние слова
        teacherName = teacherName
          .replace(/расписание|пары|занятия/gi, '')
          .trim();
        
        if (teacherName.length > 2) {
          return {
            type: 'TEACHER_SCHEDULE',
            teacherName,
            confidence: 0.85
          };
        }
      }
    }

    return null;
  }

  /**
   * Парсинг запроса расписания на день
   */
  parseDaySchedule(text) {
    const days = {
      'понедельник': 'Понедельник',
      'вторник': 'Вторник',
      'среда': 'Среду',
      'четверг': 'Четверг',
      'пятница': 'Пятницу',
      'суббота': 'Субботу',
      'пн': 'Понедельник',
      'вт': 'Вторник',
      'ср': 'Среду',
      'чт': 'Четверг',
      'пт': 'Пятницу',
      'сб': 'Субботу'
    };

    for (const [key, value] of Object.entries(days)) {
      if (text.includes(key)) {
        // Ищем название группы: сначала после слова "группа", затем
        // код вида "9ССА-37-23" (начинается с цифры), затем старый ПИ-xxx
        const groupPatterns = [
          /групп[а-яё]*\s+([а-яa-zёА-ЯA-Z0-9][а-яa-zёА-ЯA-Z0-9-]+)/i,
          /\b(\d+[а-яa-zёА-ЯA-Z][а-яa-zёА-ЯA-Z0-9-]+)/i,
          /([пП][иИ]-?\d+)/i,
        ]
        for (const re of groupPatterns) {
          const m = text.match(re)
          if (m) {
            return {
              type: 'DAY_SCHEDULE',
              groupName: m[1].toUpperCase(),
              dayName: value,
              confidence: 0.9
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Парсинг запроса свободных окон
   */
  parseFreeSlots(text) {
    if (text.includes('свободн') || text.includes('окна') || 
        text.includes('когда свободен') || text.includes('консультация')) {
      
      // Ищем преподавателя
      const teacherMatch = text.match(/(?:у\s+)?(.+?)(?:\s+в\s+|\s+на\s+|$)/i);
      
      // Ищем день
      const days = {
        'понедельник': 'Понедельник',
        'вторник': 'Вторник',
        'среда': 'Среду',
        'четверг': 'Четверг',
        'пятница': 'Пятницу',
        'суббота': 'Субботу'
      };

      let dayName = null;
      for (const [key, value] of Object.entries(days)) {
        if (text.includes(key)) {
          dayName = value;
          break;
        }
      }

      if (teacherMatch) {
        let teacherName = teacherMatch[1].trim();
        teacherName = teacherName
          .replace(/преподавател[ья]|препода?|свободн\w*|окна|когда/gi, '')
          .trim();

        if (teacherName.length > 2) {
          return {
            type: 'TEACHER_FREE_SLOTS',
            teacherName,
            dayName,
            confidence: 0.85
          };
        }
      }
    }

    return null;
  }

  /**
   * Проверка запроса списка групп
   */
  isGroupListRequest(text) {
    return (
      text.includes('список групп') ||
      text.includes('какие группы') ||
      text.includes('все группы') ||
      text.includes('покажи группы')
    );
  }

  /**
   * Проверка запроса списка преподавателей
   */
  isTeacherListRequest(text) {
    return (
      text.includes('список преподавателей') ||
      text.includes('какие преподаватели') ||
      text.includes('все преподаватели') ||
      text.includes('покажи преподавателей')
    );
  }

  /**
   * Получить примеры команд
   */
  getExamples() {
    return [
      '📅 Расписание группы ПИ-301',
      '👨‍🏫 Расписание преподавателя Иванова',
      '📆 Расписание ПИ-301 в понедельник',
      '🕐 Когда свободен Петров в четверг',
      '📋 Список групп',
      '👥 Список преподавателей',
      '❓ Помощь'
    ];
  }
}

// Экспортируем единственный экземпляр
export default new CommandParser();
