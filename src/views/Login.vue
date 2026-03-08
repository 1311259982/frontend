<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900">
    <div class="w-full max-w-md px-4">
      <el-card class="shadow-2xl rounded-2xl overflow-hidden border-none">
        <div class="p-8">
          <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">需求文档评估系统</h1>
            <p class="text-gray-500">LLM-Based Testability Evaluation</p>
          </div>
          
          <el-tabs v-model="activeTab" class="mb-6">
            <el-tab-pane label="登录">
              <el-form :model="loginForm" @submit.prevent="handleLogin" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" />
                </el-form-item>
                
                <div class="mt-8">
                  <el-button type="primary" native-type="submit" class="w-full h-12 text-lg font-semibold rounded-xl" :loading="loading">
                    登 录
                  </el-button>
                </div>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="注册">
              <el-form :model="registerForm" @submit.prevent="handleRegister" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" />
                </el-form-item>
                
                <div class="mt-8">
                  <el-button type="primary" native-type="submit" class="w-full h-12 text-lg font-semibold rounded-xl" :loading="loading">
                    注 册
                  </el-button>
                </div>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const activeTab = ref('0');

const loginForm = reactive({
  username: '',
  password: '',
});

const registerForm = reactive({
  username: '',
  password: '',
});

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.error('请输入用户名和密码');
    return;
  }
  
  loading.value = true;
  try {
    await authStore.login(loginForm.username, loginForm.password);
    ElMessage.success('登录成功');
    if (authStore.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerForm.username || !registerForm.password) {
    ElMessage.error('请输入用户名和密码');
    return;
  }
  
  loading.value = true;
  try {
    await authStore.register(registerForm.username, registerForm.password);
    ElMessage.success('注册成功，请登录');
    activeTab.value = '0';
    // 清空注册表单
    registerForm.username = '';
    registerForm.password = '';
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 0;
}
</style>
