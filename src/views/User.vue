<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
    <!-- Left Sidebar: Standards & Files (20%) -->
    <aside 
      :class="['bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 ease-in-out', isSidebarCollapsed ? 'w-12' : 'w-[20%]']"
    >
      <template v-if="!isSidebarCollapsed">
        <!-- Sidebar Header -->
        <div class="p-5 border-b border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <el-icon><Files /></el-icon> 参考文档
            </h2>
            <el-button link @click="isSidebarCollapsed = true">
              <el-icon><Fold /></el-icon>
            </el-button>
          </div>

          <!-- Tab Switcher -->
          <div class="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button 
              class="flex-1 py-1.5 text-xs font-bold rounded-md transition-all bg-white shadow-sm text-blue-600"
            >
              评估标准
            </button>
          </div>
          
          <!-- Search Standards -->
          <el-input
            v-model="knowledgeStore.searchQuery"
            placeholder="搜索标准名称..."
            prefix-icon="Search"
            size="small"
            clearable
            class="mb-4"
          />

          <!-- Selected Standards Summary (Fixed at top) -->
          <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">已选文档</span>
              <el-tag size="small" type="primary" effect="dark" round>{{ knowledgeStore.allSelectedFiles.length }}</el-tag>
            </div>
            <div v-if="knowledgeStore.allSelectedFiles.length === 0" class="text-[10px] text-red-400">
              请至少勾选 1 项评估标准
            </div>
            <div v-else class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              <el-tag 
                v-for="file in knowledgeStore.allSelectedFiles" 
                :key="file.id"
                size="small"
                closable
                @close="knowledgeStore.removeSelected(file.id, file.isUser)"
                class="max-w-full truncate"
              >
                {{ file.name }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <!-- Standards List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Default Categories -->
            <div v-for="category in knowledgeStore.enabledDefaultCategories" :key="category.id" class="space-y-2">
              <div 
                class="flex items-center justify-between cursor-pointer group px-1"
                @click="knowledgeStore.toggleCategory(category.id)"
              >
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <el-icon :class="{'rotate-[-90deg]': knowledgeStore.collapsedCategories.includes(category.id)}" class="transition-transform">
                    <CaretBottom />
                  </el-icon>
                  {{ category.name }}
                </h3>
              </div>
              
              <el-collapse-transition>
                <div v-show="!knowledgeStore.collapsedCategories.includes(category.id)" class="space-y-1">
                  <div 
                    v-for="file in category.files" 
                    :key="file.id"
                    :class="['flex items-center p-2 rounded-lg transition-all cursor-pointer group border border-transparent', 
                      knowledgeStore.selectedFiles.includes(file.id) ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50']"
                    @click="knowledgeStore.toggleFile(file.id)"
                  >
                    <el-checkbox 
                      :model-value="knowledgeStore.selectedFiles.includes(file.id)"
                      @change="knowledgeStore.toggleFile(file.id)"
                      class="mr-3"
                    />
                    <div class="flex-1 min-w-0">
                      <p :class="['text-sm truncate', knowledgeStore.selectedFiles.includes(file.id) ? 'font-bold text-blue-700' : 'text-gray-700']">
                        {{ file.name }}
                      </p>
                    </div>
                    <el-tooltip :content="file.desc" placement="right">
                      <el-icon class="text-gray-300 group-hover:text-blue-400"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
              </el-collapse-transition>
            </div>

            <!-- User Defined Categories -->
            <div v-for="category in knowledgeStore.enabledUserCategories" :key="category.id" class="space-y-2">
              <div 
                class="flex items-center justify-between cursor-pointer group px-1"
                @click="knowledgeStore.toggleCategory(category.id)"
              >
                <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1">
                  <el-icon :class="{'rotate-[-90deg]': knowledgeStore.collapsedCategories.includes(category.id)}" class="transition-transform">
                    <CaretBottom />
                  </el-icon>
                  {{ category.name }}
                </h3>
                <el-upload action="#" :auto-upload="false" :show-file-list="false" @change="(f) => handleUserStandardUploadToCat(f, category.id)">
                  <el-button size="small" link type="primary" icon="Plus">上传</el-button>
                </el-upload>
              </div>
              
              <el-collapse-transition>
                <div v-show="!knowledgeStore.collapsedCategories.includes(category.id)" class="space-y-1">
                  <div 
                    v-for="file in category.files" 
                    :key="file.id"
                    :class="['flex items-center p-2 rounded-lg transition-all cursor-pointer group border border-transparent', 
                      knowledgeStore.selectedFiles.includes(file.id) ? 'bg-orange-50 border-orange-100' : 'hover:bg-gray-50']"
                    @click="knowledgeStore.toggleFile(file.id)"
                  >
                    <el-checkbox 
                      :model-value="knowledgeStore.selectedFiles.includes(file.id)"
                      @change="knowledgeStore.toggleFile(file.id)"
                      class="mr-3"
                    />
                    <div class="flex-1 min-w-0">
                      <p :class="['text-sm truncate', knowledgeStore.selectedFiles.includes(file.id) ? 'font-bold text-orange-700' : 'text-gray-700']">
                        {{ file.name }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <el-button size="small" link type="danger" icon="Delete" @click.stop="knowledgeStore.removeFile(category.id, file.id)" />
                    </div>
                  </div>
                </div>
              </el-collapse-transition>
            </div>
        </div>
      </template>
      <div v-else class="flex flex-col items-center py-5 gap-4">
        <el-button link @click="isSidebarCollapsed = false">
          <el-icon><Expand /></el-icon>
        </el-button>
        <el-icon class="text-gray-300"><Files /></el-icon>
      </div>
    </aside>

    <!-- Middle: Main Content Area (55%) -->
    <main class="flex-1 flex flex-col relative bg-white overflow-hidden">
      <!-- Header with Progress -->
      <header class="border-b border-gray-100 bg-white/80 backdrop-blur-md z-20">
        <div class="h-16 flex items-center justify-between px-8">
          <div class="flex items-center gap-3">
            <div class="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
              <el-icon size="20"><Monitor /></el-icon>
            </div>
            <h1 class="text-xl font-black text-gray-800 tracking-tight">需求文档可测试性评估</h1>
          </div>
          
          <div class="flex items-center gap-4">
            <el-dropdown trigger="click">
              <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-xl transition-all">
                <el-avatar :size="32" src="https://picsum.photos/seed/user/200" />
                <span class="text-sm font-bold text-gray-700">{{ authStore.user?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- Linear Workflow Steps -->
        <div class="px-12 pb-4">
          <el-steps :active="evalStore.currentStep - 1" finish-status="success" simple class="custom-steps">
            <el-step title="选择标准" />
            <el-step title="提交需求" />
            <el-step title="评估设置" />
            <el-step title="查看结果" />
          </el-steps>
        </div>
      </header>

      <!-- Main Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-8 space-y-10" ref="mainContent">
        <!-- Step 1 Guide -->
        <div v-if="evalStore.currentStep === 1" class="max-w-3xl mx-auto text-center py-20">
          <div class="mb-6 inline-flex p-4 bg-blue-50 rounded-full text-blue-600">
            <el-icon size="48"><Files /></el-icon>
          </div>
          <h2 class="text-2xl font-bold mb-2">第一步：选择评估标准</h2>
          <p class="text-gray-500 mb-8">请在左侧面板勾选本次评估需要遵循的行业标准、公司规范或项目文档。</p>
          <el-button type="primary" size="large" :disabled="knowledgeStore.allSelectedFiles.length === 0" @click="evalStore.setStep(2)">
            下一步：提交需求内容
          </el-button>
        </div>

        <!-- Step 2 & 3: Input Area -->
        <div v-if="evalStore.currentStep >= 2 && !evalStore.currentReport" class="max-w-4xl mx-auto space-y-8">
          <!-- Module 1: Requirement Submission -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                提交待评估需求
              </h3>
              <div class="flex items-center gap-4">
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Plus" 
                  class="rounded-lg"
                  @click="openBaselineDrawer"
                >
                  引用历史基准需求
                </el-button>
                <el-radio-group v-model="evalStore.requirementType" size="small" :disabled="evalStore.onlyReference">
                  <el-radio-button label="text">文本输入</el-radio-button>
                  <el-radio-button label="document">文档上传</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- Referenced Baseline Module (New) -->
            <div v-if="evalStore.referencedBaselineIds.length > 0" class="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <el-icon :size="20"><Connection /></el-icon>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">基准上下文</span>
                      <!-- <el-tag size="small" type="primary" effect="dark" round class="font-bold">
                        {{ baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.version }}
                      </el-tag> -->
                    </div>
                    <h4 class="text-sm font-bold text-gray-800">{{ baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.name }}</h4>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <el-button size="small" link type="primary" icon="View" @click="previewFile(baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0]))">查看全文</el-button>
                  <el-button size="small" link type="danger" icon="Close" @click="evalStore.clearBaselines()">取消引用</el-button>
                </div>
              </div>
              
              <div class="flex items-center gap-4 pt-2 border-t border-blue-100/50">
                <!-- <div class="flex-1">
                  <span class="text-[10px] text-gray-400 block mb-1 uppercase font-bold tracking-tighter">版本切换</span>
                  <el-select 
                    :model-value="evalStore.referencedBaselineIds[0]" 
                    size="small" 
                    class="w-full"
                    @change="(val) => evalStore.referencedBaselineIds = [val]"
                  >
                    <el-option 
                      v-for="v in baselineStore.baselineTree.find(b => b.id === baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.parent_base_id || b.id === evalStore.referencedBaselineIds[0])?.versions"
                      :key="v.id"
                      :label="v.version + (v.is_latest ? ' (最新)' : '')"
                      :value="v.id"
                    />
                  </el-select>
                </div> -->
                <div class="flex-1">
                  <span class="text-[10px] text-gray-400 block mb-1 uppercase font-bold tracking-tighter">归档时间</span>
                  <div class="text-xs text-gray-600 font-medium">
                    {{ baselineStore.allFiles.find(f => f.id === evalStore.referencedBaselineIds[0])?.date }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Project Name Input -->
            <div v-if="evalStore.referencedBaselineIds.length === 0" class="space-y-2">
              <label class="text-sm font-bold text-gray-700">项目名</label>
              <el-input
                v-model="evalStore.projectName"
                placeholder="请输入项目名，将作为评估历史的分组依据"
                size="large"
                :disabled="evalStore.onlyReference"
              />
            </div>

            <!-- Requirement Title Input -->
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700">需求标题</label>
              <el-input
                v-model="evalStore.requirementTitle"
                placeholder="请输入需求标题，将作为项目名下的需求标题展示"
                size="large"
                :disabled="evalStore.onlyReference"
              />
            </div>

            <el-card class="border-none shadow-sm bg-gray-50 rounded-2xl overflow-hidden">
              <div v-if="evalStore.requirementType === 'text'" class="p-1">
                <el-input
                  v-model="evalStore.textContent"
                  type="textarea"
                  :rows="12"
                  :placeholder="inputPlaceholder"
                  resize="none"
                  :disabled="evalStore.onlyReference"
                />
                <div class="p-2 text-[10px] text-gray-400 text-right">
                  当前字数: {{ evalStore.textContent.length }}
                </div>
              </div>
              <div v-else class="p-8" :class="{ 'opacity-50 pointer-events-none': evalStore.onlyReference }">
                <el-upload
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  @change="handleReqFileUpload"
                  class="w-full"
                  :disabled="evalStore.onlyReference"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    拖拽文件到此处或 <em>点击上传需求文档</em>
                    <p class="text-xs text-gray-400 mt-2">支持 PDF, DOCX, TXT 格式</p>
                  </div>
                </el-upload>
                
                <div v-if="evalStore.uploadedFile" class="mt-4 p-4 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <el-icon size="24" color="#3b82f6"><Document /></el-icon>
                    <div>
                      <p class="text-sm font-bold text-gray-700">{{ evalStore.uploadedFile.name }}</p>
                      <p class="text-xs text-gray-400">{{ evalStore.uploadedFile.size }} • 解析成功</p>
                    </div>
                  </div>
                  <el-button link type="danger" icon="Delete" @click="evalStore.uploadedFile = null">移除</el-button>
                </div>
              </div>
            </el-card>

            <!-- Only evaluate new content switch -->
            <div v-if="evalStore.referencedBaselineIds.length > 0" class="flex items-center gap-2 px-2">
              <el-checkbox v-model="evalStore.onlyEvaluateNew">仅评估本次新增内容，不合并基准做整体评估</el-checkbox>
              <el-tooltip content="打开后仅生成新增内容评分，关闭则默认生成三维评分（新增、一致性、整体）" placement="top">
                <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </section>

          <!-- Module 2: Instructions -->
          <section class="space-y-4">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <span class="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">3</span>
              补充评估指令 (选填)
            </h3>
            <el-input
              v-model="evalStore.instructions"
              placeholder="选填：可输入本次评估的补充要求、重点关注维度、特殊规则等，无特殊要求可留空"
              size="large"
              prefix-icon="ChatLineRound"
            />
          </section>

          <!-- Step 3: Parameters (Optional) -->
          <section v-if="evalStore.currentStep === 3" class="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h3 class="text-sm font-bold text-blue-800 flex items-center gap-2 uppercase tracking-widest">评估参数设置</h3>
            <div class="grid grid-cols-2 gap-8">
              <el-form-item label="评估深度">
                <el-slider v-model="settings.depth" :step="1" :max="3" show-stops />
              </el-form-item>
              <el-form-item label="模型选择">
                <el-select v-model="settings.model" class="w-full">
                  <el-option 
                    v-for="model in availableModels" 
                    :key="model.id" 
                    :label="model.name + (model.name.includes('GPT-4o') ? ' (推荐)' : '')" 
                    :value="model.name" 
                  />
                </el-select>
              </el-form-item>
            </div>
          </section>
        </div>

        <!-- Evaluation Progress -->
        <div v-if="evalStore.isEvaluating" class="max-w-2xl mx-auto py-20 text-center space-y-6">
          <div class="relative w-32 h-32 mx-auto">
            <el-progress type="circle" :percentage="evalStore.evaluationProgress" :stroke-width="8" color="#3b82f6" />
            <div class="absolute inset-0 flex items-center justify-center">
              <el-icon size="32" class="animate-spin text-blue-600"><Loading /></el-icon>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-gray-800">{{ progressText }}</h3>
            <p class="text-sm text-gray-400">正在调用大语言模型进行深度评估，请稍候...</p>
          </div>
          <div class="flex justify-center gap-4">
            <div v-for="i in 4" :key="i" :class="['w-2 h-2 rounded-full transition-all duration-500', evalStore.evaluationProgress >= i*25 ? 'bg-blue-600 scale-125' : 'bg-gray-200']"></div>
          </div>
          <div class="pt-4">
            <el-button type="danger" plain round size="small" icon="Close" @click="cancelEvaluation">取消评估</el-button>
          </div>
        </div>

        <!-- Step 4: Evaluation Report -->
        <div v-if="evalStore.currentReport" class="max-w-4xl mx-auto space-y-8 pb-24">
          <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <!-- Report Header -->
            <div class="p-8 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
              <div class="flex justify-between items-center mb-8">
                <div>
                  <h2 class="text-2xl font-bold mb-1">需求可测试性评估报告</h2>
                  <p class="text-xs opacity-60">评估时间: {{ new Date().toLocaleString() }} • 使用模型: GPT-4o</p>
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
                        <!-- <p class="text-[10px] text-gray-400">版本: {{ base.version }} · 评分: {{ base.score }}</p> -->
                         <p class="text-[10px] text-gray-400">评分: {{ base.score }}</p>
                      </div>
                    </div>
                    <el-button link icon="View" @click="previewFile(base)">预览原文</el-button>
                  </div>
                </div>
              </div>

              <!-- Summary -->
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

              <!-- Issues (Overall) -->
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

              <!-- Suggestions -->
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
                <el-button v-if="evalStore.referencedBaselineIds.length > 0" type="primary" icon="Plus" @click="continueSupplementing">基于本次结果继续补充需求</el-button>
              </div>
              <div class="flex gap-2">
                <el-button icon="Refresh" @click="handleRestartEvaluation">重新评估</el-button>
                <el-button type="primary" icon="ChatDotRound">针对报告提问</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Bottom Action Bar -->
      <footer class="h-20 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center justify-center px-8 z-30">
        <div class="max-w-4xl w-full flex items-center justify-between">
          <div class="flex items-center gap-4">
            <el-button v-if="evalStore.currentStep > 1 && !evalStore.currentReport" link icon="Back" @click="evalStore.setStep(evalStore.currentStep - 1)">
              返回上一步
            </el-button>
            <div v-if="!evalStore.currentReport" class="text-xs text-gray-400 italic">
              {{ stepHint }}
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <el-button 
              v-if="evalStore.currentStep < 3 && !evalStore.currentReport" 
              type="primary" 
              size="large" 
              class="px-10 rounded-xl font-bold"
              :disabled="isNextDisabled"
              @click="evalStore.setStep(evalStore.currentStep + 1)"
            >
              下一步
            </el-button>
            <el-button 
              v-if="evalStore.currentStep === 3 && !evalStore.currentReport" 
              type="primary" 
              size="large" 
              class="px-12 rounded-xl font-bold shadow-lg shadow-blue-200"
              :loading="evalStore.isEvaluating"
              @click="handleStartEvaluation"
            >
              开始智能评估
            </el-button>
            <el-button v-if="evalStore.currentReport" type="primary" size="large" class="px-10 rounded-xl font-bold" @click="handleRestartEvaluation">
              开启新评估
            </el-button>
            <el-button 
              v-if="evalStore.currentReport" 
              :type="evalStore.referencedBaselineIds.length > 0 ? 'warning' : 'success'" 
              plain 
              size="large" 
              class="px-10 rounded-xl font-bold" 
              icon="CollectionTag" 
              @click="openArchiveDialog"
            >
              {{ evalStore.referencedBaselineIds.length > 0 ? '归档为基准需求' : '归档为基准需求' }}
            </el-button>
          </div>
        </div>
      </footer>
    </main>

    <!-- Right Sidebar: History -->
    <div 
      v-if="!isHistoryCollapsed"
      class="w-1 hover:bg-blue-400 cursor-col-resize transition-colors z-20"
      @mousedown="startResizing"
    ></div>
    <aside 
      :class="['bg-gray-50 border-l border-gray-200 flex flex-col shadow-inner transition-all duration-300 ease-in-out relative', isHistoryCollapsed ? 'w-12' : '']"
      :style="!isHistoryCollapsed ? { width: historySidebarWidth + 'px' } : {}"
    >
      <template v-if="!isHistoryCollapsed">
        <div class="p-6 border-b border-gray-200 bg-white">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <el-icon><Timer /></el-icon> 评估历史
            </h2>
            <el-button link @click="isHistoryCollapsed = true">
              <el-icon><Expand /></el-icon>
            </el-button>
          </div>
          <div class="flex gap-2">
            <el-input v-model="historySearch" placeholder="搜索需求名称..." prefix-icon="Search" size="small" class="flex-1" />
            <el-button size="small" icon="Filter" />
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          <!-- Independent Tasks (Unarchived/New) -->
          <div v-if="evalStore.aggregatedHistory.independentByProject.length > 0" class="space-y-6">
            <div class="flex items-center gap-3 px-2 mb-2">
              <div class="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full"></div>
              <h3 class="text-sm font-bold text-gray-700">未归档项目</h3>
              <span class="text-xs text-gray-400 font-medium">{{ evalStore.aggregatedHistory.independentByProject.length }} 个项目</span>
            </div>
            
            <!-- Grouped by Project -->
            <el-collapse v-model="activeUnarchivedProjects" accordion class="border-none space-y-3">
              <el-collapse-item 
                v-for="project in evalStore.aggregatedHistory.independentByProject" 
                :key="project.projectName" 
                :name="project.projectName" 
                class="group rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                <template #title>
                  <div class="flex items-center justify-between w-full p-4 bg-white gap-4 min-h-[64px]">
                    <div class="flex items-center gap-3 flex-1 overflow-hidden">
                      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shrink-0 shadow-sm">
                        <el-icon class="text-orange-600 font-bold text-lg"><Timer /></el-icon>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-base font-bold text-gray-800 truncate min-w-0 leading-tight">{{ project.projectName }}</span>
                        <el-tag v-if="project.items.length > 0" size="small" :type="getScoreType(project.items[0].total_score)" class="text-xs font-bold whitespace-nowrap">{{ project.items[0].total_score }}</el-tag>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <el-button size="small" circle icon="CollectionTag" type="success" plain class="!w-8 !h-8" @click.stop="archiveAllProjectTasks(project)" />
                      <el-button size="small" circle icon="Delete" type="danger" plain class="!w-8 !h-8" @click.stop="deleteProject(project)" />
                    </div>
                  </div>
                </template>
                
                <div class="space-y-3 p-3 bg-gray-50/70 rounded-b-xl">
                  <!-- Parent Item (First item as parent) -->
                  <div 
                    v-if="project.items.length > 0"
                    class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-l-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                    :class="isHistoryReferenced(project.items[0]) ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-100' : ''"
                    @click="loadHistory(project.items[0])"
                  >
                    <h4 class="text-sm font-bold text-gray-800 line-clamp-1 mb-2 pr-8">{{ project.items[0].title }}</h4>
                    
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">{{ project.items[0].date }}</span>
                      <span class="text-xs font-medium text-gray-500">{{ project.items[0].version }}</span>
                    </div>

                    <!-- Hover Actions -->
                    <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <el-button size="small" circle icon="View" type="primary" plain @click.stop="loadHistory(project.items[0])" />
                    </div>
                  </div>

                  <!-- Child Items -->
                  <div 
                    v-for="history in project.items.slice(1)" 
                    :key="history.id"
                    class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                    :class="isHistoryReferenced(history) ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-100' : ''"
                    @click="loadHistory(history)"
                  >
                    <h4 class="text-sm font-bold text-gray-700 line-clamp-1 mb-2 pr-8">{{ history.title }}</h4>
                    
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">{{ history.date }}</span>
                      <span class="text-xs font-medium text-gray-500">{{ history.version }}</span>
                    </div>

                    <!-- Hover Actions -->
                    <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <el-button size="small" circle icon="View" type="primary" plain @click.stop="loadHistory(history)" />
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          
          <!-- No Unarchived Tasks -->
          <div v-else-if="evalStore.aggregatedHistory.independent.length === 0 && evalStore.aggregatedHistory.baselines.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400 opacity-40">
            <el-icon size="64" class="mb-2"><DataBoard /></el-icon>
            <p class="text-sm">暂无评估记录</p>
          </div>

          <!-- Grouped by Baseline -->
          <el-collapse v-model="activeHistoryNames" accordion class="border-none space-y-3">
            <el-collapse-item v-for="base in evalStore.aggregatedHistory.baselines" :key="base.id" :name="base.id" class="group rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <template #title>
                <div class="flex items-start justify-between w-full p-4 bg-white gap-4 min-h-[80px]">
                  <div class="flex items-start gap-3 flex-1 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <el-icon class="text-blue-600 font-bold text-lg"><Connection /></el-icon>
                    </div>
                    <div class="flex flex-col overflow-hidden flex-1 gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-gray-800 truncate min-w-0 leading-tight">{{ base.name }}</span>
                        <el-tag size="small" :type="getScoreType(base.score)" class="text-xs font-bold whitespace-nowrap">{{ base.score }}</el-tag>
                      </div>
                      <el-select v-if="base.versions" size="small" class="!w-[100px]" @change="handleVersionChange(base, $event)" placeholder="选择版本">
                        <el-option 
                          v-for="version in base.versions" 
                          :key="version.id" 
                          :label="version.version" 
                          :value="version.id" 
                        />
                      </el-select>
                    </div>
                  </div>
                  <div class="flex flex-col items-center justify-start gap-2 shrink-0 mt-1">
                    <el-button 
                      size="small" 
                      circle 
                      icon="Plus" 
                      type="primary" 
                      class="flex items-center justify-center !ml-0"
                      @click.stop="handleBaselineReference(base)" 
                    />
                    <el-button 
                      size="small" 
                      circle 
                      icon="Delete" 
                      type="danger" 
                      plain 
                      class="flex items-center justify-center !ml-0"
                      @click.stop="deleteBaseline(base)" 
                    />
                  </div>
                </div>
              </template>
              
              <div class="space-y-3 p-3 bg-gray-50/70 rounded-b-xl">
                <!-- Parent Item (The Baseline itself) -->
                <div 
                  class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-l-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                  @click="loadHistory({...base, title: base.name, total_score: base.score})"
                >

                  <h4 class="text-sm font-bold text-gray-800 line-clamp-1 mb-2 pr-8">{{ base.title || base.name }}</h4>
                  
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ base.date }}</span>
                  </div>

                  <!-- Hover Actions -->
                  <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <el-button size="small" circle icon="View" type="primary" plain @click.stop="loadHistory({...base, title: base.name, total_score: base.score})" />
                  </div>
                </div>

                <!-- Child Items -->
                <div 
                  v-for="item in base.history" 
                  :key="item.id"
                  class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                  @click="loadHistory(item)"
                >

                  <h4 class="text-sm font-bold text-gray-700 line-clamp-1 mb-2 pr-8">{{ item.title }}</h4>
                  
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ item.date }}</span>
                  </div>

                  <!-- Hover Actions -->
                  <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <el-button size="small" circle icon="View" type="primary" plain @click.stop="loadHistory(item)" />
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <div v-if="evalStore.history.length === 0 && evalStore.aggregatedHistory.baselines.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400 opacity-40">
            <el-icon size="64" class="mb-2"><DataBoard /></el-icon>
            <p class="text-sm">暂无评估记录</p>
          </div>
        </div>
      </template>
      <div v-else class="flex flex-col items-center py-5 gap-4">
        <el-button link @click="isHistoryCollapsed = false">
          <el-icon><Fold /></el-icon>
        </el-button>
        <el-icon class="text-gray-300"><Timer /></el-icon>
      </div>
    </aside>

    <!-- Baseline Selection Drawer -->
    <el-drawer
      v-model="showBaselineDrawer"
      title="引用历史基准需求"
      direction="rtl"
      size="450px"
    >
      <div class="space-y-6">
        <div class="flex gap-2">
          <el-input v-model="baselineSearch" placeholder="搜索需求名称..." prefix-icon="Search" />
          <el-select v-model="baselineFilter" placeholder="共享范围" style="width: 120px">
            <el-option label="全部" value="all" />
            <el-option label="全平台公开" value="public" />
            <el-option label="私有" value="private" />
          </el-select>
        </div>

        <div class="space-y-4">
          <div v-for="(versions, projectName) in groupedBaselines" :key="projectName">
            <!-- Project Header with Collapse Button -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer" @click="toggleProjectCollapse(projectName)">
              <div class="flex items-center gap-2">
                <el-icon :class="{'rotate-180': collapsedProjects[projectName]}" class="transition-transform">
                  <CaretBottom />
                </el-icon>
                <h3 class="text-sm font-bold text-gray-800">{{ projectName }}</h3>
                <span class="text-xs text-gray-400">({{ versions.length }} 个版本)</span>
              </div>
            </div>
            
            <!-- Project Details (Collapsible) -->
            <el-collapse-transition>
              <div v-if="!collapsedProjects[projectName]" class="pl-4 border-l-2 border-gray-200 mt-1">
                <div class="p-3 rounded-xl border border-gray-100">
                  <!-- Version Selection -->
                  <div class="mb-3">
                    <el-select v-model="selectedVersions[projectName]" placeholder="选择版本" size="small" @change="handleVersionSelect(projectName, $event)" class="w-full">
                      <el-option 
                        v-for="version in versions" 
                        :key="version.id" 
                        :label="version.version" 
                        :value="version.id" 
                      />
                    </el-select>
                  </div>
                  
                  <!-- Selected Version Details -->
                  <div v-if="getSelectedVersion(projectName)" class="space-y-3">
                    <div class="flex justify-between items-center">
                      <div class="text-xs text-gray-500">
                        归档于: {{ getSelectedVersion(projectName)?.date }}
                      </div>
                      <el-tag size="small" :type="getSelectedVersion(projectName)?.score > 80 ? 'success' : 'warning'">{{ getSelectedVersion(projectName)?.score }}分</el-tag>
                    </div>

                    <div class="flex gap-2">
                      <el-button size="small" icon="View" @click.stop="previewFile(getSelectedVersion(projectName))">预览</el-button>
                      <el-button 
                        size="small" 
                        :type="evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? 'danger' : 'primary'"
                        :icon="evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? 'Close' : 'Connection'"
                        @click.stop="handleReferenceBaseline(selectedVersions[projectName])"
                      >
                        {{ evalStore.referencedBaselineIds.includes(selectedVersions[projectName]) ? '取消引用' : '引用' }}
                      </el-button>
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-400 py-2">
                    请选择一个版本
                  </div>
                </div>
              </div>
            </el-collapse-transition>
          </div>
          
          <div v-if="Object.keys(groupedBaselines).length === 0" class="text-center py-10 text-gray-400">
            <el-icon size="48" class="mb-2"><DataBoard /></el-icon>
            <p class="text-sm">暂无基准需求</p>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">已选择 {{ evalStore.referencedBaselineIds.length }} 份基准文档</span>
          <el-button type="primary" @click="showBaselineDrawer = false">完成选择</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Standard Preview Dialog -->
    <el-dialog v-model="showPreview" title="标准全文预览" width="800px" rounded-3xl>
      <div class="prose max-w-none p-4 bg-gray-50 rounded-2xl max-h-[500px] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">{{ previewContent.name }}</h3>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useKnowledgeStore, useEvaluationStore, useModelStore, useBaselineStore } from '@/store';
