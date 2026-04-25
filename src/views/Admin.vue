<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Admin Sidebar -->
    <aside class="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
      <div class="p-8 border-b border-indigo-800/50">
        <h2 class="text-2xl font-black tracking-tighter flex items-center gap-2">
          <el-icon><Setting /></el-icon> 管理后台
        </h2>
      </div>
      
      <nav class="flex-1 p-4 space-y-2">
        <div v-for="item in menuItems" :key="item.id">
          <div 
            @click="item.subItems ? (item.expanded = !item.expanded) : (activeMenu = item.id)"
            :class="['flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all', activeMenu === item.id || (item.subItems && item.subItems.some(s => s.id === activeMenu)) ? 'bg-white/10 text-white shadow-inner' : 'text-indigo-300 hover:bg-white/5 hover:text-white']"
          >
            <div class="flex items-center gap-3">
              <el-icon size="18"><component :is="item.icon" /></el-icon>
              <span class="font-medium text-sm">{{ item.name }}</span>
            </div>
            <el-icon v-if="item.subItems" :class="{'rotate-180': item.expanded}" class="transition-transform"><ArrowDown /></el-icon>
          </div>
          
          <div v-if="item.subItems && item.expanded" class="mt-1 ml-9 space-y-1">
            <div 
              v-for="sub in item.subItems" 
              :key="sub.id"
              @click="activeMenu = sub.id"
              :class="['p-2 rounded-lg cursor-pointer text-xs transition-all', activeMenu === sub.id ? 'text-white font-bold' : 'text-indigo-400 hover:text-white']"
            >
              {{ sub.name }}
            </div>
          </div>
        </div>
      </nav>
      
      <div class="p-4 border-t border-indigo-800/50">
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer text-indigo-300 hover:text-white transition-colors" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span class="text-sm">退出登录</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
        <h1 class="text-lg font-bold text-gray-800">{{ currentMenuName }}</h1>
        <div class="flex items-center gap-4">
          <el-button type="primary" plain size="small" icon="Plus" @click="handleAdd">新增配置</el-button>
          <el-avatar :size="32" src="https://picsum.photos/seed/admin/200" />
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-8 bg-gray-50/50">
        <!-- AI Model Management -->
        <div v-if="activeMenu === 'models'" class="space-y-6">
          <el-row :gutter="20">
            <el-col :span="8" v-for="model in modelStore.models" :key="model.id">
              <el-card class="model-card border-none shadow-md rounded-2xl hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <el-icon size="20"><Cpu /></el-icon>
                    </div>
                    <div>
                      <h3 class="font-bold text-gray-800">{{ model.name }}</h3>
                      <p class="text-xs text-gray-400">{{ model.provider }}</p>
                    </div>
                  </div>
                  <el-tag :type="model.status === 'active' ? 'success' : 'info'" size="small" round effect="light">
                    {{ model.status === 'active' ? '已启用' : '未启用' }}
                  </el-tag>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-400">API Key:</span>
                    <span class="font-mono text-gray-600">{{ maskApiKey(model.apiKey) }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-400">调用次数:</span>
                    <span class="font-bold text-gray-700">{{ model.usageCount?.toLocaleString() || 0 }}</span>
                  </div>
                </div>
                
                <div class="flex gap-2 border-t border-gray-100 pt-4">
                  <el-button v-if="model.status !== 'active'" size="small" plain type="success" @click="handleActivateModel(model.id)">启用</el-button>
                  <el-button v-else size="small" plain type="warning" @click="handleActivateModel(model.id)">禁用</el-button>
                  <el-button size="small" icon="Edit" @click="handleEdit(model)">编辑</el-button>
                  <el-button size="small" type="danger" plain icon="Delete" @click="handleRemoveModel(model.id)">删除</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- Knowledge Base Management (Standard Rules) -->
        <div v-if="activeMenu === 'knowledge_standards'" class="space-y-8">
          <!-- Default Categories -->
          <section>
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <el-icon><Lock /></el-icon> 系统默认分组 (管理员管控)
            </h3>
            <div class="flex gap-4 overflow-x-auto pb-2">
              <el-card 
                v-for="cat in knowledgeStore.defaultCategories" 
                :key="cat.id"
                class="min-w-[220px] border-none shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-all relative group"
                :class="{'ring-2 ring-blue-500': selectedAdminCategory === cat.id}"
                @click="selectedAdminCategory = cat.id"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-gray-700">{{ cat.name }}</span>
                  <el-button size="small" link type="danger" icon="Delete" @click.stop="handleRemoveCategory(cat.id)"></el-button>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ cat.files.length }} 个文件</p>
              </el-card>
              <el-button class="min-w-[120px] rounded-xl border-dashed" icon="Plus" @click="openAddCategory('default')">添加默认分类</el-button>
            </div>
          </section>

          <!-- User Defined Categories -->
          <section>
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <el-icon><User /></el-icon> 用户自定义分组 (用户归档)
            </h3>
            <div class="flex gap-4 overflow-x-auto pb-2">
              <el-card 
                v-for="cat in knowledgeStore.userCategories" 
                :key="cat.id"
                class="min-w-[220px] border-none shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-all"
                :class="{'ring-2 ring-blue-500': selectedAdminCategory === cat.id}"
                @click="selectedAdminCategory = cat.id"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-gray-700">{{ cat.name }}</span>
                  <el-button size="small" link type="danger" icon="Delete" @click.stop="handleRemoveCategory(cat.id)"></el-button>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ cat.files.length }} 个文件</p>
              </el-card>
              <el-button class="min-w-[120px] rounded-xl border-dashed" icon="Plus" @click="openAddCategory('user')">添加用户分类</el-button>
            </div>
          </section>

          <!-- File List for Selected Category -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 class="font-bold text-gray-700">标准文件列表 - {{ currentCategoryName }}</h3>
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleAdminFileUpload"
              >
                <el-button type="primary" size="small" icon="Upload">上传标准</el-button>
              </el-upload>
            </div>
            <el-table :data="currentCategoryFiles" style="width: 100%" class="custom-table">
              <el-table-column label="标准名称" min-width="200">
                <template #default="{ row }">
                  <div class="flex items-center gap-3">
                    <el-icon size="20" class="text-blue-500"><Document /></el-icon>
                    <span class="font-medium text-gray-700">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="关联基准" width="150">
                <template #default>
                  <el-button link size="small" icon="Connection">关联基准</el-button>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" active-color="#4ade80" @change="toggleFileStatus(row)" />
                </template>
              </el-table-column>
              <el-table-column label="最后更新" width="150">
                <template #default>
                  <span class="text-xs text-gray-400">2024-05-15</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">预览</el-button>
                  <el-button size="small" text type="danger" @click="removeFile(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- Smell Library Management -->
        <div v-if="activeMenu === 'knowledge_smells'" class="space-y-8">
          <!-- Stats Dashboard -->
          <div class="grid grid-cols-3 gap-4">
            <el-card class="border-none shadow-sm rounded-2xl">
              <p class="text-xs text-gray-400 font-bold uppercase mb-1">异味规则总数</p>
              <p class="text-2xl font-black text-orange-600">{{ smellStore.categories.reduce((acc: number, c: any) => acc + c.files.length, 0) }}</p>
            </el-card>
            <el-card class="border-none shadow-sm rounded-2xl">
              <p class="text-xs text-gray-400 font-bold uppercase mb-1">已启用规则</p>
              <p class="text-2xl font-black text-green-600">{{ smellStore.categories.reduce((acc: number, c: any) => acc + c.files.filter((f: any) => f.status === 'enabled').length, 0) }}</p>
            </el-card>
            <el-card class="border-none shadow-sm rounded-2xl">
              <p class="text-xs text-gray-400 font-bold uppercase mb-1">异味分类数</p>
              <p class="text-2xl font-black text-gray-800">{{ smellStore.categories.length }}</p>
            </el-card>
          </div>

          <!-- Default Smell Categories -->
          <section>
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <el-icon><Lock /></el-icon> 系统默认异味分组
            </h3>
            <div class="flex gap-4 overflow-x-auto pb-2">
              <el-card 
                v-for="cat in smellStore.defaultCategories" 
                :key="cat.id"
                class="min-w-[220px] border-none shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-all relative group"
                :class="{'ring-2 ring-orange-500': selectedSmellCategory === cat.id}"
                @click="selectedSmellCategory = cat.id"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-gray-700">{{ cat.name }}</span>
                  <el-button size="small" link type="danger" icon="Delete" @click.stop="handleRemoveSmellCategory(cat.id)"></el-button>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  {{ cat.files.length }} 条规则 | 
                  <span class="text-red-400">{{ cat.files.filter((f: any) => f.priority === 'high').length }}高</span>
                  <span class="text-yellow-400">{{ cat.files.filter((f: any) => f.priority === 'medium').length }}中</span>
                  <span class="text-green-400">{{ cat.files.filter((f: any) => f.priority === 'low').length }}低</span>
                </p>
              </el-card>
              <el-button class="min-w-[120px] rounded-xl border-dashed" icon="Plus" @click="openAddCategory('default')">添加默认分类</el-button>
            </div>
          </section>



          <!-- Smell Rules File List -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 class="font-bold text-gray-700">异味规则列表 - {{ currentSmellCategoryName }}</h3>
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleSmellFileUpload"
              >
                <el-button type="warning" size="small" icon="Upload">上传异味规则</el-button>
              </el-upload>
            </div>
            <el-table :data="currentSmellCategoryFiles" style="width: 100%" class="custom-table">
              <el-table-column label="异味规则名称" min-width="200">
                <template #default="{ row }">
                  <div class="flex items-center gap-3">
                    <el-icon size="20" class="text-orange-500"><Warning /></el-icon>
                    <span class="font-medium text-gray-700">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" active-color="#f97316" @change="toggleSmellFileStatus(row)" />
                </template>
              </el-table-column>
              <el-table-column label="优先级" width="160">
                <template #default="{ row }">
                  <el-select 
                    v-model="row.priority" 
                    size="small" 
                    @change="handlePriorityChange(row)"
                  >
                    <el-option label="高 (严重)" value="high">
                      <span class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span> 高 (严重)
                      </span>
                    </el-option>
                    <el-option label="中 (一般)" value="medium">
                      <span class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> 中 (一般)
                      </span>
                    </el-option>
                    <el-option label="低 (轻微)" value="low">
                      <span class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span> 低 (轻微)
                      </span>
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">预览</el-button>
                  <el-button size="small" text type="danger" @click="removeSmellFile(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- Baseline Requirements Management -->
        <div v-if="activeMenu === 'knowledge_baselines'" class="space-y-8">
          <!-- Stats Dashboard -->
          <div class="grid grid-cols-4 gap-4">
            <el-card v-for="(stat, i) in baselineStats" :key="i" class="border-none shadow-sm rounded-2xl">
              <p class="text-xs text-gray-400 font-bold uppercase mb-1">{{ stat.label }}</p>
              <p class="text-2xl font-black text-gray-800">{{ stat.value }}</p>
            </el-card>
          </div>

          <!-- Baseline Categories -->
          <section>
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <el-icon><Collection /></el-icon> 基准需求分类
            </h3>
            <div class="flex gap-4 overflow-x-auto pb-2">
              <el-card 
                v-for="cat in baselineStore.categories" 
                :key="cat.id"
                class="min-w-[220px] border-none shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-all"
                :class="{'ring-2 ring-blue-500': selectedBaselineCategory === cat.id}"
                @click="selectedBaselineCategory = cat.id"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-gray-700">{{ cat.name }}</span>
                  <el-tag size="small" :type="cat.type === 'default' ? 'primary' : 'info'">{{ cat.type === 'default' ? '系统' : '用户' }}</el-tag>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ cat.files.length }} 个文档</p>
              </el-card>
              <el-button class="min-w-[120px] rounded-xl border-dashed" icon="Plus">新增分类</el-button>
            </div>
          </section>

          <!-- Baseline File List -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 class="font-bold text-gray-700">基准文档列表 - {{ currentBaselineCategoryName }}</h3>
            </div>
            <el-table :data="currentBaselineFiles" style="width: 100%" class="custom-table">
              <el-table-column label="需求文档名称" min-width="200">
                <template #default="{ row }">
                  <div class="flex items-center gap-3">
                    <el-icon size="20" class="text-indigo-500"><DocumentChecked /></el-icon>
                    <div>
                      <p class="font-medium text-gray-700">{{ row.name }}</p>
                      <p class="text-[10px] text-gray-400">版本: {{ row.version }}</p>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="归档人" width="120" prop="author" />
              <el-table-column label="共享范围" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.scope === 'public' ? 'success' : 'info'">{{ row.scope === 'public' ? '全平台公开' : '私有' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="引用次数" width="100" prop="refCount" align="center" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-switch 
                    :model-value="row.status === 'enabled'" 
                    active-color="#4ade80" 
                    @change="(val: boolean) => baselineStore.updateStatus(row.id, val ? 'enabled' : 'disabled')" 
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" align="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">预览</el-button>
                  <el-button size="small" text type="primary">编辑</el-button>
                  <el-button size="small" text type="danger" @click="baselineStore.removeBaseline(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- System Settings -->
        <div v-if="activeMenu === 'settings'" class="max-w-4xl space-y-8">
          <el-card class="border-none shadow-sm rounded-2xl">
            <template #header>
              <div class="flex items-center gap-2 font-bold text-gray-800">
                <el-icon><ChatDotRound /></el-icon> 系统提示词 (System Prompt)
              </div>
            </template>
            <el-input
              v-model="modelStore.prompts.system"
              type="textarea"
              :rows="5"
              placeholder="配置 AI 评估时的核心指令..."
            />
            <div class="mt-4 flex justify-end">
              <el-button type="primary" @click="savePrompt('system')">保存配置</el-button>
            </div>
          </el-card>

          <el-card class="border-none shadow-sm rounded-2xl">
            <template #header>
              <div class="flex items-center gap-2 font-bold text-gray-800">
                <el-icon><Memo /></el-icon> 评估标准格式
              </div>
            </template>
            <el-input
              v-model="modelStore.prompts.format"
              type="textarea"
              :rows="5"
              placeholder="定义评估报告的输出结构和评分标准..."
            />
            <div class="mt-4 flex justify-end">
              <el-button type="primary" @click="savePrompt('format')">保存配置</el-button>
            </div>
          </el-card>
        </div>
      </div>
    </main>

    <!-- Add Model Dialog -->
    <el-dialog v-model="showAddDialog" title="新增大语言模型" width="500px">
      <el-form :model="newModel" label-position="top">
        <el-form-item label="模型名称">
          <el-input v-model="newModel.name" placeholder="如: GPT-4o, Claude 3.5" />
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="newModel.provider" class="w-full">
            <el-option label="OpenAI" value="OpenAI" />
            <el-option label="Anthropic" value="Anthropic" />
            <el-option label="Google" value="Google" />
            <el-option label="Zhipu AI" value="Zhipu" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="newModel.apiKey" type="password" show-password />
        </el-form-item>
        <el-form-item label="Base URL (可选)">
          <el-input v-model="newModel.baseUrl" placeholder="https://api.openai.com/v1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeAddDialog">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确定</el-button>
      </template>
    </el-dialog>
    <!-- Edit Model Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑模型配置" width="500px">
      <el-form :model="editingModel" label-position="top">
        <el-form-item label="模型名称">
          <el-input v-model="editingModel.name" placeholder="如: GPT-4o, Claude 3.5" />
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="editingModel.provider" class="w-full">
            <el-option label="OpenAI" value="OpenAI" />
            <el-option label="Anthropic" value="Anthropic" />
            <el-option label="Google" value="Google" />
            <el-option label="Zhipu AI" value="Zhipu" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="editingModel.apiKey" type="password" show-password placeholder="请输入 API Key" />
        </el-form-item>
        <el-form-item label="Base URL (可选)">
          <el-input v-model="editingModel.baseUrl" placeholder="https://api.openai.com/v1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- Add Category Dialog -->
    <el-dialog v-model="showAddCategoryDialog" title="新增知识库分类" width="400px">
      <el-form label-position="top">
        <el-form-item label="分类名称">
          <el-input v-model="newCategoryName" placeholder="如: 行业标准, 内部规范" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeAddCategory">取消</el-button>
        <el-button type="primary" @click="confirmAddCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useModelStore, useKnowledgeStore, useBaselineStore, useSmellStore } from '@/store';
