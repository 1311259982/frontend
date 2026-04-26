<!--
  雷达图可视化组件 - 用于展示多维度评估结果

  ⚠️ 依赖说明：
  此组件需要安装 ECharts 和 vue-echarts 才能正常运行。
  请在项目根目录执行以下命令安装依赖：

  npm install echarts vue-echarts

  或使用 yarn:
  yarn add echarts vue-echarts

  安装后需要在 main.ts 或相关入口文件中注册组件：
  import { createApp } from 'vue'
  import VueEcharts from 'vue-echarts'
  import * as echarts from 'echarts'

  const app = createApp(App)
  app.component('v-chart', VueEcharts)
  app.mount('#app')
-->

<template>
  <div class="radar-chart-container" :style="containerStyle" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <!-- 背景装饰效果 -->
    <div class="chart-bg-decoration"></div>
    
    <!-- Loading 状态 -->
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading" :size="48"><Loading /></el-icon>
      <p class="loading-text">数据分析中...</p>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="!hasData" class="chart-empty">
      <div class="empty-glow"></div>
      <el-icon :size="56" class="empty-icon"><DataAnalysis /></el-icon>
      <p class="empty-text">暂无维度评分数据</p>
      <p class="empty-hint">请完成评估流程以解锁详细的维度多维分析报告</p>
    </div>

    <!-- 雷达图 -->
    <v-chart
      v-else
      ref="chartRef"
      :option="chartOption"
      :style="chartStyle"
      autoresize
      @click="handleChartClick"
    />

    <!-- 自定义迷你提示框（单点触发） -->
    <div v-if="isMini && tooltipVisible && hoveredDim" 
         class="absolute pointer-events-none z-[1000] transition-opacity duration-150"
         :style="{ left: tooltipX + 8 + 'px', top: tooltipY - 12 + 'px' }">
      <div class="px-2 py-0.5 bg-[#0f172a] border border-[#334155] rounded shadow-lg whitespace-nowrap flex items-baseline gap-1.5">
        <span class="text-[9px] text-[#94a3b8]">{{ hoveredDim.name }}</span>
        <span class="text-[11px] font-black text-[#60a5fa]">{{ hoveredDim.score }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * RadarChart.vue - 高级多维度评估结果雷达图组件
 *
 * 优化特性：
 * 1. 采用深色/渐变视觉设计，契合 AI 评估的高端定位
 * 2. 移除冗余轴标签，减少视觉噪音
 * 3. 动态发光数据点与平滑面积渐变
 * 4. 增强型交互 Tooltip，支持状态等级显示
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart as RadarChartComponent } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { Loading, DataAnalysis } from '@element-plus/icons-vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  RadarChartComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// ==================== 类型定义 ====================

interface DimensionScore {
  score: number
  detail: string
}

interface DimensionScores {
  [dimensionKey: string]: DimensionScore
}

// ==================== Props 定义 ====================

const props = withDefaults(defineProps<{
  dimensionScores?: DimensionScores | null
  width?: string
  height?: string
  loading?: boolean
  isMini?: boolean
}>(), {
  dimensionScores: null,
  width: '100%',
  height: '420px',
  loading: false,
  isMini: false
})

// ==================== Emits 定义 ====================

const emit = defineEmits<{
  (e: 'chartClick', dimension: string, score: number): void
}>()

// ==================== 维度名称映射表 ====================

const dimensionLabels: Record<string, string> = {
  completeness: '完整性',
  correctness: '正确性',
  unambiguity: '无歧义性',
  feasibility: '可行性',
  verifiability: '可验证性',
  traceability: '可跟踪性'
}

// ==================== 响应式数据 ====================

const chartRef = ref<any>(null)

// 悬停单点提示框状态
const tooltipVisible = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)
const hoveredDim = ref<{name: string, score: number} | null>(null)

// ==================== 计算属性 ====================