import { 
  Files, Document, Monitor, ArrowDown, Promotion, 
  Timer, Calendar, DataBoard, Upload, Setting, 
  CircleCheckFilled, Plus, UserFilled, Fold, Expand,
  Search, InfoFilled, CaretBottom, UploadFilled,
  Warning, CircleCheck, Loading, Refresh, ChatDotRound,
  Delete, Back, ChatLineRound, Filter, Top, Connection,
  View, Close, CollectionTag, DocumentChecked
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { startEvaluation, getEvaluationStatus, archiveEvaluation, cancelEvaluationMock } from '@/services';

const router = useRouter();
const authStore = useAuthStore();
const knowledgeStore = useKnowledgeStore();
const evalStore = useEvaluationStore();
const modelStore = useModelStore();
const baselineStore = useBaselineStore();

// 初始化：从 service 层通过 store 加载初始数据
onMounted(async () => {
  await Promise.all([
    baselineStore.fetchBaselines(),
    evalStore.fetchHistory(),
    knowledgeStore.fetchStandards(),
    modelStore.fetchModels(),
  ]);
});

// Automatically reset onlyReference if no baselines are selected
watch(() => evalStore.referencedBaselineIds.length, (newLength) => {
  if (newLength === 0) {
    evalStore.onlyReference = false;
  }
});

const isSidebarCollapsed = ref(false);
const isHistoryCollapsed = ref(false);
const historySidebarWidth = ref(380);
const isResizing = ref(false);

const startResizing = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResizing);
  document.addEventListener('mouseup', stopResizing);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResizing = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const newWidth = window.innerWidth - e.clientX;
  if (newWidth > 280 && newWidth < 600) {
    historySidebarWidth.value = newWidth;
  }
};

