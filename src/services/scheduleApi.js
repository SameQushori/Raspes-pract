/**
 * scheduleApi.js
 * Сервис для работы с API расписания ГБПОУ УКРТБ
 * API base: https://study.ukrtb.ru/api/frontend/schedule
 *
 * ИСПОЛЬЗОВАНИЕ:
 *   1. Добавь прокси в vite.config.js (см. ниже)
 *   2. import { scheduleService } from './scheduleApi'
 *   3. await scheduleService.init()
 *   4. const groups = await scheduleService.getGroups()
 *   5. const schedule = await scheduleService.getSchedule(group, '2026-02-18')
 *
 * VITE PROXY (vite.config.js):
 *   server: {
 *     proxy: {
 *       '/ukrtb-api': {
 *         target: 'https://study.ukrtb.ru',
 *         changeOrigin: true,
 *         secure: true,
 *         rewrite: path => path.replace(/^\/ukrtb-api/, '')
 *       }
 *     }
 *   }
 */

// ─── Константы ────────────────────────────────────────────────────────────────

const BASE = '/ukrtb-api'                         // → проксируется на study.ukrtb.ru
const API  = `${BASE}/api/frontend/schedule`

const ENDPOINTS = {
  page:      `${BASE}/schedule`,                  // HTML страница — даёт куки
  login:     `${BASE}/login`,                     // POST авторизация
  groups:    `${API}/get/lists/groups`,            // GET список групп
  teachers:  `${API}/get/lists/teachers`,          // GET список преподавателей
  cabs:      `${API}/get/lists/cabs`,              // GET список кабинетов
  date:      `${API}/get/lists/date`,              // GET текущая дата
  user:      `${BASE}/api/frontend/user`,          // GET текущий пользователь
  schedule:  `${API}/get`,                         // GET расписание ?type=groups&item[label]=...
}

const DEFAULT_HEADERS = {
  'Accept':            'application/json',
  'X-Requested-With':  'XMLHttpRequest',
  'Accept-Language':   'ru-RU,ru;q=0.9',
}

// ─── Кэш ──────────────────────────────────────────────────────────────────────

class Cache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this._store = new Map()
    this._ttl   = ttlMs
  }

  get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > this._ttl) {
      this._store.delete(key)
      return null
    }
    return entry.data
  }

  set(key, data) {
    this._store.set(key, { data, ts: Date.now() })
  }

  delete(key) { this._store.delete(key) }
  clear()     { this._store.clear() }

  /** Удалить все ключи, начинающиеся с prefix */
  clearPrefix(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key)
    }
  }
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function formatDate(date) {
  // Date → 'YYYY-MM-DD'
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return date
}

function getWeekDates(startDate) {
  const start  = new Date(startDate)
  const monday = new Date(start)
  // Отматываем до понедельника
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return formatDate(d)
  })
}

// ─── Основной сервис ──────────────────────────────────────────────────────────

class ScheduleService {
  constructor() {
    this._cache      = new Cache(5 * 60 * 1000) // 5 мин для расписания
    this._listCache  = new Cache(30 * 60 * 1000) // 30 мин для групп/учителей
    this._ready      = false
    this._xsrf       = null
  }

  // ── Инициализация ──────────────────────────────────────────────────────────

  /**
   * Загружает страницу расписания чтобы получить сессионные куки и XSRF токен.
   * Вызывать один раз перед любыми запросами.
   */
  async init() {
    const res = await fetch(ENDPOINTS.page, {
      credentials: 'include',
      headers: { 'Accept': 'text/html' },
    })

    if (!res.ok) throw new Error(`[ScheduleService] init: ${res.status} ${res.statusText}`)

    // Laravel автоматически ставит XSRF-TOKEN в куку — читаем его
    this._xsrf  = getCookie('XSRF-TOKEN')
    this._ready = true

    console.log('[ScheduleService] ✅ Initialized, XSRF:', this._xsrf?.slice(0, 15) + '...')
    return this
  }

  _ensureReady() {
    if (!this._ready) throw new Error('[ScheduleService] Вызови init() перед запросами')
  }

  _getXsrf() {
    // Токен может обновиться — читаем из куки при каждом запросе
    this._xsrf = getCookie('XSRF-TOKEN') ?? this._xsrf
    return this._xsrf
  }

  // ── Авторизация ────────────────────────────────────────────────────────────

  /**
   * Авторизация студента.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    if (!this._ready) await this.init()

    const res = await fetch(ENDPOINTS.login, {
      method:      'POST',
      credentials: 'include',
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type':  'application/json',
        'X-XSRF-TOKEN':  this._getXsrf(),
        'Referer':       'https://study.ukrtb.ru/schedule',
      },
      body: JSON.stringify({ email, password }),
    })

    if (res.status === 422) {
      const body = await res.json()
      const msgs = Object.values(body.errors ?? {}).flat().join(', ')
      throw new Error(`Ошибка входа: ${msgs || body.message}`)
    }
    if (!res.ok) throw new Error(`[login] ${res.status} ${res.statusText}`)

    // Обновляем XSRF после логина
    this._xsrf = getCookie('XSRF-TOKEN') ?? this._xsrf
    this._cache.clear()
    this._listCache.clear()

    console.log('[ScheduleService] ✅ Logged in')
    return res.json()
  }

  /**
   * Выход из системы.
   */
  async logout() {
    await fetch(`${BASE}/logout`, {
      method:      'POST',
      credentials: 'include',
      headers: { 'X-XSRF-TOKEN': this._getXsrf() },
    })
    this._ready = false
    this._cache.clear()
    this._listCache.clear()
    console.log('[ScheduleService] Logged out')
  }

