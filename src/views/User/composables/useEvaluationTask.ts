import { ref, unref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { startEvaluation, getEvaluationStatus, syncDraftItems, submitDraft } from '@/services';
import { useEvaluationStore, useModelStore, useKnowledgeStore } from '@/store';

export function useEvaluationTask(settings: Ref<{ depth: number; selectedModelId: number | null }> | { depth: number; selectedModelId: number | null }) {
  const evalStore = useEvaluationStore();
  const modelStore = useModelStore();
  const knowledgeStore = useKnowledgeStore();

  let _currentEvaluationId: number | null = null;
  let _pollingTimer: ReturnType<typeof setTimeout> | null = null;

  const handleStartEvaluation = async () => {
    evalStore.isEvaluating = true;
    evalStore.evaluationProgress = 0;

    try {
      const standardIds = knowledgeStore.allSelectedFiles.map((f: any) => f.id);
      
      if (_currentEvaluationId) {
        await evalStore.updateAndRestart(_currentEvaluationId, standardIds);
        pollEvaluationStatus(_currentEvaluationId);
        return;
      }

      if (evalStore.draftId) {
        // Sync items explicitly in case of pending debounce
        if (evalStore.syncTimer) {
          clearTimeout(evalStore.syncTimer);
          evalStore.syncTimer = null;
        }
        await syncDraftItems(evalStore.draftId, evalStore.items);

        const payload = {
          standard_ids: standardIds,
          instructions: evalStore.instructions || undefined,
          model_id: unref(settings).selectedModelId || modelStore.defaultModelId,
        };
        const { evaluation_id } = await submitDraft(evalStore.draftId, payload);
        _currentEvaluationId = evaluation_id;
        evalStore.draftId = null; // Important: Clear it so onUnmount doesn't destroy the submitted evaluation
        pollEvaluationStatus(evaluation_id);
      } else {
        const usingCards = evalStore.items.length > 0;
        const payload = {
          project_name: evalStore.projectName,
          requirement_title: evalStore.requirementTitle,
          requirement_type: evalStore.requirementType,
          text_content: !usingCards && (evalStore.requirementType === 'text' || evalStore.textContent) ? evalStore.textContent : undefined,
          document_file_id: evalStore.requirementType === 'document' ? evalStore.uploadedFile?.file_id : undefined,
          standard_ids: standardIds,
          referenced_baseline_id: evalStore.referencedBaselineIds[0] || null,
          only_evaluate_new: evalStore.onlyEvaluateNew,
          instructions: evalStore.instructions || undefined,
          model_id: unref(settings).selectedModelId || modelStore.defaultModelId,
          edit_mode: evalStore.editMode,
          items: usingCards ? evalStore.items.map((item: any, idx: number) => ({
            parent_item_id: item.parent_item_id ?? null,
            title: item.title,
            content: item.content ?? '',
            status: item.status,
            sort_order: idx,
          })) : undefined,
        };

        const { evaluation_id } = await startEvaluation(payload);
        _currentEvaluationId = evaluation_id;
        pollEvaluationStatus(evaluation_id);
      }
    } catch (e: any) {
      evalStore.isEvaluating = false;
      ElMessage.error(`评估启动失败：${e.message || '未知错误'}`);
    }
  };

  const pollEvaluationStatus = (id: number) => {
    _pollingTimer = setTimeout(async () => {
      if (!evalStore.isEvaluating) return;
      try {
        const result = await getEvaluationStatus(id);
        evalStore.evaluationProgress = Math.min(result.progress, 99);

        if (result.status === 'completed' && result.report) {
          evalStore.evaluationProgress = 100;
          await finishEvaluation(result.report);
        } else {
          pollEvaluationStatus(id);
        }
      } catch (e) {
        pollEvaluationStatus(id);
      }
    }, 300);
  };

  const cancelEvaluation = async () => {
    if (_pollingTimer) { clearTimeout(_pollingTimer); _pollingTimer = null; }
    if (_currentEvaluationId) {
      await evalStore.discardEvaluation(_currentEvaluationId).catch(() => {});
      _currentEvaluationId = null;
    }
    evalStore.isEvaluating = false;
    evalStore.evaluationProgress = 0;
    ElMessage.info('评估已取消并清理物理文件');
  };

  const finishEvaluation = async (report: any) => {
    evalStore.isEvaluating = false;
    evalStore.currentReport = report;
    await evalStore.addHistory(report);
    evalStore.setStep(4);
    ElMessage.success('评估完成！');
  };

  const handleRestartEvaluation = async (confirmDialog: (message: string, title: string, options: any) => Promise<any>) => {
    if (evalStore.currentReport && !evalStore.currentReport.is_archived) {
      try {
        await confirmDialog(
          '您可以选择返回编辑当前内容并重测（保留历史记录），或者重置所有内容（彻底删除当前记录）。',
          '评估迭代提示',
          {
            distinguishCancelAndClose: true,
            confirmButtonText: '返回编辑 (推荐)',
            cancelButtonText: '彻底重置并删除',
            type: 'info'
          }
        );
        evalStore.setStep(2);
        return;
      } catch (action) {
        if (action === 'cancel' && _currentEvaluationId) {
          await evalStore.discardEvaluation(_currentEvaluationId);
          _currentEvaluationId = null;
          evalStore.reset();
        }
        return;
      }
    }
    evalStore.reset();
    _currentEvaluationId = null;
  };

  return {
    handleStartEvaluation,
    cancelEvaluation,
    handleRestartEvaluation
  };
}
