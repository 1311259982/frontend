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

        <!-- 多维度评分可视化（雷达图） -->
        <section class="mb-8">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <el-icon class="text-blue-500"><DataAnalysis /></el-icon> 各维度评分分布
          </h3>
          
          <!-- 有维度数据时显示雷达图 -->
          <RadarChart 
            v-if="dimensionScores && Object.keys(dimensionScores).length > 0"
            :dimension-scores="dimensionScores"
            width="100%"
            height="420px"
            @chart-click="handleDimensionClick"
          />
          
          <!-- 无维度数据时显示降级提示 -->
          <div v-else class="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200 p-12 text-center">
            <el-icon :size="56" class="text-gray-300 mb-3"><DataAnalysis /></el-icon>
            <p class="text-base font-semibold text-gray-400 mb-2">暂无维度评分数据</p>
            <p class="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              系统可能使用旧版本评估模型，或该次评估未启用多维度分析功能。
              <br>建议升级评估引擎以获取更详细的维度评分报告。
            </p>
          </div>
        </section>

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
import { Connection, Document, View, Top, Warning, CircleCheck, Download, Plus, Refresh, ChatDotRound, DataAnalysis } from '@element-plus/icons-vue';
import RadarChart from '@/components/RadarChart.vue';

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

/**
 * 提取并转换维度评分数据
 * 支持从 currentReport 中获取 dimension_scores 字段
 * 兼容旧数据格式（如果后端尚未返回维度数据）
 */
const dimensionScores = computed(() => {
  if (!evalStore.currentReport) return null;
  
  // 优先使用 dimension_scores 字段（新版本数据格式）
  if (evalStore.currentReport.dimension_scores) {
    return evalStore.currentReport.dimension_scores;
  }
  
  // 兼容旧版本：如果维度数据在其他字段中，可以在这里添加转换逻辑
  // 例如：if (evalStore.currentReport.dimensions) { ... }
  
  return null;
});

/**
 * 处理雷达图维度点击事件
 * 可扩展：点击某个维度时高亮显示对应的 issues
 * @param dimension - 被点击的维度名称（英文 key）
 * @param score - 该维度的分数
 */
function handleDimensionClick(dimension: string, score: number): void {
  console.log('[Step4_Report] 维度点击:', dimension, '分数:', score);
  
  // TODO: 可扩展功能 - 根据点击的维度过滤或高亮对应的 issues
  // 例如：如果点击 'completeness'，可以滚动到相关的完整性问题
  
  // 使用 Element Plus 消息提示反馈用户操作
  // import { ElMessage } from 'element-plus'
  // ElMessage.info(`您点击了「${getDimensionLabel(dimension)}」维度，得分: ${score}分`);
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
};
</script>
