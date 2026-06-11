import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS, storage, generateId } from '@/utils/storage'
import { mockScores } from '@/data/mockData'
import { WARNING_SCORE } from '@/constants'

export const useScoreStore = defineStore('score', () => {
  const scores = ref([])

  const initScores = () => {
    const stored = storage.get(STORAGE_KEYS.SCORES)
    if (stored && stored.length > 0) {
      scores.value = stored.map(s => {
        if (s.avgScore === undefined) {
          return {
            ...s,
            avgScore: Number(((s.serviceAttitude + s.professional + s.adaptability + s.explanation) / 4).toFixed(2))
          }
        }
        return s
      })
      saveToStorage()
    } else {
      scores.value = mockScores.map(s => ({
        ...s,
        avgScore: Number(((s.serviceAttitude + s.professional + s.adaptability + s.explanation) / 4).toFixed(2))
      }))
      saveToStorage()
    }
  }

  const saveToStorage = () => {
    storage.set(STORAGE_KEYS.SCORES, scores.value)
  }

  const addScore = (scoreData) => {
    const avg = (scoreData.serviceAttitude + scoreData.professional + 
               scoreData.adaptability + scoreData.explanation) / 4
    
    const newScore = {
      id: generateId(),
      avgScore: Number(avg.toFixed(2)),
      created_at: new Date().toISOString().split('T')[0],
      ...scoreData
    }
    scores.value.push(newScore)
    saveToStorage()
    return newScore
  }

  const getScoresByGuide = (guideId) => {
    return scores.value.filter(s => s.guideId === guideId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const getAvgScoreByGuide = (guideId) => {
    const guideScores = getScoresByGuide(guideId)
    if (guideScores.length === 0) return 0
    const sum = guideScores.reduce((acc, s) => acc + s.avgScore, 0)
    return Number((sum / guideScores.length).toFixed(2))
  }

  const lowScoreGuides = computed(() => {
    const guideMap = {}
    scores.value.forEach(s => {
      if (!guideMap[s.guideId]) {
        guideMap[s.guideId] = { total: 0, count: 0 }
      }
      guideMap[s.guideId].total += s.avgScore
      guideMap[s.guideId].count++
    })
    
    return Object.entries(guideMap)
      .map(([guideId, data]) => ({
        guideId,
        avgScore: Number((data.total / data.count).toFixed(2))
      }))
      .filter(item => item.avgScore < WARNING_SCORE)
      .sort((a, b) => a.avgScore - b.avgScore)
  })

  const deleteScore = (id) => {
    const index = scores.value.findIndex(s => s.id === id)
    if (index !== -1) {
      scores.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  const getMonthlyScores = (guideId) => {
    const guideScores = getScoresByGuide(guideId)
    const monthMap = {}
    
    guideScores.forEach(s => {
      const month = s.created_at.substring(0, 7)
      if (!monthMap[month]) {
        monthMap[month] = { total: 0, count: 0 }
      }
      monthMap[month].total += s.avgScore
      monthMap[month].count++
    })
    
    return Object.entries(monthMap)
      .map(([month, data]) => ({
        month,
        avgScore: Number((data.total / data.count).toFixed(2)),
        count: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  const getConsecutiveLowScoreMonths = (guideId) => {
    const monthlyScores = getMonthlyScores(guideId)
    if (monthlyScores.length === 0) return 0
    
    const monthMap = {}
    monthlyScores.forEach(ms => {
      monthMap[ms.month] = ms.avgScore
    })
    
    const getPrevMonth = (monthStr) => {
      const [y, m] = monthStr.split('-').map(Number)
      const date = new Date(y, m - 2, 1)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    
    let consecutive = 0
    let currentMonth = monthlyScores[monthlyScores.length - 1].month
    
    while (true) {
      const avg = monthMap[currentMonth]
      
      if (avg === undefined) {
        break
      }
      
      if (avg < WARNING_SCORE) {
        consecutive++
        currentMonth = getPrevMonth(currentMonth)
      } else {
        break
      }
    }
    
    return consecutive
  }

  return {
    scores,
    initScores,
    addScore,
    getScoresByGuide,
    getAvgScoreByGuide,
    lowScoreGuides,
    deleteScore,
    getMonthlyScores,
    getConsecutiveLowScoreMonths
  }
})