import { 
  Setting, Cpu, Files, ChatDotRound, Memo, 
  SwitchButton, Plus, Edit, Delete, Document,
  Lock, User, Upload, ArrowDown, Collection,
  DocumentChecked, Connection, Warning
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const modelStore = useModelStore();
const knowledgeStore = useKnowledgeStore();
const baselineStore = useBaselineStore();
const smellStore = useSmellStore();

const activeMenu = ref('models');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showAddCategoryDialog = ref(false);
const newCategoryName = ref('');
const newCategoryType = ref<'default' | 'user'>('default');
const selectedAdminCategory = ref(knowledgeStore.categories[0]?.id);
const selectedBaselineCategory = ref(baselineStore.categories[0]?.id);
const selectedSmellCategory = ref(smellStore.categories[0]?.id);

const editingModel = reactive({
  id: 0,
  name: '',
  provider: '',
  apiKey: '',
  status: 'available',
  baseUrl: ''
});

onMounted(async () => {
  await Promise.all([
    modelStore.fetchModels(),
    baselineStore.fetchBaselines(),
    knowledgeStore.fetchStandards(),
    smellStore.fetchSmells(),
  ]);
});

const menuItems = reactive([
  { 
    id: 'system', 
    name: '系统配置', 
    icon: 'Setting',
    expanded: true,
    subItems: [
      { id: 'models', name: '模型管理' },
      { id: 'settings', name: '系统提示词' },
    ]
  },
  { 
    id: 'knowledge', 
    name: '知识库维护', 
    icon: 'Files',
    expanded: true,
    subItems: [
      { id: 'knowledge_standards', name: '标准规则库' },
      { id: 'knowledge_smells', name: '异味需求库' },
      { id: 'knowledge_baselines', name: '基准需求库' },
    ]
  },
]);

const currentMenuName = computed(() => {
  if (activeMenu.value === 'knowledge_standards') return '标准规则库';
  if (activeMenu.value === 'knowledge_smells') return '异味需求库';
  if (activeMenu.value === 'knowledge_baselines') return '基准需求库';
  return menuItems.find(i => i.id === activeMenu.value)?.name || '';
});

const currentCategoryName = computed(() => {
  return knowledgeStore.categories.find(c => c.id === selectedAdminCategory.value)?.name || '未选择';
});

const currentCategoryFiles = computed(() => {
  const cat = knowledgeStore.categories.find(c => c.id === selectedAdminCategory.value);
  return cat ? cat.files.map(f => ({ ...f, enabled: f.status === 'enabled' })) : [];
});

const currentBaselineCategoryName = computed(() => {
  return baselineStore.categories.find(c => c.id === selectedBaselineCategory.value)?.name || '未选择';
});

const currentBaselineFiles = computed(() => {
  const cat = baselineStore.categories.find(c => c.id === selectedBaselineCategory.value);
  return cat ? cat.files : [];
});

const currentSmellCategoryName = computed(() => {
  return smellStore.categories.find(c => c.id === selectedSmellCategory.value)?.name || '未选择';
});

const currentSmellCategoryFiles = computed(() => {
  const cat = smellStore.categories.find(c => c.id === selectedSmellCategory.value);
  return cat ? cat.files.map(f => ({ ...f, enabled: f.status === 'enabled', priority: f.priority || 'medium' })) : [];
});

const baselineStats = computed(() => [
  { label: '总归档文档数', value: baselineStore.allFiles.length },
  { label: '总引用次数', value: baselineStore.allFiles.reduce((acc, f) => acc + f.refCount, 0) },
  { label: '本月新增', value: 12 },
  { label: '全平台公开', value: baselineStore.allFiles.filter(f => f.scope === 'public').length },
]);

const maskApiKey = (key: string) => {
  if (!key) return '未配置';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
};

const allFiles = computed(() => {
  return knowledgeStore.categories.flatMap(cat => 
    cat.files.map(f => ({
      ...f,
      categoryName: cat.name,
      enabled: f.status === 'enabled'
    }))
  );
});

const newModel = reactive({
  name: '',
  provider: 'OpenAI',
  apiKey: '',
  baseUrl: ''
});

const handleAdd = () => {
  if (activeMenu.value === 'models') {
    showAddDialog.value = true;
  } else if (activeMenu.value === 'knowledge') {
    openAddCategory('default');
  }
};

const openAddCategory = (type: 'default' | 'user') => {
  newCategoryType.value = type;
  showAddCategoryDialog.value = true;
};

const closeAddCategory = () => {
  newCategoryName.value = '';
  showAddCategoryDialog.value = false;
};

const confirmAddCategory = async () => {
  if (!newCategoryName.value) return;
  try {
    if (activeMenu.value === 'knowledge_smells') {
      await smellStore.addCategory(newCategoryName.value, newCategoryType.value);
    } else {
      await knowledgeStore.addCategory(newCategoryName.value, newCategoryType.value);
    }
    closeAddCategory();
    ElMessage.success('分类添加成功');
  } catch (e: any) {
    ElMessage.error(`添加失败: ${e.message || '未知错误'}`);
  }
};

const handleRemoveCategory = (id: number) => {
  ElMessageBox.confirm('确定要删除此分类及其所有标准文档吗？', '警告', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await knowledgeStore.removeCategory(id);
      if (selectedAdminCategory.value === id) {
        selectedAdminCategory.value = knowledgeStore.categories[0]?.id;
      }
      ElMessage.success('分类已删除');
    } catch (e: any) {
      ElMessage.error(`删除失败: ${e.message || '未知错误'}`);
    }
  }).catch(() => {});
};

