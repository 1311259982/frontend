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
  handleStartEvaluation, cancelEvaluation, handleRestartEvaluation, resumeEvaluation
} = useEvaluationTask(settings);

const { 
  handleReferenceBaseline, deleteBaseline, openArchiveDialog, continueSupplementing 
} = useBaselineActions();

// Initialization
onMounted(async () => {
  console.log('[User/index.vue] Starting background data synchronization...');
  
  evalStore.isHistoryLoaded = false;
  
  await Promise.all([
    modelStore.fetchModels().catch(() => {}),
    knowledgeStore.fetchStandards().catch(() => {}),
    baselineStore.fetchBaselines().catch(() => {}),
    evalStore.fetchHistory().catch(() => {})
  ]);

  // 模型列表加载完成后，检查 LLM 缓存状态（触发后端预热）
  if (modelStore.isLoaded) {
    await modelStore.checkCacheStatus().catch(() => {});
  }

  if (evalStore.isAutoStart) {
    console.log('[User] Detected Auto-Start from Revision flow. Navigating to Config Step...');
    evalStore.isAutoStart = false;
    evalStore.setStep(3);
    return;
  }

  if (evalStore.isEvaluating && evalStore.activeEvaluationId) {
    console.log('[User] Resuming in-progress evaluation:', evalStore.activeEvaluationId);
    resumeEvaluation(evalStore.activeEvaluationId);
    return;
  }

  if (evalStore.isEvaluating && !evalStore.activeEvaluationId) {
    evalStore.isEvaluating = false;
    evalStore.evaluationProgress = 0;
  }

  if (!evalStore.currentReport && evalStore.history.length > 0) {
    const unarchivedWithResults = evalStore.history.filter(
      (item: any) => !item.is_archived && (item.issues?.length > 0 || item.suggestions)
    );
    if (unarchivedWithResults.length > 0) {
      unarchivedWithResults.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = unarchivedWithResults[0];
      evalStore.currentReport = {
        total_score: latest.total_score || latest.score,
        task_type: latest.task_type || 'full',
        parent_base_id: latest.parent_base_id || null,
        issues: latest.issues || [],
        suggestions: latest.suggestions || '',
        is_archived: latest.is_archived,
        id: latest.id,
        dimension_scores: latest.dimension_scores || null,
      };
      if (latest.parent_base_id) {
        evalStore.referencedBaselineIds = [latest.parent_base_id];
      }
      evalStore.projectName = latest.projectName || latest.project_name || '';
      evalStore.setStep(4);
      console.log('[User] Restored evaluation state from history:', latest.id);
    }
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
  const restoreReport = (data: any) => {
    evalStore.currentReport = {
      total_score: data.total_score || data.score,
      task_type: data.task_type || 'full',
      parent_base_id: data.parent_base_id || null,
      issues: data.issues || [],
      suggestions: data.suggestions || '',
      is_archived: data.is_archived,
      id: data.id,
      dimension_scores: data.dimension_scores || null,
    };
    if (data.parent_base_id) {
      evalStore.referencedBaselineIds = [data.parent_base_id];
    }
    evalStore.projectName = data.projectName || data.project_name || '';
    evalStore.setStep(4);
  };

  if (history.issues && history.suggestions) {
    restoreReport(history);
    return;
  }
  try {
    const { getEvaluationDetail } = await import('@/services');
    const detail = await getEvaluationDetail(history.id);
    restoreReport({ ...detail, id: history.id });
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
