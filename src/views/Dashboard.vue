<template>
  <div class="dashboard-page">
    <div class="stat-cards">
      <div class="stat-card primary">
        <span class="stat-card-icon">👨‍💼</span>
        <div class="stat-info">
          <div class="stat-card-title">导游总数</div>
          <div class="stat-card-value">{{ guideStore.guides.length }}</div>
        </div>
        <div class="stat-footer">
          <span class="text-green-600">在岗 {{ guideStore.activeGuides.length }} 人</span>
        </div>
      </div>
      <div class="stat-card success">
        <span class="stat-card-icon">📋</span>
        <div class="stat-info">
          <div class="stat-card-title">团组总数</div>
          <div class="stat-card-value">{{ groupStore.groups.length }}</div>
        </div>
        <div class="stat-footer">
          <span class="text-orange-600">待分配 {{ groupStore.pendingGroups.length }} 个</span>
        </div>
      </div>
      <div class="stat-card warning">
        <span class="stat-card-icon">⭐</span>
        <div class="stat-info">
          <div class="stat-card-title">平均评分</div>
          <div class="stat-card-value">{{ overallAvgScore.toFixed(1) }}</div>
        </div>
        <div class="stat-footer">
          <span class="text-orange-600">{{ lowScoreCount }} 人低分预警</span>
        </div>
      </div>
      <div class="stat-card info">
        <span class="stat-card-icon">💰</span>
        <div class="stat-info">
          <div class="stat-card-title">本月工资</div>
          <div class="stat-card-value">¥{{ formatMoney(monthSalaryTotal) }}</div>
        </div>
        <div class="stat-footer">
          <span class="text-blue-600">人均 ¥{{ formatMoney(monthSalaryAvg) }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title">月度接团趋势</div>
          <div class="chart-tabs">
            <button 
              v-for="type in chartTypes" 
              :key="type.value"
              :class="['tab-btn', { active: currentChart === type.value }]"
              @click="currentChart = type.value"
            >
              {{ type.label }}
            </button>
          </div>
        </div>
        <div class="chart-container">
          <div class="bar-chart">
            <div class="chart-y-axis">
              <span v-for="label in yAxisLabels" :key="label">{{ label }}</span>
            </div>
            <div class="chart-content">
              <div class="chart-bars">
                <div 
                  v-for="(item, index) in monthChartData" 
                  :key="index"
                  class="bar-group"
                >
                  <div class="bar-item">
                    <div 
                      class="bar-fill"
                      :style="{ height: getBarHeight(item.count) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-label">{{ item.month }}月</span>
                </div>
              </div>
              <div class="chart-x-label">
                <span>{{ currentYear }}年 各月接团数</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title">导游评分分布</div>
        </div>
        <div class="chart-container">
          <div class="score-distribution">
            <div 
              v-for="item in scoreDistribution" 
              :key="item.label"
              class="dist-item"
            >
              <div class="dist-info">
                <span class="dist-label">{{ item.label }}</span>
                <span class="dist-count">{{ item.count }} 人</span>
              </div>
              <div class="dist-bar">
                <div 
                  class="dist-fill"
                  :style="{ width: (item.count / maxGuideCount * 100) + '%' }"
                  :class="item.colorClass"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card list-card">
        <div class="card-header">
          <div class="card-title">近期待分配团组</div>
          <router-link to="/assign" class="view-all">查看全部 →</router-link>
        </div>
        <div class="pending-list">
          <div 
            v-for="group in recentPendingGroups" 
            :key="group.id"
            class="pending-item"
          >
            <div class="pending-info">
              <div class="pending-no">{{ group.groupNo }}</div>
              <div class="pending-dest">{{ group.destination }}</div>
              <div class="pending-meta">
                <span>📅 {{ group.startDate.slice(5) }}~{{ group.endDate.slice(5) }}</span>
                <span>👥 {{ group.peopleCount }}人</span>
              </div>
            </div>
            <div class="pending-tags">
              <span class="tag tag-blue">{{ group.route }}</span>
              <span class="tag tag-green">{{ group.guestSource }}</span>
            </div>
          </div>
          <div v-if="recentPendingGroups.length === 0" class="empty-state small">
            <div class="empty-text">暂无待分配团组</div>
          </div>
        </div>
      </div>

      <div class="card list-card">
        <div class="card-header">
          <div class="card-title">观察名单导游</div>
          <router-link to="/guide" class="view-all">查看全部 →</router-link>
        </div>
        <div class="watchlist">
          <div 
            v-for="guide in guideStore.watchlistGuides" 
            :key="guide.id"
            class="watchlist-item"
          >
            <span class="guide-avatar">{{ guide.photo }}</span>
            <div class="guide-info">
              <div class="guide-name">{{ guide.name }}</div>
              <div class="guide-reason">
                连续 {{ guide.consecutiveLowScoreMonths }} 个月评分低于3.5
              </div>
            </div>
            <span class="tag tag-red">观察中</span>
          </div>
          <div v-if="guideStore.watchlistGuides.length === 0" class="empty-state small">
            <div class="empty-icon">🎉</div>
            <div class="empty-text">无观察名单</div>
          </div>
        </div>
      </div>

      <div class="card list-card full-width">
        <div class="card-header">
          <div class="card-title">健康证即将到期</div>
        </div>
        <div class="health-alert-list">
          <div 
            v-for="guide in healthExpiringGuides" 
            :key="guide.id"
            class="health-item"
            :class="{ 'expired': isExpired(guide) }"
          >
            <span class="health-icon">🏥</span>
            <div class="health-info">
              <div class="health-name">{{ guide.name }}</div>
              <div class="health-date">
                有效期至：{{ guide.healthCertExpiry }}
                <span class="days-left">
                  ({{ getDaysLeft(guide) }}天后到期)
                </span>
              </div>
            </div>
            <span :class="['tag', isExpired(guide) ? 'tag-red' : 'tag-orange']">
              {{ isExpired(guide) ? '已过期' : '即将到期' }}
            </span>
          </div>
          <div v-if="healthExpiringGuides.length === 0" class="empty-state small">
            <div class="empty-icon">✅</div>
            <div class="empty-text">所有导游健康证有效</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGuideStore } from '@/stores/guide'
