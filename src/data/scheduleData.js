/**
 * СТАТИЧНЫЕ ДАННЫЕ РАСПИСАНИЯ
 * Замените это реальными данными вашего колледжа
 */

export const scheduleData = {
  // Расписание по группам
  groups: [
    {
      id: 1,
      name: "ПИ-301",
      specialty: "Программирование в компьютерных системах",
      course: 3,
      schedule: [
        {
          day: "Понедельник",
          lessons: [
            {
              id: 1,
              time: "9:00-10:30",
              subject: "Базы данных",
              teacher: "Иванова А.И.",
              teacherId: 1,
              room: "320",
              building: "Корпус А",
              type: "Лекция"
            },
            {
              id: 2,
              time: "10:45-12:15",
              subject: "Веб-программирование",
              teacher: "Петров П.П.",
              teacherId: 2,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            },
            {
              id: 3,
              time: "13:00-14:30",
              subject: "Английский язык",
              teacher: "Смирнова О.В.",
              teacherId: 3,
              room: "105",
              building: "Корпус Б",
              type: "Практика"
            }
          ]
        },
        {
          day: "Вторник",
          lessons: [
            {
              id: 4,
              time: "10:45-12:15",
              subject: "Разработка мобильных приложений",
              teacher: "Петров П.П.",
              teacherId: 2,
              room: "215",
              building: "Корпус А",
              type: "Лекция"
            },
            {
              id: 5,
              time: "13:00-14:30",
              subject: "Разработка мобильных приложений",
              teacher: "Петров П.П.",
              teacherId: 2,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            },
            {
              id: 6,
              time: "14:45-16:15",
              subject: "Физическая культура",
              teacher: "Кузнецов В.М.",
              teacherId: 4,
              room: "Спортзал",
              building: "Корпус С",
              type: "Практика"
            }
          ]
        },
        {
          day: "Среда",
          lessons: [
            {
              id: 7,
              time: "9:00-10:30",
              subject: "Базы данных",
              teacher: "Иванова А.И.",
              teacherId: 1,
              room: "320",
              building: "Корпус А",
              type: "Практика"
            },
            {
              id: 8,
              time: "10:45-12:15",
              subject: "Системное программирование",
              teacher: "Сидоров С.С.",
              teacherId: 5,
              room: "312",
              building: "Корпус А",
              type: "Лекция"
            }
          ]
        },
        {
          day: "Четверг",
          lessons: [
            {
              id: 9,
              time: "11:00-12:30",
              subject: "Веб-программирование",
              teacher: "Петров П.П.",
              teacherId: 2,
              room: "215",
              building: "Корпус А",
              type: "Лекция"
            },
            {
              id: 10,
              time: "13:00-14:30",
              subject: "Английский язык",
              teacher: "Смирнова О.В.",
              teacherId: 3,
              room: "105",
              building: "Корпус Б",
              type: "Практика"
            },
            {
              id: 11,
              time: "14:45-16:15",
              subject: "Системное программирование",
              teacher: "Сидоров С.С.",
              teacherId: 5,
              room: "312",
              building: "Корпус А",
              type: "Практика"
            }
          ]
        },
        {
          day: "Пятница",
          lessons: [
            {
              id: 12,
              time: "9:00-10:30",
              subject: "Разработка мобильных приложений",
              teacher: "Петров П.П.",
              teacherId: 2,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            },
            {
              id: 13,
              time: "10:45-12:15",
              subject: "Классный час",
              teacher: "Иванова А.И.",
              teacherId: 1,
              room: "320",
              building: "Корпус А",
              type: "Организационное"
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "ПИ-201",
      specialty: "Программирование в компьютерных системах",
      course: 2,
      schedule: [
        {
          day: "Понедельник",
          lessons: [
            {
              id: 14,
              time: "10:45-12:15",
              subject: "Основы алгоритмизации",
              teacher: "Сидоров С.С.",
              teacherId: 5,
              room: "312",
              building: "Корпус А",
              type: "Лекция"
            },
            {
              id: 15,
              time: "13:00-14:30",
              subject: "Математика",
              teacher: "Волкова Е.А.",
              teacherId: 6,
              room: "201",
              building: "Корпус Б",
              type: "Лекция"
            }
          ]
        }
      ]
    }
  ],

  // Расписание по преподавателям
  teachers: [
    {
      id: 1,
      name: "Иванова Анна Ивановна",
      shortName: "Иванова А.И.",
      position: "Преподаватель",
      department: "Информационные технологии",
      subjects: ["Базы данных"],
      email: "ivanova@college.ru",
      consultationTime: "Среда 15:00-17:00",
      schedule: [
        {
          day: "Понедельник",
          lessons: [
            {
              id: 1,
              time: "9:00-10:30",
              subject: "Базы данных",
              group: "ПИ-301",
              groupId: 1,
              room: "320",
              building: "Корпус А",
              type: "Лекция"
            }
          ]
        },
        {
          day: "Среда",
          lessons: [
            {
              id: 7,
              time: "9:00-10:30",
              subject: "Базы данных",
              group: "ПИ-301",
              groupId: 1,
              room: "320",
              building: "Корпус А",
              type: "Практика"
            }
          ]
        },
        {
          day: "Пятница",
          lessons: [
            {
              id: 13,
              time: "10:45-12:15",
              subject: "Классный час",
              group: "ПИ-301",
              groupId: 1,
              room: "320",
              building: "Корпус А",
              type: "Организационное"
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Петров Пётр Петрович",
      shortName: "Петров П.П.",
      position: "Старший преподаватель",
      department: "Информационные технологии",
      subjects: ["Веб-программирование", "Разработка мобильных приложений"],
      email: "petrov@college.ru",
      consultationTime: "Четверг 16:30-18:00",
      schedule: [
        {
          day: "Понедельник",
          lessons: [
            {
              id: 2,
              time: "10:45-12:15",
              subject: "Веб-программирование",
              group: "ПИ-301",
              groupId: 1,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            }
          ]
        },
        {
          day: "Вторник",
          lessons: [
            {
              id: 4,
              time: "10:45-12:15",
              subject: "Разработка мобильных приложений",
              group: "ПИ-301",
              groupId: 1,
              room: "215",
              building: "Корпус А",
              type: "Лекция"
            },
            {
              id: 5,
              time: "13:00-14:30",
              subject: "Разработка мобильных приложений",
              group: "ПИ-301",
              groupId: 1,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            }
          ]
        },
        {
          day: "Четверг",
          lessons: [
            {
              id: 9,
              time: "11:00-12:30",
              subject: "Веб-программирование",
              group: "ПИ-301",
              groupId: 1,
              room: "215",
              building: "Корпус А",
              type: "Лекция"
            }
          ]
        },
        {
          day: "Пятница",
          lessons: [
            {
              id: 12,
              time: "9:00-10:30",
              subject: "Разработка мобильных приложений",
              group: "ПИ-301",
              groupId: 1,
              room: "215",
              building: "Корпус А",
              type: "Практика"
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Смирнова Ольга Викторовна",
      shortName: "Смирнова О.В.",
      position: "Преподаватель",
      department: "Иностранные языки",
      subjects: ["Английский язык"],
      email: "smirnova@college.ru",
      consultationTime: "Вторник 14:00-15:00",
      schedule: [
        {
          day: "Понедельник",
          lessons: [
            {
              id: 3,
              time: "13:00-14:30",
              subject: "Английский язык",
              group: "ПИ-301",
              groupId: 1,
              room: "105",
              building: "Корпус Б",
              type: "Практика"
            }
          ]
        },
        {
          day: "Четверг",
          lessons: [
            {
              id: 10,
              time: "13:00-14:30",
              subject: "Английский язык",
              group: "ПИ-301",
              groupId: 1,
              room: "105",
              building: "Корпус Б",
              type: "Практика"
            }
          ]
        }
      ]
    }
  ],

  // Дополнительная информация
  metadata: {
    lastUpdated: "2026-02-16",
    semester: "Весенний 2025-2026",
    academicYear: "2025-2026"
  }
};

export default scheduleData;
