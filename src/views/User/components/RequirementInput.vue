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

    <!-- Step 3: Parameters -->
    <section v-if="evalStore.currentStep === 3" class="space-y-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
      <h3 class="text-sm font-bold text-blue-800 flex items-center gap-2 uppercase tracking-widest">评估参数设置</h3>
      
      <!-- 第一行：评估深度 + 模型选择 -->
      <div class="grid grid-cols-2 gap-8">
        <!-- 评估深度：折叠时显示，展开时隐藏 -->
        <el-form-item v-if="!isAdvancedOpen" label="评估深度">
          <el-tooltip :content="depthTooltip" placement="top">
            <el-slider v-model="localSettings.depth" :min="1" :max="3" :step="1" show-stops @change="handleDepthChange" :show-tooltip="false" />
          </el-tooltip>
        </el-form-item>
        <!-- 展开高级选项时，显示当前深度为只读标签 -->
        <el-form-item v-else label="评估深度">
          <div class="flex items-center gap-2 h-8">
            <el-tag size="small" type="info">{{ depthLabel[localSettings.depth] }}</el-tag>
            <span class="text-xs text-gray-400">（高级选项已展开，由预设方案控制）</span>
          </div>
        </el-form-item>

        <el-form-item label="模型选择">
          <el-select
            v-model="localSettings.selectedModelId"
            class="w-full"
            :disabled="!modelStore.isCacheReady"
            :placeholder="modelStore.isCacheReady ? '请选择模型' : '模型加载中...'"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
          <div v-if="!modelStore.isCacheReady" class="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <el-icon class="animate-spin"><Loading /></el-icon>
            <span>正在初始化模型实例，请稍候...</span>
          </div>
        </el-form-item>
      </div>

      <!-- 高级选项折叠面板 -->
      <div class="border border-blue-100 rounded-xl overflow-hidden">
        <div
          class="flex items-center justify-between px-4 py-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          @click="isAdvancedOpen = !isAdvancedOpen"
        >
          <div class="flex items-center gap-2">
            <el-icon :class="isAdvancedOpen ? 'rotate-90' : ''" class="transition-transform duration-200"><arrow-right /></el-icon>
            <span class="text-sm font-bold text-gray-700">高级选项</span>
            <el-tag v-if="evalStore.hasCustomizedRetrieval && !isAdvancedOpen" size="small" type="warning" class="ml-2">已自定义</el-tag>
          </div>
          <span class="text-xs text-gray-400">{{ isAdvancedOpen ? '收起' : '展开' }}</span>
        </div>

        <div v-show="isAdvancedOpen" class="bg-white border-t border-blue-100 p-4 space-y-4">
          <!-- 预设方案选择（移入高级选项内部） -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">预设方案</label>
            <div class="flex gap-3 items-center flex-wrap">
              <el-button
                v-for="preset in systemPresets"
                :key="preset.key"
                size="small"
                :type="activePreset === preset.key ? 'primary' : 'default'"
                plain
                @click="applyPreset(preset.key)"
              >
                {{ preset.label }}
              </el-button>
              <!-- 自定义预设下拉 -->
              <el-dropdown v-if="evalStore.customPresets.length > 0" @command="handleCustomPresetCommand">
                <el-button
                  size="small"
                  :type="activePreset === 'custom' ? 'primary' : 'default'"
                  plain
                >
                  自定义 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="cp in evalStore.customPresets"
                      :key="cp.name"
                      :command="{ action: 'apply', name: cp.name }"
                    >
                      <div class="flex items-center justify-between w-40">
                        <span>{{ cp.name }}</span>
                        <el-icon class="text-gray-400 hover:text-red-500" @click.stop="handleCustomPresetCommand({ action: 'delete', name: cp.name })"><delete /></el-icon>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 检索策略配置 -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-gray-700">检索策略配置</span>
              <el-tag v-if="evalStore.hasCustomizedRetrieval" size="small" type="warning">已自定义</el-tag>
            </div>
            
            <div class="grid grid-cols-3 gap-6">
              <!-- 检索方式 -->
              <el-form-item label="检索方式">
                <el-select v-model="evalStore.retrievalConfig.strategy" class="w-full" @change="markCustomized">
                  <el-option label="纯向量检索 (vector)" value="vector" />
                  <el-option label="关键词匹配 (keyword)" value="keyword" />
                  <el-option label="混合检索 (hybrid)" value="hybrid" />
                  <el-option label="多重采样检索 (multi_sample)" value="multi_sample" />
                </el-select>
                <div class="text-xs text-gray-400 mt-1">{{ strategyDesc[evalStore.retrievalConfig.strategy] }}</div>
              </el-form-item>

              <!-- top-k：仅输入框 -->
              <el-form-item label="Top-K 数量">
                <el-input-number v-model="evalStore.retrievalConfig.topK" :min="1" :max="100" size="small" class="w-40" @change="markCustomized" />
              </el-form-item>

              <!-- 重排序规则 -->
              <el-form-item label="重排序规则">
                <el-select v-model="evalStore.retrievalConfig.rerankRule" class="w-full" @change="markCustomized">
                  <el-option label="相关性排序 (relevance)" value="relevance" />
                  <el-option label="时间戳排序 (timestamp)" value="timestamp" />
                  <el-option label="优先级排序 (priority)" value="priority" />
                </el-select>
                <div class="text-xs text-gray-400 mt-1">{{ rerankDesc[evalStore.retrievalConfig.rerankRule] }}</div>
              </el-form-item>
            </div>
          </div>

          <!-- 增量评估开关 -->
          <div class="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div class="space-y-1">
              <div class="text-sm font-bold text-gray-700">增量评估</div>
              <div class="text-xs text-gray-400">仅对新增/修改/删除的卡片做深度评估，未修改卡片保留上下文</div>
            </div>
            <div class="flex items-center gap-2">
              <el-switch
                v-model="evalStore.retrievalConfig.incremental"
                :disabled="!canIncremental"
                active-text="开启"
                inactive-text="关闭"
                @change="markCustomized"
              />
              <el-tooltip v-if="!canIncremental" content="首次评估默认为全量评估，不适用增量评估" placement="top">
                <el-icon class="text-gray-400"><warning /></el-icon>
              </el-tooltip>
            </div>
          </div>

          <!-- 资源消耗预估器 -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-3">
            <div class="text-sm font-bold text-gray-700">资源消耗预估</div>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white rounded-lg p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">Token 消耗预估</div>
                <div class="text-lg font-bold text-blue-600">{{ estimatedTokens }}</div>
                <div class="text-xs text-gray-400">tokens</div>
              </div>
              <div class="bg-white rounded-lg p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">时间成本预估</div>
                <div class="text-lg font-bold text-blue-600">{{ estimatedTime }}</div>
                <div class="text-xs text-gray-400">秒</div>
              </div>
              <div class="bg-white rounded-lg p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">性能指标</div>
                <div class="flex items-center justify-center gap-2 mt-1">
                  <el-tag size="small" :type="accuracyType">准确率: {{ accuracyLabel }}</el-tag>
                  <el-tag size="small" :type="speedType">速度: {{ speedLabel }}</el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 保存自定义预设按钮 -->
          <div class="flex justify-end">
            <el-button size="small" type="primary" plain icon="Plus" @click="showSavePresetDialog = true">
              保存当前配置为预设
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 保存预设对话框 -->
    <el-dialog v-model="showSavePresetDialog" title="保存自定义预设" width="400px">
      <el-input v-model="newPresetName" placeholder="请输入预设名称，如：我的快速配置" />
      <template #footer>
        <el-button @click="showSavePresetDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCurrentPreset">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onBeforeUnmount } from 'vue';