import { useGroupStore } from '@/stores/group'
import { useScoreStore } from '@/stores/score'
import { useSalaryStore } from '@/stores/salary'
import { useTrainingStore } from '@/stores/training'
import { WARNING_SCORE } from '@/constants'
import dayjs from 'dayjs'

const guideStore = useGuideStore()
const groupStore = useGroupStore()
const scoreStore = useScoreStore()
const salaryStore = useSalaryStore()
const trainingStore = useTrainingStore()

const currentYear = ref(dayjs().year())
const currentChart = ref('tours')

const chartTypes = [
  { value: 'tours', label: '接团数' },
  { value: 'revenue', label: '营收' }
]

const overallAvgScore = computed(() => {
  const guides = guideStore.guides.filter(g => g.totalTours > 0)
  if (guides.length === 0) return 0
  const sum = guides.reduce((acc, g) => acc + g.avgScore, 0)
  return sum / guides.length
})

const lowScoreCount = computed(() => {
  return guideStore.guides.filter(g => g.avgScore < WARNING_SCORE && g.totalTours > 0).length
})

const monthSalaryStats = computed(() => {
  const now = dayjs()
  const monthGroups = groupStore.getGroupsByMonth(now.year(), now.month() + 1)
    .filter(g => g.status === 'completed')
  
  const groupsByGuideMap = {}
  monthGroups.forEach(g => {
    if (!groupsByGuideMap[g.guideId]) {
      groupsByGuideMap[g.guideId] = []
    }
    groupsByGuideMap[g.guideId].push(g)
  })
  
  const salaries = salaryStore.getAllMonthlySalaries(guideStore.guides, groupsByGuideMap)
  return salaryStore.getSalaryStatistics(salaries)
})

const monthSalaryTotal = computed(() => monthSalaryStats.value.totalSalary)
const monthSalaryAvg = computed(() => monthSalaryStats.value.avgSalary)

const recentPendingGroups = computed(() => {
  return groupStore.pendingGroups
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
    .slice(0, 5)
})

const healthExpiringGuides = computed(() => {
  return guideStore.expiredHealthCertGuides.slice(0, 6)
})

