<template>
  <div class="h-screen flex flex-col bg-slate-50 overflow-hidden text-sm">
    <header class="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm flex-shrink-0 flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <el-button icon="Back" link @click="goBack" class="!text-gray-400 hover:!text-blue-600 !text-base">
          <span class="ml-1 text-sm">返回</span>
        </el-button>
        <div class="w-px h-6 bg-gray-200"></div>
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200/50">
            <el-icon size="18"><Notebook /></el-icon>
          </div>
          <div v-if="currentContext">
            <h1 class="text-base font-black text-gray-800 leading-tight tracking-tight">{{ currentContext.project_name }}</h1>
            <div class="flex items-center gap-2 mt-0.5">
              <el-tag size="small" effect="plain" type="primary" class="!text-[10px] !px-1.5 !py-0">{{ currentContext.version }}</el-tag>
              <span class="text-[11px] text-gray-400">·</span>
              <span v-if="isDirty" class="text-[11px] text-amber-500 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                草稿（已修改）
              </span>
              <span v-else class="text-[11px] text-gray-400">只读</span>
            </div>
          </div>
          <div v-else class="flex items-center gap-2">
            <el-icon class="animate-spin text-blue-500"><Loading /></el-icon>
            <span class="text-gray-400 text-xs">加载中...</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <transition name="fade">
          <el-tag v-if="isDirty" type="warning" effect="dark" size="small" class="animate-pulse">
            <el-icon class="mr-1"><Warning /></el-icon>检测到本地变动
          </el-tag>
        </transition>
        <el-button plain size="small" @click="toggleRightPane" :icon="rightPaneOpen ? 'Hide' : 'View'">
          {{ rightPaneOpen ? '隐藏当前报告' : '展开当前报告' }}
        </el-button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- 左栏：父版本参考 -->
      <aside
        ref="leftPaneRef"
        class="w-1/3 min-w-[350px] border-r border-gray-100 bg-gradient-to-b from-slate-50 to-gray-50 flex flex-col z-0"
      >
        <div class="h-12 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 flex-shrink-0">
          <h2 class="font-bold text-gray-700 flex items-center gap-2 text-[13px]">
            <div class="w-6 h-6 bg-violet-50 rounded-lg flex items-center justify-center">
              <el-icon class="text-violet-500" size="14"><CopyDocument /></el-icon>
            </div>
            父版本参考
            <el-tag size="small" type="info" effect="plain" v-if="parentContext" class="!text-[10px]">{{ parentContext.version }}</el-tag>
          </h2>
          <el-radio-group v-model="leftPaneTab" size="small" v-if="parentContext" class="!scale-90">
            <el-radio-button value="items">需求</el-radio-button>
            <el-radio-button value="report">报告</el-radio-button>
          </el-radio-group>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin" v-if="!parentContext">
          <div class="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <el-icon size="28" class="text-gray-300"><CopyDocument /></el-icon>
            </div>
            <div>
              <h3 class="font-bold text-sm text-gray-500">此版本为首创版本</h3>
              <p class="text-xs text-gray-400 mt-1">当前版本 ({{ currentContext?.version || 'V1.0' }}) 没有历史参考父本</p>
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto scrollbar-thin" v-else>
          <transition name="fade" mode="out-in">
            <div v-if="leftPaneTab === 'items'" key="items" class="p-4 space-y-3">
              <div
                v-for="(item, idx) in parentContext.items"
                :key="item.id"
                class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
                :class="getParentItemDiffClass(item.id)"
              >
                <div class="flex items-start gap-3">
                  <span class="w-5 h-5 bg-violet-50 text-violet-500 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{{ idx + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                      <h3 class="font-bold text-gray-800 text-[13px] truncate">{{ item.title }}</h3>
                      <el-tag
                        v-if="getParentItemStatus(item.id) !== 'unchanged'"
                        size="small"
                        :type="getParentItemStatus(item.id) === 'deleted' ? 'danger' : getParentItemStatus(item.id) === 'modified' ? 'warning' : 'success'"
                        effect="light"
                        class="!scale-75"
                      >
                        {{ getParentItemStatus(item.id) === 'deleted' ? '已删除' : getParentItemStatus(item.id) === 'modified' ? '已修改' : '新增' }}
                      </el-tag>
                    </div>
                    <!-- 父版本内容：删除的文字显示删除线 -->
                    <div class="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                      <ParentDiffText
                        :parentText="item.content || ''"
                        :currentText="getCurrentItemContent(item.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else key="report" class="h-full">
              <EvaluationReportView :report="parentContext.evaluation_report" />
            </div>
          </transition>
        </div>
      </aside>

      <!-- 中栏：修订工作台 -->
      <main
        ref="mainPaneRef"
        class="flex-1 flex flex-col relative bg-white"
      >
        <div class="h-12 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 flex-shrink-0 z-10">
          <h2 class="font-bold text-gray-800 flex items-center gap-2 text-[13px]">
            <div class="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500" size="14"><EditPen /></el-icon>
            </div>
            修订工作台
            <el-tag size="small" effect="plain" type="info" class="!text-[10px]">{{ localItems.length }} 条</el-tag>
          </h2>

          <div class="flex items-center gap-4">
            <!-- Diff 统计摘要 -->
            <div v-if="diffSummary" class="flex items-center gap-2 text-[11px]">
              <span v-if="diffSummary.newItems > 0" class="text-green-600 font-medium">+{{ diffSummary.newItems }} 新增</span>
              <span v-if="diffSummary.modifiedItems > 0" class="text-amber-600 font-medium">~{{ diffSummary.modifiedItems }} 修改</span>
              <span v-if="diffSummary.deletedItems > 0" class="text-red-600 font-medium">-{{ diffSummary.deletedItems }} 删除</span>
            </div>

            <!-- 版本修订备注 -->
            <div class="relative" style="max-width: 400px;">
              <div class="flex items-center gap-1 cursor-pointer" @click="toggleRevisionNote" style="height: 28px;">
                <div class="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                  <el-icon size="11" class="text-blue-600"><ChatLineSquare /></el-icon>
                </div>
                <span class="font-bold text-blue-700 text-[11px]">版本修订备注</span>
                <el-icon :class="{ 'rotate-180': revisionNoteExpanded }" class="ml-1 transition-transform duration-300 text-blue-500"><ArrowDown /></el-icon>
              </div>
              <transition name="fade">
                <div v-if="revisionNoteExpanded" class="absolute top-full right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-md p-3 z-50">
                  <el-input
                    v-model="versionDesc"
                    type="textarea"
                    :rows="3"
                    placeholder="请记录本次版本的修改目标或修订点（如：修复了可测试性评分中提到的语义模糊问题）..."
                    class="revision-input"
                  />
                </div>
              </transition>
            </div>

            <div class="flex items-center gap-2">
              <el-button v-if="isDirty" type="danger" link size="small" @click="handleDiscard">
                <el-icon class="mr-1"><RefreshLeft /></el-icon>放弃修改
              </el-button>
              <el-button
                type="primary"
                :disabled="!isDirty"
                class="font-bold !rounded-lg"
                size="small"
                @click="handleJumpToEvaluation"
              >
                <el-icon class="mr-1"><Promotion /></el-icon>发起评估
              </el-button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-white to-slate-50/50 scrollbar-thin">
          <div class="max-w-4xl mx-auto space-y-6">

            <div class="flex items-center gap-3 py-3">
              <div class="h-px flex-1 bg-gray-200"></div>
              <span class="text-[11px] text-gray-400 uppercase font-black tracking-widest">需求条目修订区</span>
              <div class="h-px flex-1 bg-gray-200"></div>
            </div>

            <TransitionGroup name="list" tag="div" class="space-y-4 pb-20">
              <div
                v-for="(item, idx) in localItems"
                :key="item.id || item._localId"
                :class="[
                  'bg-white border rounded-2xl shadow-sm transition-all duration-200 overflow-hidden group',
                  item._isDirty
                    ? 'border-amber-200 shadow-amber-100/50 hover:shadow-amber-200/50'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                ]"
              >
                <div class="px-5 py-3 border-b flex items-center justify-between" :class="item._isDirty ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50/30 border-gray-50'">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
                      :class="item._isDirty ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'">
                      {{ idx + 1 }}
                    </span>
                    <el-input v-model="item.title" placeholder="需求标题" size="small" class="max-w-[300px] !font-bold" disabled @change="markDirty(item)"/>
                    <transition name="fade">
                      <el-tag v-if="item._isDirty" size="small" type="warning" effect="light" class="!scale-90">
                        <el-icon class="mr-0.5"><EditPen /></el-icon>有改动
                      </el-tag>
                    </transition>
                  </div>
                  <el-button size="small" circle text type="danger" icon="Delete" @click="handleLocalDelete(item)" class="opacity-0 group-hover:opacity-100 transition-opacity"></el-button>
                </div>
                <div class="p-5">
                  <!-- 内联 Diff 展示：编辑时实时显示与父版本的差异 -->
                  <div v-if="item.parent_item_id && getItemDiff(item.parent_item_id)" class="mb-3">
                    <div class="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                      <el-icon size="10"><InfoFilled /></el-icon>
                      与父版本对比
                    </div>
                    <div class="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <TextDiff :segments="getItemDiff(item.parent_item_id)!.contentDiff" />
                    </div>
                  </div>
                  <div v-else-if="item.is_new" class="mb-3">
                    <div class="text-[10px] text-green-500 mb-1 flex items-center gap-1">
                      <el-icon size="10"><CirclePlus /></el-icon>
                      新增条目
                    </div>
                  </div>
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

            <div v-if="localItems.length === 0" class="py-20 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <el-icon size="28" class="text-gray-300"><DocumentDelete /></el-icon>
              </div>
              <p class="text-gray-400 font-medium">内容已被清空</p>
              <p class="text-xs text-gray-300 mt-1">所有需求条目已移除</p>
            </div>
          </div>
        </div>
      </main>

      <!-- 右栏：当前版本评估参考 -->
      <aside
        class="border-l border-gray-100 bg-gradient-to-b from-slate-50 to-gray-50 flex flex-col z-0 transition-all duration-300 ease-in-out"
        :class="rightPaneOpen ? 'w-1/3 min-w-[320px]' : 'w-0 border-none opacity-0 overflow-hidden'"
      >
        <div class="h-12 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 flex-shrink-0 whitespace-nowrap">
          <h2 class="font-bold text-gray-700 flex items-center gap-2 text-[13px]">
            <div class="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
              <el-icon class="text-emerald-500" size="14"><DataLine /></el-icon>
            </div>
            当前版本评估参考
          </h2>
          <el-button link icon="Close" size="small" @click="rightPaneOpen = false" class="!text-gray-400 hover:!text-gray-600"></el-button>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin">
          <EvaluationReportView :report="currentContext?.evaluation_report" class="h-full" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBaselineFullContext, getBaselineDiff, type BaselineContextInfo, type ItemDiff, type BaselineDiffSummary } from '@/services/api'