const stopResizing = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResizing);
  document.removeEventListener('mouseup', stopResizing);
  document.body.style.cursor = 'default';
  document.body.style.userSelect = '';
};

const historySearch = ref('');
const showPreview = ref(false);
const previewContent = ref<any>({});

// Baseline Drawer
const showBaselineDrawer = ref(false);
const activeHistoryNames = ref('');
const activeUnarchivedProjects = ref('');
const baselineSearch = ref('');
const baselineFilter = ref('all');
const selectedVersions = ref<Record<string, number>>({});
const collapsedProjects = ref<Record<string, boolean>>({});

const filteredBaselines = computed(() => {
  let files = baselineStore.allFiles;
  if (baselineSearch.value) {
    files = files.filter(f => f.name.toLowerCase().includes(baselineSearch.value.toLowerCase()));
  }
  if (baselineFilter.value !== 'all') {
    files = files.filter(f => f.scope === baselineFilter.value);
  }
  return files;
});

const groupedBaselines = computed(() => {
  const files = filteredBaselines.value;
  const groups: Record<string, any[]> = {};
  
  // 构建基准需求的树状结构，与baselineTree逻辑一致
  const roots = files.filter(f => !f.parent_base_id);
  
  roots.forEach(root => {
    // 找到根基准及其所有子基准
    const versions = files.filter(f => f.parent_base_id === root.id || f.id === root.id)
      .sort((a, b) => {
        // 按版本号降序排序
        const vA = parseFloat(a.version.replace(/[^0-9.]/g, ''));
        const vB = parseFloat(b.version.replace(/[^0-9.]/g, ''));
        return vB - vA;
      });
    
    // 使用根基准的名称作为分组键
    groups[root.name] = versions;
  });
  
  return groups;
});

