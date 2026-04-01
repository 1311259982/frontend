<template>
  <div v-if="evalStore.isEvaluating" class="max-w-2xl mx-auto py-20 text-center space-y-6">
    <div class="relative w-32 h-32 mx-auto">
      <el-progress type="circle" :percentage="evalStore.evaluationProgress" :stroke-width="8" color="#3b82f6" />
      <div class="absolute inset-0 flex items-center justify-center">
        <el-icon size="32" class="animate-spin text-blue-600"><Loading /></el-icon>
      </div>
    </div>
    <div class="space-y-2">
      <h3 class="text-xl font-bold text-gray-800">{{ progressText }}</h3>
      <p class="text-sm text-gray-400">正在调用大语言模型进行深度评估，请稍候...</p>
    </div>
    <div class="flex justify-center gap-4">
      <div v-for="i in 4" :key="i" :class="['w-2 h-2 rounded-full transition-all duration-500', evalStore.evaluationProgress >= i*25 ? 'bg-blue-600 scale-125' : 'bg-gray-200']"></div>
    </div>
    <div class="pt-4">
      <el-button type="danger" plain round size="small" icon="Close" @click="$emit('cancel')">取消评估</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEvaluationStore } from '@/store';
import { Loading, Close } from '@element-plus/icons-vue';

defineEmits(['cancel']);

const evalStore = useEvaluationStore();

const progressText = computed(() => {
  if (evalStore.evaluationProgress < 25) return '正在加载评估标准...';
  if (evalStore.evaluationProgress < 50) return '正在解析需求内容...';
  if (evalStore.evaluationProgress < 75) return '正在执行可测试性评估...';
  return '正在生成评估报告...';
});
</script>
