<template>
  <div v-if="evalStore.currentStep >= 2 && !evalStore.currentReport" class="max-w-4xl mx-auto space-y-8">
    <!-- Module 1: Requirement Submission -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold flex items-center gap-2">
          <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
          提交待评估需求
        </h3>
        <div class="flex items-center gap-4">
          <el-button 
            type="primary" 
            size="small" 
            icon="Plus" 
            class="rounded-lg"
            @click="$emit('openBaselineDrawer')"
          >
            引用历史基准需求
          </el-button>
          <!-- 移除文本/文档互斥模式，统一使用卡片模式 -->
        </div>
      </div>

      <!-- Referenced Baseline Module -->
      <div v-if="evalStore.referencedBaselineIds.length > 0" class="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <el-icon :size="20"><Connection /></el-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">基准上下文</span>
              </div>
              <h4 class="text-sm font-bold text-gray-800">{{ baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.name }}</h4>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <el-button size="small" link type="primary" icon="View" @click="$emit('previewFile', baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0]))">查看全文</el-button>
            <el-button size="small" link type="danger" icon="Close" @click="evalStore.clearBaselines()">取消引用</el-button>
          </div>
        </div>
        
        <div class="flex items-center gap-4 pt-2 border-t border-blue-100/50">
          <div class="flex-1">
            <span class="text-[10px] text-gray-400 block mb-1 uppercase font-bold tracking-tighter">归档时间</span>
            <div class="text-xs text-gray-600 font-medium">
              {{ baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.date }}
            </div>
          </div>
        </div>
      </div>

      <!-- Project Name Input -->
      <div class="space-y-2">
        <label class="text-sm font-bold text-gray-700">项目名</label>
        <el-input
          v-model="evalStore.projectName"
          placeholder="请输入项目名，将作为评估历史的分组依据"
          size="large"
          :disabled="evalStore.onlyReference || evalStore.referencedBaselineIds.length > 0"
          @blur="handleDraftInitialize"
        />
      </div>

      <!-- Version Note Input -->
      <div class="space-y-2">
        <label class="text-sm font-bold text-gray-700">版本备注 <span class="text-gray-400 font-normal text-xs">(选填)</span></label>
        <el-input
          v-model="evalStore.requirementTitle"
          :placeholder="evalStore.referencedBaselineIds.length > 0 ? '为本次迭代添加备注，如：登录模块优化' : '为本次评估添加备注，将展示在历史记录中'"
          size="large"
          :disabled="evalStore.onlyReference"
          @blur="handleDraftInitialize"
        />
      </div>

      <el-card class="border-none shadow-sm bg-gray-50 rounded-2xl overflow-hidden">
        <div class="p-1">
          <!-- 卡片流模式 -->
          <div v-if="evalStore.items.length > 0" class="space-y-4 p-4 bg-gray-50/50">
            <div 
              v-for="(item, index) in evalStore.items" 
              :key="index"
              class="relative bg-white rounded-xl border p-4 shadow-sm transition-all duration-300"
              :class="{
                'border-green-300 bg-green-50/30': item.status === 'new',
                'border-orange-300 bg-orange-50/30': item.status === 'modified',
                'border-gray-200 opacity-60': item.status === 'deleted',
                'border-blue-100': item.status === 'unchanged'
              }"
            >
              <!-- Card Header -->
              <div class="flex items-center justify-between mb-3 border-b pb-2" :class="{'border-gray-100': item.status === 'unchanged', 'border-green-100': item.status === 'new', 'border-orange-100': item.status === 'modified'}">
                <div class="flex items-center gap-3">
                  <el-tag size="small" effect="light"
                    :type="item.status === 'new' ? 'success' : item.status === 'modified' ? 'warning' : item.status === 'deleted' ? 'info' : 'primary'">
                    {{ item.status === 'new' ? '新增卡片' : item.status === 'modified' ? '已修改' : item.status === 'deleted' ? '已删除' : '未修改' }}
                  </el-tag>
                  <el-input 
                    v-model="item.title" 
                    class="font-bold w-64"
                    :class="{'opacity-50': item.status === 'deleted'}"
                    size="small"
                    placeholder="输入卡片标题"
                    :disabled="item.status !== 'new' || evalStore.onlyReference"
                    @input="evalStore.updateItem(index, item.title, item.content)"
                  />
                </div>
                <div v-if="!evalStore.onlyReference">
                  <el-button 
                    v-if="item.status === 'deleted'"
                    size="small" type="success" plain @click="evalStore.toggleDeleteItem(index)"
                  >
                    恢复卡片
                  </el-button>
                  <el-button 
                    v-else
                    size="small" type="danger" plain icon="Delete" @click="evalStore.toggleDeleteItem(index)"
                  />
                </div>
              </div>
              
              <!-- Card Content -->
              <el-input
                v-model="item.content"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 8 }"
                placeholder="在此输入或编辑需求细节..."
                resize="none"
                :disabled="item.status === 'deleted' || evalStore.onlyReference"
                @input="evalStore.updateItem(index, item.title, item.content)"
                class="req-card-input"
              />
            </div>
            
          </div>
          
          <div class="flex flex-col items-center justify-center p-8 border-t border-gray-100 gap-4" :class="{'bg-white': evalStore.items.length === 0}">
            <p v-if="evalStore.items.length === 0" class="text-sm text-gray-400 mb-2">暂无需求卡片，请手动添加或上传文档解析</p>
            <div class="flex items-center gap-4">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleReqFileUploadAsCard"
                :disabled="evalStore.onlyReference || isUploadingDoc"
              >
                <el-button size="large" type="success" plain :loading="isUploadingDoc" icon="DocumentAdd" class="w-48 border-dashed">
                  上传文档解析为卡片
                </el-button>
              </el-upload>
              <el-button 
                type="primary" plain class="w-48 border-dashed" icon="Plus" size="large"
                @click="evalStore.addItem('', '')"
                :disabled="evalStore.onlyReference"
              >
                新增空需求卡片
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

    </section>

    <!-- Module 2: Instructions -->
    <section class="space-y-4">
      <h3 class="text-lg font-bold flex items-center gap-2">
        <span class="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">3</span>
        补充评估指令 (选填)
      </h3>
      <el-input
        v-model="evalStore.instructions"
        placeholder="选填：可输入本次评估的补充要求、重点关注维度、特殊规则等，无特殊要求可留空"
        size="large"
        prefix-icon="ChatLineRound"
      />
    </section>

    <!-- Step 3: Parameters (Optional) -->
    <section v-if="evalStore.currentStep === 3" class="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
      <h3 class="text-sm font-bold text-blue-800 flex items-center gap-2 uppercase tracking-widest">评估参数设置</h3>
      <div class="grid grid-cols-2 gap-8">
        <el-form-item label="评估深度">
          <el-slider v-model="localSettings.depth" :step="1" :max="3" show-stops />
        </el-form-item>
        <el-form-item label="模型选择">
          <el-select 
            v-model="localSettings.selectedModelId" 
            class="w-full"
            v-loading="modelStore.isLoading"
            placeholder="正在同步配置..."
          >
            <el-option 
              v-for="model in availableModels" 
              :key="model.id" 
              :label="model.name" 
              :value="model.id" 
            />
          </el-select>
        </el-form-item>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onBeforeUnmount } from 'vue';
