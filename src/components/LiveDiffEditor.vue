<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { diffChars } from 'diff'

interface Props {
  modelValue: string
  originalValue: string
  placeholder?: string
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: true,
  placeholder: '需求内容...'
})
const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isEditing = ref(false)

watch(() => props.modelValue, (val) => {
  internalValue.value = val
})

watch(() => props.expanded, (val) => {
  if (!val) isEditing.value = false
})

// 计算 diff segments（仅用于展示模式）
const segments = computed(() => {
  const old = props.originalValue || ''
  const cur = internalValue.value || ''
  if (!old && !cur) return []
  return diffChars(old, cur).map(change => ({
    text: change.value,
    type: change.added ? 'added' as const : change.removed ? 'removed' as const : 'equal' as const
  }))
})

const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

const startEditing = () => {
  isEditing.value = true
  nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  internalValue.value = target.value
  emit('update:modelValue', target.value)
  nextTick(autoResize)
}
</script>

<template>
  <div class="live-diff-editor">

    <!-- 折叠模式：单行截断 -->
    <div v-if="!expanded" class="collapsed-preview">
      <span>{{ internalValue || placeholder }}</span>
    </div>

    <!-- 展开 + 编辑模式：纯净 textarea，无叠加层 -->
    <textarea
      v-else-if="isEditing"
      ref="textareaRef"
      v-model="internalValue"
      :placeholder="placeholder"
      class="editor-textarea"
      @input="onInput"
      @blur="isEditing = false"
    ></textarea>

    <!-- 展开 + 展示模式：span 渲染，精准无歧义 -->
    <div
      v-else
      class="display-view"
      @click="startEditing"
      title="点击编辑"
    >
      <template v-if="segments.length > 0">
        <template v-for="(seg, i) in segments" :key="i">
          <span v-if="seg.type === 'added'" class="seg-added">{{ seg.text }}</span>
          <span v-else-if="seg.type === 'removed'" class="seg-removed">{{ seg.text }}</span>
          <span v-else>{{ seg.text }}</span>
        </template>
      </template>
      <span v-else class="placeholder-text">{{ placeholder }}</span>
    </div>

  </div>
</template>

<style scoped>
/* ---- 共用变量 ---- */
/* padding、font-size、line-height 必须与左侧 ParentDiffText 容器完全一致 */
:root {
  --diff-pad: 12px;
  --diff-fs: 13px;
  --diff-lh: 1.5;
}

.live-diff-editor {
  width: 100%;
}

/* ---- 折叠 ---- */
.collapsed-preview {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 展示模式（核心：与左侧保持完全一致的盒模型）---- */
.display-view {
  /* 与左侧 ParentDiffText 包装 div 完全相同 */
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;
  border: 1px solid transparent;
  transition: border-color 0.15s, background-color 0.15s;
}

.display-view:hover {
  border-color: #e2e8f0;
  background-color: white;
}

/* ---- 编辑模式（核心：padding 完全等于展示模式，box-sizing 必须一致）---- */
.editor-textarea {
  display: block;
  width: 100%;
  /* 用 box-sizing: border-box，border(1px)*2 + padding(12px)*2 = 总宽度不变 */
  box-sizing: border-box;
  /* 内容 padding = 展示模式 padding(12px) - border(1px) = 11px，确保内容区等宽 */
  padding: 11px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #334155;
  font-family: inherit;
  background-color: white;
  resize: none;
  overflow: hidden;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.editor-textarea:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.editor-textarea::placeholder {
  color: #9ca3af;
}

/* ---- Diff 高亮（与 ParentDiffText.vue 完全一致）---- */
.seg-added {
  background-color: #dcfce7;
  color: #166534;
  border-radius: 2px;
}

.seg-removed {
  background-color: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
  border-radius: 2px;
}

.placeholder-text {
  color: #9ca3af;
}
</style>
