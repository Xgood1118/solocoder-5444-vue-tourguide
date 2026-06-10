import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS, storage, generateId } from '@/utils/storage'
import { mockGuides } from '@/data/mockData'
import { WARNING_SCORE } from '@/constants'
import dayjs from 'dayjs'

export const useGuideStore = defineStore('guide', () => {
  const guides = ref([])
  const loading = ref(false)

  const initGuides = () => {
    const stored = storage.get(STORAGE_KEYS.GUIDES)
    if (stored && stored.length > 0) {
      guides.value = stored.map(g => ({
        totalTours: 0,
        avgScore: 0,
        status: 'active',
        watchlist: false,
        consecutiveLowScoreMonths: 0,
        baseSalary: 3500,
        ...g
      }))
      saveToStorage()
    } else {
      guides.value = [...mockGuides]
      saveToStorage()
    }
  }

  const saveToStorage = () => {
    storage.set(STORAGE_KEYS.GUIDES, guides.value)
  }

  const activeGuides = computed(() => {
    return guides.value.filter(g => g.status === 'active' && !g.watchlist)
  })

  const watchlistGuides = computed(() => {
    return guides.value.filter(g => g.watchlist)
  })

  const expiredHealthCertGuides = computed(() => {
    const today = dayjs()
    return guides.value.filter(g => {
      const expiry = dayjs(g.healthCertExpiry)
      return expiry.isBefore(today) || expiry.diff(today, 'month') <= 1
    })
  })

  const getGuideById = (id) => {
    return guides.value.find(g => g.id === id)
  }

  const addGuide = (guideData) => {
    const newGuide = {
      id: generateId(),
      totalTours: 0,
      avgScore: 0,
      status: 'active',
      watchlist: false,
      consecutiveLowScoreMonths: 0,
      ...guideData
    }
    guides.value.push(newGuide)
    saveToStorage()
    return newGuide
  }

  const updateGuide = (id, data) => {
    const index = guides.value.findIndex(g => g.id === id)
    if (index !== -1) {
      guides.value[index] = { ...guides.value[index], ...data }
      saveToStorage()
      return true
    }
    return false
  }

  const deleteGuide = (id) => {
    const index = guides.value.findIndex(g => g.id === id)
    if (index !== -1) {
      guides.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  const addToWatchlist = (id) => {
    return updateGuide(id, { watchlist: true })
  }

  const removeFromWatchlist = (id) => {
    return updateGuide(id, { watchlist: false, consecutiveLowScoreMonths: 0 })
  }

  const updateAvgScore = (id, score) => {
    const guide = getGuideById(id)
    if (guide) {
      const newTotal = guide.totalTours + 1
      const newAvg = ((guide.avgScore * guide.totalTours) + score) / newTotal
      updateGuide(id, {
        totalTours: newTotal,
        avgScore: Number(newAvg.toFixed(2))
      })
    }
  }

  const filterGuides = (filters = {}) => {
    let result = [...guides.value]
    
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(g => 
        g.name.toLowerCase().includes(kw) ||
        g.phone.includes(kw)
      )
    }
    
    if (filters.languages && filters.languages.length > 0) {
      result = result.filter(g => 
        filters.languages.some(lang => g.languages.includes(lang))
      )
    }
    
    if (filters.specialties && filters.specialties.length > 0) {
      result = result.filter(g =>
        filters.specialties.some(spec => g.specialties.includes(spec))
      )
    }
    
    if (filters.level) {
      result = result.filter(g => g.level === filters.level)
    }

    if (filters.status === 'active') {
      result = result.filter(g => g.status === 'active' && !g.watchlist)
    } else if (filters.status === 'watchlist') {
      result = result.filter(g => g.watchlist)
    }
    
    return result
  }

  return {
    guides,
    loading,
    activeGuides,
    watchlistGuides,
    expiredHealthCertGuides,
    initGuides,
    getGuideById,
    addGuide,
    updateGuide,
    deleteGuide,
    addToWatchlist,
    removeFromWatchlist,
    updateAvgScore,
    filterGuides
  }
})
