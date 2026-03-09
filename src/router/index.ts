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
  const isAuthenticated = !!authStore.token;

  // Already logged in and trying to reach /login → redirect to appropriate home
  if (to.path === '/login' && isAuthenticated) {
    return next(authStore.role === 'admin' ? '/admin' : '/');
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  // Admin-only route: redirect non-admins to user home
  if (to.meta.role === 'admin' && authStore.role !== 'admin') {
    return next('/');
  }

  next();
});


export default router;
