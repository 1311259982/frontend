import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/User.vue'),
      meta: { requiresAuth: true, role: 'user' },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/Admin.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.role && authStore.role !== to.meta.role && to.meta.role !== 'user') {
    // Basic role check, user can access home, admin needs admin role
    if (to.meta.role === 'admin' && authStore.role !== 'admin') {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
