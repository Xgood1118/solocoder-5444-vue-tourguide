<template>
  <div class="training-page">
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-icon">📚</span>
        <div class="stat-card-title">年度培训目标</div>
        <div class="stat-card-value">{{ ANNUAL_TRAINING_HOURS }} 课时</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">✅</span>
        <div class="stat-card-title">已达标导游</div>
        <div class="stat-card-value text-green-600">{{ trainingStats.completedCount }} 人</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">📊</span>
        <div class="stat-card-title">完成率</div>
        <div class="stat-card-value text-blue-600">{{ trainingStats.completionRate }}%</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">⚠️</span>
        <div class="stat-card-title">未达标</div>
        <div class="stat-card-value text-orange-600">{{ insufficientGuides.length }} 人</div>
      </div>
    </div>

    <div class="training-content">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            培训课时管理
            <span class="year-selector">
              <select v-model="currentYear">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年度</option>
              </select>
            </span>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary btn-sm" @click="openAddModal">
              + 登记培训
            </button>
          </div>
        </div>

        <div class="progress-overview">
          <div class="progress-bar-wrapper">
            <div class="progress-label">
              <span>整体进度</span>
              <span class="progress-text">
                {{ trainingStats.completedCount }}/{{ trainingStats.totalGuides }} 人达标
                ({{ trainingStats.completionRate }}%)
              </span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: trainingStats.completionRate + '%' }"
                :class="{ 'low': trainingStats.completionRate < 50 }"
              ></div>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>导游</th>
              <th>等级</th>
              <th>已完成课时</th>
              <th>进度</th>
              <th>差额</th>
              <th>已修课程</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in trainingList" :key="record.guideId">
              <td>
                <div class="guide-cell">
                  <span class="guide-avatar">{{ getGuide(record.guideId)?.photo }}</span>
                  <span class="guide-name">{{ getGuide(record.guideId)?.name }}</span>
                </div>
              </td>
              <td>
                <span :class="['level-tag', `level-${getGuide(record.guideId)?.level}`]">
                  {{ getGuide(record.guideId)?.level }}
                </span>
              </td>
              <td class="font-medium">{{ record.hours }} 课时</td>
              <td style="width: 180px">
                <div class="mini-progress">
                  <div class="mini-bar">
                    <div 
                      class="mini-fill"
                      :style="{ width: Math.min(record.hours / ANNUAL_TRAINING_HOURS * 100, 100) + '%' }"
                      :class="{ 'low': record.hours < ANNUAL_TRAINING_HOURS * 0.5, 'high': record.hours >= ANNUAL_TRAINING_HOURS }"
                    ></div>
                  </div>
                  <span class="mini-text">{{ Math.round(record.hours / ANNUAL_TRAINING_HOURS * 100) }}%</span>
                </div>
              </td>
              <td>
                <span v-if="record.hours < ANNUAL_TRAINING_HOURS" class="text-orange-600">
                  还差 {{ ANNUAL_TRAINING_HOURS - record.hours }} 课时
                </span>
                <span v-else class="text-green-600">已达标</span>
              </td>
              <td style="max-width: 200px">
                <div class="course-tags">
                  <span 
                    v-for="course in record.courses.slice(0, 3)" 
                    :key="course"
                    class="tag tag-blue"
                  >
                    {{ course }}
                  </span>
                  <span v-if="record.courses.length > 3" class="tag tag-default">
                    +{{ record.courses.length - 3 }}
                  </span>
                </div>
              </td>
              <td>
                <span v-if="record.hours >= ANNUAL_TRAINING_HOURS" class="tag tag-green">已达标</span>
                <span v-else-if="record.hours >= ANNUAL_TRAINING_HOURS * 0.7" class="tag tag-blue">进行中</span>
                <span v-else class="tag tag-orange">需加强</span>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" @click="addHours(record)">
                  增加课时
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card warning-card">
        <div class="card-header">
          <div class="card-title">⚠️ 课时不足预警</div>
        </div>
        <div class="warning-list">
          <div 
            v-for="item in insufficientGuides.slice(0, 5)" 
            :key="item.guideId"
            class="warning-item"
            :class="{ 'critical': item.deficit > 20 }"
          >
            <div class="warning-info">
              <div class="warning-name">{{ item.guideName }}</div>
              <div class="warning-hours">
                已完成 {{ item.hours }}/40 课时
              </div>
            </div>
            <div class="warning-deficit">
              <span class="deficit-num">-{{ item.deficit }}</span>
              <span class="deficit-label">课时</span>
            </div>
          </div>

          <div v-if="insufficientGuides.length === 0" class="empty-state small">
            <div class="empty-icon">🎉</div>
            <div class="empty-text">全员达标</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ isAddHours ? '增加培训课时' : '登记培训记录' }}</div>
          <button class="modal-close" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">选择导游</label>
            <select class="form-select" v-model="form.guideId" :disabled="isAddHours">
              <option value="">请选择导游</option>
              <option v-for="g in guideStore.guides" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">培训课时</label>
              <input type="number" class="form-input" v-model.number="form.hours" placeholder="请输入课时数" />
            </div>
            <div class="form-item">
              <label class="form-label">培训年度</label>
              <select class="form-select" v-model="form.year">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
              </select>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">课程名称</label>
            <input type="text" class="form-input" v-model="form.courseName" placeholder="如：旅游安全培训" />
          </div>
          <div class="form-tip">
            💡 行业规定：导游每年需完成至少 {{ ANNUAL_TRAINING_HOURS }} 学时培训，否则影响续证。
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeAddModal">取消</button>
          <button class="btn btn-primary" @click="saveTraining">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useTrainingStore } from '@/stores/training'