const inputPlaceholder = computed(() => {
  if (evalStore.referencedBaselineIds.length > 0) {
    return '您已引用基准需求作为参考，此处请输入本次评估的【新增/差异需求】内容，系统将结合两者进行综合评估...\n\n提示：如果仅想重新评估基准需求，可保持此处为空并直接点击下一步。';
  }
  return '请输入您需要评估的需求内容，支持单条/多条需求，将作为本次评估的核心对象...';
});

const referencedBaselines = computed(() => {
  return evalStore.referencedBaselineIds.map(id => 
    baselineStore.allFiles.find(f => f.id === id)
  ).filter(f => f);
});

const handleReferenceBaseline = (id: number) => {
  evalStore.toggleBaseline(id);
  if (evalStore.referencedBaselineIds.includes(id)) {
    ElMessage.success('已成功引用基准需求，系统将为您执行增量评估模式');
  }
};

const openArchiveDialog = (historyItem?: any) => {
  // If historyItem is an event object (from @click without args), treat it as undefined
  if (historyItem && (historyItem instanceof Event || historyItem.type === 'click')) {
    historyItem = undefined;
  }
  const target = historyItem || evalStore.currentReport;
  if (!target) return;

  const isIncremental = evalStore.referencedBaselineIds.length > 0 || (target.parent_base_id);
  const title = isIncremental ? '归档为基准需求' : '归档为基准需求';
  // 使用项目名称作为基准名称
  const defaultName = evalStore.projectName || (isIncremental 
    ? (baselineStore.allFiles.find(f => f.id === (evalStore.referencedBaselineIds[0] || target.parent_base_id))?.name)
    : (evalStore.uploadedFile?.name || '新基准需求文档'));

  const performArchive = async (name: string) => {
    const parentId = evalStore.referencedBaselineIds[0] || target.parent_base_id;
    // 对于历史记录，使用历史记录的标题作为需求标题
    const requirementTitle = historyItem ? historyItem.title : evalStore.requirementTitle;
    try {
      await baselineStore.addBaseline({
        name: name || '未命名基准',
        title: requirementTitle || '未命名需求',
        desc: '由评估报告归档生成的基准需求文档。',
        score: target.total_score || target.score,
        scope: 'private',
        parent_base_id: parentId,
        full_content: evalStore.textContent
      });

      if (historyItem) {
        historyItem.is_archived = true;
      } else if (evalStore.currentReport) {
        evalStore.currentReport.is_archived = true;
      }

      ElMessage.success('已成功归档至基准需求库');
    } catch (e: any) {
      ElMessage.error(`归档失败：${e.message || '未知错误'}`);
    }
  };

  // 直接使用项目名称归档，不再弹出输入框
  ElMessageBox.confirm(
    `确定要将本次评估结果归档为基准需求吗？`,
    title,
    {
      confirmButtonText: '确定归档',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    performArchive(defaultName);
  }).catch(() => {});
};

