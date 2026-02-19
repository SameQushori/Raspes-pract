// src/hooks/useSchedule.js
import { useState, useEffect, useCallback } from 'react'
import { scheduleService } from '../services/scheduleApi'

// ─── Хук: инициализация сервиса ───────────────────────────────────────────────
export function useScheduleService() {
  const [ready, setReady]     = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    scheduleService.init()
      .then(() => setReady(true))
      .catch(e => setError(e.message))
  }, [])

  return { ready, error }
}

// ─── Хук: авторизация ─────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      await scheduleService.login(email, password)
      const u = await scheduleService.getUser()
      setUser(u)
      return u
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await scheduleService.logout()
    setUser(null)
  }, [])

  return { user, loading, error, login, logout }
}

// ─── Хук: список групп ────────────────────────────────────────────────────────
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

// ─── Хук: расписание на неделю ────────────────────────────────────────────────
/**
 * @param {{ label: string, value: string } | null} group
 * @param {string} weekDate  — любая дата из нужной недели ('2026-02-18')
 */
export function useWeekSchedule(group, weekDate) {
  const [week, setWeek]       = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchWeek = useCallback(async () => {
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

  useEffect(() => { fetchWeek() }, [fetchWeek])

  return { week, loading, error, refetch: fetchWeek }
}

// ─── Хук: расписание на один день ─────────────────────────────────────────────
export function useDaySchedule(group, date) {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!group?.value || !date) return
    setLoading(true)
    scheduleService.getSchedule(group, date)
      .then(setSchedule)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [group?.value, date])

  return { schedule, loading, error }
}
