<template>
  <aside 
    :class="['bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 ease-in-out', collapsed ? 'w-12' : 'w-[20%]']"
  >
    <template v-if="!collapsed">
      <!-- Sidebar Header -->
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <el-icon><Files /></el-icon> 参考文档
          </h2>
          <el-button link @click="$emit('toggle')">
            <el-icon><Fold /></el-icon>
          </el-button>
        </div>

        <!-- Tab Switcher -->
        <div class="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            class="flex-1 py-1.5 text-xs font-bold rounded-md transition-all bg-white shadow-sm text-blue-600"
          >
            评估标准
          </button>
        </div>
        
        <!-- Search Standards -->
        <el-input
          v-model="knowledgeStore.searchQuery"
          placeholder="搜索标准名称..."
          prefix-icon="Search"
          size="small"
          clearable
          class="mb-4"
        />

        <!-- Selected Standards Summary (Fixed at top) -->
        <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">已选文档</span>
            <el-tag size="small" type="primary" effect="dark" round>{{ knowledgeStore.allSelectedFiles.length }}</el-tag>
          </div>
          <div v-if="knowledgeStore.allSelectedFiles.length === 0" class="text-[10px] text-red-400">
            请至少勾选 1 项评估标准
          </div>
          <div v-else class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            <el-tag 
              v-for="file in knowledgeStore.allSelectedFiles" 
              :key="file.id"
              size="small"
              closable
              @close="knowledgeStore.removeSelected(file.id, file.isUser)"
              class="max-w-full truncate"
            >
              {{ file.name }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <!-- Standards List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Default Categories -->
          <div v-for="category in knowledgeStore.enabledDefaultCategories" :key="category.id" class="space-y-2">
            <div 
              class="flex items-center justify-between cursor-pointer group px-1"
              @click="knowledgeStore.toggleCategory(category.id)"
            >
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <el-icon :class="{'rotate-[-90deg]': knowledgeStore.collapsedCategories.includes(category.id)}" class="transition-transform">
                  <CaretBottom />
                </el-icon>
                {{ category.name }}
              </h3>
            </div>
            
            <el-collapse-transition>
              <div v-show="!knowledgeStore.collapsedCategories.includes(category.id)" class="space-y-1">
                <div 
                  v-for="file in category.files" 
                  :key="file.id"
                  :class="['flex items-center p-2 rounded-lg transition-all cursor-pointer group border border-transparent', 
                    knowledgeStore.selectedFiles.includes(file.id) ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50']"
                  @click="knowledgeStore.toggleFile(file.id)"
                >
                  <el-checkbox 
                    :model-value="knowledgeStore.selectedFiles.includes(file.id)"
                    @change="knowledgeStore.toggleFile(file.id)"
                    class="mr-3"
                  />
                  <div class="flex-1 min-w-0">
                    <p :class="['text-sm truncate', knowledgeStore.selectedFiles.includes(file.id) ? 'font-bold text-blue-700' : 'text-gray-700']">
                      {{ file.name }}
                    </p>
                  </div>
                  <el-tooltip :content="file.desc" placement="right">
                    <el-icon class="text-gray-300 group-hover:text-blue-400"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
              </div>
            </el-collapse-transition>
          </div>

          <!-- User Defined Categories -->
          <div v-for="category in knowledgeStore.enabledUserCategories" :key="category.id" class="space-y-2">
            <div 
              class="flex items-center justify-between cursor-pointer group px-1"
              @click="knowledgeStore.toggleCategory(category.id)"
            >
              <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1">
                <el-icon :class="{'rotate-[-90deg]': knowledgeStore.collapsedCategories.includes(category.id)}" class="transition-transform">
                  <CaretBottom />
                </el-icon>
                {{ category.name }}
              </h3>
              <el-upload action="#" :auto-upload="false" :show-file-list="false" @change="(f) => handleUpload(f, category.id)">
                <el-button size="small" link type="primary" icon="Plus">上传</el-button>
              </el-upload>
            </div>
            
            <el-collapse-transition>
              <div v-show="!knowledgeStore.collapsedCategories.includes(category.id)" class="space-y-1">
                <div 
                  v-for="file in category.files" 
                  :key="file.id"
                  :class="['flex items-center p-2 rounded-lg transition-all cursor-pointer group border border-transparent', 
                    knowledgeStore.selectedFiles.includes(file.id) ? 'bg-orange-50 border-orange-100' : 'hover:bg-gray-50']"
                  @click="knowledgeStore.toggleFile(file.id)"
                >
                  <el-checkbox 
                    :model-value="knowledgeStore.selectedFiles.includes(file.id)"
                    @change="knowledgeStore.toggleFile(file.id)"
                    class="mr-3"
                  />
                  <div class="flex-1 min-w-0">
                    <p :class="['text-sm truncate', knowledgeStore.selectedFiles.includes(file.id) ? 'font-bold text-orange-700' : 'text-gray-700']">
                      {{ file.name }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <el-button size="small" link type="danger" icon="Delete" @click.stop="handleDelete(category.id, file.id, file.name)" />
                  </div>
                </div>
              </div>
            </el-collapse-transition>
          </div>
      </div>
    </template>
    <div v-else class="flex flex-col items-center py-5 gap-4">
      <el-button link @click="$emit('toggle')">
        <el-icon><Expand /></el-icon>
      </el-button>
      <el-icon class="text-gray-300"><Files /></el-icon>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useKnowledgeStore } from '@/store';
import { Files, Fold, Expand, Search, CaretBottom, InfoFilled, Plus, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

defineProps<{ collapsed: boolean }>();
defineEmits(['toggle']);

const knowledgeStore = useKnowledgeStore();

const handleUpload = async (file: any, categoryId: number) => {
  try {
    await knowledgeStore.uploadStandard(categoryId, file.raw);
    ElMessage.success(`标准文档 "${file.name}" 上传并解析成功`);
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};

const handleDelete = (categoryId: number, fileId: number, fileName: string) => {
  ElMessageBox.confirm(
    `确定要删除标准文件 "${fileName}" 吗？此操作不可逆。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await knowledgeStore.removeFile(categoryId, fileId);
      ElMessage.success('删除成功');
    } catch (e: any) {
      ElMessage.error(`删除失败: ${e.message || '权限不足或未知错误'}`);
    }
  }).catch(() => {});
};
</script>
