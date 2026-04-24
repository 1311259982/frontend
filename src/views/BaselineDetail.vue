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
        :class="[
          'border-r border-gray-100 bg-gradient-to-b from-slate-50 to-gray-50 flex flex-col z-0 transition-all duration-300 ease-in-out',
          rightPaneOpen ? 'w-1/3 min-w-[350px]' : 'w-1/2'
        ]"
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
        <div ref="leftPaneRef" class="flex-1 overflow-y-auto scrollbar-thin" v-else>
          <transition name="fade" mode="out-in">
            <div v-if="leftPaneTab === 'items'" key="items" class="p-6 space-y-4">
              <template v-for="(row, ridx) in alignedRows" :key="'left-' + ridx">
                <!-- 有父版本条目：显示卡片 -->
                <div
                  v-if="row.parent"
                  :ref="el => setCardRef(el, 'parent', row.parent.id)"
                  :class="[
                    'bg-white border rounded-2xl shadow-sm transition-all duration-200 overflow-hidden group',
                    getParentItemStatus(row.parent.id) === 'deleted' ? 'border-red-100 shadow-red-50' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                  ]"
                >
                  <!-- 卡片页眉 -->
                  <div 
                    class="px-5 py-3 border-b flex items-center justify-between transition-colors bg-gray-50/50 border-gray-50 cursor-pointer"
                    @click="toggleItemExpansionByRow(ridx)"
                  >
                    <div class="flex items-center gap-4 flex-1">
                      <el-icon class="text-gray-400 transition-transform" :class="{ 'rotate-180': isExpanded(ridx) }"><ArrowDown /></el-icon>
                      <div class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm shrink-0 bg-violet-600 text-white shadow-violet-200">
                        {{ row.pIdx + 1 }}
                      </div>
                      <span class="text-sm font-bold text-slate-800 tracking-tight truncate max-w-[300px]">
                        {{ row.parent.title }}
                      </span>
                      <transition name="fade">
                        <div class="flex items-center gap-1.5 ml-2">
                          <div v-if="getParentItemStatus(row.parent.id) === 'deleted'" 
                            class="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-bold">
                            <el-icon><DocumentDelete /></el-icon>
                            <span>已删除</span>
                          </div>
                          <div v-else-if="getParentItemStatus(row.parent.id) === 'modified'" 
                            class="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold">
                            <el-icon><InfoFilled /></el-icon>
                            <span>已修改</span>
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>

                  <!-- 卡片内容 -->
                  <div class="p-5" v-show="isExpanded(ridx)">
                    <div
                      class="bg-[#f8fafc] rounded-xl border border-transparent text-[13px]"
                      style="padding: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; box-sizing: border-box; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
                    >
                      <ParentDiffText
                        :parentText="row.parent.content || ''"
                        :currentText="getCurrentItemContent(row.parent.id, row.parent.title)"
                      />
                    </div>
                  </div>
                </div>
                <!-- 无父版本条目（对应右侧新增）：显示占位符 -->
                <div v-else :style="{ height: getRowHeight(ridx, 'current') + 'px' }" class="border border-transparent"></div>
              </template>
            </div>
            <div v-else key="report" class="h-full">
              <EvaluationReportView :report="parentContext.evaluation_report" />
            </div>
          </transition>
        </div>
      </aside>

      <!-- 中栏：修订工作台 -->
      <main
        :class="[
          'flex flex-col relative bg-white transition-all duration-300 ease-in-out',
          rightPaneOpen ? 'w-1/3' : 'w-1/2'
        ]"
      >
        <div class="h-12 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 flex-shrink-0 z-10">
          <h2 class="font-bold text-gray-800 flex items-center gap-2 text-[13px]">
            <div class="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500" size="14"><EditPen /></el-icon>
            </div>
            修订工作台
            <el-tag size="small" type="info" effect="plain" v-if="currentContext" class="!text-[10px]">{{ currentContext.version }}</el-tag>
          </h2>

          <div class="flex items-center gap-4">
            <!-- Diff 统计摘要 -->
            <div v-if="diffSummary" class="flex items-center gap-2 text-[11px]">
              <span v-if="diffSummary.newItems > 0" class="text-green-600 font-medium">+{{ diffSummary.newItems }} 新增</span>
              <span v-if="diffSummary.modifiedItems > 0" class="text-amber-600 font-medium">~{{ diffSummary.modifiedItems }} 修改</span>
              <span v-if="diffSummary.deletedItems > 0" class="text-red-600 font-medium">-{{ diffSummary.deletedItems }} 删除</span>
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

        <div ref="mainPaneRef" class="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-slate-50/50 scrollbar-thin">

          <div class="space-y-4 pb-20">
            <template v-for="(row, ridx) in alignedRows" :key="'main-' + ridx">
              <!-- 有当前版本条目：显示卡片 -->
              <div
                v-if="row.current"
                :ref="el => setCardRef(el, 'current', row.current.id || row.current._localId)"
                :class="[
                  'bg-white border rounded-2xl shadow-sm transition-all duration-200 overflow-hidden group',
                  row.current._isDirty
                    ? 'border-amber-200 shadow-amber-100/50 hover:shadow-amber-200/50'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                ]"
              >
                <div class="px-5 py-3 border-b flex items-center justify-between transition-colors cursor-pointer" 
                  :class="row.current._isDirty ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50/50 border-gray-50'"
                  @click="toggleItemExpansionByRow(ridx)"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <el-icon class="text-gray-400 transition-transform" :class="{ 'rotate-180': isExpanded(ridx) }"><ArrowDown /></el-icon>
                    <!-- 序列号徽章 -->
                    <div class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm shrink-0 transition-colors"
                      :class="row.current._isDirty ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-blue-600 text-white shadow-blue-200'">
                      {{ row.cIdx + 1 }}
                    </div>
                    
                    <!-- 需求标题 -->
                    <span class="text-sm font-bold text-slate-800 tracking-tight truncate max-w-[400px]">
                      {{ row.current.title }}
                    </span>

                    <transition name="fade">
                      <div class="flex items-center gap-1.5 ml-2">
                        <el-tag v-if="getItemStatusTag(row.current) === 'modified'" size="small" type="warning" effect="light" class="!scale-90">
                          <el-icon class="mr-0.5"><EditPen /></el-icon>已修改
                        </el-tag>
                        <el-tag v-else-if="getItemStatusTag(row.current) === 'added'" size="small" type="success" effect="light" class="!scale-90">
                          <el-icon class="mr-0.5"><CirclePlus /></el-icon>新增条目
                        </el-tag>
                      </div>
                    </transition>
                  </div>
                  <el-button size="small" circle text type="danger" icon="Delete" @click.stop="handleLocalDelete(row.current)" class="opacity-0 group-hover:opacity-100 transition-opacity"></el-button>
                </div>
                
                <div class="p-5" v-show="isExpanded(ridx)">
                  <LiveDiffEditor
                    v-model="row.current.content"
                    :originalValue="getParentItemContent(row.current.parent_item_id, row.current.title)"
                    :expanded="true"
                    @update:modelValue="markDirty(row.current)"
                  />
                </div>
              </div>
              <!-- 无当前版本条目（对应左侧已删除）：显示占位符 -->
              <div v-else :style="{ height: getRowHeight(ridx, 'parent') + 'px' }" class="border border-transparent"></div>
            </template>
          </div>

          <div v-if="localItems.length === 0" class="py-20 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <el-icon size="28" class="text-gray-300"><DocumentDelete /></el-icon>
            </div>
            <p class="text-gray-400 font-medium">内容已被清空</p>
            <p class="text-xs text-gray-300 mt-1">所有需求条目已移除</p>
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
import ParentDiffText from '@/components/ParentDiffText.vue'
import LiveDiffEditor from '@/components/LiveDiffEditor.vue'
import { useEvaluationStore } from '@/store'
import { Notebook, CopyDocument, Warning, EditPen, DataLine, Close, Loading, Delete, ChatLineSquare, DocumentDelete, RefreshLeft, Promotion, Hide, View, ArrowDown, InfoFilled, CirclePlus, DocumentCopy } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const evalStore = useEvaluationStore()
const versionId = computed(() => Number(route.params.versionId))

