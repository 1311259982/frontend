<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900">
    <el-card class="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border-none">
      <div class="p-8">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">需求文档评估系统</h1>
          <p class="text-gray-500">LLM-Based Testability Evaluation</p>
        </div>
        
        <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item label="角色选择">
            <el-radio-group v-model="form.role" class="w-full flex justify-between">
              <el-radio-button label="user">产品经理</el-radio-button>
              <el-radio-button label="admin">管理员</el-radio-button>
            </el-radio-group>
          </el-form-item>
          
          <div class="mt-8">
            <el-button type="primary" native-type="submit" class="w-full h-12 text-lg font-semibold rounded-xl" :loading="loading">
              登 录
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store';
import { User } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  username: 'Demo User',
  role: 'user' as 'admin' | 'user',
});

const handleLogin = () => {
  loading.value = true;
  setTimeout(() => {
    authStore.login(form.username, form.role);
    loading.value = false;
    if (form.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }, 800);
};
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 0;
}
</style>