import EvaluationReportView from '@/components/EvaluationReportView.vue'
import TextDiff from '@/components/TextDiff.vue'
import ParentDiffText from '@/components/ParentDiffText.vue'
import { useEvaluationStore } from '@/store'
import { Notebook, CopyDocument, Warning, EditPen, DataLine, Close, Loading, Delete, ChatLineSquare, DocumentDelete, RefreshLeft, Promotion, Hide, View, ArrowDown, InfoFilled, CirclePlus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const evalStore = useEvaluationStore()
const versionId = computed(() => Number(route.params.versionId))

const currentContext = ref<BaselineContextInfo | null>(null)
const parentContext = ref<BaselineContextInfo | null>(null)

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
const revisionNoteExpanded = ref(false)

// Diff 相关状态
const itemDiffs = ref<Map<number, ItemDiff>>(new Map())
const diffSummary = ref<BaselineDiffSummary | null>(null)
const diffLoading = ref(false)

// 同步滚动相关
const leftPaneRef = ref<HTMLElement | null>(null)
const mainPaneRef = ref<HTMLElement | null>(null)
let isLeftScrolling = false
let isMainScrolling = false

function toggleRevisionNote() {
  revisionNoteExpanded.value = !revisionNoteExpanded.value
}

function toggleRightPane() {
  rightPaneOpen.value = !rightPaneOpen.value
}

const isDirty = computed(() => {
  return localItems.value.some(item => item._isDirty) || !!versionDesc.value.trim()
})

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

    // 加载 diff 数据
    if (res.parent) {
      await loadDiffData()
    }

  } catch (e: any) {
    ElMessage.error(e.message || '加载详情失败')
  }
}

