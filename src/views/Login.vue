<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo & Title -->
      <div class="auth-header">
        <div class="auth-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" />
            <path d="M14 24l6 6 14-14" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="auth-title">需求文档评估系统</h1>
        <p class="auth-subtitle">LLM-Based Testability Evaluation</p>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >登录</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'register' }"
          @click="switchTab('register')"
        >注册</button>
        <div class="tab-indicator" :class="activeTab" />
      </div>

      <!-- Login Form -->
      <transition name="fade-slide" mode="out-in">
        <el-form
          v-if="activeTab === 'login'"
          key="login"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
          <p class="form-tip">还没有账号？<span class="link" @click="switchTab('register')">立即注册</span></p>
        </el-form>

        <!-- Register Form -->
        <el-form
          v-else
          key="register"
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-position="top"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（3-20个字符）"
              prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请设置密码（至少6位）"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          <div class="role-info">
            <el-tag type="info" size="small" effect="plain">默认角色：普通用户</el-tag>
          </div>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </el-button>
          <p class="form-tip">已有账号？<span class="link" @click="switchTab('login')">返回登录</span></p>
        </el-form>
      </transition>
    </div>

    <!-- Background decoration -->
    <div class="bg-orb orb1" />
    <div class="bg-orb orb2" />
    <div class="bg-orb orb3" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '@/store';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const activeTab = ref<'login' | 'register'>('login');
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({ username: '', password: '', confirmPassword: '' });

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const validateConfirm = (_rule: any, value: string, callback: (e?: Error) => void) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
};

const switchTab = (tab: 'login' | 'register') => {
  activeTab.value = tab;
  loginFormRef.value?.clearValidate();
  registerFormRef.value?.clearValidate();
};

const navigateAfterAuth = (role: string) => {
  if (role === 'admin') {
    router.push('/admin');
  } else {
    router.push('/');
  }
};

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await authStore.login(loginForm.username, loginForm.password);
    ElMessage.success('登录成功');
    navigateAfterAuth(authStore.role);
  } catch (err: any) {
    ElMessage.error(err.message || '登录失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  const valid = await registerFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await authStore.register(registerForm.username, registerForm.password);
    ElMessage.success('注册成功，欢迎加入！');
    navigateAfterAuth(authStore.role);
  } catch (err: any) {
    ElMessage.error(err.message || '注册失败，请重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  position: relative;
  overflow: hidden;
}

/* floating background orbs */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: float 8s ease-in-out infinite;
}
.orb1 { width: 400px; height: 400px; background: #6366f1; top: -100px; left: -120px; animation-delay: 0s; }
.orb2 { width: 300px; height: 300px; background: #3b82f6; bottom: -80px; right: -60px; animation-delay: -3s; }
.orb3 { width: 250px; height: 250px; background: #8b5cf6; top: 50%; left: 60%; animation-delay: -5s; }

@keyframes float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.auth-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  margin: 0 16px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 40px 40px 36px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

/* Header */
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-logo { width: 56px; height: 56px; margin: 0 auto 16px; display: block; }
.auth-logo svg { width: 100%; height: 100%; filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.6)); }
.auth-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}
.auth-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Tabs */
.auth-tabs {
  display: flex;
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.tab-btn {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 7px;
  position: relative;
  z-index: 1;
  transition: color 0.3s;
}
.tab-btn.active { color: #ffffff; font-weight: 600; }

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border-radius: 7px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.tab-indicator.login  { left: 4px; }
.tab-indicator.register { left: calc(50%); }

/* Form */
.auth-form { /* width */ }

:deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.75) !important;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.07) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: none !important;
  border-radius: 10px;
  transition: border-color 0.2s;
}
:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(99, 102, 241, 0.7) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}
:deep(.el-input__inner) {
  color: #ffffff !important;
  font-size: 14px;
}
:deep(.el-input__inner::placeholder) { color: rgba(255, 255, 255, 0.3) !important; }
:deep(.el-input__prefix-inner .el-icon),
:deep(.el-input__suffix-inner .el-icon) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.el-form-item__error) {
  color: #f87171;
  font-size: 12px;
}

.role-info {
  margin-bottom: 20px;
}
:deep(.el-tag) {
  background: rgba(99, 102, 241, 0.15) !important;
  border-color: rgba(99, 102, 241, 0.3) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 12px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #3b82f6) !important;
  border: none !important;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
  letter-spacing: 2px;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.55);
  transform: translateY(-1px);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }

.form-tip {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  margin: 18px 0 0;
}
.link {
  color: #818cf8;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}
.link:hover { color: #a5b4fc; text-decoration: underline; }

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to  { opacity: 0; transform: translateY(-10px); }
</style>
