import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS, storage } from '@/utils/storage'
import { mockTraining } from '@/data/mockData'
import { ANNUAL_TRAINING_HOURS } from '@/constants'

export const useTrainingStore = defineStore('training', () => {
  const trainingRecords = ref([])

  const initTraining = () => {
    const stored = storage.get(STORAGE_KEYS.TRAINING)
    if (stored && stored.length > 0) {
      trainingRecords.value = stored
    } else {
      trainingRecords.value = [...mockTraining]
      saveToStorage()
    }
  }

  const saveToStorage = () => {
    storage.set(STORAGE_KEYS.TRAINING, trainingRecords.value)
  }

  const getGuideTraining = (guideId, year) => {
    return trainingRecords.value.find(t => t.guideId === guideId && t.year === year) || 
           { guideId, year, hours: 0, courses: [] }
  }

  const getYearlyTraining = (year) => {
    return trainingRecords.value.filter(t => t.year === year)
  }

  const addTrainingHours = (guideId, year, hours, courseName) => {
    let record = trainingRecords.value.find(t => t.guideId === guideId && t.year === year)
    
    if (!record) {
      record = {
        guideId,
        year,
        hours: 0,
        courses: []
      }
      trainingRecords.value.push(record)
    }
    
    record.hours += hours
    if (courseName && !record.courses.includes(courseName)) {
      record.courses.push(courseName)
    }
    
    saveToStorage()
    return record
  }

  const updateTraining = (guideId, year, data) => {
    const index = trainingRecords.value.findIndex(t => t.guideId === guideId && t.year === year)
    if (index !== -1) {
      trainingRecords.value[index] = { ...trainingRecords.value[index], ...data }
      saveToStorage()
      return true
    }
    return false
  }

  const getInsufficientTraining = (year) => {
    return trainingRecords.value
      .filter(t => t.year === year && t.hours < ANNUAL_TRAINING_HOURS)
      .map(t => ({
        ...t,
        required: ANNUAL_TRAINING_HOURS,
        deficit: ANNUAL_TRAINING_HOURS - t.hours
      }))
      .sort((a, b) => b.deficit - a.deficit)
  }

  const trainingProgress = computed(() => {
    const year = new Date().getFullYear()
    const yearRecords = trainingRecords.value.filter(t => t.year === year)
    
    const total = yearRecords.length
    const completed = yearRecords.filter(t => t.hours >= ANNUAL_TRAINING_HOURS).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      year,
      total,
      completed,
      progress
    }
  })

  const getTrainingStats = (year) => {
    const yearRecords = trainingRecords.value.filter(t => t.year === year)
    
    const totalGuides = yearRecords.length
    const avgHours = totalGuides > 0 
      ? Math.round(yearRecords.reduce((sum, t) => sum + t.hours, 0) / totalGuides * 10) / 10
      : 0
    const completedCount = yearRecords.filter(t => t.hours >= ANNUAL_TRAINING_HOURS).length
    const completionRate = totalGuides > 0 ? Math.round(completedCount / totalGuides * 100) : 0
    
    return {
      totalGuides,
      avgHours,
      completedCount,
      completionRate,
      required: ANNUAL_TRAINING_HOURS
    }
  }

  return {
    trainingRecords,
    initTraining,
    getGuideTraining,
    getYearlyTraining,
    addTrainingHours,
    updateTraining,
    getInsufficientTraining,
    trainingProgress,
    getTrainingStats
  }
})