const currentContext = ref<BaselineContextInfo | null>(null)
const parentContext = ref<BaselineContextInfo | null>(null)

// 展开状态管理
const expandedItems = ref(new Set<number>())
function isExpanded(idx: number) {
  return expandedItems.value.has(idx)
}
function toggleItemExpansion(idx: number) {
  const next = new Set(expandedItems.value)
  if (next.has(idx)) next.delete(idx)
  else next.add(idx)
  expandedItems.value = next // 强制触发响应式
}

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

    // 默认展开所有项
    expandedItems.value = new Set(localItems.value.map((_, i) => i))

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

function getParentItemContent(parentItemId: number | null | undefined, title: string): string {
  if (!parentContext.value) return ''
  let parentItem = null
  if (parentItemId) {
    parentItem = parentContext.value.items.find(i => i.id === parentItemId)
  }
  // 容错：如果 parent_item_id 错误（跨版本），则尝试通过 title 匹配
  if (!parentItem && title) {
    parentItem = parentContext.value.items.find(i => i.title === title)
  }
  return parentItem?.content || ''
}

function getCurrentItemContent(parentItemId: number, title: string): string {
  let currentItem = localItems.value.find(item => item.parent_item_id === parentItemId)
  if (!currentItem && title) {
    currentItem = localItems.value.find(item => item.title === title)
  }
  return currentItem?.content || ''
}

