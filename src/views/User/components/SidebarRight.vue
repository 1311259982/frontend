<template>
  <div 
    v-if="!collapsed"
    class="w-1 hover:bg-blue-400 cursor-col-resize transition-colors z-20"
    @mousedown="$emit('resize', $event)"
  ></div>
  <aside 
    :class="['bg-gray-50 border-l border-gray-200 flex flex-col shadow-inner transition-all duration-300 ease-in-out relative', collapsed ? 'w-12' : '']"
    :style="!collapsed ? { width: width + 'px' } : {}"
  >
    <template v-if="!collapsed">
      <div class="p-6 border-b border-gray-200 bg-white">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <el-icon><Timer /></el-icon> 评估历史
          </h2>
          <el-button link @click="$emit('toggle')">
            <el-icon><Expand /></el-icon>
          </el-button>
        </div>
        <div class="flex gap-2">
          <el-input v-model="historySearch" placeholder="搜索需求名称..." prefix-icon="Search" size="small" class="flex-1" />
          <el-button size="small" icon="Filter" />
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        <!-- Grouped by Baseline -->
        <el-collapse v-model="activeHistoryNames" accordion class="border-none space-y-3">
          <el-collapse-item v-for="base in evalStore.aggregatedHistory.baselines" :key="base.id" :name="base.id" class="group rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <template #title>
              <div class="flex items-start justify-between w-full p-4 bg-white gap-4 min-h-[80px]">
                <div class="flex items-start gap-3 flex-1 overflow-hidden">
                  <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <el-icon class="text-blue-600 font-bold text-lg"><Connection /></el-icon>
                  </div>
                  <div class="flex flex-col overflow-hidden flex-1 gap-2">
                    <div class="flex items-center gap-2">
                      <el-tooltip :content="'版本备注: ' + (getSelectedVersionNote(base) || '完全一致')" placement="top-start" :show-after="200" transition="el-zoom-in-bottom">
                        <span class="text-sm font-bold text-gray-800 truncate min-w-0 leading-tight cursor-default hover:text-blue-600 transition-colors underline decoration-dashed decoration-gray-300 underline-offset-4">{{ base.name }}</span>
                      </el-tooltip>
                      <el-tag size="small" :type="getScoreType(base.score)" class="text-xs font-bold whitespace-nowrap">{{ base.score }}</el-tag>
                    </div>
                    <div class="flex items-center gap-2">
                      <el-select v-model="selectedVersions[base.id]" size="small" class="!w-[105px]" @change="handleVersionChange(base, $event)" placeholder="选择版本">
                        <el-option 
                          v-for="vInfo in getAvailableVersions(base)" 
                          :key="vInfo.version" 
                          :label="vInfo.version" 
                          :value="vInfo.version" 
                        />
                      </el-select>
                      <el-tooltip content="查阅此版本基准文档全貌" placement="top">
                        <el-button size="small" circle icon="Notebook" type="success" plain @click.stop="openBaselineDetail(base)" />
                      </el-tooltip>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-center justify-start gap-2 shrink-0 mt-1">
                  <el-button 
                    size="small" 
                    circle 
                    icon="Plus" 
                    type="primary" 
                    class="flex items-center justify-center !ml-0"
                    @click.stop="handleReferenceEx(base)" 
                  />
                  <el-button 
                    size="small" 
                    circle 
                    icon="Delete" 
                    type="danger" 
                    plain 
                    class="flex items-center justify-center !ml-0"
                    @click.stop="deleteBaselineEx(base)" 
                  />
                </div>
              </div>
            </template>
            
            <div class="space-y-3 p-3 bg-gray-50/70 rounded-b-xl">
              <!-- Parent Item: Baseline Version Overview — show all cards for this version -->
              <template v-if="base.versions.find(v => v.version === selectedVersions[base.id])">
                <div 
                  v-for="versionItem in [base.versions.find(v => v.version === selectedVersions[base.id])]"
                  :key="versionItem.id"
                  class="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <el-tag size="small" type="primary">{{ versionItem.version || 'V?' }}</el-tag>
                    <span class="text-xs font-semibold text-blue-700">基准快照</span>
                    <span class="text-xs text-gray-400 ml-auto">{{ versionItem.date || versionItem.created_at?.split('T')[0] }}</span>
                  </div>
                  <!-- Show all requirement card titles belonging to this version -->
                  <div v-if="versionItem.card_titles && versionItem.card_titles.length > 0" class="space-y-1">
                    <div 
                      v-for="(ct, idx) in versionItem.card_titles" 
                      :key="idx"
                      class="flex items-start gap-1.5"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1"></span>
                      <span class="text-xs text-blue-600">{{ ct }}</span>
                    </div>
                  </div>
                  <p v-else class="text-xs text-blue-500">{{ versionItem.title || base.name }}</p>
                </div>
              </template>

              <!-- Child Items (Evaluation Records): only show deltas -->
              <div 
                v-for="item in filteredHistory(base)" 
                :key="item.id"
                class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                @click="loadHistory(item)"
              >
                <!-- Header row: status + date -->
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <el-tag v-if="item.is_archived" size="small" type="success" class="!text-xs">已归档</el-tag>
                    <el-tag v-else size="small" type="warning" class="!text-xs">评估中</el-tag>
                  </div>
                  <span class="text-xs text-gray-400">{{ item.date }}</span>
                </div>

                <!-- Changed card titles -->
                <div v-if="item.card_titles && item.card_titles.length > 0" class="space-y-1 mb-2 pr-8">
                  <div 
                    v-for="(ct, idx) in item.card_titles" 
                    :key="idx"
                    class="flex items-start gap-1.5"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
                    <span class="text-sm text-gray-700 leading-snug">{{ ct }}</span>
                  </div>
                </div>
                <p v-else class="text-sm text-gray-400 italic mb-2 pr-8">无内容变更记录</p>

                <!-- Removed bottom date -->

                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <el-button size="small" circle icon="View" type="primary" plain @click.stop="loadHistory(item)" />
                </div>
              </div>


            </div>
          </el-collapse-item>
        </el-collapse>

        <div v-if="evalStore.history.length === 0 && evalStore.aggregatedHistory.baselines.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400 opacity-40">
          <el-icon size="64" class="mb-2"><DataBoard /></el-icon>
          <p class="text-sm">暂无评估记录</p>
        </div>
      </div>
    </template>
    <div v-else class="flex flex-col items-center py-5 gap-4">
      <el-button link @click="$emit('toggle')">
        <el-icon><Fold /></el-icon>
      </el-button>
      <el-icon class="text-gray-300"><Timer /></el-icon>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEvaluationStore, useBaselineStore } from '@/store';
