<template>
  <div v-if="report" class="flex flex-col h-full bg-white">
    <!-- Header: Score -->
    <div class="p-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white flex-shrink-0">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold mb-1">评估报告</h2>
          <p class="text-xs opacity-60">版本评估结果概览</p>
        </div>
        <div class="text-center">
          <div :class="['text-4xl font-black', getScoreColor(report.total_score || report.score)]">
            {{ report.total_score || report.score || 0 }}
          </div>
          <div class="text-[10px] uppercase tracking-widest opacity-60 font-bold">综合评分</div>
        </div>
      </div>
    </div>

    <!-- Content: Scrollable -->
    <div class="p-6 overflow-y-auto flex-1 space-y-6">
      
      <!-- Summary metrics -->
      <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span class="text-xs font-bold text-gray-500 uppercase">缺陷总数</span>
        <div class="flex items-center gap-1">
          <p class="text-lg font-black text-red-500">{{ (report.issues || []).length }}</p>
          <span class="text-xs text-red-400">个</span>
        </div>
      </div>

      <!-- Issues List -->
      <section v-if="report.issues && report.issues.length > 0">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> 发现的缺陷
        </h3>
        <div class="space-y-2">
          <div 
            v-for="(issue, i) in report.issues" 
            :key="i"
            class="p-3 bg-red-50/50 border-l-2 border-red-400 text-xs text-gray-700 leading-relaxed rounded-r-lg"
          >
            <span class="font-bold text-red-500 mr-1">{{ i + 1 }}.</span>
            {{ issue }}
          </div>
        </div>
      </section>

      <!-- Suggestions -->
      <section v-if="report.suggestions">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> 改进建议
        </h3>
        <div class="p-4 bg-green-50/50 border border-green-100 rounded-xl text-xs text-gray-700 leading-relaxed italic">
          {{ report.suggestions }}
        </div>
      </section>

    </div>
  </div>
  <div v-else class="h-full flex flex-col items-center justify-center text-gray-400">
    <div class="text-4xl mb-2 opacity-20">📊</div>
    <p class="text-sm font-bold">暂无评估报告数据</p>
    <p class="text-xs mt-1">此版本未经评估或报告丢失</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  report: any
}>()

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-orange-400'
  return 'text-red-400'
}
</script>
