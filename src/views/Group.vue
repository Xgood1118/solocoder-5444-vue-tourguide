<template>
  <div class="group-page">
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-icon">📋</span>
        <div class="stat-card-title">团组总数</div>
        <div class="stat-card-value">{{ groupStore.groups.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">⏳</span>
        <div class="stat-card-title">待分配</div>
        <div class="stat-card-value text-orange-600">{{ groupStore.pendingGroups.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">✅</span>
        <div class="stat-card-title">已分配</div>
        <div class="stat-card-value text-blue-600">{{ groupStore.assignedGroups.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">🎉</span>
        <div class="stat-card-title">已完成</div>
        <div class="stat-card-value text-green-600">{{ groupStore.completedGroups.length }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">团组管理</div>
        <button class="btn btn-primary" @click="openAddModal">
          <span>+</span>
          <span>新增团组</span>
        </button>
      </div>

      <div class="filter-bar">
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <input 
            type="text" 
            class="filter-input" 
            placeholder="团号/目的地"
            v-model="filters.keyword"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">状态</label>
          <select class="filter-select" v-model="filters.status">
            <option value="">全部状态</option>
            <option value="pending">待分配</option>
            <option value="assigned">已分配</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">线路</label>
          <select class="filter-select" v-model="filters.route">
            <option value="">全部线路</option>
            <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">客人来源</label>
          <select class="filter-select" v-model="filters.guestSource">
            <option value="">全部来源</option>
            <option v-for="src in GUEST_SOURCES" :key="src.value" :value="src.value">{{ src.label }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">出发日期</label>
          <input type="date" class="filter-input" v-model="filters.startDate" />
        </div>
        <button class="btn btn-default btn-sm" @click="resetFilters">重置</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>团号</th>
            <th>目的地</th>
            <th>日期</th>
            <th>人数</th>
            <th>线路/来源</th>
            <th>预算/报价</th>
            <th>毛利</th>
            <th>导游</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in filteredGroups" :key="group.id">
            <td class="font-medium">{{ group.groupNo }}</td>
            <td>{{ group.destination }}</td>
            <td class="text-sm text-gray-600">
              {{ group.startDate }} ~ {{ group.endDate }}
              <div class="text-xs text-gray-500">{{ getDaysText(group) }}</div>
            </td>
            <td>{{ group.peopleCount }}人</td>
            <td>
              <span class="tag tag-blue">{{ group.route }}</span>
              <span class="tag tag-green">{{ group.guestSource }}</span>
            </td>
            <td class="text-sm">
              <div>预算：¥{{ formatMoney(group.budget) }}</div>
              <div>报价：¥{{ formatMoney(group.quotedPrice) }}</div>
            </td>
            <td>
              <span :class="getProfitClass(group)">
                ¥{{ formatMoney(getProfit(group)) }}
              </span>
              <div class="text-xs text-gray-500">{{ groupStore.getProfitMargin(group) }}%</div>
            </td>
            <td>
              <template v-if="group.guideId">
                {{ getGuideName(group.guideId) }}
              </template>
              <template v-else>
                <span class="text-gray-500">-</span>
              </template>
            </td>
            <td>
              <span :class="['tag', statusClass[group.status]]">
                {{ statusText[group.status] }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn btn-default btn-sm" @click="viewGroup(group)">详情</button>
                <button class="btn btn-primary btn-sm" @click="editGroup(group)">编辑</button>
                <button 
                  v-if="group.status !== 'completed'"
                  class="btn btn-danger btn-sm" 
                  @click="deleteGroup(group)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredGroups.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无团组数据</div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ isEdit ? '编辑团组' : '新增团组' }}</div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">团号</label>
            <input type="text" class="form-input" v-model="form.groupNo" placeholder="如：SH-20260615-001" />
          </div>
          <div class="form-item">
            <label class="form-label">目的地</label>
            <input type="text" class="form-input" v-model="form.destination" placeholder="请输入目的地" />
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">出发日期</label>
              <input type="date" class="form-input" v-model="form.startDate" />
            </div>
            <div class="form-item">
              <label class="form-label">结束日期</label>
              <input type="date" class="form-input" v-model="form.endDate" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">人数</label>
              <input type="number" class="form-input" v-model.number="form.peopleCount" placeholder="人数" />
            </div>
            <div class="form-item">
              <label class="form-label">线路</label>
              <select class="form-select" v-model="form.route">
                <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">客人来源</label>
              <select class="form-select" v-model="form.guestSource">
                <option v-for="src in GUEST_SOURCES" :key="src.value" :value="src.value">{{ src.label }}</option>
              </select>
              <div class="form-tip">推荐导游等级：{{ getRecommendedLevel(form.guestSource) }}</div>
            </div>
            <div class="form-item">
              <label class="form-label">推荐等级</label>
              <div class="recommend-level">
                <span :class="['level-tag', `level-${getRecommendedLevel(form.guestSource)}`]">
                  {{ getRecommendedLevel(form.guestSource) }}
                </span>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">预算（元）</label>
              <input type="number" class="form-input" v-model.number="form.budget" placeholder="客户预算上限" />
            </div>
            <div class="form-item">
              <label class="form-label">报价（元）</label>
              <input type="number" class="form-input" v-model.number="form.quotedPrice" placeholder="实际报价" />
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea class="form-textarea" v-model="form.notes" placeholder="特殊要求、景点等"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveGroup">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="modal-overlay" @click.self="closeDetail">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">团组详情 - {{ detailGroup?.groupNo }}</div>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="modal-body" v-if="detailGroup">
          <div class="detail-section">
            <h4 class="detail-section-title">基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">团号</span>
                <span class="detail-value">{{ detailGroup.groupNo }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">目的地</span>
                <span class="detail-value">{{ detailGroup.destination }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">日期</span>
                <span class="detail-value">{{ detailGroup.startDate }} ~ {{ detailGroup.endDate }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">天数</span>
                <span class="detail-value">{{ getDays(detailGroup) }}天</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">人数</span>
                <span class="detail-value">{{ detailGroup.peopleCount }}人</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">线路</span>
                <span class="detail-value">{{ detailGroup.route }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">客人来源</span>
                <span class="detail-value">{{ detailGroup.guestSource }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">状态</span>
                <span :class="['tag', statusClass[detailGroup.status]]">
                  {{ statusText[detailGroup.status] }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">财务信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">预算</span>
                <span class="detail-value">¥{{ formatMoney(detailGroup.budget) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">报价</span>
                <span class="detail-value">¥{{ formatMoney(detailGroup.quotedPrice) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">毛利</span>
                <span :class="['detail-value', getProfitClass(detailGroup)]">
                  ¥{{ formatMoney(getProfit(detailGroup)) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">毛利率</span>
                <span class="detail-value">{{ groupStore.getProfitMargin(detailGroup) }}%</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">分配导游</h4>
            <div v-if="detailGroup.guideId" class="guide-info-box">
              <span class="guide-avatar">{{ getGuide(detailGroup.guideId)?.photo }}</span>
              <div class="guide-info-content">
                <div class="guide-name">{{ getGuideName(detailGroup.guideId) }}</div>
                <div class="guide-desc">
                  <span :class="['level-tag', `level-${getGuide(detailGroup.guideId)?.level}`]">
                    {{ getGuide(detailGroup.guideId)?.level }}
                  </span>
                  {{ getGuide(detailGroup.guideId)?.languages?.join('、') }}
                </div>
              </div>
              <button 
                v-if="detailGroup.status !== 'completed'"
                class="btn btn-danger btn-sm" 
                @click="unassignGuide(detailGroup.id)"
              >
                取消分配
              </button>
            </div>
            <div v-else class="no-guide">
              <span class="no-guide-icon">👤</span>
              <span class="no-guide-text">尚未分配导游，请到调度分派页面分配</span>
            </div>
          </div>

          <div class="detail-section" v-if="detailGroup.notes">
            <h4 class="detail-section-title">备注</h4>
            <p class="detail-notes">{{ detailGroup.notes }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDetail">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useGroupStore } from '@/stores/group'
import { useGuideStore } from '@/stores/guide'
import { ROUTE_TYPES, GUEST_SOURCES, getRecommendedLevel } from '@/constants'
import dayjs from 'dayjs'

const groupStore = useGroupStore()
const guideStore = useGuideStore()

const showModal = ref(false)
const showDetail = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const detailGroup = ref(null)

const filters = reactive({
  keyword: '',
  status: '',
  route: '',
  guestSource: '',
  startDate: ''
})

const form = reactive({
  groupNo: '',
  startDate: '',
  endDate: '',
  destination: '',
  peopleCount: 20,
  route: '国内',
  guestSource: '散拼',
  budget: 0,
  quotedPrice: 0,
  notes: ''
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

const filteredGroups = computed(() => {
  const filterParams = {}
  if (filters.keyword) filterParams.keyword = filters.keyword
  if (filters.status) filterParams.status = filters.status
  if (filters.route) filterParams.route = filters.route
  if (filters.guestSource) filterParams.guestSource = filters.guestSource
  if (filters.startDate) filterParams.startDate = filters.startDate
  
  return groupStore.filterGroups(filterParams)
})

const formatMoney = (val) => {
  return val?.toLocaleString() || '0'
}

const getDays = (group) => {
  return dayjs(group.endDate).diff(dayjs(group.startDate), 'day') + 1
}

const getDaysText = (group) => {
  return `${getDays(group)}天${getDays(group) - 1}晚`
}

const getProfit = (group) => {
  return group.quotedPrice - group.budget
}

const getProfitClass = (group) => {
  const profit = getProfit(group)
  if (profit > 0) return 'text-green-600'
  if (profit < 0) return 'text-red-600'
  return 'text-gray-600'
}

const getGuide = (id) => {
  return guideStore.getGuideById(id)
}

const getGuideName = (id) => {
  const guide = guideStore.getGuideById(id)
  return guide?.name || '未知'
}

const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.route = ''
  filters.guestSource = ''
  filters.startDate = ''
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null
  const today = dayjs()
  Object.assign(form, {
    groupNo: `SH-${today.format('YYYYMMDD')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    startDate: today.add(7, 'day').format('YYYY-MM-DD'),
    endDate: today.add(11, 'day').format('YYYY-MM-DD'),
    destination: '',
    peopleCount: 20,
    route: '国内',
    guestSource: '散拼',
    budget: 0,
    quotedPrice: 0,
    notes: ''
  })
  showModal.value = true
}

const editGroup = (group) => {
  isEdit.value = true
  editingId.value = group.id
  Object.assign(form, {
    groupNo: group.groupNo,
    startDate: group.startDate,
    endDate: group.endDate,
    destination: group.destination,
    peopleCount: group.peopleCount,
    route: group.route,
    guestSource: group.guestSource,
    budget: group.budget,
    quotedPrice: group.quotedPrice,
    notes: group.notes || ''
  })
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveGroup = () => {
  if (!form.groupNo.trim()) {
    alert('请输入团号')
    return
  }
  if (!form.destination.trim()) {
    alert('请输入目的地')
    return
  }
  if (!form.startDate || !form.endDate) {
    alert('请选择日期')
    return
  }
  if (dayjs(form.endDate).isBefore(dayjs(form.startDate))) {
    alert('结束日期不能早于出发日期')
    return
  }

  if (isEdit.value) {
    groupStore.updateGroup(editingId.value, { ...form })
  } else {
    groupStore.addGroup({ ...form })
  }
  closeModal()
}

const deleteGroup = (group) => {
  if (confirm(`确定要删除团组 ${group.groupNo} 吗？`)) {
    groupStore.deleteGroup(group.id)
  }
}

const viewGroup = (group) => {
  detailGroup.value = group
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  detailGroup.value = null
}

const unassignGuide = (groupId) => {
  if (confirm('确定要取消该导游的分配吗？')) {
    groupStore.unassignGuide(groupId)
    detailGroup.value = groupStore.getGroupById(groupId)
  }
}

onMounted(() => {
  groupStore.initGroups()
  guideStore.initGuides()
})
</script>

<style scoped>
.group-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-btns {
  display: flex;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.recommend-level {
  display: flex;
  align-items: center;
  height: 36px;
}

.level-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.level-初级 {
  background: #f6ffed;
  color: #52c41a;
}

.level-中级 {
  background: #e6f7ff;
  color: #1890ff;
}

.level-高级 {
  background: #f9f0ff;
  color: #722ed1;
}

.level-金牌 {
  background: #fffbe6;
  color: #d4b106;
}

.modal-lg {
  max-width: 700px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #999;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.guide-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
}

.guide-info-box .guide-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.guide-info-content {
  flex: 1;
}

.guide-info-content .guide-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.guide-info-content .guide-desc {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
  color: #999;
}

.no-guide-icon {
  font-size: 24px;
}

.detail-notes {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}
</style>