import { Timer, Expand, Search, Filter, Connection, Plus, Delete, Fold, Notebook, View, DataBoard } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteEvaluation } from '@/services';

defineProps<{ collapsed: boolean, width: number }>();


const evalStore = useEvaluationStore();
const baselineStore = useBaselineStore();
const router = useRouter();

const historySearch = ref('');
const activeHistoryNames = ref('');
const selectedVersions = reactive<Record<string, string>>({}); // base.id -> 'V1.0'

const getAvailableVersions = (base: any) => {
  const versionsMap = new Map<string, any>();
  if (base.history) {
    base.history.forEach((h: any) => {
      if (h.version && !versionsMap.has(h.version)) {
        versionsMap.set(h.version, { version: h.version, note: h.title, isArchived: h.is_archived, baseId: null });
      } else if (h.version) {
        if (h.title) versionsMap.get(h.version).note = h.title;
        if (h.is_archived) versionsMap.get(h.version).isArchived = true;
      }
    });
  }
  if (base.versions) {
    base.versions.forEach((v: any) => {
      if (v.version && !versionsMap.has(v.version)) {
        versionsMap.set(v.version, { version: v.version, note: v.desc || v.title, isArchived: true, baseId: v.id });
      } else if (v.version) {
        versionsMap.get(v.version).isArchived = true;
        versionsMap.get(v.version).baseId = v.id;
        if (v.desc || v.title) versionsMap.get(v.version).note = v.desc || v.title;
      }
    });
  }
  return Array.from(versionsMap.values()).sort((a, b) => {
    const vA = parseFloat(a.version.replace(/[^0-9.]/g, '') || '0');
    const vB = parseFloat(b.version.replace(/[^0-9.]/g, '') || '0');
    return vB - vA;
  });
};

const getSelectedVersionNote = (base: any) => {
  const versions = getAvailableVersions(base);
  const vInfo = versions.find(v => v.version === selectedVersions[base.id]);
  return vInfo ? vInfo.note : '';
};