  /**
   * Получить информацию о текущем пользователе.
   */
  async getUser() {
    return this._fetch(ENDPOINTS.user, {}, this._listCache, 'user')
  }

  // ── Базовые запросы ────────────────────────────────────────────────────────

  async _fetch(url, params = {}, cache = this._cache, cacheKey = null) {
    this._ensureReady()

    const fullUrl = new URL(url, window.location.origin)
    Object.entries(params).forEach(([k, v]) => fullUrl.searchParams.set(k, v))

    const key = cacheKey ?? fullUrl.toString()
    const hit  = cache.get(key)
    if (hit) {
      console.log('[ScheduleService] 📦 cache hit:', key)
      return hit
    }

    const res = await fetch(fullUrl.toString(), {
      credentials: 'include',
      headers: {
        ...DEFAULT_HEADERS,
        'X-XSRF-TOKEN': this._getXsrf(),
        'Referer':      'https://study.ukrtb.ru/schedule',
      },
    })

    if (res.status === 401) {
      this._ready = false
      throw new Error('Сессия истекла. Авторизуйтесь заново.')
    }
    if (!res.ok) throw new Error(`[fetch] ${res.status} ${res.statusText} → ${url}`)

    // Читаем как текст — пустое тело (дни без пар) не бросает исключение
    const text = await res.text()
    const data = text.trim() ? JSON.parse(text) : null
    cache.set(key, data)
    return data
  }

  // ── Справочники ────────────────────────────────────────────────────────────

  /** Список всех групп: [{label, value}, ...] */
  async getGroups() {
    return this._fetch(ENDPOINTS.groups, {}, this._listCache, 'groups')
  }

  /** Список преподавателей */
  async getTeachers() {
    return this._fetch(ENDPOINTS.teachers, {}, this._listCache, 'teachers')
  }

  /** Список кабинетов */
  async getCabs() {
    return this._fetch(ENDPOINTS.cabs, {}, this._listCache, 'cabs')
  }

  /** Найти группу по части названия */
  async findGroup(query) {
    const groups = await this.getGroups()
    const q = query.toLowerCase()
    return groups.filter(g => g.label.toLowerCase().includes(q))
  }

  // ── Расписание ─────────────────────────────────────────────────────────────

  /**
   * Расписание на одну дату.
   * @param {{ label: string, value: string }} group  — объект группы из getGroups()
   * @param {string|Date} date                        — '2026-02-18'
   * @param {'groups'|'teachers'|'cabs'} type
   */
  async getSchedule(group, date, type = 'groups') {
    const d = formatDate(date)
    const params = {
      type,
      'item[label]': group.label,
      'item[value]': group.value,
      date: d,
    }
    const cacheKey = `schedule:${type}:${group.value}:${d}`
    return this._fetch(ENDPOINTS.schedule, params, this._cache, cacheKey)
  }

  /**
   * Расписание на неделю (пн–сб).
   * @param {{ label: string, value: string }} group
   * @param {string|Date} anyDateInWeek  — любая дата из нужной недели
   */
  async getWeekSchedule(group, anyDateInWeek = new Date(), type = 'groups') {
    const dates = getWeekDates(anyDateInWeek)

    const results = await Promise.allSettled(
      dates.map(d => this.getSchedule(group, d, type))
    )

    return dates.reduce((acc, d, i) => {
      const r = results[i]
      acc[d] = r.status === 'fulfilled'
        ? { data: r.value, error: null }
        : { data: null,    error: r.reason.message }
      return acc
    }, {})
  }

  /**
   * Расписание на диапазон дат.
   * @param {{ label: string, value: string }} group
   * @param {string} from  — '2026-02-17'
   * @param {string} to    — '2026-02-21'
   */
  async getDateRangeSchedule(group, from, to) {
    const dates = []
    const cur   = new Date(from)
    const end   = new Date(to)
    while (cur <= end) {
      dates.push(formatDate(cur))
      cur.setDate(cur.getDate() + 1)
    }

    const results = await Promise.allSettled(
      dates.map(d => this.getSchedule(group, d))
    )

    return dates.reduce((acc, d, i) => {
      const r = results[i]
      acc[d] = r.status === 'fulfilled' ? r.value : null
      return acc
    }, {})
  }

  // ── Кэш управление ────────────────────────────────────────────────────────

  /** Очистить кэш расписания для группы */
  clearGroupCache(groupValue) {
    this._cache.clearPrefix(`schedule:groups:${groupValue}:`)
  }

  /** Полная очистка кэша */
  clearAllCache() {
    this._cache.clear()
    this._listCache.clear()
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const scheduleService = new ScheduleService()
export default scheduleService

// ─── React хуки ───────────────────────────────────────────────────────────────
// Скопируй в отдельный файл src/hooks/useSchedule.js

/*
import { useState, useEffect, useCallback, useRef } from 'react'
import { scheduleService } from '../services/scheduleApi'

// Хук: список групп
export function useGroups() {
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    scheduleService.getGroups()
      .then(setGroups)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { groups, loading, error }
}

// Хук: расписание на неделю
export function useWeekSchedule(group, weekDate) {
  const [week, setWeek]       = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)

  const fetch = useCallback(async () => {
    if (!group?.value) return
    setLoading(true)
    setError(null)
    try {
      const data = await scheduleService.getWeekSchedule(group, weekDate)
      setWeek(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [group?.value, weekDate])

  useEffect(() => { fetch() }, [fetch])

  return { week, loading, error, refetch: fetch }
}
*/