import { useEvaluationStore, useBaselineStore, useModelStore } from '@/store';
import { uploadRequirementFile } from '@/services';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Connection, View, Close, Document, Delete, UploadFilled, ChatLineRound, DocumentCopy, DocumentAdd, Warning, ArrowRight, ArrowDown, Loading } from '@element-plus/icons-vue';

const props = defineProps<{ settings: { depth: number; selectedModelId: number | null } }>();
const emit = defineEmits(['update:settings', 'openBaselineDrawer', 'previewFile']);

const evalStore = useEvaluationStore();
const baselineStore = useBaselineStore();
const modelStore = useModelStore();

const isEditingParsedText = ref(false);
const isAdvancedOpen = ref(false);
const showSavePresetDialog = ref(false);
const newPresetName = ref('');

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

// ─────────────────────────────────────────────
// 检索策略与评估参数面板逻辑
// ─────────────────────────────────────────────

const systemPresets = [
  { key: 'performance', label: '性能优先' },
  { key: 'cost', label: '成本优先' },
  { key: 'balanced', label: '平衡模式' },
  { key: 'depth', label: '深度优先' },
];

const activePreset = ref<string | null>(null);

const presetConfigs: Record<string, any> = {
  performance: { strategy: 'vector', topK: 5, rerankRule: 'relevance', incremental: true },
  cost: { strategy: 'keyword', topK: 3, rerankRule: 'priority', incremental: true },
  balanced: { strategy: 'hybrid', topK: 10, rerankRule: 'relevance', incremental: true },
  depth: { strategy: 'multi_sample', topK: 20, rerankRule: 'priority', incremental: false },
};

