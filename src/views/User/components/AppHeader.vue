<template>
  <header class="border-b border-gray-100 bg-white/80 backdrop-blur-md z-20">
    <div class="h-16 flex items-center justify-between px-8">
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
          <el-icon size="20"><Monitor /></el-icon>
        </div>
        <h1 class="text-xl font-black text-gray-800 tracking-tight">需求文档可测试性评估</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <el-dropdown trigger="click">
          <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-xl transition-all">
            <el-avatar :size="32" src="https://picsum.photos/seed/user/200" />
            <span class="text-sm font-bold text-gray-700">{{ authStore.user?.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Linear Workflow Steps -->
    <div class="px-12 pb-4">
      <el-steps :active="evalStore.currentStep - 1" finish-status="success" simple class="custom-steps">
        <el-step title="选择标准" />
        <el-step title="提交需求" />
        <el-step title="评估设置" />
        <el-step title="查看结果" />
      </el-steps>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore, useEvaluationStore } from '@/store';
import { useRouter } from 'vue-router';
import { Monitor, ArrowDown } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const evalStore = useEvaluationStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.custom-steps :deep(.el-step.is-simple .el-step__title) {
  font-size: 12px;
  font-weight: 700;
}
</style>