async function loadDiffData() {
  if (!parentContext.value) return
  diffLoading.value = true
  try {
    const res = await getBaselineDiff(versionId.value)
    diffSummary.value = res.summary

    // 构建 parent_item_id -> ItemDiff 映射
    const map = new Map<number, ItemDiff>()
    for (const item of res.items) {
      if (item.parentItemId) {
        map.set(item.parentItemId, item)
      }
    }
    itemDiffs.value = map
  } catch (e: any) {
    console.warn('加载 diff 数据失败:', e)
  } finally {
    diffLoading.value = false
  }
}

function getItemDiff(parentItemId: number): ItemDiff | undefined {
  return itemDiffs.value.get(parentItemId)
}

function getParentItemStatus(parentItemId: number): string {
  const diff = itemDiffs.value.get(parentItemId)
  return diff?.status || 'unchanged'
}

function getParentItemDiffClass(parentItemId: number): string {
  const status = getParentItemStatus(parentItemId)
  switch (status) {
    case 'deleted':
      return 'border-red-200 bg-red-50/20'
    case 'modified':
      return 'border-amber-200 bg-amber-50/20'
    case 'unchanged':
      return ''
    default:
      return ''
  }
}

function getCurrentItemContent(parentItemId: number): string {
  const currentItem = localItems.value.find(item => item.parent_item_id === parentItemId)
  return currentItem?.content || ''
}