const depthToPresetMap: Record<number, string> = {
  1: 'performance',
  2: 'balanced',
  3: 'depth',
};

const depthDefaults: Record<number, any> = {
  1: { strategy: 'vector', topK: 5, rerankRule: 'relevance' },
  2: { strategy: 'hybrid', topK: 10, rerankRule: 'relevance' },
  3: { strategy: 'multi_sample', topK: 20, rerankRule: 'priority' },
};

const depthLabel: Record<number, string> = {
  1: '浅评估',
  2: '标准评估',
  3: '深度评估',
};

const depthTooltip = computed(() => {
  const depth = localSettings.depth;
  if (depth === 1) return '浅评估：性能优先，纯向量检索，Top-K=5';
  if (depth === 2) return '标准评估：平衡模式，混合检索，Top-K=10';
  if (depth === 3) return '深度评估：深度优先，多重采样检索，Top-K=20';
  return '';
});

function applyPreset(key: string) {
  activePreset.value = key;
  const cfg = presetConfigs[key];
  if (cfg) {
    evalStore.retrievalConfig.strategy = cfg.strategy;
    evalStore.retrievalConfig.topK = cfg.topK;
    evalStore.retrievalConfig.rerankRule = cfg.rerankRule;
    evalStore.retrievalConfig.incremental = cfg.incremental;
    evalStore.hasCustomizedRetrieval = true;
  }
}

async function handleDepthChange(val: number) {
  const targetPreset = depthToPresetMap[val];
  if (evalStore.hasCustomizedRetrieval) {
    try {
      await ElMessageBox.confirm(
        '切换评估深度将覆盖当前自定义的检索配置，是否继续？',
        '确认覆盖',
        { confirmButtonText: '覆盖', cancelButtonText: '保留当前配置', type: 'warning' }
      );
      // 用户确认覆盖
      const defaults = depthDefaults[val];
      if (defaults) {
        evalStore.retrievalConfig.strategy = defaults.strategy;
        evalStore.retrievalConfig.topK = defaults.topK;
        evalStore.retrievalConfig.rerankRule = defaults.rerankRule;
      }
      evalStore.hasCustomizedRetrieval = false;
      activePreset.value = targetPreset || null;
    } catch {
      // 用户取消，仅更新滑块值（已由 el-slider 绑定）
      // 不需要额外操作
    }
  } else {
    // 未自定义，直接应用默认值
    const defaults = depthDefaults[val];
    if (defaults) {
      evalStore.retrievalConfig.strategy = defaults.strategy;
      evalStore.retrievalConfig.topK = defaults.topK;
      evalStore.retrievalConfig.rerankRule = defaults.rerankRule;
    }
    activePreset.value = targetPreset || null;
  }
}

