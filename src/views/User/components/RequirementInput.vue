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
          <el-radio-group v-model="evalStore.requirementType" size="small" :disabled="evalStore.onlyReference || !!evalStore.uploadedFile">
            <el-radio-button label="text">文本输入</el-radio-button>
            <el-radio-button label="document">文档上传</el-radio-button>
          </el-radio-group>
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
            <el-button v-if="evalStore.editMode === 'incremental'" size="small" type="warning" plain icon="Unlock" @click="handleUnlockBaseline">解锁并修改基准</el-button>
            <el-tag v-else size="small" type="warning" effect="dark">已进入全量重塑模式</el-tag>
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
      <div v-if="evalStore.referencedBaselineIds.length === 0" class="space-y-2">
        <label class="text-sm font-bold text-gray-700">项目名</label>
        <el-input
          v-model="evalStore.projectName"
          placeholder="请输入项目名，将作为评估历史的分组依据"
          size="large"
          :disabled="evalStore.onlyReference"
        />
      </div>

      <!-- Requirement Title Input -->
      <div class="space-y-2">
        <label class="text-sm font-bold text-gray-700">需求标题</label>
        <el-input
          v-model="evalStore.requirementTitle"
          placeholder="请输入需求标题，将作为项目名下的需求标题展示"
          size="large"
          :disabled="evalStore.onlyReference"
        />
      </div>

      <el-card class="border-none shadow-sm bg-gray-50 rounded-2xl overflow-hidden">
        <div v-if="evalStore.requirementType === 'text'" class="p-1">
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
                    :disabled="item.status === 'deleted' || evalStore.onlyReference"
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
            
            <el-button 
              type="primary" plain class="w-full border-dashed" icon="Plus" 
              @click="evalStore.addItem('', '')"
              :disabled="evalStore.onlyReference"
            >
              添加新需求卡片
            </el-button>
          </div>

          <!-- 旧版长文本模式 (无卡片时备用) -->
          <div v-else class="relative">
            <el-input
              v-model="evalStore.textContent"
              type="textarea"
              :rows="12"
              :placeholder="inputPlaceholder"
              resize="none"
              :disabled="evalStore.onlyReference"
            />
            <div class="p-3 bg-white border-t flex justify-between items-center text-[11px] text-gray-500 rounded-b-xl">
              <el-button size="small" type="primary" plain icon="DocumentCopy" @click="evalStore.addItem('默认卡片标题', evalStore.textContent); evalStore.textContent=''">
                转换为卡片流模式 (推荐)
              </el-button>
              <span>当前字数: {{ evalStore.textContent.length }}</span>
            </div>
          </div>
        </div>

        <div v-else class="p-8" :class="{ 'opacity-50 pointer-events-none': evalStore.onlyReference }">
          <el-upload
            v-if="!evalStore.uploadedFile"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            @change="handleReqFileUpload"
            class="w-full"
            :disabled="evalStore.onlyReference"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传需求文档</em>
              <p class="text-xs text-gray-400 mt-2">支持 PDF, DOCX, TXT 格式</p>
            </div>
          </el-upload>
          
          <div v-if="evalStore.uploadedFile" class="mt-4 p-4 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <el-icon size="24" color="#3b82f6"><Document /></el-icon>
              <div>
                <p class="text-sm font-bold text-gray-700">{{ evalStore.uploadedFile.name }}</p>
                <p class="text-xs text-gray-400">{{ evalStore.uploadedFile.size }} • 解析成功</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-button 
                link 
                :type="isEditingParsedText ? 'success' : 'primary'" 
                :icon="isEditingParsedText ? 'View' : 'Edit'" 
                @click="isEditingParsedText = !isEditingParsedText"
              >
                {{ isEditingParsedText ? '收起预览' : '预览并编辑内容' }}
              </el-button>
              <el-button link type="danger" icon="Delete" @click="evalStore.removeUploadedFile()">移除</el-button>
            </div>
          </div>

          <!-- 解析文本预览与编辑容器 -->
          <div v-if="evalStore.uploadedFile && isEditingParsedText" class="mt-4 p-4 bg-white rounded-xl border border-blue-50 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center justify-between mb-2 px-1">
              <p class="text-xs font-bold text-gray-500 flex items-center gap-1">
                <el-icon><Document /></el-icon> 解析文本 (建议将解析后的文本转为卡片流)
              </p>
              <el-button size="small" type="primary" plain icon="DocumentCopy" @click="evalStore.requirementType = 'text'; evalStore.addItem('解析导入卡片', evalStore.textContent); evalStore.textContent=''; isEditingParsedText=false">
                转入卡片流模式
              </el-button>
            </div>
            <el-input
              v-model="evalStore.textContent"
              type="textarea"
              :rows="10"
              placeholder="正在加载解析内容..."
              class="parsed-editor-mini"
            />
          </div>
        </div>
      </el-card>

      <!-- Only evaluate new content switch -->
      <div v-if="evalStore.referencedBaselineIds.length > 0" class="flex items-center gap-2 px-2">
        <el-checkbox v-model="evalStore.onlyEvaluateNew">仅评估本次新增内容，不合并基准做整体评估</el-checkbox>
        <el-tooltip content="打开后仅生成新增内容评分，关闭则默认生成三维评分（新增、一致性、整体）" placement="top">
          <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
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
import { ref, computed, watch, reactive } from 'vue';
import { useEvaluationStore, useBaselineStore, useModelStore } from '@/store';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Connection, View, Close, Document, Edit, Delete, UploadFilled, QuestionFilled, ChatLineRound, Unlock, DocumentCopy } from '@element-plus/icons-vue';

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
    if (evalStore.editMode === 'full') {
      return '全量重塑模式：您可以在此直接修改或覆盖原有的基准需求文档内容...';
    }
    return '您已引用基准需求。默认在此输入【本次新增或变化的需求内容】（请勿输入基准中已有且未变更的内容）...';
  }
  return '请输入您需要评估的需求内容，支持单条/多条需求，将作为本次评估的核心对象...';
});

const handleUnlockBaseline = () => {
  ElMessageBox.confirm(
    '将基准内容同步到编辑器后，本次评估将转为“全量覆盖/重塑模式”，您可以整体修改需求。确认继续？',
    '解锁基准重塑',
    {
      confirmButtonText: '确认解锁',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    evalStore.unlockBaselineToEditor();
    ElMessage.success('已切换为全量重塑模式，基准内容已载入');
  }).catch(() => {
    // cancelled
  });
};

const handleReqFileUpload = async (file: any) => {
  try {
    await evalStore.uploadFile(file.raw);
    ElMessage.success('需求文档上传并解析成功，已自动填充编辑器');
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};
</script>