const handleAdminFileUpload = async (file: any) => {
  if (!selectedAdminCategory.value) {
    ElMessage.warning('请先选择一个分类');
    return;
  }
  try {
    await knowledgeStore.uploadStandard(selectedAdminCategory.value, file.raw);
    ElMessage.success(`已上传文件 ${file.name} 到分类 ${currentCategoryName.value}`);
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};

const toggleFileStatus = async (file: any) => {
  const newStatus = file.enabled ? 'enabled' : 'disabled';
  try {
    await knowledgeStore.updateFileStatus(selectedAdminCategory.value, file.id, newStatus);
    ElMessage.success(`文档 "${file.name}" 状态已更新为: ${newStatus === 'enabled' ? '开启' : '关闭'}`);
  } catch (e: any) {
    // Revert the toggle on failure
    file.enabled = !file.enabled;
    ElMessage.error(`状态更新失败: ${e.message || '未知错误'}`);
  }
};

const removeFile = (file: any) => {
  ElMessageBox.confirm(`确定要删除标准文档 "${file.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await knowledgeStore.removeFile(selectedAdminCategory.value, file.id);
      ElMessage.success('文件已删除');
    } catch (e: any) {
      ElMessage.error(`删除失败: ${e.message || '未知错误'}`);
    }
  }).catch(() => {});
};

const handleSmellFileUpload = async (file: any) => {
  if (!selectedSmellCategory.value) {
    ElMessage.warning('请先选择一个异味分类');
    return;
  }
  try {
    await smellStore.uploadSmellFile(selectedSmellCategory.value, file.raw);
    ElMessage.success(`已上传异味规则 ${file.name}`);
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};

const toggleSmellFileStatus = async (file: any) => {
  const newStatus = file.enabled ? 'enabled' : 'disabled';
  try {
    await smellStore.updateFileStatus(selectedSmellCategory.value, file.id, newStatus);
    ElMessage.success(`规则 "${file.name}" 状态已更新为: ${newStatus === 'enabled' ? '开启' : '关闭'}`);
  } catch (e: any) {
    file.enabled = !file.enabled;
    ElMessage.error(`状态更新失败: ${e.message || '未知错误'}`);
  }
};

const handlePriorityChange = async (file: any) => {
  try {
    await smellStore.updateFilePriority(selectedSmellCategory.value, file.id, file.priority);
    const label = file.priority === 'high' ? '高' : file.priority === 'medium' ? '中' : '低';
    ElMessage.success(`规则 "${file.name}" 优先级已更新为: ${label}`);
  } catch (e: any) {
    ElMessage.error(`优先级更新失败: ${e.message || '未知错误'}`);
  }
};

const removeSmellFile = (file: any) => {
  ElMessageBox.confirm(`确定要删除异味规则 "${file.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await smellStore.removeFile(selectedSmellCategory.value, file.id);
      ElMessage.success('规则已删除');
    } catch (e: any) {
      ElMessage.error(`删除失败: ${e.message || '未知错误'}`);
    }
  }).catch(() => {});
};

