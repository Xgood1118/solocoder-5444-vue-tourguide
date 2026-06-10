<template>
  <div class="score-page">
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-icon">⭐</span>
        <div class="stat-card-title">总评分数</div>
        <div class="stat-card-value">{{ scoreStore.scores.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">📊</span>
        <div class="stat-card-title">平均评分</div>
        <div class="stat-card-value text-green-600">{{ overallAvg.toFixed(1) }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">⚠️</span>
        <div class="stat-card-title">低分导游</div>
        <div class="stat-card-value text-orange-600">{{ lowScoreGuides.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">🚫</span>
        <div class="stat-card-title">观察名单</div>
        <div class="stat-card-value text-red-600">{{ guideStore.watchlistGuides.length }}</div>
      </div>
    </div>

    <div class="score-content">
      <div class="card left-panel">
        <div class="card-header">
          <div class="card-title">低分预警导游</div>
        </div>
        <div class="warning-list">
          <div 
            v-for="item in lowScoreGuideDetails" 
            :key="item.guideId"
            class="warning-item"
            :class="{ 'danger': item.avgScore < 3.0 }"
            @click="selectGuide(item.guideId)"
          >
            <div class="warning-avatar">{{ item.guide?.photo }}</div>
            <div class="warning-info">
              <div class="warning-name">
                {{ item.guide?.name }}
                <span v-if="item.guide?.watchlist" class="tag tag-red">观察名单</span>
              </div>
              <div class="warning-score">
                <span class="score-star">★</span>
                <span :class="['score-num', { 'text-red-600': item.avgScore < 3.5 }]">
                  {{ item.avgScore.toFixed(1) }}
                </span>
                <span class="score-label">分</span>
              </div>
              <div class="warning-desc">
                <span v-if="item.consecutiveLowMonths > 0">
                  连续 <strong>{{ item.consecutiveLowMonths }}</strong> 个月低于{{ WARNING_SCORE }}分
                  <span v-if="item.consecutiveLowMonths >= 2" class="text-red-600">（即将进入观察名单）</span>
                </span>
                <span v-else>本月评分正常，历史平均分偏低</span>
              </div>
            </div>
          </div>

          <div v-if="lowScoreGuideDetails.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <div class="empty-text">所有导游评分良好</div>
          </div>
        </div>
      </div>

      <div class="card right-panel">
        <div class="card-header">
          <div class="card-title">
            {{ selectedGuide ? `导游评分详情 - ${selectedGuide.name}` : '导游评分列表' }}
          </div>
          <div class="header-actions">
            <select class="form-select" v-model="filterGuideId" style="width: 160px" @change="onGuideChange">
              <option value="">全部导游</option>
              <option v-for="g in guideStore.guides" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
            <button class="btn btn-primary btn-sm" @click="openAddScoreModal">
              + 新增评分
            </button>
          </div>
        </div>

        <div v-if="selectedGuide" class="guide-score-summary">
          <div class="summary-item">
            <span class="summary-label">累计带团</span>
            <span class="summary-value">{{ selectedGuide.totalTours }} 次</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">平均评分</span>
            <span :class="['summary-value', { 'text-orange-600': selectedGuide.avgScore < 3.5 }]">
              {{ selectedGuide.avgScore.toFixed(1) }} 分
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">评分次数</span>
            <span class="summary-value">{{ guideScores.length }} 次</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">连续低分</span>
            <span :class="['summary-value', { 'text-red-600': currentConsecutiveLow >= 3, 'text-orange-600': currentConsecutiveLow > 0 && currentConsecutiveLow < 3 }]">
              {{ currentConsecutiveLow }} 个月
            </span>
          </div>
        </div>

        <div v-if="selectedGuide && monthlyScoreTrend.length > 0" class="monthly-score-section">
          <div class="section-title">月度评分趋势</div>
          <div class="monthly-score-list">
            <div 
              v-for="ms in monthlyScoreTrend" 
              :key="ms.month" 
              class="monthly-score-item"
              :class="{ 'low': ms.avgScore < WARNING_SCORE }"
            >
              <span class="ms-month">{{ ms.month }}</span>
              <div class="ms-bar-wrap">
                <div class="ms-bar" :style="{ width: (ms.avgScore / 5 * 100) + '%' }"></div>
              </div>
              <span :class="['ms-score', { 'text-red-600': ms.avgScore < WARNING_SCORE }]">
                {{ ms.avgScore.toFixed(1) }}
              </span>
              <span class="ms-count">{{ ms.count }}单</span>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>导游</th>
              <th>团号</th>
              <th>服务态度</th>
              <th>专业度</th>
              <th>应变能力</th>
              <th>讲解水平</th>
              <th>平均分</th>
              <th>评价</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="score in displayScores" :key="score.id">
              <td class="text-sm">{{ score.created_at }}</td>
              <td>{{ getGuideName(score.guideId) }}</td>
              <td class="font-medium">{{ getGroupNo(score.groupId) }}</td>
              <td>
                <span class="star-display">
                  <span v-for="i in 5" :key="i" :class="['s-star', { active: i <= score.serviceAttitude }]">★</span>
                </span>
              </td>
              <td>
                <span class="star-display">
                  <span v-for="i in 5" :key="i" :class="['s-star', { active: i <= score.professional }]">★</span>
                </span>
              </td>
              <td>
                <span class="star-display">
                  <span v-for="i in 5" :key="i" :class="['s-star', { active: i <= score.adaptability }]">★</span>
                </span>
              </td>
              <td>
                <span class="star-display">
                  <span v-for="i in 5" :key="i" :class="['s-star', { active: i <= score.explanation }]">★</span>
                </span>
              </td>
              <td>
                <span :class="['score-badge', { 'low': score.avgScore < 3.5 }]">
                  {{ score.avgScore.toFixed(1) }}
                </span>
              </td>
              <td class="text-sm text-gray-600 max-w-200 truncate">{{ score.comment || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="displayScores.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无评分记录</div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">新增评分</div>
          <button class="modal-close" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">选择导游</label>
            <select class="form-select" v-model="scoreForm.guideId">
              <option value="">请选择导游</option>
              <option v-for="g in completedGuides" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">选择团组</label>
            <select class="form-select" v-model="scoreForm.groupId" :disabled="!scoreForm.guideId">
              <option value="">请选择团组</option>
              <option v-for="grp in guideCompletedGroups" :key="grp.id" :value="grp.id">
                {{ grp.groupNo }} - {{ grp.destination }}
              </option>
            </select>
          </div>
          
          <div class="score-input-section">
            <div class="score-input-item">
              <span class="score-input-label">服务态度</span>
              <div class="stars-input">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  :class="['star', { 'active': i <= scoreForm.serviceAttitude }]"
                  @click="scoreForm.serviceAttitude = i"
                >★</span>
              </div>
              <span class="score-input-val">{{ scoreForm.serviceAttitude }}分</span>
            </div>
            <div class="score-input-item">
              <span class="score-input-label">专业度</span>
              <div class="stars-input">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  :class="['star', { 'active': i <= scoreForm.professional }]"
                  @click="scoreForm.professional = i"
                >★</span>
              </div>
              <span class="score-input-val">{{ scoreForm.professional }}分</span>
            </div>
            <div class="score-input-item">
              <span class="score-input-label">应变能力</span>
              <div class="stars-input">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  :class="['star', { 'active': i <= scoreForm.adaptability }]"
                  @click="scoreForm.adaptability = i"
                >★</span>
              </div>
              <span class="score-input-val">{{ scoreForm.adaptability }}分</span>
            </div>
            <div class="score-input-item">
              <span class="score-input-label">讲解水平</span>
              <div class="stars-input">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  :class="['star', { 'active': i <= scoreForm.explanation }]"
                  @click="scoreForm.explanation = i"
                >★</span>
              </div>
              <span class="score-input-val">{{ scoreForm.explanation }}分</span>
            </div>
          </div>

          <div class="score-average">
            <span class="avg-label">平均分</span>
            <span :class="['avg-value', { 'low': avgScore < 3.5 }]">{{ avgScore.toFixed(1) }} 分</span>
          </div>

          <div class="form-item">
            <label class="form-label">客人评价</label>
            <textarea class="form-textarea" v-model="scoreForm.comment" placeholder="请输入客人评价（选填）"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeAddModal">取消</button>
          <button class="btn btn-primary" @click="saveScore">提交评分</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useScoreStore } from '@/stores/score'
import { useGuideStore } from '@/stores/guide'
import { useGroupStore } from '@/stores/group'
import { WARNING_SCORE } from '@/constants'

const scoreStore = useScoreStore()
const guideStore = useGuideStore()
const groupStore = useGroupStore()

const showAddModal = ref(false)
const filterGuideId = ref('')
const selectedGuideId = ref(null)

const scoreForm = reactive({
  guideId: '',
  groupId: '',
  serviceAttitude: 4,
  professional: 4,
  adaptability: 4,
  explanation: 4,
  comment: ''
})

const overallAvg = computed(() => {
  if (scoreStore.scores.length === 0) return 0
  const sum = scoreStore.scores.reduce((acc, s) => acc + s.avgScore, 0)
  return sum / scoreStore.scores.length
})

const lowScoreGuides = computed(() => scoreStore.lowScoreGuides)

const lowScoreGuideDetails = computed(() => {
  const result = lowScoreGuides.value.map(item => {
    const guide = guideStore.getGuideById(item.guideId)
    const consecutiveMonths = scoreStore.getConsecutiveLowScoreMonths(item.guideId)
    const monthlyScores = scoreStore.getMonthlyScores(item.guideId)
    return {
      ...item,
      guide,
      consecutiveLowMonths: consecutiveMonths,
      latestMonthAvg: monthlyScores.length > 0 ? monthlyScores[monthlyScores.length - 1].avgScore : 0
    }
  }).filter(item => item.guide)
  
  return result.sort((a, b) => b.consecutiveLowMonths - a.consecutiveLowMonths || a.avgScore - b.avgScore)
})

const selectedGuide = computed(() => {
  if (selectedGuideId.value) {
    return guideStore.getGuideById(selectedGuideId.value)
  }
  if (filterGuideId.value) {
    return guideStore.getGuideById(filterGuideId.value)
  }
  return null
})

const monthlyScoreTrend = computed(() => {
  const gid = selectedGuideId.value || filterGuideId.value
  if (!gid) return []
  const result = scoreStore.getMonthlyScores(gid)
  return result.slice(-6)
})

const currentConsecutiveLow = computed(() => {
  const gid = selectedGuideId.value || filterGuideId.value
  if (!gid) return 0
  return scoreStore.getConsecutiveLowScoreMonths(gid)
})

const guideScores = computed(() => {
  const gid = selectedGuideId.value || filterGuideId.value
  if (gid) {
    return scoreStore.getScoresByGuide(gid)
  }
  return scoreStore.scores.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const displayScores = computed(() => guideScores.value.slice(0, 20))

const completedGuides = computed(() => {
  return guideStore.guides.filter(g => g.status === 'active')
})

const guideCompletedGroups = computed(() => {
  if (!scoreForm.guideId) return []
  return groupStore.groups.filter(g => 
    g.guideId === scoreForm.guideId && g.status === 'completed'
  )
})

const avgScore = computed(() => {
  return (scoreForm.serviceAttitude + scoreForm.professional + 
          scoreForm.adaptability + scoreForm.explanation) / 4
})

const getGuideName = (id) => {
  const guide = guideStore.getGuideById(id)
  return guide?.name || '未知'
}

const getGroupNo = (id) => {
  const group = groupStore.getGroupById(id)
  return group?.groupNo || '未知'
}

const selectGuide = (guideId) => {
  selectedGuideId.value = guideId
}

const onGuideChange = () => {
  selectedGuideId.value = null
}

const openAddScoreModal = () => {
  scoreForm.guideId = ''
  scoreForm.groupId = ''
  scoreForm.serviceAttitude = 4
  scoreForm.professional = 4
  scoreForm.adaptability = 4
  scoreForm.explanation = 4
  scoreForm.comment = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const saveScore = () => {
  if (!scoreForm.guideId) {
    alert('请选择导游')
    return
  }
  if (!scoreForm.groupId) {
    alert('请选择团组')
    return
  }

  scoreStore.addScore({ ...scoreForm })
  guideStore.updateAvgScore(scoreForm.guideId, avgScore.value)

  const consecutiveLowMonths = scoreStore.getConsecutiveLowScoreMonths(scoreForm.guideId)
  const guide = guideStore.getGuideById(scoreForm.guideId)

  if (consecutiveLowMonths >= 3 && !guide.watchlist) {
    if (confirm(`该导游已连续 ${consecutiveLowMonths} 个月评分低于 ${WARNING_SCORE} 分，是否加入观察名单暂停派团？`)) {
      guideStore.addToWatchlist(scoreForm.guideId)
    }
  } else if (consecutiveLowMonths > 0 && !guide.watchlist) {
    alert(`该导游本月评分低于 ${WARNING_SCORE} 分，已连续 ${consecutiveLowMonths} 个月低分，请注意关注。\n连续 3 个月低分将自动进入观察名单。`)
  }

  closeAddModal()
  alert('评分提交成功')
}

onMounted(() => {
  scoreStore.initScores()
  guideStore.initGuides()
  groupStore.initGroups()
})
</script>

<style scoped>
.score-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-content {
  display: flex;
  gap: 20px;
  flex: 1;
}

.left-panel {
  width: 320px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.warning-item:hover {
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.2);
}

.warning-item.danger {
  background: #fff1f0;
  border-color: #ffccc7;
}

.warning-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.warning-info {
  flex: 1;
  min-width: 0;
}

.warning-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.warning-score {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.score-star {
  color: #faad14;
  font-size: 14px;
}

.score-num {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.score-label {
  font-size: 12px;
  color: #999;
}

.warning-desc {
  font-size: 12px;
  color: #999;
}

.guide-score-summary {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.score-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f6ffed;
  color: #52c41a;
  font-weight: 600;
  font-size: 13px;
}

.score-badge.low {
  background: #fff1f0;
  color: #f5222d;
}

.score-input-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.score-input-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.score-input-item:last-child {
  margin-bottom: 0;
}

.score-input-label {
  width: 80px;
  font-size: 14px;
  color: #666;
}

.stars-input {
  display: flex;
  gap: 4px;
}

.stars-input .star {
  font-size: 24px;
  color: #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
}

.stars-input .star:hover {
  transform: scale(1.1);
}

.stars-input .star.active {
  color: #faad14;
}

.score-input-val {
  width: 50px;
  font-size: 14px;
  color: #999;
}

.score-average {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #e6f7ff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.avg-label {
  font-size: 14px;
  color: #666;
}

.avg-value {
  font-size: 24px;
  font-weight: 700;
  color: #1890ff;
}

.avg-value.low {
  color: #f5222d;
}

.max-w-200 {
  max-width: 200px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-display {
  display: inline-flex;
  gap: 2px;
}

.s-star {
  color: #e8e8e8;
  font-size: 14px;
}

.s-star.active {
  color: #faad14;
}

.monthly-score-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.monthly-score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monthly-score-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monthly-score-item .ms-month {
  width: 80px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.monthly-score-item .ms-bar-wrap {
  flex: 1;
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.monthly-score-item .ms-bar {
  height: 100%;
  background: #52c41a;
  border-radius: 4px;
  transition: width 0.3s;
}

.monthly-score-item.low .ms-bar {
  background: #f5222d;
}

.monthly-score-item .ms-score {
  width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.monthly-score-item .ms-count {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #999;
}
</style>
