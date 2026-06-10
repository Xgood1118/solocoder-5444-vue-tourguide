import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS, storage, generateId, dateOverlap } from '@/utils/storage'
import { mockGroups } from '@/data/mockData'
import dayjs from 'dayjs'

export const useGroupStore = defineStore('group', () => {
  const groups = ref([])

  const initGroups = () => {
    const stored = storage.get(STORAGE_KEYS.GROUPS)
    if (stored && stored.length > 0) {
      groups.value = stored.map(g => ({
        status: 'pending',
        guideId: null,
        peopleCount: 20,
        budget: 0,
        quotedPrice: 0,
        ...g
      }))
      saveToStorage()
    } else {
      groups.value = [...mockGroups]
      saveToStorage()
    }
  }

  const saveToStorage = () => {
    storage.set(STORAGE_KEYS.GROUPS, groups.value)
  }

  const pendingGroups = computed(() => {
    return groups.value.filter(g => g.status === 'pending')
  })

  const assignedGroups = computed(() => {
    return groups.value.filter(g => g.status === 'assigned')
  })

  const completedGroups = computed(() => {
    return groups.value.filter(g => g.status === 'completed')
  })

  const getGroupById = (id) => {
    return groups.value.find(g => g.id === id)
  }

  const addGroup = (groupData) => {
    const newGroup = {
      id: generateId(),
      status: 'pending',
      guideId: null,
      ...groupData
    }
    groups.value.push(newGroup)
    saveToStorage()
    return newGroup
  }

  const updateGroup = (id, data) => {
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...data }
      saveToStorage()
      return true
    }
    return false
  }

  const deleteGroup = (id) => {
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  const assignGuide = (groupId, guideId) => {
    return updateGroup(groupId, { guideId, status: 'assigned' })
  }

  const unassignGuide = (groupId) => {
    return updateGroup(groupId, { guideId: null, status: 'pending' })
  }

  const completeGroup = (groupId) => {
    return updateGroup(groupId, { status: 'completed' })
  }

  const getGroupsByDateRange = (startDate, endDate) => {
    return groups.value.filter(g => 
      dateOverlap(g.startDate, g.endDate, startDate, endDate)
  )}

  const getGroupsByGuide = (guideId) => {
    return groups.value.filter(g => g.guideId === guideId)
  }

  const getGroupsByMonth = (year, month) => {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month')
    const end = start.endOf('month')
    return groups.value.filter(g => {
      const groupStart = dayjs(g.startDate)
      const groupEnd = dayjs(g.endDate)
      return groupStart.isBefore(end) && groupEnd.isAfter(start)
    })
  }

  const filterGroups = (filters = {}) => {
    let result = [...groups.value]
    
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(g => 
        g.groupNo.toLowerCase().includes(kw) ||
        g.destination.toLowerCase().includes(kw)
      )
    }
    
    if (filters.status) {
      result = result.filter(g => g.status === filters.status)
    }
    
    if (filters.route) {
      result = result.filter(g => g.route === filters.route)
    }
    
    if (filters.guestSource) {
      result = result.filter(g => g.guestSource === filters.guestSource)
    }

    if (filters.startDate) {
      result = result.filter(g => dayjs(g.startDate).isSameOrAfter(filters.startDate))
    }

    if (filters.endDate) {
      result = result.filter(g => dayjs(g.endDate).isSameOrBefore(filters.endDate))
    }
    
    return result.sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
  }

  const getProfit = (group) => {
    return group.quotedPrice - group.budget
  }

  const getProfitMargin = (group) => {
    if (group.budget === 0) return 0
    return ((group.quotedPrice - group.budget) / group.budget * 100).toFixed(1)
  }

  return {
    groups,
    pendingGroups,
    assignedGroups,
    completedGroups,
    initGroups,
    getGroupById,
    addGroup,
    updateGroup,
    deleteGroup,
    assignGuide,
    unassignGuide,
    completeGroup,
    getGroupsByDateRange,
    getGroupsByGuide,
    getGroupsByMonth,
    filterGroups,
    getProfit,
    getProfitMargin
  }
})
