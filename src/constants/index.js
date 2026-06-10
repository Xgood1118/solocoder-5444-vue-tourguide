export const LANGUAGES = ['普通话', '英语', '日语', '韩语', '法语', '德语', '西班牙语']

export const GUIDE_LEVELS = [
  { value: '初级', label: '初级', multiplier: 1 },
  { value: '中级', label: '中级', multiplier: 1.5 },
  { value: '高级', label: '高级', multiplier: 2 },
  { value: '金牌', label: '金牌', multiplier: 3 }
]

export const ROUTE_TYPES = ['出境', '国内', '周边', '亲子', '老年']

export const GUEST_SOURCES = [
  { value: '散拼', label: '散拼团', level: '中级' },
  { value: '包团', label: '包团', level: '高级' },
  { value: '亲子', label: '亲子团', level: '中级' },
  { value: '老年', label: '老年团', level: '中级' },
  { value: '商务', label: '商务团', level: '高级' },
  { value: '蜜月', label: '蜜月团', level: '高级' }
]

export const ROUTE_COEFFICIENTS = {
  '出境': 1.8,
  '国内': 1.2,
  '周边': 0.8,
  '亲子': 1.0,
  '老年': 1.0
}

export const DAILY_ALLOWANCE_BASE = 150

export const WARNING_SCORE = 3.5

export const ANNUAL_TRAINING_HOURS = 40

export const getLevelMultiplier = (level) => {
  const found = GUIDE_LEVELS.find(l => l.value === level)
  return found ? found.multiplier : 1
}

export const getRecommendedLevel = (source) => {
  const found = GUEST_SOURCES.find(s => s.value === source)
  return found ? found.level : '中级'
}
