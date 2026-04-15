<template>
  <el-drawer
    v-model="visible"
    title="引用历史基准需求"
    direction="rtl"
    size="450px"
  >
    <div class="space-y-6">
      <div class="flex gap-2">
        <el-input v-model="baselineSearch" placeholder="搜索需求名称..." prefix-icon="Search" />
        <el-select v-model="baselineFilter" placeholder="共享范围" style="width: 120px">
          <el-option label="全部" value="all" />
          <el-option label="全平台公开" value="public" />
          <el-option label="私有" value="private" />
        </el-select>
      </div>

      <div class="space-y-4">
        <div v-for="group in displayedBaselines" :key="group.projectName">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer" @click="toggleProjectCollapse(group.projectName)">
            <div class="flex items-center gap-2">
              <el-icon :class="{'rotate-180': collapsedProjects[group.projectName]}" class="transition-transform">
                <CaretBottom />
              </el-icon>
              <h3 class="text-sm font-bold text-gray-800">{{ group.projectName || group.name }}</h3>
              <span class="text-xs text-gray-400">({{ group.versions.length }} 个版本)</span>
            </div>
          </div>
          
          <el-collapse-transition>
            <div v-if="!collapsedProjects[group.projectName]" class="pl-4 border-l-2 border-gray-200 mt-1">
              <div class="p-3 rounded-xl border border-gray-100">
                <div class="mb-3">
                  <el-select v-model="selectedVersions[group.projectName]" placeholder="选择版本" size="small" class="w-full">
                    <el-option 
                      v-for="version in group.versions" 
                      :key="version.id" 
                      :label="version.version" 
                      :value="version.id" 
                    />
                  </el-select>
                </div>
                
                <div v-if="getSelectedVersion(group)" class="space-y-3">
                  <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                      归档于: {{ getSelectedVersion(group)?.date }}
                    </div>
                    <el-tag size="small" :type="(getSelectedVersion(group)?.score || 0) > 80 ? 'success' : 'warning'">{{ getSelectedVersion(group)?.score || 0 }}分</el-tag>
                  </div>
 
                  <div class="flex gap-2">
                    <el-button size="small" icon="View" @click.stop="$emit('previewFile', getSelectedVersion(group))">预览</el-button>
                    <el-button 
                      size="small" 
                      :type="evalStore.referencedBaselineIds.includes(selectedVersions[group.projectName]) ? 'danger' : 'primary'"
                      :icon="evalStore.referencedBaselineIds.includes(selectedVersions[group.projectName]) ? 'Close' : 'Connection'"
                      @click.stop="$emit('referenceBaseline', selectedVersions[group.projectName])"
                    >
                      {{ evalStore.referencedBaselineIds.includes(selectedVersions[group.projectName]) ? '取消引用' : '引用' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400">已选择 {{ evalStore.referencedBaselineIds.length }} 份基准文档</span>
        <el-button type="primary" @click="visible = false">完成选择</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useBaselineStore, useEvaluationStore } from '@/store';
import { Search, CaretBottom, View, Connection, Close } from '@element-plus/icons-vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'previewFile', 'referenceBaseline']);

const baselineStore = useBaselineStore();
const evalStore = useEvaluationStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const baselineSearch = ref('');
const baselineFilter = ref('all');
const selectedVersions = reactive<Record<string, number>>({});
const collapsedProjects = ref<Record<string, boolean>>({});

const displayedBaselines = computed(() => {
  let tree = baselineStore.baselineTree.map(root => ({
    projectName: root.name,
    versions: root.versions,
    scope: root.scope
  }));
  
  if (baselineSearch.value) {
    tree = tree.filter(t => t.projectName.toLowerCase().includes(baselineSearch.value.toLowerCase()));
  }
  if (baselineFilter.value !== 'all') {
    tree = tree.filter(t => t.scope === baselineFilter.value);
  }
  return tree;
});

const toggleProjectCollapse = (projectName: string) => {
  collapsedProjects.value[projectName] = !collapsedProjects.value[projectName];
};

const getSelectedVersion = (group: any) => {
  const versionId = selectedVersions[group.projectName];
  if (!versionId) return null;
  return group.versions.find((v: any) => v.id === versionId) || null;
};
</script>
