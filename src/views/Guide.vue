<template>
  <div class="guide-page">
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-icon">👨‍💼</span>
        <div class="stat-card-title">导游总数</div>
        <div class="stat-card-value">{{ guideStore.guides.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">✅</span>
        <div class="stat-card-title">在岗导游</div>
        <div class="stat-card-value text-green-600">{{ guideStore.activeGuides.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">⚠️</span>
        <div class="stat-card-title">观察名单</div>
        <div class="stat-card-value text-orange-600">{{ guideStore.watchlistGuides.length }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-card-icon">🏥</span>
        <div class="stat-card-title">健康证预警</div>
        <div class="stat-card-value text-red-600">{{ guideStore.expiredHealthCertGuides.length }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">导游管理</div>
        <button class="btn btn-primary" @click="openAddModal">
          <span>+</span>
          <span>新增导游</span>
        </button>
      </div>

      <div class="filter-bar">
        <div class="filter-item">
          <label class="filter-label">关键词</label>
          <input 
            type="text" 
            class="filter-input" 
            placeholder="姓名/电话"
            v-model="filters.keyword"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">语种</label>
          <select class="filter-select" v-model="filters.language">
            <option value="">全部语种</option>
            <option v-for="lang in LANGUAGES" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">等级</label>
          <select class="filter-select" v-model="filters.level">
            <option value="">全部等级</option>
            <option v-for="lvl in GUIDE_LEVELS" :key="lvl.value" :value="lvl.value">{{ lvl.label }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">擅长线路</label>
          <select class="filter-select" v-model="filters.specialty">
            <option value="">全部线路</option>
            <option v-for="rt in ROUTE_TYPES" :key="rt" :value="rt">{{ rt }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">状态</label>
          <select class="filter-select" v-model="filters.status">
            <option value="">全部状态</option>
            <option value="active">在岗</option>
            <option value="watchlist">观察名单</option>
          </select>
        </div>
        <button class="btn btn-default btn-sm" @click="resetFilters">重置</button>
      </div>

      <div class="guide-grid">
        <div 
          v-for="guide in filteredGuides" 
          :key="guide.id" 
          class="guide-card"
          :class="{ 'watchlist': guide.watchlist }"
        >
          <div class="guide-card-header">
            <div class="guide-avatar">{{ guide.photo }}</div>
            <div class="guide-info">
              <div class="guide-name">
                {{ guide.name }}
                <span v-if="guide.watchlist" class="tag tag-red">观察名单</span>
              </div>
              <div class="guide-level">
                <span :class="['level-tag', `level-${guide.level}`]">{{ guide.level }}</span>
                <span class="guide-gender">{{ guide.gender }}</span>
              </div>
            </div>
          </div>
          
          <div class="guide-card-body">
            <div class="guide-languages">
              <span class="label">语种：</span>
              <span v-for="lang in guide.languages" :key="lang" class="tag tag-blue">{{ lang }}</span>
            </div>
            <div class="guide-specialties">
              <span class="label">擅长：</span>
              <span v-for="spec in guide.specialties" :key="spec" class="tag tag-green">{{ spec }}</span>
            </div>
            <div class="guide-stats">
              <div class="stat-item">
                <span class="stat-num">{{ guide.totalTours }}</span>
                <span class="stat-label">带团数</span>
              </div>
              <div class="stat-item">
                <span :class="['stat-num', { 'text-orange-600': guide.avgScore < 3.5 }]">
                  {{ guide.avgScore.toFixed(1) }}
                </span>
                <span class="stat-label">评分</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">¥{{ guide.baseSalary }}</span>
                <span class="stat-label">基本工资</span>
              </div>
            </div>
            <div class="guide-health" :class="{ 'expired': isHealthExpired(guide) }">
              <span class="health-icon">🏥</span>
              <span>健康证有效期：{{ guide.healthCertExpiry }}</span>
              <span v-if="isHealthExpired(guide)" class="tag tag-red">已过期/临近</span>
            </div>
          </div>
          
          <div class="guide-card-footer">
            <button class="btn btn-default btn-sm" @click="viewDetail(guide)">详情</button>
            <button class="btn btn-primary btn-sm" @click="editGuide(guide)">编辑</button>
            <button 
              v-if="!guide.watchlist"
              class="btn btn-warning btn-sm" 
              @click="toggleWatchlist(guide)"
            >
              加入观察
            </button>
            <button 
              v-else
              class="btn btn-success btn-sm" 
              @click="toggleWatchlist(guide)"
            >
              恢复
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ isEdit ? '编辑导游' : '新增导游' }}</div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">姓名</label>
            <input type="text" class="form-input" v-model="form.name" placeholder="请输入姓名" />
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">性别</label>
              <select class="form-select" v-model="form.gender">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label">等级</label>
              <select class="form-select" v-model="form.level">
                <option v-for="lvl in GUIDE_LEVELS" :key="lvl.value" :value="lvl.value">{{ lvl.label }}</option>
              </select>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">语种（可多选）</label>
            <div class="checkbox-group">
              <label v-for="lang in LANGUAGES" :key="lang" class="checkbox-item">
                <input type="checkbox" :value="lang" v-model="form.languages" />
                <span>{{ lang }}</span>
              </label>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">擅长线路（可多选）</label>
            <div class="checkbox-group">
              <label v-for="rt in ROUTE_TYPES" :key="rt" class="checkbox-item">
                <input type="checkbox" :value="rt" v-model="form.specialties" />
                <span>{{ rt }}</span>
              </label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">电话</label>
              <input type="text" class="form-input" v-model="form.phone" placeholder="请输入电话" />
            </div>
            <div class="form-item">
              <label class="form-label">基本工资</label>
              <input type="number" class="form-input" v-model.number="form.baseSalary" placeholder="基本工资" />
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">健康证有效期</label>
            <input type="date" class="form-input" v-model="form.healthCertExpiry" />
          </div>
          <div class="form-item">
            <label class="form-label">头像</label>
            <div class="avatar-selector">
              <span 
                v-for="emoji in avatarOptions" 
                :key="emoji"
                :class="['avatar-option', { active: form.photo === emoji }]"
                @click="form.photo = emoji"
              >{{ emoji }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveGuide">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useGuideStore } from '@/stores/guide'
import { LANGUAGES, GUIDE_LEVELS, ROUTE_TYPES } from '@/constants'
import dayjs from 'dayjs'

const guideStore = useGuideStore()

const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const filters = reactive({
  keyword: '',
  language: '',
  level: '',
  specialty: '',
  status: ''
})

const form = reactive({
  name: '',
  gender: '男',
  languages: ['普通话'],
  level: '初级',
  specialties: [],
  photo: '👨‍💼',
  phone: '',
  email: '',
  baseSalary: 3500,
  healthCertExpiry: dayjs().add(1, 'year').format('YYYY-MM-DD')
})

const avatarOptions = ['👨‍💼', '👩‍💼', '🧑‍💼', '👴', '👵']

const filteredGuides = computed(() => {
  const filterParams = {}
  if (filters.keyword) filterParams.keyword = filters.keyword
  if (filters.language) filterParams.languages = [filters.language]
  if (filters.level) filterParams.level = filters.level
  if (filters.specialty) filterParams.specialties = [filters.specialty]
  if (filters.status) filterParams.status = filters.status
  
  return guideStore.filterGuides(filterParams)
})

const isHealthExpired = (guide) => {
  const today = dayjs()
  const expiry = dayjs(guide.healthCertExpiry)
  return expiry.isBefore(today) || expiry.diff(today, 'month') <= 1
}

const resetFilters = () => {
  filters.keyword = ''
  filters.language = ''
  filters.level = ''
  filters.specialty = ''
  filters.status = ''
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, {
    name: '',
    gender: '男',
    languages: ['普通话'],
    level: '初级',
    specialties: [],
    photo: '👨‍💼',
    phone: '',
    email: '',
    baseSalary: 3500,
    healthCertExpiry: dayjs().add(1, 'year').format('YYYY-MM-DD')
  })
  showModal.value = true
}

const editGuide = (guide) => {
  isEdit.value = true
  editingId.value = guide.id
  Object.assign(form, {
    name: guide.name,
    gender: guide.gender,
    languages: [...guide.languages],
    level: guide.level,
    specialties: [...guide.specialties],
    photo: guide.photo,
    phone: guide.phone,
    email: guide.email || '',
    baseSalary: guide.baseSalary,
    healthCertExpiry: guide.healthCertExpiry
  })
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveGuide = () => {
  if (!form.name.trim()) {
    alert('请输入姓名')
    return
  }
  if (form.languages.length === 0) {
    alert('请至少选择一种语种')
    return
  }
  if (form.specialties.length === 0) {
    alert('请至少选择一个擅长线路')
    return
  }

  if (isEdit.value) {
    guideStore.updateGuide(editingId.value, { ...form })
  } else {
    guideStore.addGuide({ ...form })
  }
  closeModal()
}

const toggleWatchlist = (guide) => {
  if (guide.watchlist) {
    if (confirm(`确定要将 ${guide.name} 移出观察名单吗？`)) {
      guideStore.removeFromWatchlist(guide.id)
    }
  } else {
    if (confirm(`确定要将 ${guide.name} 加入观察名单吗？加入后将暂停派团。`)) {
      guideStore.addToWatchlist(guide.id)
    }
  }
}

const viewDetail = (guide) => {
  alert(`导游详情：${guide.name}\n电话：${guide.phone}\n带团数：${guide.totalTours}\n评分：${guide.avgScore}`)
}

onMounted(() => {
  guideStore.initGuides()
})
</script>

<style scoped>
.guide-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.guide-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.guide-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.guide-card.watchlist {
  border-color: #ffccc7;
  background: #fff1f0;
}

.guide-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.guide-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.guide-info {
  flex: 1;
}

.guide-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.guide-level {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
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

.guide-gender {
  font-size: 12px;
  color: #999;
}

.guide-card-body {
  padding: 16px;
}

.guide-languages,
.guide-specialties {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.guide-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.guide-health {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.guide-health.expired {
  color: #f5222d;
  font-weight: 500;
}

.health-icon {
  font-size: 14px;
}

.guide-card-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.guide-card-footer .btn {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.avatar-selector {
  display: flex;
  gap: 12px;
}

.avatar-option {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-option:hover {
  border-color: #40a9ff;
}

.avatar-option.active {
  border-color: #1890ff;
  background: #e6f7ff;
}
</style>
