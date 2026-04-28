<template>
  <div v-if="evalStore.currentReport" id="report-content" class="max-w-4xl mx-auto space-y-8 pb-24">
    <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <!-- Report Header (Compact) -->
      <div class="px-6 py-4 bg-gradient-to-r from-gray-900 to-blue-900 text-white flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold mb-0.5">需求可测试性评估报告</h2>
          <p class="text-[10px] opacity-60">
            评估时间: {{ evalStore.currentReport.date || new Date().toLocaleString() }} • 
            使用模型: {{ evalStore.currentReport.model_used || settings.model }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">总体评分</div>
            <div class="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10" :class="getScoreColor(evalStore.currentReport.total_score || evalStore.currentReport.score)">
              {{ (evalStore.currentReport.total_score || evalStore.currentReport.score) >= 80 ? '优秀' : ((evalStore.currentReport.total_score || evalStore.currentReport.score) >= 60 ? '及格' : '待改进') }}
            </div>
          </div>
          <div :class="['text-5xl font-black', getScoreColor(evalStore.currentReport.total_score || evalStore.currentReport.score)]">
            {{ evalStore.currentReport.total_score || evalStore.currentReport.score }}
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div class="p-6 space-y-6">
        
        <!-- Dashboard Grid (1 Row) -->
        <div class="grid grid-cols-4 gap-4">
          <!-- Referenced Baselines -->
          <div class="col-span-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
              <el-icon class="text-blue-500"><Connection /></el-icon> 引用基准
            </p>
            <div v-if="referencedBaselines.length > 0" class="space-y-1">
              <div v-for="base in referencedBaselines" :key="base.id" class="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-gray-50">
                <span class="text-xs font-bold text-gray-700 truncate max-w-[80px]">{{ base.name }}</span>
                <el-button link size="small" type="primary" @click="$emit('previewFile', base)" class="text-[10px]">预览</el-button>
              </div>
            </div>
            <div v-else class="text-xs text-gray-400 font-medium px-1">未引用任何基准</div>
          </div>

          <!-- Summary Stats -->
          <div class="col-span-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">选用标准</p>
            <p class="text-sm font-bold text-gray-700">{{ knowledgeStore.allSelectedFiles.length }} 项</p>
          </div>
          <div class="col-span-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
            <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">评估深度</p>
            <p class="text-sm font-bold text-gray-700">标准评估</p>
          </div>
          <div class="col-span-1 bg-red-50/50 p-3 rounded-xl border border-red-100 flex flex-col justify-center">
            <p class="text-[10px] text-red-400 font-bold uppercase mb-1">问题总数</p>
            <div class="flex items-center gap-1">
              <p class="text-xl font-black text-red-600">{{ evalStore.currentReport.issues.length }} <span class="text-xs font-bold text-red-400">个</span></p>
              <el-icon class="text-red-500 text-xs"><Top /></el-icon>
            </div>
          </div>
        </div>

        <!-- Split View for Analysis & Details -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: Visuals (35%) -->
          <div class="md:col-span-5 space-y-4 sticky top-4">
            <div class="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
              <h3 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <el-icon class="text-blue-500"><DataAnalysis /></el-icon> 各维度评分分布
              </h3>
              
              <!-- 雷达图容器 (限制高度) -->
              <div class="h-[240px] relative">
                <RadarChart 
                  v-if="dimensionScores && Object.keys(dimensionScores).length > 0"
                  ref="radarChartRef"
                  :dimension-scores="dimensionScores"
                  width="100%"
                  height="100%"
                  @chart-click="handleDimensionClick"
                />
                <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <el-icon :size="40" class="text-gray-300 mb-2"><DataAnalysis /></el-icon>
                  <p class="text-xs font-semibold text-gray-400">暂无维度数据</p>
                </div>
              </div>

              <!-- 维度具体分数进度条 -->
              <div v-if="dimensionScores" class="mt-6 space-y-3">
                <div v-for="(val, key) in dimensionScores" :key="key" class="flex items-center gap-3 text-xs group cursor-pointer hover:bg-white p-1.5 -mx-1.5 rounded-lg transition-colors" @click="handleDimensionClick(key as string, val.score)">
                   <span class="w-14 text-gray-600 font-medium truncate">{{ dimensionLabels[key] || key }}</span>
                   <el-progress :percentage="val.score" :color="getScoreColorHash(val.score)" class="flex-1" :show-text="false" :stroke-width="6" />
                   <span class="w-6 text-right font-black" :class="getScoreColorTextClass(val.score)">{{ val.score }}</span>
                </div>
              </div>
            </div>
            
            <!-- 选中的维度评价详情 -->
            <transition name="el-zoom-in-top">
              <div v-if="selectedDimension && dimensionScores?.[selectedDimension]" class="p-4 bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 rounded-2xl shadow-sm">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <el-icon><DataAnalysis /></el-icon> {{ dimensionLabels[selectedDimension] }} 诊断
                  </h4>
                  <el-button link :icon="Close" class="p-0 h-auto text-indigo-400" @click="clearFilter"></el-button>
                </div>
                <p class="text-[11px] text-indigo-900/80 leading-relaxed font-medium">
                  {{ dimensionScores[selectedDimension].detail }}
                </p>
              </div>
            </transition>
          </div>

          <!-- Right Column: Actionable Insights (65%) -->
          <div class="md:col-span-7 space-y-6">
            
            <!-- Issues Accordion -->
            <section id="issues-analysis" class="scroll-mt-8">
              <div class="flex justify-between items-end mb-3 px-1">
                <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <el-icon class="text-red-500"><Warning /></el-icon> 发现的缺陷
                </h3>
              </div>

              <!-- 使用 el-collapse 压缩垂直空间 -->
              <el-collapse accordion class="border-none space-y-2">
                <el-collapse-item 
                  v-for="(rawIssue, i) in evalStore.currentReport.issues" 
                  :key="i"
                  :name="i"
                  class="bg-white border border-gray-100 rounded-xl overflow-hidden transition-opacity duration-300 shadow-sm [&_.el-collapse-item__header]:border-b-0 [&_.el-collapse-item__header]:h-auto [&_.el-collapse-item__header]:py-3 [&_.el-collapse-item__header]:px-4 [&_.el-collapse-item__wrap]:border-b-0"
                >
                  <template #title>
                    <div class="flex items-start gap-2.5 max-w-[95%]">
                      <span class="text-red-500 font-bold mt-[1px] text-xs bg-red-50 px-1.5 py-0.5 rounded">{{ (Number(i) + 1).toString().padStart(2, '0') }}</span>
                      <el-tooltip
                        v-if="normalizeIssue(rawIssue).affected_card"
                        placement="top"
                        :show-after="300"
                        effect="light"
                      >
                        <template #content>
                          <div style="max-width: 300px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">{{ normalizeIssue(rawIssue).affected_card.title }}</div>
                            <div style="font-size: 12px; line-height: 1.5; color: #d97706;">{{ normalizeIssue(rawIssue).affected_card.snippet }}</div>
                          </div>
                        </template>
                        <span class="text-xs text-gray-700 leading-snug font-semibold text-left line-clamp-2 pr-4 cursor-help" style="text-decoration: underline dotted; text-underline-offset: 3px;">
                          {{ normalizeIssue(rawIssue).description.split(/[。！？]/)[0] }}
                        </span>
                      </el-tooltip>
                      <span v-else class="text-xs text-gray-700 leading-snug font-semibold text-left line-clamp-2 pr-4">
                        {{ normalizeIssue(rawIssue).description.split(/[。！？]/)[0] }}
                      </span>
                    </div>
                  </template>
                  <div class="px-4 pb-4 pt-1 space-y-3">
                     
                     <div v-if="normalizeIssue(rawIssue).affected_card" class="bg-amber-50/60 border border-amber-200/60 rounded-lg p-3">
                       <div class="flex items-center gap-1.5 mb-1.5">
                         <el-icon class="text-amber-500" :size="12"><Document /></el-icon>
                         <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider">关联需求</span>
                       </div>
                       <div class="text-[11px] text-amber-900 font-semibold mb-1">{{ normalizeIssue(rawIssue).affected_card.title }}</div>
                       <div class="text-[11px] text-amber-800/80 leading-relaxed bg-amber-100/40 px-2 py-1.5 rounded border-l-2 border-amber-400">
                         {{ normalizeIssue(rawIssue).affected_card.snippet }}
                       </div>
                     </div>
                     
                     <div v-if="normalizeIssue(rawIssue).references && normalizeIssue(rawIssue).references.length > 0" class="space-y-1.5">
                       <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                         <el-icon :size="10"><Link /></el-icon>
                         引用来源
                       </div>
                      <div
                        v-for="(ref, ri) in normalizeIssue(rawIssue).references" :key="ri"
                        class="flex items-start gap-2 text-[11px] p-2 rounded-lg"
                        :class="ref.type === 'smell' ? 'bg-red-50/50 border border-red-100/60' : 'bg-blue-50/50 border border-blue-100/60'"
                      >
                        <el-tag 
                          size="small" 
                          :type="ref.type === 'smell' ? 'danger' : 'primary'" 
                          effect="light"
                          class="!text-[9px] !px-1 !py-0 shrink-0"
                        >
                          {{ ref.type === 'smell' ? '异味' : '标准' }}
                        </el-tag>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="font-semibold" :class="ref.type === 'smell' ? 'text-red-700' : 'text-blue-700'">{{ ref.name }}</span>
                            <el-tag v-if="ref.type === 'smell' && ref.priority" 
                              size="small" 
                              :type="ref.priority === 'high' ? 'danger' : ref.priority === 'low' ? 'info' : 'warning'"
                              effect="dark"
                              class="!text-[8px] !px-1 !py-0 !h-4"
                            >
                              {{ ref.priority === 'high' ? '高(严重)' : ref.priority === 'low' ? '低(轻微)' : '中(一般)' }}
                            </el-tag>
                          </div>
                          <div class="text-gray-800 leading-relaxed">{{ ref.snippet }}</div>
                        </div>
                      </div>
                     </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </section>

            <!-- Optimization Suggestions -->
            <section v-if="evalStore.currentReport.suggestions">
              <h3 class="text-sm font-bold text-gray-800 mb-3 px-1 flex items-center gap-2">
                <el-icon class="text-green-500"><CircleCheck /></el-icon> 优化改进建议
              </h3>
              <div class="p-5 bg-green-50/50 border border-green-100 rounded-xl shadow-sm">
                <p class="text-[11px] text-gray-700 leading-relaxed italic whitespace-pre-wrap">
                  {{ evalStore.currentReport.suggestions }}
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
      
      <!-- Report Footer -->
      <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div class="flex gap-2">
          <el-button type="primary" plain :icon="Download" :loading="isExporting" @click="exportPDF">导出 PDF 报告</el-button>
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
import { ref, computed, nextTick } from 'vue';
import { useEvaluationStore, useKnowledgeStore, useBaselineStore } from '@/store';
import { Connection, Document, View, Top, Warning, CircleCheck, Download, Plus, Refresh, ChatDotRound, DataAnalysis, Close, Link } from '@element-plus/icons-vue';
import RadarChart from '@/components/RadarChart.vue';
import { generatePdfTemplate, type PdfTemplateData } from '@/utils/pdfTemplate';

defineProps<{ settings: { model: string } }>();
defineEmits(['previewFile', 'continueSupplementing', 'restart']);

const evalStore = useEvaluationStore();
const knowledgeStore = useKnowledgeStore();
const baselineStore = useBaselineStore();

// 当前选中的过滤维度
const selectedDimension = ref<string | null>(null);
const isExporting = ref(false);
const radarChartRef = ref<InstanceType<typeof RadarChart> | null>(null);

function normalizeIssue(issue: any) {
  if (typeof issue === 'string') {
    return { description: issue, affected_card: null, references: [] };
  }
  return issue;
}

const dimensionLabels: Record<string, string> = {
  completeness: '完整性',
  correctness: '正确性',
  unambiguity: '无歧义性',
  feasibility: '可行性',
  verifiability: '可验证性',
  traceability: '可跟踪性'
};

const referencedBaselines = computed(() => {
  return evalStore.referencedBaselineIds.map(id => 
    baselineStore.allFiles.find(f => f.id === id)
  ).filter(f => f);
});

/**
 * 提取并转换维度评分数据
 */
const dimensionScores = computed(() => {
  if (!evalStore.currentReport) return null;
  if (evalStore.currentReport.dimension_scores) {
    return evalStore.currentReport.dimension_scores;
  }
  return null;
});

/**
 * 根据维度过滤问题列表
 */
const filteredIssues = computed(() => {
  const allIssues = evalStore.currentReport?.issues || [];
  if (!selectedDimension.value) return allIssues;
  
  const label = dimensionLabels[selectedDimension.value];
  return allIssues.filter((rawIssue: any) => normalizeIssue(rawIssue).description.includes(label));
});

/**
 * 处理雷达图维度点击事件
 */
function handleDimensionClick(dimension: string, score: number): void {
  console.log('[Step4_Report] 维度点击:', dimension, '分数:', score);
  selectedDimension.value = dimension;
  
  // 平滑滚动到问题分析区域
  nextTick(() => {
    const el = document.getElementById('issues-analysis');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function clearFilter() {
  selectedDimension.value = null;
}

function getRadarImageDataURL(): string | null {
  try {
    const chartComponent = radarChartRef.value as any;
    const echartsInstance = chartComponent?.chartRef?.chart;
    if (echartsInstance && typeof echartsInstance.getDataURL === 'function') {
      return echartsInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
    }
  } catch (e) {
    console.warn('[PDF Export] Failed to get radar chart image:', e);
  }
  return null;
}

async function exportPDF() {
  if (!evalStore.currentReport || isExporting.value) return;

  isExporting.value = true;

  try {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const report = evalStore.currentReport;
    const radarDataURL = getRadarImageDataURL();

    const changedItems = (evalStore.items || [])
      .filter((item: any) => item.status === 'new' || item.status === 'modified' || item.status === 'deleted')
      .map((item: any) => ({ title: item.title || '', status: item.status }));

    const issues = (report.issues || []).map((rawIssue: any) => {
      const issue = normalizeIssue(rawIssue);
      return {
        description: issue.description || '',
        affected_card: issue.affected_card || null,
        references: issue.references || [],
      };
    });

    const currentVersion = (() => {
      const projectName = evalStore.projectName || '未命名项目';
      const match = evalStore.history.find(
        (h: any) => (h.projectName === projectName || h.project_name === projectName) && !h.is_archived
      );
      return match?.version || 'V1.0';
    })();

    const templateData: PdfTemplateData = {
      projectName: evalStore.projectName || '未命名项目',
      version: currentVersion,
      date: report.date || new Date().toISOString().split('T')[0],
      model: report.model_used || 'Unknown',
      totalScore: report.total_score || report.score || 0,
      changedItems,
      dimensionScores: report.dimension_scores || null,
      radarImageDataURL: radarDataURL,
      issues,
      suggestions: report.suggestions || '',
      standardsCount: knowledgeStore.allSelectedFiles.length,
    };

    const htmlString = generatePdfTemplate(templateData);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 794px; height: 1200px; border: none; z-index: -1;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      isExporting.value = false;
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlString);
    iframeDoc.close();

    await new Promise<void>(resolve => {
      const checkReady = () => {
        if (iframeDoc.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    const renderTarget = iframeDoc.body.firstElementChild as HTMLElement;
    if (!renderTarget) {
      document.body.removeChild(iframe);
      isExporting.value = false;
      return;
    }

    const canvas = await html2canvas(renderTarget, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pdfPageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      let srcY = 0;
      let page = 0;

      while (remainingHeight > 0) {
        if (page > 0) pdf.addPage();
        const sliceH = Math.min(remainingHeight, pdfPageHeight);
        const canvasSlice = document.createElement('canvas');
        canvasSlice.width = canvas.width;
        canvasSlice.height = (sliceH / imgHeight) * canvas.height;
        const sliceCtx = canvasSlice.getContext('2d');
        if (sliceCtx) {
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, canvasSlice.width, canvasSlice.height);
          sliceCtx.drawImage(canvas, 0, srcY, canvas.width, canvasSlice.height, 0, 0, canvas.width, canvasSlice.height);
        }
        const sliceData = canvasSlice.toDataURL('image/jpeg', 0.95);
        pdf.addImage(sliceData, 'JPEG', 0, 0, imgWidth, sliceH);
        srcY += canvasSlice.height;
        remainingHeight -= sliceH;
        page++;
      }
    }

    const projectName = evalStore.projectName || '未命名项目';
    const date = new Date().toISOString().split('T')[0];
    pdf.save(`评估报告_${projectName}_${date}.pdf`);

    document.body.removeChild(iframe);
  } catch (e) {
    console.error('[PDF Export]', e);
  } finally {
    isExporting.value = false;
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreColorHash = (score: number) => {
  if (score >= 80) return '#4ade80'; // green-400
  if (score >= 60) return '#fb923c'; // orange-400
  return '#f87171'; // red-400
};

const getScoreColorTextClass = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-red-500';
};
</script>

<style>
@media print {
  .el-collapse-item__header { break-inside: avoid; }
  .el-collapse-item__wrap { break-inside: avoid; }
}
</style>
