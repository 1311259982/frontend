<template>
  <div v-if="evalStore.currentStep === 1" class="max-w-3xl mx-auto text-center py-20">
    <div class="mb-6 inline-flex p-4 bg-blue-50 rounded-full text-blue-600">
      <el-icon size="48"><Files /></el-icon>
    </div>
    <h2 class="text-2xl font-bold mb-2">第一步：选择评估标准</h2>
    <p class="text-gray-500 mb-8">请在左侧面板勾选本次评估需要遵循的行业标准、公司规范或项目文档。</p>
    <el-button type="primary" size="large" :disabled="knowledgeStore.allSelectedFiles.length === 0" @click="evalStore.setStep(2)">
      下一步：提交需求内容
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useEvaluationStore, useKnowledgeStore } from '@/store';
import { Files } from '@element-plus/icons-vue';

const evalStore = useEvaluationStore();
const knowledgeStore = useKnowledgeStore();
</script>