const scoreDistribution = computed(() => {
  const ranges = [
    { label: '5分（优秀）', min: 4.5, max: 5, colorClass: 'color-excellent' },
    { label: '4-5分（良好）', min: 4, max: 4.5, colorClass: 'color-good' },
    { label: '3.5-4分（合格）', min: 3.5, max: 4, colorClass: 'color-ok' },
    { label: '3-3.5分（预警）', min: 3, max: 3.5, colorClass: 'color-warning' },
    { label: '3分以下（不合格）', min: 0, max: 3, colorClass: 'color-danger' }
  ]
  
  const guidesWithScore = guideStore.guides.filter(g => g.totalTours > 0)
  
  return ranges.map(r => ({
    ...r,
    count: guidesWithScore.filter(g => g.avgScore >= r.min && g.avgScore < r.max).length
  }))
})

const maxGuideCount = computed(() => {
  return Math.max(...scoreDistribution.value.map(d => d.count), 1)
})

const monthChartData = computed(() => {
  const data = []
  for (let i = 1; i <= 12; i++) {
    const groups = groupStore.getGroupsByMonth(currentYear.value, i)
    data.push({
      month: i,
      count: groups.length,
      revenue: groups.reduce((sum, g) => sum + g.quotedPrice, 0)
    })
  }
  return data
})

const maxToursCount = computed(() => {
  return Math.max(...monthChartData.value.map(d => d.count), 1)
})

const yAxisLabels = computed(() => {
  const max = maxToursCount.value
  const step = Math.ceil(max / 5)
  return [step * 5, step * 4, step * 3, step * 2, step, 0]
})

const getBarHeight = (count) => {
  return (count / maxToursCount.value) * 100
}

const isExpired = (guide) => {
  return dayjs(guide.healthCertExpiry).isBefore(dayjs())
}

const getDaysLeft = (guide) => {
  return dayjs(guide.healthCertExpiry).diff(dayjs(), 'day')
}

const formatMoney = (val) => {
  if (!val) return '0'
  return Math.round(val).toLocaleString()
}

onMounted(() => {
  guideStore.initGuides()
  groupStore.initGroups()
  scoreStore.initScores()
  trainingStore.initTraining()
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.stat-card.primary::before { background: #1890ff; }
.stat-card.success::before { background: #52c41a; }
.stat-card.warning::before { background: #faad14; }
.stat-card.info::before { background: #722ed1; }

.stat-card-icon {
  font-size: 36px;
  position: absolute;
  right: 20px;
  top: 20px;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.chart-card {
  grid-column: span 2;
}

.list-card {
  grid-column: span 1;
}

.list-card.full-width {
  grid-column: span 3;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-all {
  font-size: 13px;
  color: #1890ff;
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.chart-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.chart-container {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-chart {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 12px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 30px;
  font-size: 11px;
  color: #999;
  width: 40px;
  text-align: right;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  border-left: 1px solid #f0f0f0;
  padding-bottom: 0;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar-item {
  width: 70%;
  height: calc(100% - 20px);
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #40a9ff, #1890ff);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.chart-x-label {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.score-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.dist-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dist-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.dist-label {
  color: #666;
}

.dist-count {
  color: #333;
  font-weight: 500;
}

.dist-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.color-excellent { background: #52c41a; }
.color-good { background: #1890ff; }
.color-ok { background: #faad14; }
.color-warning { background: #fa8c16; }
.color-danger { background: #f5222d; }

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.2s;
}

.pending-item:hover {
  background: #f0f9ff;
}

.pending-info {
  flex: 1;
}

.pending-no {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.pending-dest {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.pending-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.pending-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.watchlist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.watchlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
}

.watchlist-item .guide-avatar {
  font-size: 24px;
}

.guide-info {
  flex: 1;
  min-width: 0;
}

.guide-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.guide-reason {
  font-size: 12px;
  color: #f5222d;
}

.health-alert-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
}

.health-item.expired {
  background: #fff1f0;
  border-color: #ffccc7;
}

.health-icon {
  font-size: 28px;
}

.health-info {
  flex: 1;
}

.health-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.health-date {
  font-size: 13px;
  color: #666;
}

.days-left {
  color: #fa8c16;
  font-weight: 500;
}

.health-item.expired .days-left {
  color: #f5222d;
}

.empty-state.small {
  padding: 30px 20px;
  text-align: center;
}

.empty-state.small .empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.text-green-600 { color: #52c41a; }
.text-orange-600 { color: #fa8c16; }
.text-blue-600 { color: #1890ff; }
</style>