const hasData = computed(() => {
  if (!props.dimensionScores) return false
  return Object.keys(props.dimensionScores).length > 0
})

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  position: 'relative' as const
}))

const chartStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

/**
 * 根据分数获取评价等级
 */
function getScoreLevel(score: number): { label: string, color: string } {
  if (score >= 90) return { label: '极佳', color: '#10b981' }
  if (score >= 80) return { label: '优秀', color: '#34d399' }
  if (score >= 70) return { label: '良好', color: '#60a5fa' }
  if (score >= 60) return { label: '及格', color: '#fbbf24' }
  return { label: '待改进', color: '#f87171' }
}

/**
 * 生成 ECharts 配置项
 */
const chartOption = computed(() => {
  if (!hasData.value) return {}

  const scores = props.dimensionScores!
  const dimensions = Object.keys(scores)
  
  // 构建指示器配置
  const indicators = dimensions.map(key => ({
    name: dimensionLabels[key] || key,
    max: 100,
    axisLabel: { show: false } // 隐藏嘈杂的轴数值
  }))

  const scoreValues = dimensions.map(key => scores[key].score)
  
  // 核心视觉配置：根据平均分决定主题色调
  const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
  const themeColor = avgScore >= 60 ? '#6366f1' : '#f43f5e' // 蓝紫色或珊瑚红
  const glowColor = avgScore >= 60 ? 'rgba(99, 102, 241, 0.5)' : 'rgba(244, 63, 94, 0.5)'

  return {
    tooltip: {
      show: !props.isMini, // 普通模式下开启提示
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: [8, 12],
      formatter: (params: any) => {
        if (params.componentType === 'series') {
          return `<div style="font-size: 12px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 14px;">💡</span> 提示：请点击外围的维度名称查看诊断详情
                  </div>`
        }
        return ''
      },
      extraCssText: 'border-radius: 8px; z-index: 1000;',
      confine: true
    },
    radar: {
      center: ['50%', '50%'],
      radius: props.isMini ? '95%' : '65%', // 放大迷你模式半径，充分利用有限空间
      splitNumber: props.isMini ? 3 : 4,
      triggerEvent: true, // 开启事件响应
      axisName: {
        show: !props.isMini, // 迷你模式隐藏标签
        color: '#475569',
        fontSize: 14,
        fontWeight: 600,
        padding: [8, 12],
        fontFamily: 'Inter, sans-serif'
      },
      splitArea: {
        show: !props.isMini,
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.1)',
          type: props.isMini ? 'solid' : 'dashed'
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      },
      indicator: indicators
    },
    series: [{
      type: 'radar',
      data: [{
        value: scoreValues,
        name: '维度评分',
        symbol: 'circle',
        symbolSize: props.isMini ? 4 : 8,
        itemStyle: {
          color: themeColor,
          borderColor: '#fff',
          borderWidth: props.isMini ? 1 : 2,
          shadowColor: glowColor,
          shadowBlur: props.isMini ? 4 : 10
        },
        lineStyle: {
          width: props.isMini ? 2 : 4,
          color: themeColor,
          cap: 'round'
        },
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.1)' },
              { offset: 0.8, color: 'rgba(99, 102, 241, 0.4)' },
              { offset: 1, color: glowColor }
            ]
          },
          shadowBlur: props.isMini ? 0 : 20,
          shadowColor: 'rgba(99, 102, 241, 0.3)'
        },
        label: {
          show: false, // 非悬停状态不展示分数
          formatter: '{c}',
          position: 'top',
          color: themeColor,
          fontSize: 10,
          fontWeight: 'bold',
          distance: 5
        },
        emphasis: {
          lineStyle: {
            width: props.isMini ? 3 : 6,
            shadowBlur: 10,
            shadowColor: themeColor
          },
          areaStyle: {
            opacity: 0.6
          },
          label: {
            show: false // 无论是普通模式还是迷你模式，都不在悬停时展示全部丑陋标签
          }
        }
      }],
      animationDuration: 1000
    }]
  }
})

