import { ElMessage, ElMessageBox } from 'element-plus';
import { useBaselineStore, useEvaluationStore, useKnowledgeStore } from '@/store';

export function useBaselineActions() {
  const baselineStore = useBaselineStore();
  const evalStore = useEvaluationStore();
  const knowledgeStore = useKnowledgeStore();

  const handleReferenceBaseline = (id: number) => {
    evalStore.toggleBaseline(id);
    if (evalStore.referencedBaselineIds.includes(id)) {
      ElMessage.success('已成功引用基准需求，系统将为您执行增量评估模式');
    }
  };

  const deleteBaseline = (base: any) => {
    ElMessageBox.confirm(`确定要删除基准需求 "${base.name}" 及其所有历史版本吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    }).then(() => {
      baselineStore.removeBaseline(base.id);
      evalStore.history = evalStore.history.filter(h => h.parent_base_id !== base.id && h.id !== base.id);
      ElMessage.success('基准需求及关联历史已删除');
    }).catch(() => {});
  };

  const openArchiveDialog = (historyItem?: any) => {
    // Treat event objects as undefined
    if (historyItem && (historyItem instanceof Event || historyItem.type === 'click')) {
      historyItem = undefined;
    }
    const target = historyItem || evalStore.currentReport;
    if (!target) return;

    const isIncremental = evalStore.referencedBaselineIds.length > 0 || (target.parent_base_id);
    const title = isIncremental ? '归档为基准需求' : '归档为基准需求';
    const defaultName = evalStore.projectName || (isIncremental 
      ? (baselineStore.allFiles.find(f => f.id === (evalStore.referencedBaselineIds[0] || target.parent_base_id))?.name)
      : (evalStore.uploadedFile?.name || '新基准需求文档'));

    const performArchive = async (name: string) => {
      const parentId = evalStore.referencedBaselineIds[0] || target.parent_base_id;
      const requirementTitle = historyItem ? historyItem.title : evalStore.requirementTitle;
      try {
        await baselineStore.addBaseline({
          name: name || '未命名基准',
          title: requirementTitle || '未命名需求',
          desc: '由评估报告归档生成的基准需求文档。',
          score: target.total_score || target.score,
          scope: 'private',
          parent_base_id: parentId,
          full_content: evalStore.textContent
        });

        if (historyItem) {
          historyItem.is_archived = true;
        } else if (evalStore.currentReport) {
          evalStore.currentReport.is_archived = true;
        }

        // 核心同步：手动触发数据拉取，确保侧边栏刷新
        baselineStore.isLoaded = false;
        await baselineStore.fetchBaselines();
        evalStore.isHistoryLoaded = false;
        await evalStore.fetchHistory();

        ElMessage.success('已成功归档至基准需求库');
      } catch (e: any) {
        ElMessage.error(`归档失败：${e.message || '未知错误'}`);
      }
    };

    ElMessageBox.confirm(
      `确定要将本次评估结果归档为基准需求吗？`,
      title,
      {
        confirmButtonText: '确定归档',
        cancelButtonText: '取消',
        type: 'success'
      }
    ).then(() => {
      performArchive(defaultName);
    }).catch(() => {});
  };

  const continueSupplementing = () => {
    if (!evalStore.currentReport) return;
    
    if (!evalStore.currentReport.is_archived) {
      const target = evalStore.currentReport;
      const isIncremental = evalStore.referencedBaselineIds.length > 0 || (target.parent_base_id);
      const defaultName = evalStore.projectName || (isIncremental 
        ? (baselineStore.allFiles.find(f => f.id === (evalStore.referencedBaselineIds[0] || target.parent_base_id))?.name)
        : (evalStore.uploadedFile?.name || '新基准需求文档'));
        
      const parentId = evalStore.referencedBaselineIds[0] || target.parent_base_id;
      
      baselineStore.addBaseline({
        name: defaultName || '未命名基准',
        title: evalStore.requirementTitle || defaultName || '未命名需求',
        desc: '由评估报告归档生成的基准需求文档。',
        score: target.total_score || target.score,
        scope: 'private',
        parent_base_id: parentId,
        full_content: evalStore.textContent 
      });
      
      evalStore.currentReport.is_archived = true;
      ElMessage.success('已自动归档当前评估结果');
    }

    if (evalStore.currentReport.parent_base_id) {
      evalStore.referencedBaselineIds = [evalStore.currentReport.parent_base_id];
    } else if (evalStore.referencedBaselineIds.length === 0) {
      const latest = baselineStore.allFiles[0]; 
      if (latest) evalStore.referencedBaselineIds = [latest.id];
    }
    
    evalStore.textContent = '';
    evalStore.uploadedFile = null;
    evalStore.currentReport = null;
    evalStore.setStep(2);
    ElMessage.info('已为您准备好增量补充环境');
  };

  return {
    handleReferenceBaseline,
    deleteBaseline,
    openArchiveDialog,
    continueSupplementing
  };
}
