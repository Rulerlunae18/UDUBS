import { createRouter, createWebHistory } from 'vue-router'

// 🔹 Основные страницы
import LoginRegister from '../pages/LoginRegister.vue'
import Home from '../pages/Home.vue'
import Archive from '../pages/Archive.vue'
import Docs from '../pages/Docs.vue'
import Profile from '../pages/Profile.vue'
import PostDetail from '../pages/PostDetail.vue'

// 🔹 Динамические страницы
const AdminPanel = () => import('../pages/AdminPanel.vue')
const AdminPosts = () => import('../pages/AdminPosts.vue')
const AdminFakeUsers = () => import('../pages/AdminFakeUsers.vue')
const FakeUsers = () => import('../pages/FakeUsers.vue')
const ResearcherProfile = () => import('../pages/ResearcherProfile.vue')
const PlayerList = () => import('../pages/PlayerList.vue')
const RealUsers = () => import('../pages/RealUsers.vue')
const NoAccess = () => import('../pages/NoAccess.vue')

// ======================================================
// 🧭 Маршруты
// ======================================================

const routes = [
  { path: '/', redirect: '/access' },
  { path: '/access', name: 'LoginRegister', component: LoginRegister },

  { path: '/home', name: 'Home', component: Home },
  { path: '/archive', name: 'Archive', component: Archive },
  { path: '/docs', name: 'Docs', component: Docs },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/post/:id', name: 'PostDetail', component: PostDetail },

  // Публичные исследователи
  { path: '/fake-users', name: 'FakeUsersPublic', component: FakeUsers },
  { path: '/personnel/:id', name: 'ResearcherProfile', component: ResearcherProfile },

  // ================================
  // 🔐 ADMIN ZONE
  // ================================
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/posts',
    name: 'AdminPosts',
    component: AdminPosts,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/fakeusers',
    name: 'AdminFakeUsers',
    component: AdminFakeUsers,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/players',
    name: 'PlayerList',
    component: PlayerList,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/realusers',
    name: 'RealUsers',
    component: RealUsers,
    meta: { requiresAdmin: true },
  },

  { path: '/no-access', name: 'NoAccess', component: NoAccess },

  { path: '/:pathMatch(.*)*', redirect: '/access' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ======================================================
// 🧠 Глобальный guard — JWT / ADMIN
// ======================================================

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // 🔐 Защита админ-зоны
  if (to.meta.requiresAdmin) {
    if (!token || !user) return next('/access')
    if (user.role !== 'ADMIN') return next('/no-access')
  }

  // 🚪 Если пользователь уже авторизован — не пускаем на /access
  if (to.path === '/access' && token && user) {
    return next('/home')
  }

  next()
})

export default router