// ==================== 方法 ====================

function handleMouseMove(e: MouseEvent) {
  if (!props.isMini || !hasData.value) return
  
  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const dx = e.clientX - rect.left - cx
  const dy = e.clientY - rect.top - cy
  
  const distance = Math.sqrt(dx * dx + dy * dy)
  // 如果距离中心点较远，取消悬停状态
  if (distance > rect.width / 2) {
    tooltipVisible.value = false
    return
  }

  // 计算角度（12点钟方向为0度，顺时针递增）
  let angle = Math.atan2(dy, dx) * 180 / Math.PI
  angle = angle + 90
  if (angle < 0) angle += 360

  const dimensions = Object.keys(props.dimensionScores!)
  const numDims = dimensions.length
  const anglePerDim = 360 / numDims
  
  // 计算最接近的维度的索引
  const closestIdx = Math.round(angle / anglePerDim) % numDims
  const key = dimensions[closestIdx]
  
  hoveredDim.value = {
    name: dimensionLabels[key] || key,
    score: props.dimensionScores![key].score
  }
  
  tooltipX.value = e.clientX - rect.left
  tooltipY.value = e.clientY - rect.top
  tooltipVisible.value = true
}

function handleMouseLeave() {
  tooltipVisible.value = false
}

function handleChartClick(params: any): void {
  if (props.isMini || !hasData.value) return
  
  // 阻止点击雷达图多边形本体（Series），强制用户点击外围坐标轴标签
  if (params.componentType === 'series') {
    return
  }
  
  let clickedDimension = ''
  let clickedScore = 0

  // 情况1：点击的是雷达图中的数据点或面积区域
  if (params.componentType === 'series') {
    const dimensions = Object.keys(props.dimensionScores!)
    clickedDimension = dimensions[params.dataIndex]
    clickedScore = props.dimensionScores![clickedDimension].score
  } 
  // 情况2：点击的是雷达图周边的维度名称（坐标轴标签）
  else if (params.componentType === 'radar') {
    const labelName = params.name
    // 通过中文标签名反查英文 key
    const dimensionEntry = Object.entries(dimensionLabels).find(([_, label]) => label === labelName)
    clickedDimension = dimensionEntry ? dimensionEntry[0] : labelName
    clickedScore = props.dimensionScores![clickedDimension]?.score || 0
  }

  if (clickedDimension) {
    emit('chartClick', clickedDimension, clickedScore)
  }
}

function resizeChart(): void {
  if (chartRef.value?.resize) {
    nextTick(() => chartRef.value.resize())
  }
}

watch(() => props.dimensionScores, () => nextTick(resizeChart), { deep: true })

onMounted(() => {
  nextTick(resizeChart)
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
})

let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleWindowResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(resizeChart, 200)
}
</script>

<style scoped>
.radar-chart-container {
  background: v-bind("isMini ? 'transparent' : '#ffffff'");
  border-radius: 24px;
  border: v-bind("isMini ? 'none' : '1px solid rgba(226, 232, 240, 0.8)'");
  overflow: visible; /* 改为 visible，允许标签和 Tooltip 溢出显示 */
  position: relative;
  z-index: 10;
}

/* 装饰性背景光晕 */
.chart-bg-decoration {
  position: absolute;
  top: -10%;
  right: -10%;
  width: 40%;
  height: 40%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
  z-index: -1;
  pointer-events: none;
}

.chart-loading, .chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.loading-text, .empty-text {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
}

.empty-icon {
  color: #cbd5e1;
  filter: drop-shadow(0 0 12px rgba(203, 213, 225, 0.4));
}

.empty-hint {
  font-size: 12px;
  color: #94a3b8;
  max-width: 280px;
  text-align: center;
  line-height: 1.6;
}

/* 发光效果 */
.empty-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

:deep(.v-chart) {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.radar-chart-container:hover :deep(.v-chart) {
  transform: scale(1.02);
}
</style>