function markCustomized() {
  evalStore.hasCustomizedRetrieval = true;
  activePreset.value = null; // 手动修改后取消预设激活状态
}

function handleCustomPresetCommand(command: { action: string; name: string }) {
  if (command.action === 'apply') {
    evalStore.applyCustomPreset(command.name);
    activePreset.value = 'custom';
  } else if (command.action === 'delete') {
    evalStore.deleteCustomPreset(command.name);
    if (activePreset.value === 'custom') {
      activePreset.value = null;
    }
  }
}

function saveCurrentPreset() {
  const name = newPresetName.value.trim();
  if (!name) {
    ElMessage.warning('请输入预设名称');
    return;
  }
  evalStore.saveCustomPreset(name);
  ElMessage.success(`预设 "${name}" 已保存`);
  showSavePresetDialog.value = false;
  newPresetName.value = '';
}

const canIncremental = computed(() => {
  return evalStore.referencedBaselineIds.length > 0;
});

// 策略描述
const strategyDesc: Record<string, string> = {
  vector: '语义匹配，速度快，适合浅评估',
  keyword: '精确匹配，零向量开销，成本最低',
  hybrid: '向量候选+关键词过滤，平衡召回与精度',
  multi_sample: '多查询变体并行检索，召回率最高，适合深度评估',
};

// 重排序描述
const rerankDesc: Record<string, string> = {
  relevance: '按向量相似度排序（默认）',
  timestamp: '按标准文件上传时间排序',
  priority: '按异味优先级排序（high > medium > low）',
};

// 资源消耗预估
const estimatedTokens = computed(() => {
  const textLength = evalStore.textContent?.length || 0;
  const topK = evalStore.retrievalConfig.topK;
  const strategy = evalStore.retrievalConfig.strategy;
  const avgChunkToken = 150;
  const multiplier = strategy === 'vector' ? 1.0 : strategy === 'keyword' ? 0.8 : strategy === 'hybrid' ? 1.2 : 1.5;
  return Math.round(textLength * 0.5 + topK * avgChunkToken * multiplier);
});

const estimatedTime = computed(() => {
  const textLength = evalStore.textContent?.length || 0;
  const topK = evalStore.retrievalConfig.topK;
  const strategy = evalStore.retrievalConfig.strategy;
  const modelId = localSettings.selectedModelId;
  const model = modelStore.models.find(m => m.id === modelId);
  const modelName = model?.name || '';
  let factor = 1.0;
  if (modelName.includes('轻量') || modelName.includes('lite') || modelName.includes('mini')) factor = 0.5;
  else if (modelName.includes('大') || modelName.includes('pro') || modelName.includes('max')) factor = 2.0;
  const baseTime = strategy === 'multi_sample' ? 3.0 : strategy === 'hybrid' ? 1.5 : 0.5;
  return (baseTime + topK * 0.05 + (textLength / 1000) * factor).toFixed(1);
});

const accuracyLabel = computed(() => {
  const s = evalStore.retrievalConfig.strategy;
  const k = evalStore.retrievalConfig.topK;
  if (s === 'multi_sample' && k >= 15) return '高';
  if (s === 'hybrid' && k >= 10) return '中';
  if (s === 'vector' && k >= 5) return '中';
  return '低';
});

const accuracyType = computed(() => {
  const label = accuracyLabel.value;
  return label === '高' ? 'success' : label === '中' ? 'warning' : 'info';
});

const speedLabel = computed(() => {
  const s = evalStore.retrievalConfig.strategy;
  const k = evalStore.retrievalConfig.topK;
  if (s === 'keyword' || (s === 'vector' && k <= 5)) return '快';
  if (s === 'hybrid' && k <= 10) return '中';
  return '慢';
});

const speedType = computed(() => {
  const label = speedLabel.value;
  return label === '快' ? 'success' : label === '中' ? 'warning' : 'info';
});
</script>
