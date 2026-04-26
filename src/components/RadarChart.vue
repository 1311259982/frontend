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
  <div class="radar-chart-container" :style="containerStyle">
    <!-- Loading 状态 -->
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading" :size="48"><Loading /></el-icon>
      <p class="loading-text">数据加载中...</p>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="!hasData" class="chart-empty">
      <el-icon :size="48" class="empty-icon"><DataAnalysis /></el-icon>
      <p class="empty-text">暂无维度评分数据</p>
      <p class="empty-hint">请等待评估完成或检查数据源</p>
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
  </div>
</template>

<script setup lang="ts">
/**
 * RadarChart.vue - 多维度评估结果雷达图组件
 *
 * 功能特性：
 * 1. 使用 ECharts 渲染高性能雷达图
 * 2. 动态生成维度轴，根据数据自动调整
 * 3. 支持中英文维度名称映射
 * 4. 丰富的交互效果和 tooltip 提示
 * 5. 响应式布局，自适应容器大小
 * 6. 优雅的降级处理和 loading 状态
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
// 注意：以下导入需要在安装 echarts 和 vue-echarts 后取消注释
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

// 注册 ECharts 组件（需要在安装依赖后启用）
use([
  CanvasRenderer,
  RadarChartComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// ==================== 类型定义 ====================

/**
 * 单个维度的评分数据
 */
interface DimensionScore {
  /** 分数，范围 0-100 的整数 */
  score: number
  /** 详细说明文字 */
  detail: string
}

/**
 * 维度评分集合，key 为维度英文名，value 为对应的评分数据
 */
interface DimensionScores {
  [dimensionKey: string]: DimensionScore
}

// ==================== Props 定义 ====================

const props = withDefaults(defineProps<{
  /** 维度评分数据对象 */
  dimensionScores?: DimensionScores | null
  /** 容器宽度，默认 '100%' */
  width?: string
  /** 容器高度，默认 '400px' */
  height?: string
  /** 是否显示 loading 状态 */
  loading?: boolean
}>(), {
  dimensionScores: null,
  width: '100%',
  height: '400px',
  loading: false
})

// ==================== Emits 定义 ====================

const emit = defineEmits<{
  (e: 'chartClick', dimension: string, score: number): void
}>()

// ==================== 维度名称映射表 ====================

/**
 * 英文维度 key 到中文显示名称的映射
 * 可根据实际业务需求扩展
 */
const dimensionLabels: Record<string, string> = {
  completeness: '完整性',
  correctness: '正确性',
  unambiguity: '无歧义性',
  feasibility: '可行性',
  verifiability: '可验证性',
  traceability: '可跟踪性'
}

// ==================== 响应式数据 ====================

/** 图表实例引用 */
const chartRef = ref<any>(null)

// ==================== 计算属性 ====================

/**
 * 判断是否有有效的维度数据
 */
const hasData = computed(() => {
  if (!props.dimensionScores) return false
  return Object.keys(props.dimensionScores).length > 0
})

/**
 * 容器样式
 */
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  position: 'relative' as const
}))

/**
 * 图表样式
 */
const chartStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

/**
 * 生成 ECharts 配置项
 * 根据传入的 dimensionScores 动态构建雷达图配置
 */