// 同步滚动逻辑
function setupSyncScroll() {
  const leftPane = leftPaneRef.value
  const mainPane = mainPaneRef.value
  if (!leftPane || !mainPane) return

  const onLeftScroll = () => {
    if (isMainScrolling) return
    isLeftScrolling = true
    const ratio = leftPane.scrollTop / (leftPane.scrollHeight - leftPane.clientHeight)
    mainPane.scrollTop = ratio * (mainPane.scrollHeight - mainPane.clientHeight)
    setTimeout(() => { isLeftScrolling = false }, 50)
  }

  const onMainScroll = () => {
    if (isLeftScrolling) return
    isMainScrolling = true
    const ratio = mainPane.scrollTop / (mainPane.scrollHeight - mainPane.clientHeight)
    leftPane.scrollTop = ratio * (leftPane.scrollHeight - leftPane.clientHeight)
    setTimeout(() => { isMainScrolling = false }, 50)
  }

  leftPane.addEventListener('scroll', onLeftScroll)
  mainPane.addEventListener('scroll', onMainScroll)

  return () => {
    leftPane.removeEventListener('scroll', onLeftScroll)
    mainPane.removeEventListener('scroll', onMainScroll)
  }
}

onMounted(() => {
  loadPageData()
  // 延迟设置同步滚动，等待 DOM 渲染完成
  setTimeout(() => {
    const cleanup = setupSyncScroll()
    onUnmounted(() => {
      if (cleanup) cleanup()
    })
  }, 500)
})

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

function handleJumpToEvaluation() {
  if (!versionDesc.value.trim()) {
    ElMessage.error('请填写版本修订备注')
    return
  }

  evalStore.projectName = currentContext.value?.project_name || '基准修订项目'
  evalStore.requirementTitle = '修订版需求文档'
  evalStore.requirementType = 'text'
  evalStore.versionDesc = versionDesc.value

  evalStore.items = localItems.value.map(i => ({
    parent_item_id: i.parent_item_id || i.id || null,
    title: i.title,
    content: i.content,
    status: i._isDirty ? 'modified' : 'unchanged'
  }))

  evalStore.referencedBaselineIds = [versionId.value]
  evalStore.editMode = 'incremental'
  evalStore.isAutoStart = true

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
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.revision-input :deep(.el-textarea__inner) {
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.7;
  padding: 8px 12px !important;
  background: white !important;
  border-radius: 8px;
}

.revision-content :deep(.el-textarea__inner) {
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
  background: white !important;
  padding: 8px 12px !important;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 8px;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
