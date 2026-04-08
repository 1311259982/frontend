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
                    <div class="flex items-center gap-2">
                      <el-select v-if="base.versions" v-model="selectedVersions[base.id]" size="small" class="!w-[125px]" @change="handleVersionChange(base, $event)" placeholder="选择版本">
                        <el-option 
                          v-for="version in base.versions" 
                          :key="version.id" 
                          :label="version.version" 
                          :value="version.id" 
                        />
                      </el-select>
                      <el-tooltip content="查阅此版本基准文档全貌" placement="top">
                        <el-button size="small" circle icon="Notebook" type="success" plain @click.stop="() => { const v = base.versions.find(ver => ver.id === selectedVersions[base.id]) || base; $router.push({ name: 'BaselineDetail', params: { versionId: v.id }, query: { project: base.name, title: v.title || base.name, version: v.version } }) }" />
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
                    @click.stop="handleBaselineReference(base.versions && base.versions.find(v => v.id === selectedVersions[base.id]) || base)" 
                  />
                  <el-button 
                    size="small" 
                    circle 
                    icon="Delete" 
                    type="danger" 
                    plain 
                    class="flex items-center justify-center !ml-0"
                    @click.stop="deleteBaseline(base, selectedVersions[base.id])" 
                  />
                </div>
              </div>
            </template>
            
            <div class="space-y-3 p-3 bg-gray-50/70 rounded-b-xl">
              <!-- Parent Item (The Baseline itself) -->
              <div 
                v-for="versionItem in [base.versions.find(v => v.id === selectedVersions[base.id]) || base]"
                :key="versionItem.id"
                class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-l-blue-400 transition-all duration-300 group relative"
              >

                <h4 class="text-sm font-bold text-gray-800 line-clamp-1 mb-2 pr-8">{{ versionItem.title || base.name }} <el-tag size="small" type="info" class="ml-2 !scale-90 origin-left">版本总览</el-tag></h4>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ versionItem.date || versionItem.created_at?.split('T')[0] }}</span>
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
  const selectedVersion = base.versions?.find((v: any) => v.id === selectedId) || base;
  if (!base.history) return [];
  
  // 改为按版本号强制直观并类以确保正确区分并展现用户在那个阶段做出的所有相关批次内容
  return base.history.filter((h: any) => h.version === selectedVersion.version);
};

const handleVersionChange = (base: any, versionId: number) => {
  const selectedVersion = base.versions.find((v: any) => v.id === versionId);
  if (selectedVersion) {
    base.score = selectedVersion.score || base.score;
    ElMessage.info(`工作视图已切换到环境版本: ${selectedVersion.version}`);
  }
};

const handleBaselineReference = (versionItem: any) => {
  evalStore.clearBaselines();
  evalStore.toggleBaseline(versionItem.id);
  evalStore.setStep(2);
  ElMessage.success(`已引用基准版本: ${versionItem.version || versionItem.name}`);
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
