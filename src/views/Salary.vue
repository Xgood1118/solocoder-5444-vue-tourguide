<template>
  <div class="salary-page">
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-icon">💰</span>
        <div class="stat-card-title">本月工资总额</div>
        <div class="stat-card-value">¥{{ formatMoney(salaryStats.totalSalary) }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">📈</span>
        <div class="stat-card-title">人均工资</div>
        <div class="stat-card-value text-green-600">¥{{ formatMoney(salaryStats.avgSalary) }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">🏆</span>
        <div class="stat-card-title">最高工资</div>
        <div class="stat-card-value text-orange-600">¥{{ formatMoney(salaryStats.maxSalary) }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">📅</span>
        <div class="stat-card-title">本月带团数</div>
        <div class="stat-card-value text-blue-600">{{ salaryStats.totalTours }}</div>
      </div>
    </div>

    <div class="salary-content">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            计件工资核算
            <span class="month-selector">
              <select v-model="currentYear" style="width: 100px; margin-right: 8px">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
              </select>
              <select v-model="currentMonth">
                <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
              </select>
            </span>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary btn-sm" @click="openSalaryCalc">
              💰 工资计算器
            </button>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>导游</th>
              <th>等级</th>
              <th>带团数</th>
              <th>基本工资</th>
              <th>带团津贴</th>
              <th>销售提成</th>
              <th>应发工资</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="salary in monthlySalaries" :key="salary.guideId">
              <td>
                <div class="guide-cell">
                  <span class="guide-avatar">{{ getGuide(salary.guideId)?.photo }}</span>
                  <span class="guide-name">{{ salary.guideName }}</span>
                </div>
              </td>
              <td>
                <span :class="['level-tag', `level-${getGuide(salary.guideId)?.level}`]">
                  {{ getGuide(salary.guideId)?.level }}
                </span>
              </td>
              <td>{{ salary.tourCount }} 次</td>
              <td>¥{{ formatMoney(salary.baseSalary) }}</td>
              <td>
                <span class="text-blue-600">+¥{{ formatMoney(salary.tourAllowance) }}</span>
              </td>
              <td>
                <span class="text-green-600">+¥{{ formatMoney(salary.salesCommission) }}</span>
              </td>
              <td>
                <span class="salary-total">¥{{ formatMoney(salary.totalSalary) }}</span>
              </td>
              <td>
                <button class="btn btn-default btn-sm" @click="viewSalaryDetail(salary)">
                  明细
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="monthlySalaries.length === 0" class="empty-state">
          <div class="empty-icon">💵</div>
          <div class="empty-text">暂无工资数据</div>
        </div>
      </div>

      <div class="card salary-chart-card">
        <div class="card-header">
          <div class="card-title">工资分布</div>
        </div>
        <div class="chart-container">
          <div class="salary-bars">
            <div 
              v-for="item in salaryStats.salaryDistribution" 
              :key="item.label"
              class="salary-bar-item"
            >
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-wrapper">
                <div 
                  class="bar-fill"
                  :style="{ width: getBarWidth(item.count) + '%' }"
                ></div>
              </div>
              <div class="bar-value">{{ item.count }} 人</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCalcModal" class="modal-overlay" @click.self="closeCalcModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">工资计算器</div>
          <button class="modal-close" @click="closeCalcModal">×</button>
        </div>
        <div class="modal-body">
          <div class="calc-form">
            <div class="form-item">
              <label class="form-label">选择导游</label>
              <select class="form-select" v-model="calcForm.guideId">
                <option value="">请选择导游</option>
                <option v-for="g in guideStore.guides" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">团组人数</label>
                <input type="number" class="form-input" v-model.number="calcForm.peopleCount" />
              </div>
              <div class="form-item">
                <label class="form-label">天数</label>
                <input type="number" class="form-input" v-model.number="calcForm.days" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">线路</label>
                <select class="form-select" v-model="calcForm.route">
                  <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">销售提成</label>
                <input type="number" class="form-input" v-model.number="calcForm.commission" />
              </div>
            </div>
          </div>

          <div class="calc-result">
            <h4 class="calc-title">预估收入</h4>
            <div class="calc-breakdown">
              <div class="calc-row">
                <span class="calc-label">日津贴基数</span>
                <span class="calc-value">¥{{ DAILY_ALLOWANCE_BASE }}/人/天</span>
              </div>
              <div class="calc-row">
                <span class="calc-label">等级系数</span>
                <span class="calc-value">{{ calcLevelMultiplier }}x</span>
              </div>
              <div class="calc-row">
                <span class="calc-label">线路系数</span>
                <span class="calc-value">{{ calcRouteCoefficient }}x</span>
              </div>
              <div class="calc-row highlight">
                <span class="calc-label">带团津贴</span>
                <span class="calc-value text-blue-600">+¥{{ formatMoney(calcAllowance) }}</span>
              </div>
              <div class="calc-row">
                <span class="calc-label">销售提成</span>
                <span class="calc-value text-green-600">+¥{{ formatMoney(calcForm.commission) }}</span>
              </div>
              <div class="calc-row total">
                <span class="calc-label">合计收入</span>
                <span class="calc-value text-orange-600">¥{{ formatMoney(calcTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeCalcModal">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">工资明细 - {{ currentSalary?.guideName }}</div>
          <button class="modal-close" @click="closeDetailModal">×</button>
        </div>
        <div class="modal-body">
          <div class="salary-detail-summary">
            <div class="summary-item">
              <span class="summary-label">基本工资</span>
              <span class="summary-value">¥{{ formatMoney(currentSalary?.baseSalary) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">带团津贴</span>
              <span class="summary-value text-blue-600">+¥{{ formatMoney(currentSalary?.tourAllowance) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">销售提成</span>
              <span class="summary-value text-green-600">+¥{{ formatMoney(currentSalary?.salesCommission) }}</span>
            </div>
            <div class="summary-item total">
              <span class="summary-label">应发工资</span>
              <span class="summary-value">¥{{ formatMoney(currentSalary?.totalSalary) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">带团明细</h4>
            <table class="table">
              <thead>
                <tr>
                  <th>团号</th>
                  <th>目的地</th>
                  <th>日期</th>
                  <th>人数</th>
                  <th>天数</th>
                  <th>津贴</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in guideMonthGroups" :key="group.id">
                  <td>{{ group.groupNo }}</td>
                  <td>{{ group.destination }}</td>
                  <td class="text-sm">{{ group.startDate }}</td>
                  <td>{{ group.peopleCount }}人</td>
                  <td>{{ getGroupDays(group) }}天</td>
                  <td class="text-blue-600">¥{{ formatMoney(getGroupAllowance(group)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDetailModal">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useSalaryStore } from '@/stores/salary'
import { useGuideStore } from '@/stores/guide'
import { useGroupStore } from '@/stores/group'
import { ROUTE_TYPES, DAILY_ALLOWANCE_BASE, ROUTE_COEFFICIENTS, getLevelMultiplier } from '@/constants'
import { daysBetween } from '@/utils/storage'
import dayjs from 'dayjs'

const salaryStore = useSalaryStore()
const guideStore = useGuideStore()
const groupStore = useGroupStore()

const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)

const showCalcModal = ref(false)
const showDetailModal = ref(false)
const currentSalary = ref(null)

const calcForm = reactive({
  guideId: '',
  peopleCount: 20,
  days: 5,
  route: '国内',
  commission: 0
})

const yearOptions = computed(() => {
  const year = dayjs().year()
  return [year - 1, year, year + 1]
})

const monthlySalaries = computed(() => {
  const monthGroups = groupStore.getGroupsByMonth(currentYear.value, currentMonth.value)
    .filter(g => g.status === 'completed')
  
  const groupsByGuideMap = {}
  monthGroups.forEach(g => {
    if (!groupsByGuideMap[g.guideId]) {
      groupsByGuideMap[g.guideId] = []
    }
    groupsByGuideMap[g.guideId].push(g)
  })
  
  return salaryStore.getAllMonthlySalaries(guideStore.guides, groupsByGuideMap)
})

const salaryStats = computed(() => {
  return salaryStore.getSalaryStatistics(monthlySalaries.value)
})

const calcLevelMultiplier = computed(() => {
  if (!calcForm.guideId) return 1
  const guide = guideStore.getGuideById(calcForm.guideId)
  return getLevelMultiplier(guide?.level || '初级')
})

const calcRouteCoefficient = computed(() => {
  return ROUTE_COEFFICIENTS[calcForm.route] || 1
})

const calcAllowance = computed(() => {
  return DAILY_ALLOWANCE_BASE * calcForm.days * calcForm.peopleCount * calcLevelMultiplier * calcRouteCoefficient / 10
})

const calcTotal = computed(() => {
  return Math.round(calcAllowance + calcForm.commission)
})

const guideMonthGroups = computed(() => {
  if (!currentSalary.value) return []
  return groupStore.getGroupsByMonth(currentYear.value, currentMonth.value)
    .filter(g => g.guideId === currentSalary.value.guideId && g.status === 'completed')
})

const getGuide = (id) => guideStore.getGuideById(id)

const formatMoney = (val) => {
  if (!val) return '0'
  return Math.round(val).toLocaleString()
}

const getBarWidth = (count) => {
  const max = Math.max(...salaryStats.value.salaryDistribution.map(d => d.count), 1)
  return (count / max) * 100
}

const openSalaryCalc = () => {
  showCalcModal.value = true
}

const closeCalcModal = () => {
  showCalcModal.value = false
}

const viewSalaryDetail = (salary) => {
  currentSalary.value = salary
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  currentSalary.value = null
}

const getGroupDays = (group) => {
  return daysBetween(group.startDate, group.endDate)
}

const getGroupAllowance = (group) => {
  const guide = guideStore.getGuideById(group.guideId)
  if (!guide) return 0
  const days = daysBetween(group.startDate, group.endDate)
  return salaryStore.calculateDailyAllowance(guide.level, group.route, days, group.peopleCount)
}

onMounted(() => {
  guideStore.initGuides()
  groupStore.initGroups()
})
</script>

<style scoped>
.salary-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.salary-content {
  display: flex;
  gap: 20px;
}

.salary-content > .card:first-child {
  flex: 1;
}

.salary-chart-card {
  width: 320px;
  flex-shrink: 0;
}

.month-selector {
  margin-left: 12px;
  font-size: 14px;
  font-weight: normal;
}

.month-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
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

.salary-total {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.salary-bars {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 12px;
}

.salary-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 60px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.bar-wrapper {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #69c0ff);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 50px;
  font-size: 12px;
  color: #999;
  text-align: right;
  flex-shrink: 0;
}

.calc-form {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.calc-result {
  background: #f6ffed;
  border-radius: 8px;
  padding: 20px;
}

.calc-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.calc-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e8f5e9;
}

.calc-row:last-child {
  border-bottom: none;
}

.calc-row.highlight {
  padding-top: 12px;
  padding-bottom: 12px;
}

.calc-row.total {
  padding-top: 12px;
  border-top: 2px solid #b7eb8f;
  border-bottom: none;
  margin-top: 4px;
}

.calc-label {
  font-size: 14px;
  color: #666;
}

.calc-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.calc-row.total .calc-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.calc-row.total .calc-value {
  font-size: 20px;
  font-weight: 700;
}

.salary-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.salary-detail-summary .summary-item {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.salary-detail-summary .summary-item.total {
  background: #e6f7ff;
}

.salary-detail-summary .summary-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.salary-detail-summary .summary-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.detail-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.modal-lg {
  max-width: 700px;
}

.text-blue-600 { color: #1890ff; }
.text-green-600 { color: #52c41a; }
.text-orange-600 { color: #fa8c16; }
.text-sm { font-size: 12px; }
</style>
