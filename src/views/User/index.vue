<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
    <!-- Left Sidebar -->
    <SidebarLeft 
      :collapsed="isSidebarCollapsed" 
      @toggle="toggleSidebar"
    />

    <!-- Middle: Main Content Area -->
    <main class="flex-1 flex flex-col relative bg-white overflow-hidden">
      <AppHeader />

      <!-- Main Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-8 space-y-10" ref="mainContent">
        <Step1_Guide />

        <RequirementInput 
          v-model:settings="settings"
          @openBaselineDrawer="showBaselineDrawer = true"
          @previewFile="handlePreview"
        />

        <EvaluationLoading @cancel="cancelEvaluation" />

        <Step4_Report 
          :settings="settings" 
          @previewFile="handlePreview"
          @continueSupplementing="continueSupplementing"
          @restart="handleRestart"
        />
      </div>

      <MainFooter 
        @start="handleStartEvaluation" 
        @restart="handleRestart"
        @archive="openArchiveDialog"
      />
    </main>

    <!-- Right Sidebar -->
    <SidebarRight 
      :collapsed="isHistoryCollapsed" 
      :width="historySidebarWidth"
      @toggle="toggleHistory"
      @resize="startResizing"
      @loadHistory="loadHistory"
      @deleteBaseline="deleteBaseline"
    />

    <!-- Modals -->
    <BaselineDrawer 
      v-model="showBaselineDrawer"
      @previewFile="handlePreview"
      @referenceBaseline="handleReferenceBaseline"
    />

    <StandardPreviewDialog 
      v-model="showPreview"
      :content="previewContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useModelStore, useKnowledgeStore, useBaselineStore, useEvaluationStore } from '@/store';
import { ElMessage, ElMessageBox } from 'element-plus';

// Components
import SidebarLeft from './components/SidebarLeft.vue';
import SidebarRight from './components/SidebarRight.vue';
import AppHeader from './components/AppHeader.vue';
import MainFooter from './components/MainFooter.vue';
import Step1_Guide from './components/Step1_Guide.vue';
import RequirementInput from './components/RequirementInput.vue';
import EvaluationLoading from './components/EvaluationLoading.vue';
import Step4_Report from './components/Step4_Report.vue';
import BaselineDrawer from './components/BaselineDrawer.vue';
import StandardPreviewDialog from './components/StandardPreviewDialog.vue';

// Composables
import { useSidebarLayout } from './composables/useSidebarLayout';
import { useEvaluationTask } from './composables/useEvaluationTask';
import { useBaselineActions } from './composables/useBaselineActions';

const modelStore = useModelStore();
const knowledgeStore = useKnowledgeStore();
const baselineStore = useBaselineStore();
const evalStore = useEvaluationStore();

// UI State
const settings = ref({
  depth: 2,
  model: 'GPT-4o',
  selectedModelId: null as number | null,
});

const showPreview = ref(false);
const previewContent = ref<any>({});
const showBaselineDrawer = ref(false);

const { 
  isSidebarCollapsed, isHistoryCollapsed, historySidebarWidth,
  startResizing, toggleSidebar, toggleHistory 
} = useSidebarLayout();

const { 
  handleStartEvaluation, cancelEvaluation, handleRestartEvaluation 
} = useEvaluationTask(settings);

const { 
  handleReferenceBaseline, deleteBaseline, openArchiveDialog, continueSupplementing 
} = useBaselineActions();

// Initialization
onMounted(async () => {
  console.log('[User/index.vue] Starting background data synchronization...');
  
  // Parallel fetch
  await Promise.all([
    modelStore.fetchModels().catch(() => {}),
    knowledgeStore.fetchStandards().catch(() => {}),
    baselineStore.fetchBaselines().catch(() => {}),
    evalStore.fetchHistory().catch(() => {})
  ]);

  // Handle auto-start from Revision Flow (Navigate to Step 3 for review)
  if (evalStore.isAutoStart) {
    console.log('[User] Detected Auto-Start from Revision flow. Navigating to Config Step...');
    evalStore.isAutoStart = false; // Consumer flag
    evalStore.setStep(3);
    // User requested NOT to auto-run evaluation, stay at Step 3 to allow parameter tuning
  }
});

// Sync default model settings
watch(() => modelStore.isLoaded, (isLoaded) => {
  if (isLoaded) {
    settings.value.model = modelStore.defaultModel;
    settings.value.selectedModelId = modelStore.defaultModelId;
  }
}, { immediate: true });

const handlePreview = (file: any) => {
  previewContent.value = file;
  showPreview.value = true;
};

const handleRestart = () => {
  handleRestartEvaluation((message, title, options) => {
    return ElMessageBox.confirm(message, title, options);
  });
};

const loadHistory = async (history: any) => {
  ElMessage.info(`正在加载历史记录: ${history.title}`);
  if (history.issues && history.suggestions) {
    evalStore.currentReport = {
      total_score: history.total_score || history.score,
      task_type: history.task_type || 'full',
      parent_base_id: history.parent_base_id || null,
      issues: history.issues,
      suggestions: history.suggestions,
      is_archived: history.is_archived,
    };
    evalStore.setStep(4);
    return;
  }
  try {
    const { getEvaluationDetail } = await import('@/services');
    const detail = await getEvaluationDetail(history.id);
    evalStore.currentReport = {
      total_score: detail.total_score || detail.score,
      task_type: detail.task_type || 'full',
      parent_base_id: detail.parent_base_id || null,
      issues: detail.issues || [],
      suggestions: detail.suggestions || '',
      is_archived: detail.is_archived,
    };
    evalStore.setStep(4);
  } catch (e: any) {
    ElMessage.error(`加载历史记录失败：${e.message}`);
  }
};
</script>

<style>
/* Global or shared styles for this view */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}
</style>