// 自动锁定每个项目的最新版本
watch(() => evalStore.aggregatedHistory.baselines, (newBaselines) => {
  newBaselines.forEach(base => {
    if (!selectedVersions[base.id]) {
      const versions = getAvailableVersions(base);
      if (versions.length > 0) {
        selectedVersions[base.id] = versions[0].version;
      }
    }
  });
}, { immediate: true, deep: true });

const getScoreType = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

const filteredHistory = (base: any) => {
  if (!base.history) return [];
  const selectedVersionStr = selectedVersions[base.id];
  return base.history.filter((h: any) => h.version === selectedVersionStr).sort((a: any, b: any) => b.id - a.id);
};

const handleVersionChange = (base: any, versionStr: string) => {
  const versions = getAvailableVersions(base);
  const selectedVersion = versions.find(v => v.version === versionStr);
  if (selectedVersion) {
    if (selectedVersion.isArchived && selectedVersion.baseId) {
       const vContent = base.versions?.find((v: any) => v.id === selectedVersion.baseId);
       if (vContent) base.score = vContent.score || base.score;
    }
    ElMessage.info(`工作视图已切换到环境版本: ${versionStr}`);
  }
};

const openBaselineDetail = (base: any) => {
  const versions = getAvailableVersions(base);
  const vInfo = versions.find(v => v.version === selectedVersions[base.id]);
  if (vInfo && vInfo.isArchived && vInfo.baseId) {
     const v = base.versions?.find((ver: any) => ver.id === vInfo.baseId) || base;
     router.push({ name: 'BaselineDetail', params: { versionId: v.id }, query: { project: base.name, title: v.title || base.name, version: v.version } });
  } else {
     ElMessage.warning('该版本尚未归档，暂无基准全貌。');
  }
};

const handleReferenceEx = (base: any) => {
  const versions = getAvailableVersions(base);
  const vInfo = versions.find(v => v.version === selectedVersions[base.id]);
  if (vInfo && vInfo.isArchived && vInfo.baseId) {
     const v = base.versions?.find((ver: any) => ver.id === vInfo.baseId);
     handleBaselineReference(v || base);
  } else {
     ElMessage.warning('该版本尚未归档，请先归档再引用！');
  }
};

const handleBaselineReference = (versionItem: any) => {
  evalStore.clearBaselines();
  evalStore.toggleBaseline(versionItem.id);
  evalStore.setStep(2);
  ElMessage.success(`已引用基准版本: ${versionItem.version || versionItem.name}`);
};

const deleteBaselineEx = async (base: any) => {
  const versions = getAvailableVersions(base);
  const vInfo = versions.find(v => v.version === selectedVersions[base.id]);
  if (vInfo && vInfo.baseId) {
     deleteBaseline(base, vInfo.baseId);
  } else if (vInfo && !vInfo.isArchived) {
     const historyItem = base.history?.find((h: any) => h.version === vInfo.version && !h.is_archived);
     if (historyItem && historyItem.id) {
       try {
         await ElMessageBox.confirm(
           `确定删除 <b>${base.name}</b> 的草稿版本 <b>${vInfo.version}</b> 吗？\n\n此操作不可撤销。`,
           '删除草稿',
           { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '确定删除', cancelButtonText: '取消' }
         );
         await deleteEvaluation(historyItem.id);
         evalStore.isHistoryLoaded = false;
         await evalStore.fetchHistory();
         baselineStore.isLoaded = false;
         await baselineStore.fetchBaselines();
         ElMessage.success(`草稿版本 ${vInfo.version} 已删除`);
       } catch (e: any) {
         if (e === 'cancel' || e?.action === 'cancel') return;
         ElMessage.error(`删除失败：${e?.message || '请检查网络或联系管理员'}`);
       }
     } else {
       ElMessage.warning('未找到对应的评估草稿记录');
     }
  } else {
     ElMessage.info('该版本已归档但未找到对应的基准记录，请刷新页面后重试。');
  }
};

const deleteBaseline = (base: any, versionId?: number) => {
  emit('deleteBaseline', base, versionId);
};

const emit = defineEmits<{
  toggle: [];
  resize: [e: MouseEvent];
  loadHistory: [item: any];
  referenceBaseline: [base: any];
  deleteBaseline: [base: any, versionId?: number];
}>();

const loadHistory = (item: any) => {
  emit('loadHistory', item);
};
</script>
