<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden text-sm">
    <!-- Top Navigation -->
    <header class="h-16 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <el-button icon="Back" link @click="goBack" class="text-gray-500 hover:text-blue-600">返回</el-button>
        <div class="w-px h-6 bg-gray-200"></div>
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-md">
            <el-icon size="16"><Notebook /></el-icon>
          </div>
          <div v-if="currentContext">
            <h1 class="text-base font-black text-gray-800 leading-tight">{{ currentContext.project_name }}</h1>
            <p class="text-xs text-gray-400">
              当前版本: {{ currentContext.version }} · 
              <span v-if="isDirty" class="text-amber-500 font-bold">草稿（已修改）</span>
              <span v-else>只读/净态</span>
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-tag v-if="isDirty" type="warning" effect="dark" class="animate-pulse">检测到本地变动</el-tag>
        <el-button plain icon="FullScreen" @click="toggleRightPane">
          {{ rightPaneOpen ? '隐藏当前报告' : '展开当前报告' }}
        </el-button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- Left Pane: Parent View -->
      <aside class="w-1/3 min-w-[350px] border-r bg-gray-50 flex flex-col z-0">
        <div class="h-12 border-b bg-white flex items-center justify-between px-4 sticky top-0 flex-shrink-0">
          <h2 class="font-bold text-gray-700 flex items-center gap-2">
            <el-icon><CopyDocument /></el-icon> 
            父版本参考 
            <el-tag size="small" type="info" effect="plain" v-if="parentContext">{{ parentContext.version }}</el-tag>
          </h2>
          <el-radio-group v-model="leftPaneTab" size="small" v-if="parentContext">
            <el-radio-button value="items">需求</el-radio-button>
            <el-radio-button value="report">报告</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="flex-1 overflow-y-auto" v-if="!parentContext">
          <div class="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3">
            <el-icon size="32" class="opacity-30"><Warning /></el-icon>
            <h3 class="font-bold text-sm">此版本为首创版本</h3>
            <p class="text-xs">当前版本 ({{ currentContext?.version || 'V1.0' }}) 没有历史参考父本。</p>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto" v-else>
          <div v-if="leftPaneTab === 'items'" class="p-4 space-y-4">
            <div 
              v-for="item in parentContext.items" 
              :key="item.id"
              class="bg-white border border-gray-100 shadow-sm rounded-xl p-4 opacity-80"
            >
              <h3 class="font-bold text-gray-800 mb-2 truncate border-b pb-2 border-gray-50 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                {{ item.title }}
              </h3>
              <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{{ item.content }}</p>
            </div>
          </div>
          <div v-else class="h-full">
            <EvaluationReportView :report="parentContext.evaluation_report" />
          </div>
        </div>
      </aside>

      <!-- Middle Pane: Sandbox Work area -->
      <main class="flex-1 flex flex-col relative bg-white">
        <!-- Workbench Header -->
        <div class="h-12 border-b bg-gray-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0 z-10">
          <h2 class="font-bold text-gray-800 flex items-center gap-2">
            <el-icon class="text-blue-500"><EditPen /></el-icon> 修订工作台
          </h2>
          <div class="flex items-center gap-2">
            <el-button v-if="isDirty" type="danger" link @click="handleDiscard">放弃本次所有修改</el-button>
            <el-button type="primary" :disabled="!isDirty" class="font-bold" @click="handleJumpToEvaluation">
              发起评估
            </el-button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div class="max-w-4xl mx-auto space-y-6">
            
            <!-- Version Remark Section (Top) -->
            <div class="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
              <div class="flex items-center gap-2 mb-4 text-blue-600">
                <el-icon size="18"><ChatLineSquare /></el-icon>
                <span class="font-bold tracking-tight">版本修订备注</span>
                <span class="text-xs text-gray-400 font-normal">（此备注将随新版本永久保存）</span>
              </div>
              <el-input
                v-model="versionDesc"
                type="textarea"
                :rows="3"
                placeholder="请记录本次版本的修改目标或修订点（如：修复了可测试性评分中提到的语义模糊问题）..."
                class="revision-input shadow-inner"
              />
            </div>

            <div class="flex items-center gap-3 py-4">
              <div class="h-px flex-1 bg-gray-200"></div>
              <span class="text-xs text-gray-400 uppercase font-black tracking-widest">需求条目修订区</span>
              <div class="h-px flex-1 bg-gray-200"></div>
            </div>

            <!-- Items list -->
            <TransitionGroup name="list" tag="div" class="space-y-4 pb-20">
              <div 
                v-for="item in localItems" 
                :key="item.id || item._localId"
                :class="[
                  'bg-white border rounded-2xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-100 overflow-hidden',
                  item._isDirty ? 'border-amber-300' : 'border-gray-200'
                ]"
              >
                <div class="px-5 py-3 border-b flex items-center justify-between bg-gray-50/20">
                  <div class="flex items-center gap-3 flex-1">
                    <el-input v-model="item.title" placeholder="需求标题" size="small" class="max-w-[300px]" disabled @change="markDirty(item)"/>
                    <el-tag v-if="item._isDirty" size="small" type="warning" effect="plain" class="scale-90">有改动</el-tag>
                  </div>
                  <el-button size="small" circle text type="danger" icon="Delete" @click="handleLocalDelete(item)"></el-button>
                </div>
                <div class="p-5">
                  <el-input
                    v-model="item.content"
                    type="textarea"
                    autosize
                    placeholder="需求内容..."
                    class="text-sm font-sans revision-content"
                    @input="markDirty(item)"
                  />
                </div>
              </div>
            </TransitionGroup>

            <div v-if="localItems.length === 0" class="py-20 text-center text-gray-300">
              <el-icon size="48" class="mb-2 opacity-20"><DocumentDelete /></el-icon>
              <p>内容已被清空</p>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Pane: Current Evaluation Reference -->
      <aside 
        class="border-l bg-gray-50 flex flex-col z-0 transition-all duration-300 ease-in-out"
        :class="rightPaneOpen ? 'w-1/3 min-w-[320px]' : 'w-0 border-none opacity-0 overflow-hidden'"
      >
        <div class="h-12 border-b bg-white flex items-center justify-between px-4 sticky top-0 flex-shrink-0 whitespace-nowrap">
          <h2 class="font-bold text-gray-700 flex items-center gap-2">
            <el-icon class="text-green-500"><DataLine /></el-icon> 当前版本评估参考
          </h2>
          <el-button link icon="Close" @click="rightPaneOpen = false"></el-button>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <EvaluationReportView :report="currentContext?.evaluation_report" class="h-full" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBaselineFullContext, type BaselineContextInfo } from '@/services/api'