const continueSupplementing = () => {
  if (!evalStore.currentReport) return;
  
  // 1. Archive current report if not already archived
  if (!evalStore.currentReport.is_archived) {
    const target = evalStore.currentReport;
    const isIncremental = evalStore.referencedBaselineIds.length > 0 || (target.parent_base_id);
    const defaultName = evalStore.projectName || (isIncremental 
      ? (baselineStore.allFiles.find(f => f.id === (evalStore.referencedBaselineIds[0] || target.parent_base_id))?.name)
      : (evalStore.uploadedFile?.name || '新基准需求文档'));
      
    const parentId = evalStore.referencedBaselineIds[0] || target.parent_base_id;
    
    baselineStore.addBaseline({
      name: defaultName || '未命名基准',
      title: evalStore.requirementTitle || defaultName || '未命名需求',
      desc: '由评估报告归档生成的基准需求文档。',
      score: target.total_score || target.score,
      scope: 'private',
      parent_base_id: parentId,
      full_content: evalStore.textContent 
    });
    
    evalStore.currentReport.is_archived = true;
    ElMessage.success('已自动归档当前评估结果');
  }

  // 2. Set reference to the parent baseline (which now includes the new version)
  if (evalStore.currentReport.parent_base_id) {
    evalStore.referencedBaselineIds = [evalStore.currentReport.parent_base_id];
  } else if (evalStore.referencedBaselineIds.length === 0) {
    // If it was a new root, find it in store (it was just added)
    // In a real app we'd get the ID from the addBaseline response, here we approximate or just rely on user re-selecting if needed, 
    // but better to try to find it.
    // For simplicity in this demo, we might just clear and let user select, or try to find the latest added.
    const latest = baselineStore.allFiles[0]; // Since we unshift
    if (latest) evalStore.referencedBaselineIds = [latest.id];
  }
  
  evalStore.textContent = '';
  evalStore.uploadedFile = null;
  evalStore.currentReport = null;
  evalStore.setStep(2);
  ElMessage.info('已为您准备好增量补充环境');
};

