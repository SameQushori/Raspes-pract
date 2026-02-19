/**
 * СЕРВИС ДЛЯ РАБОТЫ С РАСПИСАНИЕМ
 * Работает с локальными данными расписания
 */

import scheduleData from '../data/scheduleData';

class ScheduleService {
  constructor() {
    this.data = scheduleData;
  }

  /**
   * Получить расписание группы
   */
  getGroupSchedule(groupName) {
    const group = this.data.groups.find(
      g => g.name.toLowerCase() === groupName.toLowerCase()
    );

    if (!group) {
      return null;
    }

    return { ...group };
  }

  /**
   * Получить расписание преподавателя
   */
  getTeacherSchedule(teacherName) {
    const teacher = this.data.teachers.find(
      t => t.name.toLowerCase().includes(teacherName.toLowerCase()) ||
           t.shortName.toLowerCase().includes(teacherName.toLowerCase())
    );

    if (!teacher) {
      return null;
    }

    return { ...teacher };
  }

  /**
   * Найти расписание на конкретный день
   */
  getScheduleForDay(groupName, dayName) {
    const group = this.getGroupSchedule(groupName);
    if (!group) return null;

    return group.schedule.find(
      day => day.day.toLowerCase() === dayName.toLowerCase()
    );
  }

  /**
   * Поиск свободных окон преподавателя
   */
  findTeacherFreeSlots(teacherName, dayName) {
    const teacher = this.getTeacherSchedule(teacherName);
    if (!teacher) return null;

    const daySchedule = teacher.schedule.find(
      day => day.day.toLowerCase() === dayName.toLowerCase()
    );

    if (!daySchedule) {
      return {
        teacher: teacher.shortName,
        day: dayName,
        message: 'В этот день нет занятий - полностью свободен!'
      };
    }

    // Определяем свободные окна между парами
    const freeSlots = [];
    const lessons = daySchedule.lessons.sort((a, b) =>
      this.parseTime(a.time.split('-')[0]) - this.parseTime(b.time.split('-')[0])
    );

    for (let i = 0; i < lessons.length - 1; i++) {
      const currentEnd = lessons[i].time.split('-')[1];
      const nextStart = lessons[i + 1].time.split('-')[0];

      const gap = this.parseTime(nextStart) - this.parseTime(currentEnd);

      if (gap >= 30) {
        freeSlots.push({
          start: currentEnd,
          end: nextStart,
          duration: gap
        });
      }
    }

    return {
      teacher: teacher.shortName,
      day: dayName,
      freeSlots
    };
  }

  /**
   * Поиск всех групп
   */
  getAllGroups() {
    return this.data.groups.map(g => ({
      id: g.id,
      name: g.name,
      specialty: g.specialty,
      course: g.course
    }));
  }

  /**
   * Поиск всех преподавателей
   */
  getAllTeachers() {
    return this.data.teachers.map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      department: t.department,
      subjects: t.subjects
    }));
  }

  /**
   * Вспомогательная функция: парсинг времени в минуты
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.trim().split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Экспортируем единственный экземпляр
export default new ScheduleService();
