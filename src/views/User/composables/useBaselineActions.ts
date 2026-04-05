import { ElMessage, ElMessageBox } from 'element-plus';
import { useBaselineStore, useEvaluationStore, useKnowledgeStore } from '@/store';
import { getDeletePreview } from '@/services';

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

  /**
   * 删除某个精确版本（及其所有子孙版本）。
   * @param base         整个项目基准对象（用于展示项目名）
   * @param versionId    当前选中的具体版本 ID（精准删除目标）
   */
  const deleteBaseline = async (base: any, versionId?: number) => {
    // 如果没传 versionId，则取 base 根节点 ID（兜底：删整个项目）
    const targetId = versionId ?? base.id;

    try {
      // 1. 先向后端查询删除影响范围
      const preview = await getDeletePreview(targetId);

      // 2. 根据影响范围选择三档不同的弹窗
      let confirmMessage = '';
      let confirmType: 'warning' | 'error' = 'warning';
      let confirmTitle = '删除确认';

      if (preview.will_delete_project && preview.affected_count === 1) {
        // 场景 A：这是项目最后一个版本，删完项目将完全消失
        confirmTitle = '⚠️ 删除最终版本';
        confirmMessage = `您正在删除 <b>${base.name}</b> 的最后一个版本 <b>${preview.target_version}</b>。\n\n删除后该项目将从评估历史中完全移除，此操作不可撤销。`;
        confirmType = 'error';
      } else if (preview.affected_count > 1) {
        // 场景 B：该版本存在子孙版本，将被级联删除
        const childList = preview.affected_versions.join('、');
        confirmTitle = '⚠️ 级联删除警告';
        confirmMessage = `您正在删除 <b>${base.name}</b> 的 <b>${preview.target_version}</b> 版本。\n\n由于该版本下存在 <b>${preview.affected_count - 1}</b> 个子版本（${childList}），它们将被一并级联删除。\n\n此操作不可撤销！`;
        confirmType = 'warning';
      } else {
        // 场景 C：叶子节点，简单提示
        confirmTitle = '删除版本';
        confirmMessage = `确定删除 <b>${base.name}</b> 的 <b>${preview.target_version}</b> 版本吗？\n\n此操作不可撤销。`;
        confirmType = 'warning';
      }

      await ElMessageBox.confirm(confirmMessage, confirmTitle, {
        type: confirmType,
        dangerouslyUseHTMLString: true,
        confirmButtonText: preview.will_delete_project ? '确定删除项目' : '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: preview.affected_count > 1 ? 'el-button--danger' : '',
      });

      // 3. 用户确认后执行删除
      await baselineStore.removeBaseline(targetId);
      ElMessage.success(
        preview.will_delete_project
          ? `项目 "${base.name}" 已完全删除`
          : `版本 ${preview.target_version} 及其 ${preview.affected_count > 1 ? `${preview.affected_count - 1} 个子版本` : ''} 已删除`
      );
    } catch (e: any) {
      // ElMessageBox.confirm 取消时会 reject，这里区分取消和真实错误
      if (e === 'cancel' || e?.action === 'cancel' || e?.message === 'cancel') return;
      ElMessage.error(`删除失败：${e?.message || '请检查网络或联系管理员'}`);
    }
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
          full_content: evalStore.textContent,
          source_evaluation_id: target.id  // 关键：传入评估ID供后端排除干扰并同步版本
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
        full_content: evalStore.textContent,
        source_evaluation_id: target.id  // 关键：传入评估ID供后端排除干扰并同步版本
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
