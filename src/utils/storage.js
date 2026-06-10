import dayjs from 'dayjs'

export const STORAGE_KEYS = {
  GUIDES: 'tourguide_guides',
  GROUPS: 'tourguide_groups',
  ASSIGNMENTS: 'tourguide_assignments',
  SCORES: 'tourguide_scores',
  SALARIES: 'tourguide_salaries',
  TRAINING: 'tourguide_training',
  LAST_SYNC: 'tourguide_last_sync'
}

export const storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(key)
  }
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const dateOverlap = (start1, end1, start2, end2) => {
  const s1 = dayjs(start1).valueOf()
  const e1 = dayjs(end1).valueOf()
  const s2 = dayjs(start2).valueOf()
  const e2 = dayjs(end2).valueOf()
  return s1 <= e2 && s2 <= e1
}

export const daysBetween = (start, end) => {
  return dayjs(end).diff(dayjs(start), 'day') + 1
}

export default {
  STORAGE_KEYS,
  storage,
  generateId,
  dateOverlap,
  daysBetween
}
