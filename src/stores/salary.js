import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  DAILY_ALLOWANCE_BASE, 
  ROUTE_COEFFICIENTS, 
  getLevelMultiplier 
} from '@/constants'
import { daysBetween } from '@/utils/storage'

export const useSalaryStore = defineStore('salary', () => {
  const salesCommissions = ref([])

  const calculateDailyAllowance = (guideLevel, groupRoute, days, peopleCount) => {
    const levelMultiplier = getLevelMultiplier(guideLevel)
    const routeCoefficient = ROUTE_COEFFICIENTS[groupRoute] || 1
    return DAILY_ALLOWANCE_BASE * days * peopleCount * levelMultiplier * routeCoefficient / 10
  }

  const calculateGroupSalary = (guide, group) => {
    if (!guide || !group) return { base: 0, allowance: 0, commission: 0, total: 0 }
    
    const days = daysBetween(group.startDate, group.endDate)
    const allowance = calculateDailyAllowance(guide.level, group.route, days, group.peopleCount)
    
    const commission = salesCommissions.value
      .filter(c => c.groupId === group.id && c.guideId === guide.id)
      .reduce((sum, c) => sum + c.amount, 0)
    
    return {
      base: guide.baseSalary / 30 * days,
      allowance: Math.round(allowance * 100) / 100,
      commission,
      total: Math.round((allowance + commission) * 100) / 100
    }
  }

  const getMonthlySalary = (guide, monthGroups) => {
    if (!guide) return null
    
    let totalAllowance = 0
    let totalCommission = 0
    
    monthGroups.forEach(group => {
      const days = daysBetween(group.startDate, group.endDate)
      totalAllowance += calculateDailyAllowance(guide.level, group.route, days, group.peopleCount)
      totalCommission += salesCommissions.value
        .filter(c => c.groupId === group.id && c.guideId === guide.id)
        .reduce((sum, c) => sum + c.amount, 0)
    })
    
    return {
      guideId: guide.id,
      guideName: guide.name,
      baseSalary: guide.baseSalary,
      tourAllowance: Math.round(totalAllowance * 100) / 100,
      salesCommission: totalCommission,
      totalSalary: Math.round((guide.baseSalary + totalAllowance + totalCommission) * 100) / 100,
      tourCount: monthGroups.length
    }
  }

  const getAllMonthlySalaries = (guides, groupsByGuideMap) => {
    return guides
      .filter(g => g.status === 'active')
      .map(guide => {
        const monthGroups = groupsByGuideMap[guide.id] || []
        return getMonthlySalary(guide, monthGroups)
      })
      .filter(Boolean)
      .sort((a, b) => b.totalSalary - a.totalSalary)
  }

  const addSalesCommission = (guideId, groupId, amount, description) => {
    const commission = {
      id: Date.now().toString(36),
      guideId,
      groupId,
      amount,
      description,
      date: new Date().toISOString().split('T')[0]
    }
    salesCommissions.value.push(commission)
    return commission
  }

  const getSalaryStatistics = (salaries) => {
    if (!salaries || salaries.length === 0) {
      return {
        totalSalary: 0,
        avgSalary: 0,
        maxSalary: 0,
        minSalary: 0,
        totalTours: 0,
        salaryDistribution: []
      }
    }
    
    const totalSalary = salaries.reduce((sum, s) => sum + s.totalSalary, 0)
    const totalTours = salaries.reduce((sum, s) => sum + s.tourCount, 0)
    
    const ranges = [
      { label: '3k以下', min: 0, max: 3000 },
      { label: '3k-5k', min: 3000, max: 5000 },
      { label: '5k-8k', min: 5000, max: 8000 },
      { label: '8k-10k', min: 8000, max: 10000 },
      { label: '10k以上', min: 10000, max: Infinity }
    ]
    
    const salaryDistribution = ranges.map(r => ({
      label: r.label,
      count: salaries.filter(s => s.totalSalary >= r.min && s.totalSalary < r.max).length
    }))
    
    return {
      totalSalary: Math.round(totalSalary),
      avgSalary: Math.round(totalSalary / salaries.length),
      maxSalary: Math.round(Math.max(...salaries.map(s => s.totalSalary))),
      minSalary: Math.round(Math.min(...salaries.map(s => s.totalSalary))),
      totalTours,
      salaryDistribution
    }
  }

  return {
    salesCommissions,
    calculateDailyAllowance,
    calculateGroupSalary,
    getMonthlySalary,
    getAllMonthlySalaries,
    addSalesCommission,
    getSalaryStatistics
  }
})