import { useGuideStore } from '@/stores/guide'
import { ANNUAL_TRAINING_HOURS } from '@/constants'
import dayjs from 'dayjs'

const trainingStore = useTrainingStore()
const guideStore = useGuideStore()

const currentYear = ref(dayjs().year())
const showAddModal = ref(false)
const isAddHours = ref(false)

const form = reactive({
  guideId: '',
  year: dayjs().year(),
  hours: 0,
  courseName: ''
})

const yearOptions = computed(() => {
  const year = dayjs().year()
  return [year - 1, year, year + 1]
})

const trainingStats = computed(() => {
  return trainingStore.getTrainingStats(currentYear.value)
})

const trainingList = computed(() => {
  const yearly = trainingStore.getYearlyTraining(currentYear.value)
  return yearly
    .map(record => ({
      ...record,
      guideName: getGuide(record.guideId)?.name || '未知'
    }))
    .sort((a, b) => b.hours - a.hours)
})

const insufficientGuides = computed(() => {
  const records = trainingStore.getInsufficientTraining(currentYear.value)
  return records.map(r => ({
    ...r,
    guideName: guideStore.getGuideById(r.guideId)?.name || '未知'
  }))
})

const getGuide = (id) => guideStore.getGuideById(id)

const openAddModal = () => {
  isAddHours.value = false
  form.guideId = ''
  form.year = currentYear.value
  form.hours = 0
  form.courseName = ''
  showAddModal.value = true
}

const addHours = (record) => {
  isAddHours.value = true
  form.guideId = record.guideId
  form.year = currentYear.value
  form.hours = 0
  form.courseName = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const saveTraining = () => {
  if (!form.guideId) {
    alert('请选择导游')
    return
  }
  if (!form.hours || form.hours <= 0) {
    alert('请输入有效课时数')
    return
  }

  trainingStore.addTrainingHours(form.guideId, form.year, form.hours, form.courseName)
  closeAddModal()
  alert('培训记录已添加')
}

onMounted(() => {
  trainingStore.initTraining()
  guideStore.initGuides()
})
</script>

<style scoped>
.training-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.training-content {
  display: flex;
  gap: 20px;
}

.training-content > .card:first-child {
  flex: 1;
}

.warning-card {
  width: 300px;
  flex-shrink: 0;
}

.year-selector {
  margin-left: 12px;
  font-size: 14px;
  font-weight: normal;
}

.year-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.progress-overview {
  padding: 20px;
  background: linear-gradient(135deg, #e6f7ff, #f0f9ff);
  border-radius: 8px;
  margin-bottom: 20px;
}

.progress-bar-wrapper {
  width: 100%;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.progress-text {
  font-weight: 600;
  color: #1890ff;
}

.progress-bar {
  height: 12px;
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #69c0ff);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-fill.low {
  background: linear-gradient(90deg, #fa8c16, #ffa940);
}

.guide-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guide-avatar {
  font-size: 20px;
}

.guide-name {
  font-weight: 500;
  color: #333;
}

.level-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.level-初级 { background: #f6ffed; color: #52c41a; }
.level-中级 { background: #e6f7ff; color: #1890ff; }
.level-高级 { background: #f9f0ff; color: #722ed1; }
.level-金牌 { background: #fffbe6; color: #d4b106; }

.mini-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: #faad14;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mini-fill.low {
  background: #ff4d4f;
}

.mini-fill.high {
  background: #52c41a;
}

.mini-text {
  font-size: 12px;
  color: #999;
  width: 40px;
  text-align: right;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-default {
  background: #fafafa;
  color: #999;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
}

.warning-item.critical {
  background: #fff1f0;
  border-color: #ffccc7;
}

.warning-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.warning-hours {
  font-size: 12px;
  color: #999;
}

.warning-deficit {
  text-align: center;
}

.deficit-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #fa8c16;
}

.warning-item.critical .deficit-num {
  color: #f5222d;
}

.deficit-label {
  font-size: 11px;
  color: #999;
}

.empty-state.small {
  padding: 30px 20px;
  text-align: center;
}

.empty-state.small .empty-icon {
  font-size: 32px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.form-tip {
  padding: 12px;
  background: #fffbe6;
  border-radius: 6px;
  font-size: 12px;
  color: #d4b106;
}

.font-medium {
  font-weight: 500;
}

.text-orange-600 {
  color: #fa8c16;
}

.text-green-600 {
  color: #52c41a;
}
</style>