const chartOption = computed(() => {
  // 如果没有数据，返回空配置
  if (!hasData.value) {
    return {}
  }

  const scores = props.dimensionScores!
  const dimensions = Object.keys(scores)

  // 构建雷达图的指示器配置
  const indicators = dimensions.map(key => ({
    name: dimensionLabels[key] || key,  // 使用中文映射，如果没有则显示原始 key
    max: 100,  // 最大值为 100
    min: 0,    // 最小值为 0
    // 标签样式配置
    axisLabel: {
      show: true,
      fontSize: 12,
      color: '#666'
    }
  }))

  // 提取分数数组
  const scoreValues = dimensions.map(key => scores[key].score)

  // 构建 ECharts 完整配置
  return {
    // 提示框配置
    tooltip: {
      trigger: 'item',           // 触发方式：数据项触发
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#303133',
        fontSize: 13,
        lineHeight: 20
      },
      // 自定义 tooltip 格式化函数
      formatter: (params: any) => {
        const dataIndex = params.dataIndex
        const dimensionKey = dimensions[dataIndex]
        const dimensionScore = scores[dimensionKey]

        // 构建富文本 HTML
        let html = `<div style="font-weight: 600; margin-bottom: 8px; color: #409EFF;">`
        html += `${dimensionLabels[dimensionKey] || dimensionKey}`
        html += `</div>`
        html += `<div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px;">`
        html += `<span style="color: #909399;">得分：</span>`
        html += `<span style="font-size: 18px; font-weight: bold; color: ${getScoreColor(dimensionScore.score)};">`
        html += `${dimensionScore.score}</span>`
        html += `<span style="color: #909399;">/ 100</span>`
        html += `</div>`

        // 显示详细说明（如果有）
        if (dimensionScore.detail) {
          html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ebeef5; color: #606266; font-size: 12px; line-height: 1.6;">`
          html += `${dimensionScore.detail}`
          html += `</div>`
        }

        return html
      },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 8px;'
    },

    // 雷达图配置
    radar: {
      center: ['50%', '55%'],     // 图表中心位置
      radius: '65%',               // 半径占比
      startAngle: 90,              // 起始角度
      splitNumber: 5,              // 分割段数
      shape: 'polygon',            // 形状：多边形
      axisName: {
        color: '#303133',
        fontSize: 13,
        fontWeight: 500,
        padding: [3, 4]
      },
      splitArea: {
        areaStyle: {
          color: [
            'rgba(64, 158, 255, 0.02)',
            'rgba(64, 158, 255, 0.04)',
            'rgba(64, 158, 255, 0.06)',
            'rgba(64, 158, 255, 0.08)',
            'rgba(64, 158, 255, 0.10)'
          ],
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 10
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(144, 147, 153, 0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(144, 147, 153, 0.2)'
        }
      },
      // 指示器配置
      indicator: indicators
    },

    // 数据系列配置
    series: [
      {
        type: 'radar',             // 图表类型：雷达图
        data: [
          {
            value: scoreValues,    // 各维度分数值
            name: '维度评分',
            symbol: 'circle',       // 数据点形状
            symbolSize: 6,         // 数据点大小
            // 数据区域填充样式（渐变色）
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.45)' },   // 渐变起始色
                  { offset: 1, color: 'rgba(102, 177, 255, 0.25)' }   // 渐变结束色
                ]
              }
            },
            // 线条样式
            lineStyle: {
              width: 2.5,
              color: '#409EFF',
              opacity: 0.9
            },
            // 数据点样式
            itemStyle: {
              color: '#409EFF',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(64, 158, 255, 0.4)',
              shadowBlur: 6,
              shadowOffsetY: 2
            }
          }
        ],
        // 高亮样式
        emphasis: {
          itemStyle: {
            color: '#f56c6c',
            borderColor: '#fff',
            borderWidth: 3,
            shadowColor: 'rgba(245, 108, 108, 0.6)',
            shadowBlur: 12
          },
          areaStyle: {
            color: 'rgba(245, 108, 108, 0.35)'
          },
          lineStyle: {
            width: 3.5,
            color: '#f56c6c'
          }
        },
        // 动画配置
        animation: true,
        animationDuration: 1200,
        animationEasing: 'cubicOut'
      }
    ]
  }
})

// ==================== 方法 ====================

/**
 * 根据分数获取颜色
 * @param score - 分数值（0-100）
 * @returns 对应的颜色字符串
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#67C23A'   // 绿色：优秀
  if (score >= 60) return '#E6A23C'   // 橙色：良好
  if (score >= 40) return '#F56C6C'   // 红色：及格边缘
  return '#909399'                     // 灰色：较差
}

/**
 * 处理图表点击事件
 * @param params - ECharts 事件参数
 */
function handleChartClick(params: any): void {
  if (!params.data || !hasData.value) return

  const dimensions = Object.keys(props.dimensionScores!)
  const clickedDimension = dimensions[params.dataIndex]
  const clickedScore = props.dimensionScores![clickedDimension].score

  // 向父组件发送点击事件
  emit('chartClick', clickedDimension, clickedScore)
}

/**
 * 手动调整图表尺寸
 * 在容器大小变化时调用
 */
function resizeChart(): void {
  if (chartRef.value && chartRef.value.resize) {
    nextTick(() => {
      chartRef.value.resize()
    })
  }
}

// ==================== 监听器 ====================

/**
 * 监听 dimensionScores 变化
 * 当数据更新时重新渲染图表
 */
watch(
  () => props.dimensionScores,
  () => {
    // 使用 nextTick 确保 DOM 更新后再调整尺寸
    nextTick(() => {
      resizeChart()
    })
  },
  { deep: true }
)

// ==================== 生命周期钩子 ====================

onMounted(() => {
  // 组件挂载后初始化图表尺寸
  nextTick(() => {
    resizeChart()
  })

  // 监听窗口 resize 事件，实现响应式布局
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  // 组件卸载前移除事件监听，防止内存泄漏
  window.removeEventListener('resize', handleWindowResize)
})

/**
 * 窗口大小变化事件处理函数
 * 使用防抖优化性能
 */
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleWindowResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer)

  resizeTimer = setTimeout(() => {
    resizeChart()
  }, 200)  // 200ms 防抖延迟
}
</script>

<style scoped>
/* 容器样式 */
.radar-chart-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafbfc;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Loading 状态样式 */
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%);
}

.loading-text {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 空数据提示样式 */
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
}

.empty-icon {
  opacity: 0.25;
  color: #c0c4cc;
}

.empty-text {
  font-size: 15px;
  font-weight: 600;
  color: #909399;
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
  max-width: 280px;
  line-height: 1.6;
}

/* 图表元素过渡动画 */
.radar-chart-container :deep(.v-chart) {
  transition: opacity 0.3s ease;
}

/* 悬停效果 */
.radar-chart-container:hover :deep(.v-chart) {
  opacity: 0.95;
}
</style>