// 复杂的对齐行逻辑
const alignedRows = computed(() => {
  if (!parentContext.value) {
    return localItems.value.map((item, idx) => ({ 
      parent: null, current: item, pIdx: -1, cIdx: idx 
    }))
  }

  const rows: any[] = []
  const currentItems = [...localItems.value]
  const parentItems = [...parentContext.value.items]
  const usedCurrentIndices = new Set<number>()

  // 1. 遍历父版本，寻找匹配项
  parentItems.forEach((pItem, pIdx) => {
    const cIdx = currentItems.findIndex((c, idx) => {
      if (usedCurrentIndices.has(idx)) return false
      // 匹配逻辑：ID 匹配 或 标题匹配（容错）
      return (c.parent_item_id === pItem.id) || (!c.parent_item_id && c.title === pItem.title)
    })

    if (cIdx !== -1) {
      rows.push({ parent: pItem, current: currentItems[cIdx], pIdx, cIdx })
      usedCurrentIndices.add(cIdx)
    } else {
      // 被删除了
      rows.push({ parent: pItem, current: null, pIdx, cIdx: -1 })
    }
  })

  // 2. 剩下的就是纯新增的
  currentItems.forEach((cItem, cIdx) => {
    if (!usedCurrentIndices.has(cIdx)) {
      rows.push({ parent: null, current: cItem, pIdx: -1, cIdx })
    }
  })

  return rows
})

// 高度监测与同步
const rowHeights = ref<Record<string, number>>({})
let resizeObserver: ResizeObserver | null = null

function setCardRef(el: any, type: 'parent' | 'current', id: any) {
  if (el && id) {
    const key = `${type}-${id}`
    // 使用 ResizeObserver 监听高度
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          const targetKey = (entry.target as any).dataset.key
          if (targetKey) {
            rowHeights.value[targetKey] = entry.contentRect.height + 1 // +1 for border
          }
        })
      })
    }
    el.dataset.key = key
    resizeObserver.observe(el)
  }
}

function getRowHeight(ridx: number, otherType: 'parent' | 'current') {
  const row = alignedRows.value[ridx]
  const otherItem = row[otherType]
  if (!otherItem) return 0
  const otherId = otherItem.id || otherItem._localId
  return rowHeights.value[`${otherType}-${otherId}`] || 100
}

function toggleItemExpansionByRow(ridx: number) {
  toggleItemExpansion(ridx)
}

function getItemStatusTag(item: LocalItem) {
  if (item._isDirty) return 'modified'
  
  const originalContent = getParentItemContent(item.parent_item_id, item.title)
  const existsInParent = !!parentContext.value?.items.find(i => i.id === item.parent_item_id || i.title === item.title)
  
  if (!existsInParent) return 'added'
  if (item.content !== originalContent) return 'modified'
  return 'unchanged'
}

// 同步滚动逻辑
function setupSyncScroll() {
  const leftPane = leftPaneRef.value
  const mainPane = mainPaneRef.value
  if (!leftPane || !mainPane) return

  const onLeftScroll = () => {
    if (isMainScrolling) return
    isLeftScrolling = true
    mainPane.scrollTop = leftPane.scrollTop
    setTimeout(() => { isLeftScrolling = false }, 50)
  }

  const onMainScroll = () => {
    if (isLeftScrolling) return
    isMainScrolling = true
    leftPane.scrollTop = mainPane.scrollTop
    setTimeout(() => { isMainScrolling = false }, 50)
  }

  leftPane.addEventListener('scroll', onLeftScroll)
  mainPane.addEventListener('scroll', onMainScroll)

  return () => {
    leftPane.removeEventListener('scroll', onLeftScroll)
    mainPane.removeEventListener('scroll', onMainScroll)
    if (resizeObserver) resizeObserver.disconnect()
  }
}

onMounted(() => {
  loadPageData()
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
  evalStore.projectName = currentContext.value?.project_name || '基准修订项目'
  evalStore.requirementTitle = '修订版需求文档'
  evalStore.requirementType = 'text'
  evalStore.versionDesc = '' // 这里置空，交给评估页面处理

  evalStore.items = localItems.value.map(i => ({
    parent_item_id: i.id || null,
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.7;
  padding: 8px 12px !important;
  background: white !important;
  border-radius: 8px;
}

.ParentDiffText, .baseline-content-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
</style>
