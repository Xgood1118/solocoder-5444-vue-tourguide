import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/views/Guide.vue')
  },
  {
    path: '/group',
    name: 'Group',
    component: () => import('@/views/Group.vue')
  },
  {
    path: '/assign',
    name: 'Assign',
    component: () => import('@/views/Assign.vue')
  },
  {
    path: '/score',
    name: 'Score',
    component: () => import('@/views/Score.vue')
  },
  {
    path: '/salary',
    name: 'Salary',
    component: () => import('@/views/Salary.vue')
  },
  {
    path: '/training',
    name: 'Training',
    component: () => import('@/views/Training.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
