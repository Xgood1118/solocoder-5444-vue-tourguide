<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">🧭</span>
        <span class="logo-text">导游调度系统</span>
      </div>
      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="sync-status">
            <span class="sync-icon">🔄</span>
            <span class="sync-text">数据已同步</span>
            <span class="sync-time">{{ lastSyncTime }}</span>
          </div>
          <div class="user-info">
            <span class="user-avatar">👤</span>
            <span class="user-name">调度员</span>
          </div>
        </div>
      </header>
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'

const route = useRoute()
const lastSyncTime = ref(dayjs().format('YYYY-MM-DD HH:mm'))

const menuItems = [
  { path: '/', icon: '📊', label: '数据概览' },
  { path: '/guide', icon: '👨‍💼', label: '导游管理' },
  { path: '/group', icon: '👥', label: '团组管理' },
  { path: '/assign', icon: '📅', label: '调度分派' },
  { path: '/score', icon: '⭐', label: '评分管理' },
  { path: '/salary', icon: '💰', label: '工资核算' },
  { path: '/training', icon: '📚', label: '培训课时' },
]

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.label : '数据概览'
})

onMounted(() => {
  const syncTime = localStorage.getItem('lastSyncTime')
  if (syncTime) {
    lastSyncTime.value = dayjs(syncTime).format('YYYY-MM-DD HH:mm')
  }
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%);
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-left-color: #4fc3f7;
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 14px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

.top-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.sync-icon {
  font-size: 14px;
}

.sync-time {
  color: #999;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.content-wrapper {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
