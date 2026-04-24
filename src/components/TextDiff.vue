<script setup lang="ts">
import type { DiffSegment } from '@/services/api'

interface Props {
  segments: DiffSegment[]
}

defineProps<Props>()
</script>

<template>
  <span class="text-diff">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.op === 'equal'" class="diff-equal">{{ seg.text }}</span>
      <span v-else-if="seg.op === 'insert'" class="diff-insert">{{ seg.text }}</span>
      <span v-else-if="seg.op === 'delete'" class="diff-delete">{{ seg.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.text-diff {
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-equal {
  color: inherit;
}

.diff-insert {
  background-color: #dcfce7;
  color: #166534;
  border-radius: 2px;
  padding: 0 1px;
}

.diff-delete {
  background-color: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
