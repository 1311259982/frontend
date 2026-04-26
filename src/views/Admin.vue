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

        <!-- System Settings - 提示词配置管理（6个配置项） -->
        <div v-if="activeMenu === 'settings'" class="max-w-4xl space-y-8">
          <!-- ==================== 分组1: 核心评估指令 ==================== -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <el-icon><Cpu /></el-icon> 核心评估指令
            </h3>

            <el-card v-for="config in corePromptConfigs" :key="config.name" class="border-none shadow-sm rounded-2xl">
              <template #header>
                <div class="flex items-center gap-2 font-bold text-gray-800">
                  <el-icon><component :is="config.icon" /></el-icon>
                  {{ config.label }}
                </div>
              </template>
              <el-input
                v-model="promptContents[config.name]"
                type="textarea"
                :rows="config.rows || 5"
                :placeholder="config.placeholder"
              />
              <div class="mt-4 flex justify-end">
                <el-button type="primary" @click="savePrompt(config.name)">保存配置</el-button>
              </div>
            </el-card>
          </div>

          <!-- ==================== 分组2: 上下文说明 ==================== -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <el-icon><Document /></el-icon> 上下文说明
            </h3>

            <el-card v-for="config in contextPromptConfigs" :key="config.name" class="border-none shadow-sm rounded-2xl">
              <template #header>
                <div class="flex items-center gap-2 font-bold text-gray-800">
                  <el-icon><component :is="config.icon" /></el-icon>
                  {{ config.label }}
                </div>
              </template>
              <el-input
                v-model="promptContents[config.name]"
                type="textarea"
                :rows="config.rows || 4"
                :placeholder="config.placeholder"
              />
              <div class="mt-4 flex justify-end">
                <el-button type="primary" @click="savePrompt(config.name)">保存配置</el-button>
              </div>
            </el-card>
          </div>

          <!-- ==================== 分组3: 规则与输出控制 ==================== -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <el-icon><Setting /></el-icon> 规则与输出控制
            </h3>

            <!-- 5.2 异味扣分规则可视化配置面板 -->
            <el-card class="border-none shadow-sm rounded-2xl">
              <template #header>
                <div class="flex items-center gap-2 font-bold text-gray-800">
                  <el-icon><Warning /></el-icon> 异味扣分规则配置
                  <el-tag size="small" type="warning" effect="plain">数值可调</el-tag>
                </div>
              </template>

              <div class="space-y-4">
                <!-- 高优先级 -->
                <div class="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <span class="w-20 text-sm font-bold text-red-700">高优先级</span>
                  <span class="text-xs text-gray-500">严重</span>
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-sm">扣</span>
                    <el-input-number v-model="deductionConfig.high_min" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">-</span>
                    <el-input-number v-model="deductionConfig.high_max" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">分</span>
                  </div>
                </div>

                <!-- 中优先级 -->
                <div class="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <span class="w-20 text-sm font-bold text-yellow-700">中优先级</span>
                  <span class="text-xs text-gray-500">一般</span>
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-sm">扣</span>
                    <el-input-number v-model="deductionConfig.medium_min" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">-</span>
                    <el-input-number v-model="deductionConfig.medium_max" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">分</span>
                  </div>
                </div>

                <!-- 低优先级 -->
                <div class="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                  <span class="w-20 text-sm font-bold text-green-700">低优先级</span>
                  <span class="text-xs text-gray-500">轻微</span>
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-sm">扣</span>
                    <el-input-number v-model="deductionConfig.low_min" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">-</span>
                    <el-input-number v-model="deductionConfig.low_max" :min="0" :max="100" size="small" controls-position="right" />
                    <span class="text-sm">分</span>
                  </div>
                </div>

                <!-- 预览区 -->
                <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p class="text-xs font-bold text-gray-500 mb-2">预览生成的文本：</p>
                  <pre class="text-xs text-gray-600 whitespace-pre-wrap font-mono">{{ deductionPreview }}</pre>
                </div>
              </div>

              <div class="mt-4 flex justify-end">
                <el-button type="warning" @click="saveSmellDeduction">保存扣分规则</el-button>
              </div>
            </el-card>

            <!-- 5.3 输出格式结构化字段编辑器 -->
            <el-card class="border-none shadow-sm rounded-2xl">
              <template #header>
                <div class="flex items-center gap-2 font-bold text-gray-800">
                  <el-icon><Memo /></el-icon> 评估输出格式
                  <el-tag size="small" type="info" effect="plain">结构锁定</el-tag>
                </div>
              </template>

              <div class="space-y-3">
                <div v-for="(field, key) in outputFields" :key="key"
                     class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <!-- 左侧：字段名（只读） -->
                  <div class="w-44 flex-shrink-0">
                    <code class="text-sm font-mono font-bold text-blue-600">"{{ key }}"</code>
                    <p class="text-xs text-gray-400 mt-1">{{ field.type }}</p>
                  </div>

                  <!-- 右侧：描述编辑 -->
                  <div class="flex-1">
                    <label class="text-xs text-gray-500 mb-1 block">字段描述（用户可见）</label>
                    <el-input
                      v-model="fieldDescriptions[key]"
                      placeholder="输入该字段的描述文本..."
                      size="small"
                    />
                  </div>
                </div>
              </div>

              <div class="mt-4 flex justify-end">
                <el-button type="primary" @click="saveOutputFormat">保存格式配置</el-button>
              </div>
            </el-card>
          </div>
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
  DocumentChecked, Connection, Warning, DataAnalysis
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { updatePrompt, getPrompts } from '@/services/api';

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

  // 加载所有6个提示词配置项
  try {
    const promptsData = await getPrompts();
    if (promptsData && Array.isArray(promptsData)) {
      promptsData.forEach((p: any) => {
        // 支持所有6个配置项：system, dimension_defs, smell_rules_intro, baseline_intro, smell_deduction, output_format
        if (p.name && p.content !== undefined) {
          promptContents[p.name] = p.content;
        }
      });
      console.log('[Admin] 已加载所有提示词配置项');
    }
  } catch (error) {
    console.error('[Admin] 加载提示词配置失败:', error);
  }
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

