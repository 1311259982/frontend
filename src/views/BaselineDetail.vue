<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navigation -->
    <header class="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 sticky top-0 z-30">
      <div class="flex items-center gap-4">
        <el-button icon="Back" link @click="goBack" class="text-gray-500 hover:text-blue-600">
          返回
        </el-button>
        <div class="w-px h-6 bg-gray-200"></div>
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <el-icon size="18"><Notebook /></el-icon>
          </div>
          <div>
            <h1 class="text-lg font-black text-gray-800 tracking-tight leading-tight">{{ projectName }}</h1>
            <p class="text-xs text-gray-400">版本 {{ versionLabel }} · {{ items.length }} 条需求</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="primary" plain icon="Download" size="small" @click="handleExport" :loading="exporting">
          导出 Markdown
        </el-button>
        <el-button type="success" icon="Plus" size="small" @click="showAddDialog = true">
          新增需求条目
        </el-button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto py-8 px-6 space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 text-gray-400">
        <el-icon size="48" class="animate-spin mb-4"><Loading /></el-icon>
        <p class="text-sm">加载积木块中...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-32 text-gray-400">
        <el-icon size="64" class="mb-4 opacity-30"><Document /></el-icon>
        <p class="text-lg font-bold mb-2">暂无需求条目</p>
        <p class="text-sm mb-6">点击下方按钮添加第一个需求积木块</p>
        <el-button type="primary" icon="Plus" @click="showAddDialog = true">新增需求条目</el-button>
      </div>

      <!-- Block List -->
      <TransitionGroup v-else name="block" tag="div" class="space-y-4">
        <div
          v-for="item in items"
          :key="item.id"
          :class="[
            'group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden',
            editingId === item.id
              ? 'border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100'
              : dirtyIds.has(item.id)
                ? 'border-amber-300 shadow-md shadow-amber-50'
                : 'border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'
          ]"
        >
          <!-- Block Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors',
                item.is_new ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
              ]">
                {{ item.sort_order + 1 }}
              </div>

              <!-- Title (View Mode) -->
              <h3
                v-if="editingId !== item.id"
                class="text-base font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                @dblclick="startEdit(item)"
              >
                {{ item.title }}
              </h3>
              <!-- Title (Edit Mode) -->
              <el-input
                v-else
                v-model="editForm.title"
                size="default"
                class="flex-1 font-bold"
                placeholder="需求标题"
              />

              <!-- Dirty Badge -->
              <el-tag v-if="dirtyIds.has(item.id) && editingId !== item.id" size="small" type="warning" effect="plain" round>
                已修改
              </el-tag>
              <el-tag v-if="item.is_new" size="small" type="success" effect="plain" round>
                新增
              </el-tag>
            </div>

            <!-- Actions -->
            <div :class="['flex items-center gap-1 transition-opacity', editingId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']">
              <template v-if="editingId === item.id">
                <el-button type="primary" size="small" icon="Check" @click="saveEdit(item)" :loading="saving">
                  保存
                </el-button>
                <el-button size="small" icon="Close" @click="cancelEdit">取消</el-button>
              </template>
              <template v-else>
                <el-button size="small" circle icon="Edit" type="primary" plain @click="startEdit(item)" />
                <el-popconfirm title="确认删除此需求条目？" @confirm="handleDelete(item)" width="200">
                  <template #reference>
                    <el-button size="small" circle icon="Delete" type="danger" plain />
                  </template>
                </el-popconfirm>
              </template>
            </div>
          </div>

          <!-- Block Content -->
          <div class="px-6 py-4">
            <!-- Content (View Mode) -->
            <div
              v-if="editingId !== item.id"
              class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-2 -m-2"
              @dblclick="startEdit(item)"
            >
              {{ item.content || '（暂无内容，双击编辑）' }}
            </div>
            <!-- Content (Edit Mode) -->
            <el-input
              v-else
              v-model="editForm.content"
              type="textarea"
              :rows="6"
              placeholder="需求详细内容..."
              resize="vertical"
            />
          </div>
        </div>
      </TransitionGroup>

      <!-- Bottom Spacer -->
      <div class="h-20"></div>
    </div>

    <!-- Add Item Dialog -->
    <el-dialog v-model="showAddDialog" title="新增需求条目" width="560px" :close-on-click-modal="false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">需求标题 *</label>
          <el-input v-model="addForm.title" placeholder="输入需求条目标题" size="large" />
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">需求内容</label>
          <el-input v-model="addForm.content" type="textarea" :rows="6" placeholder="输入需求详细内容..." />
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="saving" :disabled="!addForm.title.trim()">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getBaselineItems,
  createBaselineItem,
  updateBaselineItem,
  deleteBaselineItem,
  exportBaselineItems,
  type BaselineItemDetail,
} from '@/services/api'

const route = useRoute()
const router = useRouter()

const versionId = computed(() => Number(route.params.versionId))
const projectName = ref('基线详情')
const versionLabel = ref('')

const items = ref<BaselineItemDetail[]>([])
const loading = ref(false)
const saving = ref(false)
const exporting = ref(false)

// Editing state
const editingId = ref<number | null>(null)
const editForm = reactive({ title: '', content: '' })
const dirtyIds = ref(new Set<number>())

// Add dialog
const showAddDialog = ref(false)
const addForm = reactive({ title: '', content: '' })

async function fetchItems() {
  loading.value = true
  try {
    items.value = await getBaselineItems(versionId.value)
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function startEdit(item: BaselineItemDetail) {
  editingId.value = item.id
  editForm.title = item.title
  editForm.content = item.content || ''
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(item: BaselineItemDetail) {
  saving.value = true
  try {
    const updated = await updateBaselineItem(versionId.value, item.id, {
      title: editForm.title,
      content: editForm.content,
    })
    // Update local item
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) items.value[idx] = updated
    // Mark as dirty for incremental evaluation tracking
    dirtyIds.value.add(item.id)
    editingId.value = null
    ElMessage.success('已保存')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(item: BaselineItemDetail) {
  try {
    await deleteBaselineItem(versionId.value, item.id)
    items.value = items.value.filter((i) => i.id !== item.id)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleAdd() {
  if (!addForm.title.trim()) return
  saving.value = true
  try {
    const nextOrder = items.value.length > 0 ? Math.max(...items.value.map((i) => i.sort_order)) + 1 : 0
    const newItem = await createBaselineItem(versionId.value, {
      title: addForm.title,
      content: addForm.content || '',
      sort_order: nextOrder,
    })
    items.value.push(newItem)
    addForm.title = ''
    addForm.content = ''
    showAddDialog.value = false
    ElMessage.success('已添加')
  } catch (e: any) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    saving.value = false
  }
}

async function handleExport() {
  exporting.value = true
  try {
    const result = await exportBaselineItems(versionId.value)
    projectName.value = result.project_name || projectName.value
    versionLabel.value = result.version || versionLabel.value

    // Download as .md file
    const blob = new Blob([result.markdown_content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.project_name}_${result.version}.md`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e: any) {
    ElMessage.error(e.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchItems()
  // Try to get project name & version from query params
  projectName.value = (route.query.project as string) || '基线详情'
  versionLabel.value = (route.query.version as string) || ''
})
</script>

<style scoped>
.block-enter-active,
.block-leave-active {
  transition: all 0.3s ease;
}
.block-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.block-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