const handleRemoveSmellCategory = (id: number) => {
  ElMessageBox.confirm('确定要删除此分类及其所有异味规则吗？', '警告', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await smellStore.removeCategory(id);
      if (selectedSmellCategory.value === id) {
        selectedSmellCategory.value = smellStore.categories[0]?.id;
      }
      ElMessage.success('分类已删除');
    } catch (e: any) {
      ElMessage.error(`删除失败: ${e.message || '未知错误'}`);
    }
  }).catch(() => {});
};

const closeAddDialog = () => {
  newModel.name = '';
  newModel.apiKey = '';
  newModel.baseUrl = '';
  newModel.provider = 'OpenAI';
  showAddDialog.value = false;
};

const confirmAdd = async () => {
  try {
    await modelStore.addModel({ ...newModel });
    closeAddDialog();
    ElMessage.success('模型添加成功');
  } catch (err) {
    ElMessage.error('模型添加失败');
  }
};

const handleEdit = (model: any) => {
  editingModel.id = model.id;
  editingModel.name = model.name;
  editingModel.provider = model.provider;
  editingModel.apiKey = model.apiKey;
  editingModel.baseUrl = model.baseUrl || '';
  showEditDialog.value = true;
};

const confirmEdit = async () => {
  try {
    await modelStore.updateModel({ ...editingModel });
    showEditDialog.value = false;
    ElMessage.success('模型配置已更新');
  } catch (err) {
    ElMessage.error('模型配置更新失败');
  }
};

const handleActivateModel = async (id: number) => {
  try {
    await modelStore.activateModel(id);
    ElMessage.success('模型状态已更新');
  } catch (err) {
    ElMessage.error('模型状态更新失败');
  }
};

const handleRemoveModel = async (id: number) => {
  try {
    await modelStore.removeModel(id);
    ElMessage.success('已删除模型');
  } catch (err) {
    ElMessage.error('删除模型失败');
  }
};

const savePrompt = async (type: 'system' | 'format') => {
  try {
    await modelStore.savePrompt(type);
    ElMessage.success('配置已成功保存至服务器');
  } catch (err: any) {
    ElMessage.error(`保存失败: ${err.message || '未知错误'}`);
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.model-card {
  border: 1px solid #f3f4f6;
}
.custom-table :deep(.el-table__header) {
  background-color: #f9fafb;
}
.custom-table :deep(th.el-table__cell) {
  background-color: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