const previewFile = (file: any) => {
  previewContent.value = file;
  showPreview.value = true;
};

const settings = reactive({
  depth: 2,
  model: 'GPT-4o',
});

const availableModels = computed(() => {
  return modelStore.models.filter(m => m.status === 'active');
});

const progressText = computed(() => {
  if (evalStore.evaluationProgress < 25) return '正在加载评估标准...';
  if (evalStore.evaluationProgress < 50) return '正在解析需求内容...';
  if (evalStore.evaluationProgress < 75) return '正在执行可测试性评估...';
  return '正在生成评估报告...';
});

const stepHint = computed(() => {
  if (evalStore.currentStep === 1) return '请先勾选左侧标准以继续';
  if (evalStore.currentStep === 2) return '请提交需要评估的需求内容';
  if (evalStore.currentStep === 3) return '确认参数后即可发起评估';
  return '';
});

const isNextDisabled = computed(() => {
  if (evalStore.currentStep === 1) return knowledgeStore.allSelectedFiles.length === 0;
  if (evalStore.currentStep === 2) {
    if (!evalStore.requirementTitle) return true;
    if (evalStore.referencedBaselineIds.length === 0 && !evalStore.projectName) return true;
    if (evalStore.referencedBaselineIds.length > 0) return false;
    if (evalStore.requirementType === 'text') return evalStore.textContent.length < 10;
    return !evalStore.uploadedFile;
  }
  return false;
});

