<template>
  <footer class="h-20 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center justify-center px-8 z-30">
    <div class="max-w-4xl w-full flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-button v-if="evalStore.currentStep > 1 && !evalStore.currentReport" link icon="Back" @click="evalStore.setStep(evalStore.currentStep - 1)">
          返回上一步
        </el-button>
        <div v-if="!evalStore.currentReport" class="text-xs text-gray-400 italic">
          {{ stepHint }}
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <el-button 
          v-if="evalStore.currentStep < 3 && !evalStore.currentReport" 
          type="primary" 
          size="large" 
          class="px-10 rounded-xl font-bold"
          :disabled="isNextDisabled"
          @click="evalStore.setStep(evalStore.currentStep + 1)"
        >
          下一步
        </el-button>
        <el-button 
          v-if="evalStore.currentStep === 3 && !evalStore.currentReport" 
          type="primary" 
          size="large" 
          class="px-12 rounded-xl font-bold shadow-lg shadow-blue-200"
          :loading="evalStore.isEvaluating"
          @click="$emit('start')"
        >
          开始智能评估
        </el-button>
        <el-button v-if="evalStore.currentReport" type="primary" size="large" class="px-10 rounded-xl font-bold" @click="$emit('restart')">
          开启新评估
        </el-button>
        <el-button 
          v-if="evalStore.currentReport && !evalStore.currentReport.is_archived" 
          :type="evalStore.referencedBaselineIds.length > 0 ? 'warning' : 'success'" 
          plain 
          size="large" 
          class="px-10 rounded-xl font-bold" 
          icon="CollectionTag" 
          @click="$emit('archive')"
        >
          归档为基准需求
        </el-button>
        <el-tag v-if="evalStore.currentReport?.is_archived" type="success" effect="plain" size="large" class="px-4 py-2">
          已归档
        </el-tag>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEvaluationStore, useKnowledgeStore } from '@/store';
import { Back, CollectionTag } from '@element-plus/icons-vue';

defineEmits(['start', 'restart', 'archive']);

const evalStore = useEvaluationStore();
const knowledgeStore = useKnowledgeStore();

const stepHint = computed(() => {
  if (evalStore.currentStep === 1) return '请先勾选左侧标准以继续';
  if (evalStore.currentStep === 2) return '请提交需要评估的需求内容';
  if (evalStore.currentStep === 3) return '确认参数后即可发起评估';
  return '';
});

const isNextDisabled = computed(() => {
  if (evalStore.currentStep === 1) return knowledgeStore.allSelectedFiles.length === 0;
  if (evalStore.currentStep === 2) {
    if (evalStore.referencedBaselineIds.length > 0) {
      if (evalStore.requirementType === 'text') {
        if (evalStore.items.length > 0) {
          return !evalStore.items.some((item: any) => item.content?.trim().length > 0);
        }
      }
      return false;
    }
    
    if (!evalStore.requirementTitle || !evalStore.projectName) return true;
    
    if (evalStore.requirementType === 'text') {
      if (evalStore.items.length > 0) {
        return !evalStore.items.some((item: any) => item.content?.trim().length > 0);
      }
      return evalStore.textContent.length < 10;
    }
    return !evalStore.uploadedFile;
  }
  return false;
});
</script>
