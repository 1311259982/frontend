<template>
  <div v-if="report" class="flex flex-col h-full bg-white">
    <!-- Header: Score & Mini Radar -->
    <div class="p-4 bg-gradient-to-br from-gray-900 via-blue-950 to-blue-900 text-white flex-shrink-0 relative overflow-hidden">
      <!-- 装饰背景 -->
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div class="flex items-center relative z-10">
        <!-- Title Section -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold tracking-tight">评估报告</h2>
            <div class="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/20 text-[8px] font-black uppercase tracking-widest text-blue-300">
              Analysis
            </div>
          </div>
          <p class="text-[10px] opacity-40 uppercase tracking-tighter mt-0.5">Model diagnostic summary</p>
        </div>

        <!-- Radar & Score Combined Section -->
        <div class="flex items-center pl-4 border-l border-white/5 gap-4">
          <!-- Mini Radar (No box, minimalist) -->
          <div v-if="report.dimension_scores" class="flex-shrink-0">
            <RadarChart 
              :dimension-scores="report.dimension_scores" 
              :is-mini="true" 
              height="64px" 
              width="64px"
            />
          </div>

          <!-- Total Score -->
          <div class="text-right flex flex-col items-end">
            <div class="flex items-baseline gap-1">
              <span :class="['text-4xl font-black italic tracking-tighter drop-shadow-2xl', getScoreColor(report.total_score || report.score)]">
                {{ report.total_score || report.score || 0 }}
              </span>
              <span class="text-[10px] opacity-40 font-bold italic">PT</span>
            </div>
            <div class="text-[8px] uppercase tracking-widest opacity-40 font-black -mt-1">Final Score</div>
          </div>
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
            <span class="font-bold text-red-500 mr-1">{{ Number(i) + 1 }}.</span>
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
import RadarChart from './RadarChart.vue'

const props = defineProps<{
  report: any
}>()

console.log('[EvaluationReportView] Received report:', props.report)

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-orange-400'
  return 'text-red-400'
}
</script>