import { useEvaluationStore, useBaselineStore, useModelStore } from '@/store';
import { uploadRequirementFile } from '@/services';
import { ElMessage } from 'element-plus';
import { Plus, Connection, View, Close, Document, Delete, UploadFilled, ChatLineRound, DocumentCopy, DocumentAdd } from '@element-plus/icons-vue';

const props = defineProps<{ settings: { depth: number; selectedModelId: number | null } }>();
const emit = defineEmits(['update:settings', 'openBaselineDrawer', 'previewFile']);

const evalStore = useEvaluationStore();
const baselineStore = useBaselineStore();
const modelStore = useModelStore();

const isEditingParsedText = ref(false);

const localSettings = reactive({ ...props.settings });

watch(localSettings, (newVal) => {
  emit('update:settings', newVal);
}, { deep: true });

const availableModels = computed(() => {
  return modelStore.models.filter(m => m.is_active);
});

const inputPlaceholder = computed(() => {
  if (evalStore.referencedBaselineIds.length > 0) {
    return '您已引用基准需求。默认在此编辑/新增【本次变化的需求卡片】...';
  }
  return '请输入您需要评估的需求内容，支持单条/多条需求，将作为本次评估的核心对象...';
});

const handleDraftInitialize = () => {
    if (evalStore.projectName && !evalStore.draftId) {
        evalStore.initDraft();
    } else if (evalStore.draftId) {
        // Option to sync title/project name edits immediately?
        // evalStore.debouncedSyncItems() would only sync items. This is fine.
    }
};

const handleBeforeUnload = () => {
    if (evalStore.draftId) {
        // Use synchronous beacon or fetch keepalive if possible, or simple reset
        navigator.sendBeacon(`/api/evaluations/${evalStore.draftId}`, null);
    }
};

window.addEventListener('beforeunload', handleBeforeUnload);

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (evalStore.draftId) {
        evalStore.reset();
    }
});

const isUploadingDoc = ref(false);

const handleReqFileUploadAsCard = async (file: any) => {
  if (!file.raw) return;
  isUploadingDoc.value = true;
  try {
    const res = await uploadRequirementFile(file.raw);
    const title = file.name || '文档提取需求';
    evalStore.addItem(title, res.parsed_text || '');
    ElMessage.success('文档解析成功，已自动添加为需求卡片');
  } catch (e: any) {
    ElMessage.error(`文档解析失败: ${e.message || '未知错误'}`);
  } finally {
    isUploadingDoc.value = false;
  }
};
</script>