const filteredHistory = computed(() => {
  if (!historySearch.value) return evalStore.history;
  return evalStore.history.filter(h => h.title.toLowerCase().includes(historySearch.value.toLowerCase()));
});

const handleUserStandardUploadToCat = async (file: any, categoryId: number) => {
  try {
    await knowledgeStore.uploadStandard(categoryId, file.raw);
    ElMessage.success(`标准文档 "${file.name}" 上传并解析成功`);
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};

const handleUserStandardUpload = async (file: any) => {
  // Use category 4 (Custom Documents) as default if no category specified
  try {
    await knowledgeStore.uploadStandard(4, file.raw);
    ElMessage.success(`自定义标准 "${file.name}" 上传并解析成功`);
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e.message || '未知错误'}`);
  }
};

const handleReqFileUpload = (file: any) => {
  evalStore.uploadedFile = {
    name: file.name,
    size: (file.size / 1024).toFixed(2) + ' KB',
    raw: file.raw
  };
  ElMessage.success('需求文档上传成功');
};

// 当前正在进行的评估任务 ID（用于轮询和取消）
let _currentEvaluationId: number | null = null;
let _pollingTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 处理「开始评估」按钮点击。
 * 1. 调用 service.startEvaluation() 提交评估任务（mock: 不发真实请求；real: POST /api/evaluations）
 * 2. 启动轮询 getEvaluationStatus() 更新进度条
 * 3. 完成时解析 report 并写入 store
 */
const handleStartEvaluation = async () => {
  evalStore.isEvaluating = true;
  evalStore.evaluationProgress = 0;

  try {
    const payload = {
      project_name: evalStore.projectName,
      requirement_title: evalStore.requirementTitle,
      requirement_type: evalStore.requirementType,
      text_content: evalStore.requirementType === 'text' ? evalStore.textContent : undefined,
      document_file_id: evalStore.requirementType === 'document' ? evalStore.uploadedFile?.file_id : undefined,
      standard_ids: knowledgeStore.allSelectedFiles.map((f: any) => f.id),
      referenced_baseline_id: evalStore.referencedBaselineIds[0] || null,
      only_evaluate_new: evalStore.onlyEvaluateNew,
      instructions: evalStore.instructions || undefined,
      model_id: availableModels.value.find(m => m.name === settings.model)?.id,
    };

    const { evaluation_id } = await startEvaluation(payload);
    _currentEvaluationId = evaluation_id;
    pollEvaluationStatus(evaluation_id);
  } catch (e: any) {
    evalStore.isEvaluating = false;
    ElMessage.error(`评估启动失败：${e.message || '未知错误'}`);
  }
};

/**
 * 轮询评估任务状态，每 300ms 查询一次直至完成或取消。
 */
const pollEvaluationStatus = (id: number) => {
  _pollingTimer = setTimeout(async () => {
    if (!evalStore.isEvaluating) return; // 已被取消
    try {
      const result = await getEvaluationStatus(id);
      evalStore.evaluationProgress = Math.min(result.progress, 99);

      if (result.status === 'completed' && result.report) {
        evalStore.evaluationProgress = 100;
        await finishEvaluation(result.report);
      } else {
        pollEvaluationStatus(id); // 继续轮询
      }
    } catch (e) {
      pollEvaluationStatus(id); // 网络抖动，继续重试
    }
  }, 300);
};

const cancelEvaluation = async () => {
  if (_pollingTimer) { clearTimeout(_pollingTimer); _pollingTimer = null; }
  if (_currentEvaluationId) {
    await cancelEvaluationMock(_currentEvaluationId).catch(() => {});
    _currentEvaluationId = null;
  }
  evalStore.isEvaluating = false;
  evalStore.evaluationProgress = 0;
  ElMessage.info('评估已取消');
};

/**
 * 评估完成后的处理：解析 report，写入 store，跳转步骤 4。
 * report 数据来自 service 层（mock: 本地生成；real: 后端返回）
 */
const finishEvaluation = async (report: any) => {
  evalStore.isEvaluating = false;
  evalStore.currentReport = report;
  await evalStore.addHistory(report);
  evalStore.setStep(4);
  ElMessage.success('评估完成！');
};

const handleRestartEvaluation = async () => {
  if (evalStore.currentReport && !evalStore.currentReport.is_archived && _currentEvaluationId) {
    try {
      await ElMessageBox.confirm('当前评估尚未归档，开启新评估将彻底删除当前记录，是否确认？', '提示', {
        type: 'warning',
        confirmButtonText: '确定重置并删除',
        cancelButtonText: '取消'
      });
      await evalStore.discardEvaluation(_currentEvaluationId);
      _currentEvaluationId = null;
    } catch {
      return; // 用户取消
    }
  }
  evalStore.reset();
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreType = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

const loadHistory = async (history: any) => {
  ElMessage.info(`正在加载历史记录: ${history.title}`);
  // 如果 history 中已包含完整 report 数据（issues/suggestions），直接使用
  if (history.issues && history.suggestions) {
    evalStore.currentReport = {
      total_score: history.total_score || history.score,
      task_type: history.task_type || 'full',
      parent_base_id: history.parent_base_id || null,
      issues: history.issues,
      suggestions: history.suggestions,
      is_archived: history.is_archived,
    };
    evalStore.setStep(4);
    return;
  }
  // 否则通过 service 层获取详情（real 模式: GET /api/evaluations/{id}）
  try {
    const { getEvaluationDetail } = await import('@/services');
    const detail = await getEvaluationDetail(history.id);
    evalStore.currentReport = {
      total_score: detail.total_score || detail.score,
      task_type: detail.task_type || 'full',
      parent_base_id: detail.parent_base_id || null,
      issues: detail.issues || [],
      suggestions: detail.suggestions || '',
      is_archived: detail.is_archived,
    };
    evalStore.setStep(4);
  } catch (e: any) {
    ElMessage.error(`加载历史记录失败：${e.message}`);
  }
};

const openBaselineDrawer = () => {
  if (knowledgeStore.allSelectedFiles.length === 0) {
    ElMessage.warning('请先在左侧勾选至少一个参考文档（评估标准）');
    evalStore.setStep(1);
    return;
  }
  showBaselineDrawer.value = true;
};

const isHistoryReferenced = (history: any) => {
  return evalStore.referencedBaselineIds.includes(history.id) || 
         (history.parent_base_id && evalStore.referencedBaselineIds.includes(history.parent_base_id));
};

const handleBaselineReference = (base: any) => {
  evalStore.clearBaselines();
  evalStore.toggleBaseline(base.id);
  evalStore.setStep(2);
  ElMessage.success(`已引用基准需求: ${base.name} (包含 ${base.history.filter((h: any) => h.is_archived).length} 个已归档子版本)`);
};

const deleteBaseline = (base: any) => {
  ElMessageBox.confirm(`确定要删除基准需求 "${base.name}" 及其所有历史版本吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(() => {
    baselineStore.removeBaseline(base.id);
    // Also remove associated history
    evalStore.history = evalStore.history.filter(h => h.parent_base_id !== base.id && h.id !== base.id);
    ElMessage.success('基准需求及关联历史已删除');
  }).catch(() => {});
};

const handleVersionChange = (base: any, versionId: number) => {
  // 找到选中的版本
  const selectedVersion = base.versions.find((v: any) => v.id === versionId);
  if (selectedVersion) {
    // 更新项目级别的评分显示
    base.score = selectedVersion.score || base.score;
    ElMessage.info(`已切换到版本: ${selectedVersion.version}`);
  }
};

const handleVersionSelect = (projectName: string, versionId: number) => {
  selectedVersions.value[projectName] = versionId;
};

const getSelectedVersion = (projectName: string) => {
  const versionId = selectedVersions.value[projectName];
  if (!versionId) return null;
  
  // 找到该项目的所有版本
  const versions = groupedBaselines.value[projectName];
  if (!versions) return null;
  
  // 找到选中的版本
  return versions.find((v: any) => v.id === versionId);
};

const toggleProjectCollapse = (projectName: string) => {
  collapsedProjects.value[projectName] = !collapsedProjects.value[projectName];
};

const toggleArchiveStatus = (item: any) => {
  if (item.is_archived) {
    // Unarchive
    item.is_archived = false;
    ElMessage.info('已取消归档');
  } else {
    // Archive directly without confirmation
    const target = item;
    const isIncremental = evalStore.referencedBaselineIds.length > 0 || (target.parent_base_id);
    const defaultName = isIncremental 
      ? (baselineStore.allFiles.find(f => f.id === (evalStore.referencedBaselineIds[0] || target.parent_base_id))?.name)
      : (evalStore.uploadedFile?.name || '新基准需求文档');

    const parentId = evalStore.referencedBaselineIds[0] || target.parent_base_id;
    
    // If it's a new root baseline (not incremental) and no name is provided, we might need to prompt or generate one.
    // For sidebar toggle, we assume it belongs to the current group if it's already in history.
    // However, history items might be independent.
    // If item has parent_base_id, it's easy.
    
    if (!item.parent_base_id && !isIncremental) {
       // Independent item being archived for the first time
       ElMessageBox.prompt('请输入归档后的基准名称', '归档为基准需求', {
        confirmButtonText: '确定归档',
        cancelButtonText: '取消',
        inputValue: defaultName,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空'
      }).then(({ value }) => {
        baselineStore.addBaseline({
          name: value,
          desc: '由评估报告归档生成的基准需求文档。',
          score: target.total_score || target.score,
          scope: 'private',
          parent_base_id: null,
          full_content: evalStore.textContent 
        });
        item.is_archived = true;
        ElMessage.success('已成功归档');
      }).catch(() => {});
      return;
    }

    // Incremental or already has parent context - Archive silently
    baselineStore.addBaseline({
      name: defaultName || '未命名基准',
      desc: '由评估报告归档生成的基准需求文档。',
      score: target.total_score || target.score,
      scope: 'private',
      parent_base_id: parentId,
      full_content: evalStore.textContent 
    });
    
    item.is_archived = true;
    ElMessage.success('已成功归档');
  }
};

const handleHistoryReference = (history: any) => {
  if (knowledgeStore.allSelectedFiles.length === 0) {
    ElMessage.warning('请先在左侧勾选至少一个参考文档（评估标准）');
    evalStore.setStep(1);
    return;
  }
  
  const targetId = history.is_archived ? history.id : (history.parent_base_id || history.id);
  
  if (evalStore.referencedBaselineIds.includes(targetId)) {
    evalStore.toggleBaseline(targetId);
    ElMessage.info(`已取消引用: ${history.title}`);
  } else {
    evalStore.clearBaselines();
    evalStore.toggleBaseline(targetId);
    evalStore.setStep(2);
    ElMessage.success(`已引用历史记录作为基准: ${history.title}`);
  }
};

const removeHistory = (id: number) => {
  ElMessageBox.confirm('确定要彻底删除这条未归档的评估记录吗？', '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await evalStore.discardEvaluation(id);
      ElMessage.success('已删除');
    } catch (e: any) {
      ElMessage.error(`删除失败：${e.message || '未知错误'}`);
    }
  }).catch(() => {
    // User canceled
  });
};


