<template>
  <div v-if="evalStore.currentReport" class="max-w-4xl mx-auto space-y-8 pb-24">
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <!-- Report Header -->
      <div class="p-8 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h2 class="text-2xl font-bold mb-1">需求可测试性评估报告</h2>
            <p class="text-xs opacity-60">
              评估时间: {{ evalStore.currentReport.date || new Date().toLocaleString() }} • 
              使用模型: {{ evalStore.currentReport.model_used || settings.model }}
            </p>
          </div>
          <div class="text-center">
            <div :class="['text-5xl font-black mb-1', getScoreColor(evalStore.currentReport.total_score || evalStore.currentReport.score)]">
              {{ evalStore.currentReport.total_score || evalStore.currentReport.score }}
            </div>
            <div class="text-[10px] uppercase tracking-widest opacity-60 font-bold">总体评分</div>
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div class="p-8 space-y-10">
        <!-- Referenced Baselines in Report -->
        <div v-if="referencedBaselines.length > 0" class="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <el-icon class="text-blue-500"><Connection /></el-icon> 本次评估引用基准
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div 
              v-for="base in referencedBaselines" 
              :key="base.id"
              class="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <el-icon><Document /></el-icon>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-700">{{ base.name }}</p>
                   <p class="text-[10px] text-gray-400">评分: {{ base.score }}</p>
                </div>
              </div>
              <el-button link icon="View" @click="$emit('previewFile', base)">预览原文</el-button>
            </div>
          </div>
        </div>

        <!-- Summary Statistics -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">选用标准</p>
            <p class="text-sm font-bold text-gray-700">{{ knowledgeStore.allSelectedFiles.length }} 项</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">评估深度</p>
            <p class="text-sm font-bold text-gray-700">标准评估</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">问题总数</p>
            <div class="flex items-center gap-1">
              <p class="text-sm font-bold text-red-500">{{ evalStore.currentReport.issues.length }} 个</p>
              <el-icon class="text-red-500 text-xs"><Top /></el-icon>
            </div>
          </div>
        </div>

        <!-- Issues Analysis -->
        <section>
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <el-icon class="text-red-500"><Warning /></el-icon> 问题点分析
          </h3>
          <div class="space-y-3">
            <div 
              v-for="(issue, i) in evalStore.currentReport.issues" 
              :key="i"
              class="p-4 bg-red-50/30 border-l-4 border-red-400 rounded-r-xl flex gap-3"
            >
              <span class="text-red-500 font-bold">0{{ Number(i)+1 }}</span>
              <p class="text-sm text-gray-700 leading-relaxed">{{ issue }}</p>
            </div>
          </div>
        </section>

        <!-- Optimization Suggestions -->
        <section>
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <el-icon class="text-green-500"><CircleCheck /></el-icon> 优化改进建议
          </h3>
          <div class="p-6 bg-green-50/30 border border-green-100 rounded-2xl">
            <p class="text-sm text-gray-700 leading-relaxed italic">
              {{ evalStore.currentReport.suggestions }}
            </p>
          </div>
        </section>
      </div>
      
      <!-- Report Footer -->
      <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div class="flex gap-2">
          <el-button type="primary" plain icon="Download">导出 PDF 报告</el-button>
          <el-button v-if="evalStore.referencedBaselineIds.length > 0" type="primary" icon="Plus" @click="$emit('continueSupplementing')">基于本次结果继续补充需求</el-button>
        </div>
        <div class="flex gap-2">
          <el-button icon="Refresh" @click="$emit('restart')">重新评估</el-button>
          <el-button type="primary" icon="ChatDotRound">针对报告提问</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEvaluationStore, useKnowledgeStore, useBaselineStore } from '@/store';
import { Connection, Document, View, Top, Warning, CircleCheck, Download, Plus, Refresh, ChatDotRound } from '@element-plus/icons-vue';

defineProps<{ settings: { model: string } }>();
defineEmits(['previewFile', 'continueSupplementing', 'restart']);

const evalStore = useEvaluationStore();
const knowledgeStore = useKnowledgeStore();
const baselineStore = useBaselineStore();

const referencedBaselines = computed(() => {
  return evalStore.referencedBaselineIds.map(id => 
    baselineStore.allFiles.find(f => f.id === id)
  ).filter(f => f);
});

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
};
</script>
