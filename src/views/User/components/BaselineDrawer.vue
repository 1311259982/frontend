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
        <div v-for="(versions, projectName) in groupedBaselines" :key="projectName">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer" @click="toggleProjectCollapse(projectName)">
            <div class="flex items-center gap-2">
              <el-icon :class="{'rotate-180': collapsedProjects[projectName]}" class="transition-transform">
                <CaretBottom />
              </el-icon>
              <h3 class="text-sm font-bold text-gray-800">{{ projectName }}</h3>
              <span class="text-xs text-gray-400">({{ versions.length }} 个版本)</span>
            </div>
          </div>
          
          <el-collapse-transition>
            <div v-if="!collapsedProjects[projectName]" class="pl-4 border-l-2 border-gray-200 mt-1">
              <div class="p-3 rounded-xl border border-gray-100">
                <div class="mb-3">
                  <el-select v-model="selectedVersions[projectName]" placeholder="选择版本" size="small" class="w-full">
                    <el-option 
                      v-for="version in versions" 
                      :key="version.id" 
                      :label="version.version" 
                      :value="version.id" 
                    />
                  </el-select>
                </div>
                
                <div v-if="getSelectedVersion(projectName)" class="space-y-3">
                  <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                      归档于: {{ getSelectedVersion(projectName)?.date }}
                    </div>
                    <el-tag size="small" :type="getSelectedVersion(projectName)?.score > 80 ? 'success' : 'warning'">{{ getSelectedVersion(projectName)?.score }}分</el-tag>
                  </div>

                  <div class="flex gap-2">
                    <el-button size="small" icon="View" @click.stop="$emit('previewFile', getSelectedVersion(projectName))">预览</el-button>
                    <el-button 
                      size="small" 
                      :type="evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? 'danger' : 'primary'"
                      :icon="evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? 'Close' : 'Connection'"
                      @click.stop="$emit('referenceBaseline', selectedVersions[projectName])"
                    >
                      {{ evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? '取消引用' : '引用' }}
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

const filteredBaselines = computed(() => {
  let files = baselineStore.allFiles;
  if (baselineSearch.value) {
    files = files.filter(f => f.name.toLowerCase().includes(baselineSearch.value.toLowerCase()));
  }
  if (baselineFilter.value !== 'all') {
    files = files.filter(f => f.scope === baselineFilter.value);
  }
  return files;
});

const groupedBaselines = computed(() => {
  const files = filteredBaselines.value;
  const groups: Record<string, any[]> = {};
  const roots = files.filter(f => !f.parent_base_id);
  
  roots.forEach(root => {
    const versions = files.filter(f => f.parent_base_id === root.id || f.id === root.id)
      .sort((a, b) => {
        const vA = parseFloat(a.version.replace(/[^0-9.]/g, ''));
        const vB = parseFloat(b.version.replace(/[^0-9.]/g, ''));
        return vB - vA;
      });
    groups[root.name] = versions;
  });
  return groups;
});

const toggleProjectCollapse = (projectName: string) => {
  collapsedProjects.value[projectName] = !collapsedProjects.value[projectName];
};

const getSelectedVersion = (projectName: string) => {
  const versionId = selectedVersions[projectName];
  if (!versionId) return null;
  const versions = groupedBaselines.value[projectName];
  return versions?.find((v: any) => v.id === versionId) || null;
};
</script>