import EvaluationReportView from '@/components/EvaluationReportView.vue'
import { useEvaluationStore } from '@/store'
import { Notebook, CopyDocument, Warning, EditPen, DataLine, Close, Plus, Loading, Delete, ChatLineSquare, DocumentDelete } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const evalStore = useEvaluationStore()
const versionId = computed(() => Number(route.params.versionId))

// -- State Context --
const currentContext = ref<BaselineContextInfo | null>(null)
const parentContext = ref<BaselineContextInfo | null>(null)

// -- Local Editing State (Sandbox / Draft) --
interface LocalItem {
  id?: number
  _localId?: string
  title: string
  content: string
  is_new: boolean
  is_deleted: boolean
  _isDirty?: boolean
  parent_item_id?: number | null
}
const localItems = ref<LocalItem[]>([])
const versionDesc = ref('')
const leftPaneTab = ref<'items'|'report'>('items')
const rightPaneOpen = ref(true)

function toggleRightPane() {
  rightPaneOpen.value = !rightPaneOpen.value
}

// Computed dirty status
const isDirty = computed(() => {
  return localItems.value.some(item => item._isDirty) || !!versionDesc.value.trim()
})

// Navigation Guard
onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && to.path !== '/') {
    ElMessageBox.confirm(
      '检测到您已修改了内容，但尚未启动评估流程或归档，离开将导致草稿丢失。确定离开？',
      '注意',
      {
         confirmButtonText: '狠心离开',
         cancelButtonText: '留下继续',
         type: 'warning'
      }
    ).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
})

async function loadPageData() {
  try {
    const res = await getBaselineFullContext(versionId.value)
    currentContext.value = res.current
    parentContext.value = res.parent || null
    
    // Hydrate local sandbox memory
    localItems.value = res.current.items.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content || '',
      is_new: item.is_new,
      is_deleted: !!item.is_deleted,
      _isDirty: false,
      parent_item_id: item.parent_item_id
    }))
    versionDesc.value = ''

  } catch (e: any) {
    ElMessage.error(e.message || '加载详情失败')
  }
}

// -- Lifecycle Load --
onMounted(() => {
  loadPageData()
})

// -- Interaction Methods --
function goBack() {
  router.back()
}

function handleDiscard() {
  ElMessageBox.confirm('确定要放弃本次所有的本地修改吗？此操作无法撤销。', '重置确认', {
    type: 'warning',
    confirmButtonText: '确定重置'
  }).then(() => {
    loadPageData()
    ElMessage.success('已恢复原始状态')
  })
}

function markDirty(item: LocalItem) {
  item._isDirty = true
}

function handleLocalDelete(item: LocalItem) {
  const idx = localItems.value.indexOf(item)
  if (idx !== -1) {
    localItems.value.splice(idx, 1)
  }
}

// -- The "Portal" jump to Evaluation Page --
function handleJumpToEvaluation() {
  // 1. Pack items into evaluation store
  evalStore.projectName = currentContext.value?.project_name || '基准修订项目'
  evalStore.requirementTitle = '修订版需求文档'
  evalStore.requirementType = 'text'
  evalStore.versionDesc = versionDesc.value // 将备注传过去
  
  evalStore.items = localItems.value.map(i => ({
    parent_item_id: i.parent_item_id || i.id || null,
    title: i.title,
    content: i.content,
    // 逻辑修正：由于基准详情页已剥离“新建卡片”功能，所有在此修改的卡片均属存量卡片。
    // 因此状态只有“已修改”和“未修改”，彻底修复跳转后变为新增从而导致名称可编辑的问题。
    status: i._isDirty ? 'modified' : 'unchanged'
  }))
  
  // 2. Set context indicators
  evalStore.referencedBaselineIds = [versionId.value]
  evalStore.editMode = 'incremental'
  evalStore.isAutoStart = true // 标记跳转后自动开始
  
  // 3. Jump to evaluation root (Home page '/')
  router.push('/')
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.revision-input :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  padding: 0;
}

.revision-content :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
}
</style>
