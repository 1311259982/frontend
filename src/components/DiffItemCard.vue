<script setup lang="ts">
import type { ItemDiff } from '@/services/api'
import TextDiff from './TextDiff.vue'

interface Props {
  itemDiff: ItemDiff
  index: number
}

defineProps<Props>()
</script>

<template>
  <div
    class="diff-item-card rounded-2xl shadow-sm transition-all duration-200 overflow-hidden"
    :class="{
      'border-l-4 border-green-400 bg-green-50/30': itemDiff.status === 'new',
      'border-l-4 border-red-400 bg-red-50/30': itemDiff.status === 'deleted',
      'border-l-4 border-amber-400 bg-amber-50/30': itemDiff.status === 'modified',
      'border-l-4 border-gray-200 bg-white': itemDiff.status === 'unchanged'
    }"
  >
    <!-- Header -->
    <div
      class="px-5 py-3 border-b flex items-center justify-between"
      :class="{
        'bg-green-50/50 border-green-100': itemDiff.status === 'new',
        'bg-red-50/50 border-red-100': itemDiff.status === 'deleted',
        'bg-amber-50/50 border-amber-100': itemDiff.status === 'modified',
        'bg-gray-50/30 border-gray-50': itemDiff.status === 'unchanged'
      }"
    >
      <div class="flex items-center gap-3 flex-1">
        <span
          class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
          :class="{
            'bg-green-100 text-green-600': itemDiff.status === 'new',
            'bg-red-100 text-red-600': itemDiff.status === 'deleted',
            'bg-amber-100 text-amber-600': itemDiff.status === 'modified',
            'bg-gray-100 text-gray-400': itemDiff.status === 'unchanged'
          }"
        >
          {{ index + 1 }}
        </span>

        <el-tag
          size="small"
          :type="itemDiff.status === 'new' ? 'success' : itemDiff.status === 'deleted' ? 'danger' : itemDiff.status === 'modified' ? 'warning' : 'info'"
          effect="light"
          class="!scale-90"
        >
          {{ itemDiff.status === 'new' ? '新增' : itemDiff.status === 'deleted' ? '已删除' : itemDiff.status === 'modified' ? '已修改' : '未变更' }}
        </el-tag>

        <!-- Title with diff -->
        <div class="font-bold text-gray-800 text-[13px] flex-1 min-w-0 truncate">
          <TextDiff :segments="itemDiff.titleDiff" />
        </div>
      </div>

      <!-- Stats -->
      <div v-if="itemDiff.status === 'modified'" class="flex items-center gap-2 text-[10px] shrink-0">
        <span class="text-green-600 font-medium">+{{ itemDiff.stats.addedChars }}</span>
        <span class="text-red-600 font-medium">-{{ itemDiff.stats.deletedChars }}</span>
      </div>
    </div>

    <!-- Content with diff -->
    <div class="p-5">
      <div class="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
        <TextDiff :segments="itemDiff.contentDiff" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-item-card {
  border: 1px solid transparent;
}

.diff-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