const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

// 归档整个项目的所有需求
const archiveAllProjectTasks = (project: any) => {
  if (!project.items || project.items.length === 0) return;
  
  // 使用项目名称作为基准名称，不再弹出输入框
  const baselineName = project.projectName;
  
  ElMessageBox.confirm(
    `确定要将项目 "${project.projectName}" 的所有需求归档为基准需求吗？`,
    '归档项目',
    {
      confirmButtonText: '确定归档',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    // 归档项目下的所有需求（async，逐个调用 service）
    for (const item of project.items) {
      if (!item.is_archived) {
        try {
          await baselineStore.addBaseline({
            name: baselineName,
            title: item.title || '未命名需求',
            desc: '由评估报告归档生成的基准需求文档。',
            score: item.total_score || item.score,
            scope: 'private',
            parent_base_id: null,
            full_content: item.content || ''
          });
          item.is_archived = true;
        } catch (e: any) {
          ElMessage.error(`归档失败（${item.title}）：${e.message}`);
        }
      }
    }
    ElMessage.success(`项目 "${project.projectName}" 已成功归档为基准需求`);
  }).catch(() => {});
};

// 删除整个项目
const deleteProject = (project: any) => {
  ElMessageBox.confirm(
    `确定要彻底删除项目 "${project.projectName}" 的所有未归档评估记录吗？此操作不可恢复。`,
    '删除项目',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      for (const item of project.items) {
        if (!item.is_archived) {
          await evalStore.discardEvaluation(item.id);
        }
      }
      ElMessage.success(`项目 "${project.projectName}" 已清空`);
    } catch (e: any) {
      ElMessage.error(`部分删除失败：${e.message}`);
    }
  }).catch(() => {});
};

// 查看项目详情
const viewProject = (project: any) => {
  ElMessage.info(`查看项目: ${project.projectName}`);
  // 可以在这里添加查看项目详情的逻辑，比如打开一个抽屉或对话框
};
</script>

<style scoped>
.custom-steps :deep(.el-step.is-simple .el-step__title) {
  font-size: 12px;
  font-weight: 700;
}

.custom-steps :deep(.el-step.is-simple .el-step__icon) {
  width: 20px;
  height: 20px;
}

:deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  padding: 1.5rem;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animation for progress */
@keyframes pulse-blue {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
</style>
