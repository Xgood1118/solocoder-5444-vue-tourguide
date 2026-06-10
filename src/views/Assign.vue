<template>
  <div class="assign-page">
    <div class="assign-header">
      <div class="date-navigator">
        <button class="btn btn-default btn-sm" @click="prevWeek">← 上周</button>
        <span class="current-date">{{ currentWeekLabel }}</span>
        <button class="btn btn-default btn-sm" @click="nextWeek">下周 →</button>
        <button class="btn btn-primary btn-sm" @click="goToday">今天</button>
      </div>
      <div class="view-toggle">
        <button :class="['btn btn-sm', viewMode === 'gantt' ? 'btn-primary' : 'btn-default']" @click="viewMode = 'gantt'">甘特图</button>
        <button :class="['btn btn-sm', viewMode === 'list' ? 'btn-primary' : 'btn-default']" @click="viewMode = 'list'">列表</button>
      </div>
    </div>

    <div class="assign-content">
      <div class="pending-panel">
        <div class="panel-header">
          <span class="panel-title">待分配团组</span>
          <span class="panel-count">{{ pendingGroups.length }}</span>
        </div>
        
        <div class="filter-bar small">
          <div class="filter-item">
            <label class="filter-label">线路</label>
            <select class="filter-select" v-model="pendingFilter.route">
              <option value="">全部</option>
              <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">语种</label>
            <select class="filter-select" v-model="pendingFilter.language">
              <option value="">全部</option>
              <option v-for="lang in LANGUAGES" :key="lang" :value="lang">{{ lang }}</option>
            </select>
          </div>
        </div>

        <div class="pending-list">
          <div 
            v-for="group in filteredPendingGroups" 
            :key="group.id"
            class="pending-item"
            draggable="true"
            @dragstart="onDragStart($event, group)"
            @dragend="onDragEnd"
          >
            <div class="pending-item-header">
              <span class="pending-no">{{ group.groupNo }}</span>
              <span :class="['tag', `tag-${routeColors[group.route]}`]">{{ group.route }}</span>
            </div>
            <div class="pending-item-dest">{{ group.destination }}</div>
            <div class="pending-item-info">
              <span>📅 {{ group.startDate.slice(5) }}~{{ group.endDate.slice(5) }}</span>
              <span>👥 {{ group.peopleCount }}人</span>
            </div>
            <div class="pending-item-source">
              <span class="tag tag-green">{{ group.guestSource }}</span>
              <span class="recommend-level">推荐：{{ getRecommendedLevel(group.guestSource) }}</span>
            </div>
            <div class="pending-item-drag">
              <span>↔ 拖拽分配</span>
            </div>
          </div>

          <div v-if="filteredPendingGroups.length === 0" class="empty-state small">
            <div class="empty-icon">✅</div>
            <div class="empty-text">暂无待分配团组</div>
          </div>
        </div>
      </div>

      <div class="schedule-panel">
        <div v-if="viewMode === 'gantt'" class="gantt-view">
          <div class="gantt-header">
            <div class="gantt-guide-col">导游</div>
            <div class="gantt-dates">
              <div 
                v-for="day in weekDays" 
                :key="day.date" 
                class="gantt-date-col"
                :class="{ 'today': day.isToday, 'weekend': day.isWeekend }"
              >
                <div class="date-day">{{ day.day }}</div>
                <div class="date-weekday">{{ day.weekday }}</div>
              </div>
            </div>
          </div>
          
          <div class="gantt-body">
            <div 
              v-for="guide in displayGuides" 
              :key="guide.id"
              class="gantt-row"
              @dragover.prevent="onDragOver"
              @drop="onDrop($event, guide)"
            >
              <div class="gantt-guide-col">
                <div class="guide-avatar-small">{{ guide.photo }}</div>
                <div class="guide-info-small">
                  <div class="guide-name-small">{{ guide.name }}</div>
                  <div class="guide-level-small">
                    <span :class="['level-tag-mini', `level-${guide.level}`]">{{ guide.level }}</span>
                  </div>
                </div>
              </div>
              <div class="gantt-dates">
                <div 
                  v-for="day in weekDays" 
                  :key="day.date" 
                  class="gantt-date-col"
                  :class="{ 'today': day.isToday, 'weekend': day.isWeekend }"
                >
                  <div 
                    v-for="tour in getGuideDayTours(guide.id, day.date)"
                    :key="tour.id"
                    class="tour-block"
                    :class="[
                      `tour-${tour.route}`,
                      { 'completed': tour.status === 'completed' }
                    ]"
                    :style="getTourBlockStyle(tour, day)"
                    @click="showTourDetail(tour)"
                  >
                    <span class="tour-block-text">{{ tour.destination }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="displayGuides.length === 0" class="empty-state">
              <div class="empty-icon">👨‍💼</div>
              <div class="empty-text">暂无导游数据</div>
            </div>
          </div>
        </div>

        <div v-else class="list-view">
          <table class="table">
            <thead>
              <tr>
                <th>团号</th>
                <th>目的地</th>
                <th>日期</th>
                <th>人数</th>
                <th>线路/来源</th>
                <th>导游</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in weekGroups" :key="group.id">
                <td class="font-medium">{{ group.groupNo }}</td>
                <td>{{ group.destination }}</td>
                <td class="text-sm">{{ group.startDate }} ~ {{ group.endDate }}</td>
                <td>{{ group.peopleCount }}人</td>
                <td>
                  <span class="tag tag-blue">{{ group.route }}</span>
                  <span class="tag tag-green">{{ group.guestSource }}</span>
                </td>
                <td>
                  <template v-if="group.guideId">
                    {{ getGuideName(group.guideId) }}
                  </template>
                  <template v-else>
                    <span class="text-gray-500">未分配</span>
                  </template>
                </td>
                <td>
                  <span :class="['tag', statusClass[group.status]]">
                    {{ statusText[group.status] }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="!group.guideId"
                    class="btn btn-primary btn-sm" 
                    @click="openAssignModal(group)"
                  >
                    分配导游
                  </button>
                  <button 
                    v-else
                    class="btn btn-danger btn-sm" 
                    @click="unassignGroup(group)"
                  >
                    取消分配
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">为团组 {{ currentAssignGroup?.groupNo }} 分配导游</div>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>
        <div class="modal-body">
          <div class="assign-group-info">
            <div class="info-item">
              <span class="info-label">目的地：</span>
              <span class="info-value">{{ currentAssignGroup?.destination }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">日期：</span>
              <span class="info-value">{{ currentAssignGroup?.startDate }} ~ {{ currentAssignGroup?.endDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">线路：</span>
              <span class="info-value">{{ currentAssignGroup?.route }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">推荐等级：</span>
              <span :class="['level-tag', `level-${currentAssignGroup ? getRecommendedLevel(currentAssignGroup.guestSource) : ''}`]">
                {{ currentAssignGroup ? getRecommendedLevel(currentAssignGroup.guestSource) : '' }}
              </span>
            </div>
          </div>

          <div class="filter-bar small">
            <div class="filter-item">
              <label class="filter-label">语种</label>
              <select class="filter-select" v-model="assignFilter.languages">
                <option value="">全部</option>
                <option v-for="lang in LANGUAGES" :key="lang" :value="lang">{{ lang }}</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">擅长线路</label>
              <select class="filter-select" v-model="assignFilter.specialties">
                <option value="">全部</option>
                <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-label">等级</label>
              <select class="filter-select" v-model="assignFilter.level">
                <option value="">全部</option>
                <option v-for="lvl in GUIDE_LEVELS" :key="lvl.value" :value="lvl.value">{{ lvl.label }}</option>
              </select>
            </div>
          </div>

          <div class="available-guides-list">
            <div 
              v-for="guide in availableGuidesForAssign" 
              :key="guide.id"
              class="available-guide-card"
              @click="selectGuide(guide)"
            >
              <div class="guide-avatar-small">{{ guide.photo }}</div>
              <div class="guide-main-info">
                <div class="guide-name-row">
                  <span class="guide-name">{{ guide.name }}</span>
                  <span :class="['level-tag-mini', `level-${guide.level}`]">{{ guide.level }}</span>
                </div>
                <div class="guide-languages-row">
                  <span v-for="lang in guide.languages" :key="lang" class="tag tag-blue tag-sm">{{ lang }}</span>
                </div>
                <div class="guide-stats-row">
                  <span>带团 {{ guide.totalTours }} 次</span>
                  <span :class="{ 'text-orange-600': guide.avgScore < 3.5 }">
                    评分 {{ guide.avgScore.toFixed(1) }}
                  </span>
                </div>
              </div>
              <div class="guide-select-btn">
                <button class="btn btn-primary btn-sm">选择</button>
              </div>
            </div>

            <div v-if="availableGuidesForAssign.length === 0" class="empty-state">
              <div class="empty-icon">😕</div>
              <div class="empty-text">没有符合条件的空闲导游</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeAssignModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="showTourModal" class="modal-overlay" @click.self="closeTourModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">团组详情</div>
          <button class="modal-close" @click="closeTourModal">×</button>
        </div>
        <div class="modal-body" v-if="currentTour">
          <div class="detail-row">
            <span class="detail-label">团号：</span>
            <span class="detail-value font-medium">{{ currentTour.groupNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">目的地：</span>
            <span class="detail-value">{{ currentTour.destination }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">日期：</span>
            <span class="detail-value">{{ currentTour.startDate }} ~ {{ currentTour.endDate }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">人数：</span>
            <span class="detail-value">{{ currentTour.peopleCount }}人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">导游：</span>
            <span class="detail-value">{{ getGuideName(currentTour.guideId) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态：</span>
            <span :class="['tag', statusClass[currentTour.status]]">{{ statusText[currentTour.status] }}</span>
          </div>
          <div class="detail-row" v-if="currentTour.notes">
            <span class="detail-label">备注：</span>
            <span class="detail-value">{{ currentTour.notes }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="currentTour?.status !== 'completed'"
            class="btn btn-danger" 
            @click="cancelAssign"
          >
            取消分配
          </button>
          <button class="btn btn-default" @click="closeTourModal">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useGroupStore } from '@/stores/group'
import { useGuideStore } from '@/stores/guide'
import { LANGUAGES, GUIDE_LEVELS, ROUTE_TYPES, getRecommendedLevel } from '@/constants'
import { dateOverlap } from '@/utils/storage'
import dayjs from 'dayjs'

const groupStore = useGroupStore()
const guideStore = useGuideStore()

const isGuideAvailable = (guideId, startDate, endDate, excludeGroupId = null) => {
  const assignments = groupStore.groups.filter(g => 
    g.guideId === guideId && 
    g.status !== 'completed' &&
    g.id !== excludeGroupId
  )
  
  return !assignments.some(a => 
    dateOverlap(startDate, endDate, a.startDate, a.endDate)
  )
}

const getAvailableGuides = (startDate, endDate, filters = {}) => {
  const filtered = guideStore.filterGuides(filters)
  return filtered.filter(g => 
    g.status === 'active' && 
    !g.watchlist &&
    isGuideAvailable(g.id, startDate, endDate)
  )
}

const viewMode = ref('gantt')
const currentDate = ref(dayjs())
const showAssignModal = ref(false)
const showTourModal = ref(false)
const currentAssignGroup = ref(null)
const currentTour = ref(null)
const dragGroup = ref(null)
const isDragging = ref(false)

const pendingFilter = reactive({
  route: '',
  language: ''
})

const assignFilter = reactive({
  languages: '',
  specialties: '',
  level: ''
})

const statusText = {
  pending: '待分配',
  assigned: '已分配',
  completed: '已完成'
}

const statusClass = {
  pending: 'tag-orange',
  assigned: 'tag-blue',
  completed: 'tag-green'
}

const routeColors = {
  '出境': 'purple',
  '国内': 'blue',
  '周边': 'green',
  '亲子': 'orange',
  '老年': 'cyan'
}

const currentWeekLabel = computed(() => {
  const start = currentDate.value.startOf('week')
  const end = currentDate.value.endOf('week')
  return `${start.format('YYYY年MM月DD日')} - ${end.format('MM月DD日')}`
})

const weekDays = computed(() => {
  const start = currentDate.value.startOf('week')
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = start.add(i, 'day')
    days.push({
      date: day.format('YYYY-MM-DD'),
      day: day.format('DD'),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][day.day()],
      isToday: day.isSame(dayjs(), 'day'),
      isWeekend: day.day() === 0 || day.day() === 6
    })
  }
  return days
})

const weekStart = computed(() => currentDate.value.startOf('week').format('YYYY-MM-DD'))
const weekEnd = computed(() => currentDate.value.endOf('week').format('YYYY-MM-DD'))

const pendingGroups = computed(() => groupStore.pendingGroups)

const filteredPendingGroups = computed(() => {
  let result = pendingGroups.value
  if (pendingFilter.route) {
    result = result.filter(g => g.route === pendingFilter.route)
  }
  return result.sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
})

const displayGuides = computed(() => {
  return guideStore.guides.filter(g => g.status === 'active')
})

const weekGroups = computed(() => {
  return groupStore.getGroupsByDateRange(weekStart.value, weekEnd.value)
})

const getGuideDayTours = (guideId, date) => {
  return weekGroups.value.filter(g => 
    g.guideId === guideId &&
    dayjs(date).isBetween(g.startDate, g.endDate, 'day', '[]')
  )
}

const getTourBlockStyle = (tour, day) => {
  const start = dayjs(tour.startDate)
  const end = dayjs(tour.endDate)
  const current = dayjs(day.date)
  
  const weekStartDay = currentDate.value.startOf('week')
  const colWidth = 100 / 7
  
  let leftOffset = 0
  let width = 1
  
  if (current.isSame(start, 'day')) {
    const daysInWeek = end.diff(weekStartDay, 'day') + 1
    width = Math.min(daysInWeek, end.diff(start, 'day') + 1)
  } else if (current.isSame(weekStartDay, 'week') && start.isBefore(weekStartDay)) {
    const daysFromWeekStart = end.diff(weekStartDay, 'day') + 1
    width = Math.min(7, daysFromWeekStart)
  } else if (!current.isSame(start, 'day') && !current.isSame(weekStartDay, 'week')) {
    return { display: 'none' }
  }
  
  const startDayOfWeek = start.day()
  leftOffset = startDayOfWeek * colWidth
  
  if (start.isBefore(weekStartDay)) {
    leftOffset = 0
  }
  
  return {
    left: `${leftOffset}%`,
    width: `${width * colWidth - 2}%`
  }
}

const availableGuidesForAssign = computed(() => {
  if (!currentAssignGroup.value) return []
  
  const filters = {}
  if (assignFilter.languages) filters.languages = [assignFilter.languages]
  if (assignFilter.specialties) filters.specialties = [assignFilter.specialties]
  if (assignFilter.level) filters.level = assignFilter.level
  
  return getAvailableGuides(
    currentAssignGroup.value.startDate,
    currentAssignGroup.value.endDate,
    filters
  )
})

const getGuideName = (id) => {
  const guide = guideStore.getGuideById(id)
  return guide?.name || '未知'
}

const prevWeek = () => {
  currentDate.value = currentDate.value.subtract(1, 'week')
}

const nextWeek = () => {
  currentDate.value = currentDate.value.add(1, 'week')
}

const goToday = () => {
  currentDate.value = dayjs()
}

const onDragStart = (e, group) => {
  dragGroup.value = group
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
}

const onDragEnd = () => {
  isDragging.value = false
  dragGroup.value = null
}

const onDragOver = (e) => {
  e.dataTransfer.dropEffect = 'move'
}

const onDrop = (e, guide) => {
  if (!dragGroup.value) return
  
  const group = dragGroup.value
  const available = isGuideAvailable(guide.id, group.startDate, group.endDate)
  
  if (!available) {
    alert(`导游 ${guide.name} 在此时间段已有团，无法分配！`)
    return
  }
  
  if (guide.watchlist) {
    alert(`导游 ${guide.name} 在观察名单中，暂停派团！`)
    return
  }
  
  if (confirm(`确定将团组 ${group.groupNo} 分配给导游 ${guide.name} 吗？`)) {
    groupStore.assignGuide(group.id, guide.id)
  }
  
  isDragging.value = false
  dragGroup.value = null
}

const showTourDetail = (tour) => {
  currentTour.value = tour
  showTourModal.value = true
}

const closeTourModal = () => {
  showTourModal.value = false
  currentTour.value = null
}

const cancelAssign = () => {
  if (currentTour.value && confirm('确定要取消该团的导游分配吗？')) {
    groupStore.unassignGuide(currentTour.value.id)
    closeTourModal()
  }
}

const openAssignModal = (group) => {
  currentAssignGroup.value = group
  assignFilter.languages = ''
  assignFilter.specialties = ''
  assignFilter.level = ''
  showAssignModal.value = true
}

const closeAssignModal = () => {
  showAssignModal.value = false
  currentAssignGroup.value = null
}

const selectGuide = (guide) => {
  if (!currentAssignGroup.value) return
  
  if (confirm(`确定将团组 ${currentAssignGroup.value.groupNo} 分配给导游 ${guide.name} 吗？`)) {
    groupStore.assignGuide(currentAssignGroup.value.id, guide.id)
    closeAssignModal()
  }
}

const unassignGroup = (group) => {
  if (confirm(`确定取消导游 ${getGuideName(group.guideId)} 的分配吗？`)) {
    groupStore.unassignGuide(group.id)
  }
}

onMounted(() => {
  groupStore.initGroups()
  guideStore.initGuides()
})
</script>

<style scoped>
.assign-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.date-navigator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-date {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  min-width: 240px;
  text-align: center;
}

.view-toggle {
  display: flex;
  gap: 0;
}

.view-toggle .btn:first-child {
  border-radius: 6px 0 0 6px;
}

.view-toggle .btn:last-child {
  border-radius: 0 6px 6px 0;
}

.assign-content {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.pending-panel {
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.panel-count {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.filter-bar.small {
  padding: 10px 12px;
  margin: 0;
  background: #fafafa;
  border-radius: 0;
  flex-wrap: wrap;
}

.filter-bar.small .filter-item {
  width: 100%;
}

.filter-bar.small .filter-select,
.filter-bar.small .filter-input {
  width: 100%;
}

.pending-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pending-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  cursor: grab;
  transition: all 0.2s;
}

.pending-item:hover {
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  border-color: #40a9ff;
}

.pending-item:active {
  cursor: grabbing;
}

.pending-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pending-no {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.pending-item-dest {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.pending-item-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.pending-item-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.recommend-level {
  font-size: 12px;
  color: #999;
}

.pending-item-drag {
  text-align: center;
  padding-top: 8px;
  border-top: 1px dashed #e8e8e8;
  font-size: 11px;
  color: #999;
}

.schedule-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gantt-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.gantt-header {
  display: flex;
  background: #fafafa;
  border-bottom: 2px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.gantt-guide-col {
  width: 160px;
  min-width: 160px;
  padding: 12px;
  font-weight: 600;
  color: #333;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gantt-dates {
  flex: 1;
  display: flex;
}

.gantt-date-col {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 8px 4px;
  border-right: 1px solid #f0f0f0;
}

.gantt-date-col.today {
  background: #e6f7ff;
}

.gantt-date-col.weekend {
  background: #fafafa;
}

.date-day {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.date-weekday {
  font-size: 12px;
  color: #999;
}

.gantt-body {
  flex: 1;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 60px;
}

.gantt-row:hover {
  background: #fafafa;
}

.gantt-row .gantt-date-col {
  position: relative;
  padding: 0;
  min-height: 60px;
}

.guide-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.guide-info-small {
  flex: 1;
  min-width: 0;
}

.guide-name-small {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guide-level-small {
  margin-top: 2px;
}

.level-tag-mini {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.level-初级 { background: #f6ffed; color: #52c41a; }
.level-中级 { background: #e6f7ff; color: #1890ff; }
.level-高级 { background: #f9f0ff; color: #722ed1; }
.level-金牌 { background: #fffbe6; color: #d4b106; }

.tour-block {
  position: absolute;
  top: 6px;
  height: 44px;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  z-index: 5;
}

.tour-block:hover {
  transform: scale(1.02);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tour-block.completed {
  opacity: 0.7;
}

.tour-出境 { background: linear-gradient(135deg, #722ed1, #9254de); }
.tour-国内 { background: linear-gradient(135deg, #1890ff, #40a9ff); }
.tour-周边 { background: linear-gradient(135deg, #52c41a, #73d13d); }
.tour-亲子 { background: linear-gradient(135deg, #fa8c16, #ffa940); }
.tour-老年 { background: linear-gradient(135deg, #13c2c2, #36cfc9); }

.tour-block-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state.small {
  padding: 30px 20px;
}

.empty-state.small .empty-icon {
  font-size: 36px;
}

.modal-lg {
  max-width: 700px;
}

.assign-group-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.available-guides-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.available-guide-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.available-guide-card:hover {
  border-color: #40a9ff;
  background: #f0f9ff;
}

.guide-main-info {
  flex: 1;
}

.guide-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.guide-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.guide-languages-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.tag-sm {
  font-size: 11px;
  padding: 1px 6px;
}

.guide-stats-row {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;
}

.detail-label {
  color: #999;
  flex-shrink: 0;
  min-width: 80px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #999;
}

.text-orange-600 {
  color: #fa8c16;
}

.list-view {
  flex: 1;
  overflow: auto;
}
</style>