const savePrompt = async (name: string) => {
  try {
    const content = promptContents[name];
    await updatePrompt(name, content);
    ElMessage.success(`"${name}" 配置已成功保存至服务器`);
  } catch (err: any) {
    ElMessage.error(`保存失败: ${err.message || '未知错误'}`);
  }
};

// ==================== 5.2 异味扣分规则配置数据 ====================

/** 扣分规则数值配置 */
const deductionConfig = reactive({
  high_min: 5,
  high_max: 10,
  medium_min: 3,
  medium_max: 5,
  low_min: 1,
  low_max: 3
});

/** 扣分规则预览文本（实时计算） */
const deductionPreview = computed(() => {
  return `代码异味扣分规则：
- 【高优先级/严重】：违反此规则应扣除较多分数（建议扣${deductionConfig.high_min}-${deductionConfig.high_max}分）
- 【中优先级/一般】：违反此规则应扣除中等分数（建议扣${deductionConfig.medium_min}-${deductionConfig.medium_max}分）
- 【低优先级/轻微】：违反此规则应扣除较少分数（建议扣${deductionConfig.low_min}-${deductionConfig.low_max}分）

注意：
1. 同一类异味不重复扣分，取最高级别
2. 总扣分不超过该项满分值
3. 具体扣分由评估人员根据实际情况在建议范围内确定`;
});

/** 保存扣分规则 */
const saveSmellDeduction = async () => {
  try {
    // 将数值配置转换为文本格式后保存
    const content = deductionPreview.value;
    await updatePrompt('smell_deduction', content);
    ElMessage.success('扣分规则配置已保存');
  } catch (err: any) {
    ElMessage.error(`保存失败: ${err.message || '未知错误'}`);
  }
};

// ==================== 5.3 输出格式字段编辑器数据 ====================

/** 输出格式字段定义（只读结构） */
const outputFields = {
  total_score: { type: 'integer (0-100)' },
  dimension_scores: { type: 'object (维度评分)' },
  issues: { type: 'array (string[])' },
  suggestions: { type: 'string (100-300字)' }
};

/** 字段描述（可编辑） */
const fieldDescriptions = reactive<Record<string, string>>({
  total_score: '<0-100整数，综合可测试性得分>',
  dimension_scores: '{维度名: {score, detail}}',
  issues: '[问题点列表]',
  suggestions: '<整体优化建议>'
});

/** 保存输出格式配置 */
const saveOutputFormat = async () => {
  try {
    const content = `请严格按照以下 JSON 格式输出评估结果，不要添加任何额外说明：
{
  "total_score": ${fieldDescriptions.total_score},
  "dimension_scores": {
    "<维度英文名>": {"score": <0-100整数>, "detail": "<该维度的具体评价>"}
  },
  "issues": [
    ${fieldDescriptions.issues}
  ],
  "suggestions": ${fieldDescriptions.suggestions}
}`;
    await updatePrompt('output_format', content);
    ElMessage.success('输出格式配置已保存');
  } catch (err: any) {
    ElMessage.error(`保存失败: ${err.message || '未知错误'}`);
  }
};

// ==================== 普通文本配置项定义 ====================

/** 核心评估指令组配置 */
const corePromptConfigs = [
  {
    name: 'system',
    label: '系统角色定义 (System Prompt)',
    icon: 'ChatDotRound',
    rows: 6,
    placeholder: '配置 AI 评估专家的角色定义和核心指令...'
  },
  {
    name: 'dimension_defs',
    label: '维度定义 (Dimension Definitions)',
    icon: 'DataAnalysis',
    rows: 5,
    placeholder: '定义各评估维度的具体含义和评分标准...'
  }
];

/** 上下文说明组配置 */
const contextPromptConfigs = [
  {
    name: 'smell_rules_intro',
    label: '异味规则说明 (Smell Rules Intro)',
    icon: 'Warning',
    rows: 4,
    placeholder: '说明代码异味规则的背景和使用方式...'
  },
  {
    name: 'baseline_intro',
    label: '基线说明 (Baseline Introduction)',
    icon: 'DocumentChecked',
    rows: 4,
    placeholder: '说明基准需求的作用和引用机制...'
  }
];

// ==================== 提示词内容存储（6个配置项） ====================

/** 所有提示词内容的响应式存储 */
const promptContents = reactive<Record<string, string>>({
  system: '',
  dimension_defs: '',
  smell_rules_intro: '',
  baseline_intro: '',
  smell_deduction: '',
  output_format: ''
});

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
