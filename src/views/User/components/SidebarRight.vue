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
                      <span class="text-sm font-bold text-gray-800 truncate min-w-0 leading-tight">{{ base.name }}</span>
                      <el-tag size="small" :type="getScoreType(base.score)" class="text-xs font-bold whitespace-nowrap">{{ base.score }}</el-tag>
                    </div>
                    <el-select v-if="base.versions" v-model="selectedVersions[base.id]" size="small" class="!w-[100px]" @change="handleVersionChange(base, $event)" placeholder="选择版本">
                      <el-option 
                        v-for="version in base.versions" 
                        :key="version.id" 
                        :label="version.version" 
                        :value="version.id" 
                      />
                    </el-select>
                  </div>
                </div>
                <div class="flex flex-col items-center justify-start gap-2 shrink-0 mt-1">
                  <el-button 
                    size="small" 
                    circle 
                    icon="Plus" 
                    type="primary" 
                    class="flex items-center justify-center !ml-0"
                    @click.stop="handleBaselineReference(base)" 
                  />
                  <el-button 
                    size="small" 
                    circle 
                    icon="Delete" 
                    type="danger" 
                    plain 
                    class="flex items-center justify-center !ml-0"
                    @click.stop="deleteBaseline(base)" 
                  />
                </div>
              </div>
            </template>
            
            <div class="space-y-3 p-3 bg-gray-50/70 rounded-b-xl">
              <!-- Parent Item (The Baseline itself) -->
              <div 
                v-for="versionItem in [base.versions.find(v => v.id === selectedVersions[base.id]) || base]"
                :key="versionItem.id"
                class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-l-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                @click="() => {
                  const matchedEval = base.history && base.history.find((h: any) => h.version === versionItem.version || (h.parent_base_id === versionItem.parent_base_id && versionItem.parent_base_id));
                  if (matchedEval) emit('loadHistory', matchedEval);
                  else ElMessage.warning('未找到该版本对应的评估明细记录，可使用左侧「查看文档」按钮查阅基准详情');
                }"
              >
                <h4 class="text-sm font-bold text-gray-800 line-clamp-1 mb-2 pr-8">{{ versionItem.title || base.name }}</h4>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ versionItem.date || versionItem.created_at?.split('T')[0] }}</span>
                </div>
                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <el-button size="small" circle icon="Notebook" type="success" plain @click.stop="$router.push({ name: 'BaselineDetail', params: { versionId: versionItem.id }, query: { project: base.name, title: versionItem.title || base.name, version: versionItem.version } })" />
                  <el-button size="small" circle icon="View" type="primary" plain @click.stop="() => {
                    const matchedEval = base.history && base.history.find((h: any) => h.version === versionItem.version || (h.parent_base_id === versionItem.parent_base_id && versionItem.parent_base_id));
                    if (matchedEval) emit('loadHistory', matchedEval);
                    else ElMessage.warning('无法找到该版本对应的评估明细记录');
                  }" />
                </div>
              </div>

              <!-- Child Items -->
              <div 
                v-for="item in filteredHistory(base)" 
                :key="item.id"
                class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                @click="loadHistory(item)"
              >
                <h4 class="text-sm font-bold text-gray-700 line-clamp-1 mb-2 pr-8">{{ item.title }}</h4>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ item.date }}</span>
                </div>
                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
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
import { ElMessage } from 'element-plus';

defineProps<{ collapsed: boolean, width: number }>();


const evalStore = useEvaluationStore();
const baselineStore = useBaselineStore();
const router = useRouter();

const historySearch = ref('');
const activeHistoryNames = ref('');
const selectedVersions = reactive<Record<string, number>>({});

// 自动锁定每个项目的最新版本
watch(() => evalStore.aggregatedHistory.baselines, (newBaselines) => {
  newBaselines.forEach(base => {
    if (!selectedVersions[base.id] && base.versions && base.versions.length > 0) {
      // 默认选中第一项（即最新的版本号，因为 baselineTree 已按版本倒序排列）
      selectedVersions[base.id] = base.versions[0].id;
    }
  });
}, { immediate: true, deep: true });

const getScoreType = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

const filteredHistory = (base: any) => {
  const selectedId = selectedVersions[base.id] || base.id;
  if (!base.history) return [];
  
  return base.history.filter((h: any) => h.parent_base_id === selectedId);
};

const handleVersionChange = (base: any, versionId: number) => {
  const selectedVersion = base.versions.find((v: any) => v.id === versionId);
  if (selectedVersion) {
    base.score = selectedVersion.score || base.score;
    ElMessage.info(`已切换到版本: ${selectedVersion.version}`);
    
    // 切换下拉框时，自动在左侧面板加载并且展示该版本的评估记录以示区分
    const matchedEval = base.history && base.history.find((h: any) => h.version === selectedVersion.version || (h.parent_base_id === selectedVersion.parent_base_id && selectedVersion.parent_base_id));
    if (matchedEval) {
      emit('loadHistory', matchedEval);
    }
  }
};

const handleBaselineReference = (base: any) => {
  evalStore.clearBaselines();
  evalStore.toggleBaseline(base.id);
  evalStore.setStep(2);
  ElMessage.success(`已引用基准需求: ${base.name} (包含 ${base.history.filter((h: any) => h.is_archived).length} 个已归档子版本)`);
};

const deleteBaseline = (base: any) => {
  // Logic already exists in composable, but here we can emit or use state.
  // We'll emit to let the parent handle the MessageBox if we want strict decomposition,
  // but since we have store, we can also use store here.
  // To match the original code completely, we'll emit.
  emit('deleteBaseline', base);
};

const emit = defineEmits(['toggle', 'resize', 'loadHistory', 'referenceBaseline', 'deleteBaseline']);

const loadHistory = (item: any) => {
  emit('loadHistory', item);
};
</script>
