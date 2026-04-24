<script setup lang="ts">
import { computed } from 'vue'
import { diffChars } from 'diff'

interface Props {
  parentText: string
  currentText: string
}

const props = defineProps<Props>()

const segments = computed(() => {
  const pText = props.parentText || ''
  const cText = props.currentText || ''
  
  if (!cText && pText) {
    // 当前版本已删除此条目，全部显示删除线
    return [{ op: 'delete' as const, text: pText }]
  }
  
  const diffs = diffChars(pText, cText)
  return diffs.map((change) => ({
    op: change.added ? 'insert' as const : change.removed ? 'delete' as const : 'equal' as const,
    text: change.value
  }))
})
</script>

<template>
  <span class="parent-diff-text">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.op === 'equal'" class="diff-equal">{{ seg.text }}</span>
      <span v-else-if="seg.op === 'delete'" class="diff-delete">{{ seg.text }}</span>
      <span v-else-if="seg.op === 'insert'" class="diff-insert">{{ seg.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.parent-diff-text {
  white-space: pre-wrap;
  word-break: break-word;
  /* 确保行高固定，不受子元素 padding 影响 */
  line-height: 1.5;
  font-size: 13px;
}

.diff-equal {
  color: inherit;
}

.diff-delete {
  /* 用 box-shadow 代替 background-color 实现背景，不影响行高和布局 */
  box-shadow: 0 0 0 2px #fecaca inset;
  background-color: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
  border-radius: 2px;
}

.diff-insert {
  box-shadow: 0 0 0 2px #bbf7d0 inset;
  background-color: #dcfce7;
  color: #166534;
  border-radius: 2px;
}
</style>
