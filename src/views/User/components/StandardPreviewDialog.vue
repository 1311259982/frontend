<template>
  <el-dialog v-model="visible" title="标准全文预览" width="800px" rounded-3xl>
    <div class="prose max-w-none p-4 bg-gray-50 rounded-2xl max-h-[500px] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">{{ content.name }}</h3>
      <div class="text-gray-600 leading-relaxed">
        此处为标准的详细解析内容。在实际系统中，这里将展示从知识库中提取的文本、规则条目以及具体的评估准则。
        <br><br>
        <b>核心规则：</b>
        <ul class="list-disc list-inside mt-2">
          <li>需求必须具备唯一标识符。</li>
          <li>需求描述不得包含模糊词汇（如：可能、大概、尽量）。</li>
          <li>每个功能性需求必须对应至少一个测试用例。</li>
          <li>必须定义明确的输入数据类型及边界范围。</li>
        </ul>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue: boolean, content: any }>();
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});
</script>
