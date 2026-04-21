# 需求文档可测试性评估系统 - 前端

本项目是一个基于 Vue 3 + TypeScript + Vite 的前端应用，旨在通过 AI 辅助评估需求文档的可测试性，提供评分、问题诊断及优化建议。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite 6
- **语言**: TypeScript 5.8
- **状态管理**: Pinia 3
- **UI 组件库**: Element Plus 2.13
- **样式**: Tailwind CSS 4
- **HTTP 客户端**: Axios
- **路由**: Vue Router 5 (HTML5 History 模式)
- **图标**: @element-plus/icons-vue

## 项目结构

```text
src/
├── main.ts                          # 入口文件 (Pinia, Router, ElementPlus 注册)
├── App.vue                          # 根组件 (router-view 容器)
├── index.css                        # 全局样式 (Tailwind CSS 引入)
├── vite-env.d.ts                    # Vite 环境类型声明
├── router/
│   └── index.ts                     # 路由配置 (含导航守卫, 角色鉴权)
├── services/                        # 服务层 (API 调用与模拟数据)
│   ├── api.ts                       # 真实 HTTP 请求 (Axios, 拦截器, 全部 API 方法)
│   ├── mock.ts                      # 模拟数据服务 (前端独立运行时的假数据)
│   └── index.ts                     # 统一入口 (根据 VITE_USE_MOCK 切换)
├── store/
│   └── index.ts                     # Pinia 状态管理 (5 个 Store)
├── views/
│   ├── Login.vue                    # 登录/注册页面
│   ├── Admin.vue                    # 管理后台 (模型配置, 标准/异味管理)
│   ├── BaselineDetail.vue           # 基准版本详情页 (版本对比, 积木块查看)
│   └── User/                        # 用户主工作台
│       ├── index.vue                # 主页面 (四步流程编排)
│       ├── components/
│       │   ├── AppHeader.vue        # 顶部导航栏 (用户信息, 退出)
│       │   ├── SidebarLeft.vue      # 左侧边栏 (评估标准/异味选择)
│       │   ├── SidebarRight.vue     # 右侧边栏 (基准需求树)
│       │   ├── RequirementInput.vue # 需求输入区 (文本/文档模式, 卡片编辑器)
│       │   ├── Step1_Guide.vue      # 步骤1: 选择评估模式
│       │   ├── Step4_Report.vue     # 步骤4: 评估报告展示
│       │   ├── EvaluationLoading.vue # 评估进行中加载动画
│       │   ├── BaselineDrawer.vue   # 基准需求抽屉 (详情/对比)
│       │   ├── StandardPreviewDialog.vue # 标准文件预览弹窗
│       │   └── MainFooter.vue       # 底部信息栏
│       └── composables/
│           ├── useEvaluationTask.ts  # 评估任务逻辑 (草稿/提交/轮询/归档)
│           ├── useBaselineActions.ts # 基准操作逻辑 (选择/取消/删除预览)
│           └── useSidebarLayout.ts   # 侧边栏布局逻辑 (宽度/折叠)
└── components/
    └── EvaluationReportView.vue     # 评估报告通用展示组件
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将运行在 `http://localhost:3000`。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 类型检查

```bash
npm run lint
```

## 配置与开发模式

本项目支持 **前端模拟 (Mock)** 和 **真实后端 (Real API)** 两种模式，通过环境变量无缝切换。

### 环境变量配置

在根目录创建或编辑 `.env.development` 文件：

```env
# 是否使用前端模拟数据 (true=开启模拟, false=连接真实后端)
VITE_USE_MOCK=true

# 后端 API 基础地址 (仅在 VITE_USE_MOCK=false 时生效)
VITE_API_BASE_URL=http://localhost:8000
```

### 模式说明

- **模拟模式 (Mock Mode)**: 默认开启。UI 功能完整，所有数据操作在内存中模拟完成，不会发送真实网络请求。适合纯 UI 开发和演示。
- **真实模式 (Real API Mode)**: 将 `VITE_USE_MOCK` 设为 `false`。前端通过 Axios 向 `VITE_API_BASE_URL` 发送 RESTful 请求，自动附加 JWT Token。

## 路由配置

| 路径 | 组件 | 说明 | 鉴权 |
|------|------|------|------|
| `/login` | Login.vue | 登录/注册 | 无 |
| `/` | User/index.vue | 用户主工作台 | 需登录 |
| `/admin` | Admin.vue | 管理后台 | 需 admin 角色 |
| `/baseline/:versionId` | BaselineDetail.vue | 基准版本详情 | 需登录 |

导航守卫逻辑：
- 未登录访问需认证页面 → 重定向到 `/login`
- 已登录访问 `/login` → 按角色重定向到 `/` 或 `/admin`
- 非 admin 访问 `/admin` → 重定向到 `/`

## 状态管理 (Pinia Stores)

### AuthStore (`auth`)

| State | 类型 | 说明 |
|-------|------|------|
| token | `string \| null` | JWT Token (持久化到 localStorage) |
| user | `{id, username, role} \| null` | 当前用户信息 |
| isLoggedIn | `boolean` | 登录状态 |
| role | `'admin' \| 'user'` | 用户角色 |

| Action | 说明 |
|--------|------|
| login(username, password) | 调用后端登录 API |
| register(username, password) | 调用后端注册 API |
| logout() | 清除 Token 和用户信息 |

### ModelStore (`models`)

| State | 类型 | 说明 |
|-------|------|------|
| models | `any[]` | 大模型配置列表 |
| defaultModel | `string` | 当前激活模型名称 |
| defaultModelId | `number \| null` | 当前激活模型 ID |
| prompts | `{system, format}` | 系统提示词配置 |

| Action | 说明 |
|--------|------|
| fetchModels() | 从后端拉取模型列表 |
| addModel(model) | 新增模型配置 |
| removeModel(id) | 删除模型配置 |
| updateModel(model) | 更新模型配置 |
| activateModel(id) | 切换模型激活状态 |

### KnowledgeStore (`knowledge`)

管理评估标准分类和文件的选择状态。

| State | 类型 | 说明 |
|-------|------|------|
| categories | `any[]` | 标准分类列表 (含文件) |
| selectedFiles | `number[]` | 已选中的标准文件 ID |
| searchQuery | `string` | 搜索关键词 |

| Getter | 说明 |
|--------|------|
| enabledDefaultCategories | 启用的默认分类 |
| enabledUserCategories | 启用的用户分类 |
| allSelectedFiles | 所有已选文件列表 |
| filteredCategories | 按搜索词过滤后的分类 |

### SmellStore (`smell`)

管理异味规则分类和文件，结构与 KnowledgeStore 类似，额外支持优先级管理。

### BaselineStore (`baseline`)

| State | 类型 | 说明 |
|-------|------|------|
| categories | `any[]` | 基准分类 (系统默认/用户归档) |
| searchQuery | `string` | 搜索关键词 |

| Getter | 说明 |
|--------|------|
| baselineTree | 按项目分组的版本树结构 |
| filteredFiles | 搜索过滤后的基准列表 |

| Action | 说明 |
|--------|------|
| fetchBaselines() | 从后端拉取基准列表 |
| addBaseline(file) | 归档新基准 |
| removeBaseline(versionId) | 删除基准 (含子树级联) |

### EvaluationStore (`evaluation`)

| State | 类型 | 说明 |
|-------|------|------|
| currentStep | `number` | 当前步骤 (1-4) |
| requirementType | `'text' \| 'document'` | 输入模式 |
| items | `any[]` | 卡片列表 (积木块) |
| draftId | `number \| null` | 草稿 ID |
| isEvaluating | `boolean` | 是否正在评估 |
| evaluationProgress | `number` | 评估进度 (0-100) |
| currentReport | `any` | 当前评估报告 |
| history | `any[]` | 历史评估记录 |
| editMode | `'incremental' \| 'full'` | 编辑模式 |

| Getter | 说明 |
|--------|------|
| aggregatedHistory | 聚合基准树与独立评估的分组视图 |

| Action | 说明 |
|--------|------|
| initDraft() | 初始化草稿 |
| debouncedSyncItems() | 防抖同步卡片到后端 |
| toggleBaseline(id) | 选择/取消基准引用 |
| addItem(title, content) | 新增卡片 |
| updateItem(index, title, content) | 修改卡片 |
| toggleDeleteItem(index) | 标记/恢复删除卡片 |
| uploadFile(file) | 上传需求文档 |
| addHistory(report) | 将评估结果写入历史 |
| discardEvaluation(id) | 删除评估记录 |
| reset() | 重置所有状态 |

## API 服务层

### 服务切换机制

`services/index.ts` 根据 `VITE_USE_MOCK` 环境变量决定使用 `mock.ts` 还是 `api.ts`：

```typescript
const isMock = import.meta.env.VITE_USE_MOCK === 'true';
export const service = isMock ? mockService : apiService;
```

### API 方法一览

| 方法 | HTTP | 后端端点 | 说明 |
|------|------|----------|------|
| login | POST | `/api/auth/login` | 用户登录 |
| register | POST | `/api/auth/register` | 用户注册 |
| startEvaluation | POST | `/api/evaluations` | 发起评估任务 |
| createDraft | POST | `/api/evaluations/draft` | 创建草稿 |
| syncDraftItems | PUT | `/api/evaluations/{id}/items` | 同步草稿卡片 |
| submitDraft | POST | `/api/evaluations/{id}/submit` | 提交草稿 |
| getEvaluationStatus | GET | `/api/evaluations/{id}/status` | 轮询评估状态 |
| getEvaluations | GET | `/api/evaluations` | 获取评估历史 |
| getEvaluationDetail | GET | `/api/evaluations/{id}` | 获取评估详情 |
| updateEvaluation | PUT | `/api/evaluations/{id}` | 更新评估内容 |
| deleteEvaluation | DELETE | `/api/evaluations/{id}` | 删除评估 |
| archiveEvaluation | POST | `/api/evaluations/{id}/archive` | 归档为基准 |
| getBaselines | GET | `/api/baselines` | 获取基准列表 |
| createBaseline | POST | `/api/baselines` | 创建基准 |
| deleteBaseline | DELETE | `/api/baselines/{id}` | 删除基准 |
| getDeletePreview | GET | `/api/baselines/{id}/delete-preview` | 删除预览 |
| getBaselineContent | GET | `/api/baselines/{id}/content` | 获取基准全文 |
| getBaselineItems | GET | `/api/baselines/{versionId}/items` | 获取积木块 |
| getBaselineFullContext | GET | `/api/baselines/{versionId}/full-context` | 版本对比上下文 |
| createBaselineItem | POST | `/api/baselines/{versionId}/items` | 新增积木块 |
| updateBaselineItem | PUT | `/api/baselines/{versionId}/items/{itemId}` | 修改积木块 |
| deleteBaselineItem | DELETE | `/api/baselines/{versionId}/items/{itemId}` | 删除积木块 |
| exportBaselineItems | GET | `/api/baselines/{versionId}/export` | 导出 Markdown |
| getStandards | GET | `/api/standards` | 获取标准分类 |
| uploadStandardFile | POST | `/api/standards/{categoryId}/files` | 上传标准文件 |
| createCategory | POST | `/api/standards` | 创建标准分类 |
| deleteCategory | DELETE | `/api/standards/{categoryId}` | 删除分类 |
| deleteStandardFile | DELETE | `/api/standards/files/{standardId}` | 删除标准文件 |
| updateStandardStatus | PATCH | `/api/standards/files/{standardId}/status` | 更新状态 |
| updateStandardPriority | PATCH | `/api/standards/files/{standardId}/priority` | 更新优先级 |
| uploadRequirementFile | POST | `/api/uploads/requirement` | 上传需求文档 |
| deleteUpload | DELETE | `/api/uploads/{fileId}` | 删除上传文件 |
| getModels | GET | `/api/admin/models` | 获取模型列表 |
| createModel | POST | `/api/admin/models` | 新增模型 |
| updateModel | PUT | `/api/admin/models/{id}` | 更新模型 |
| activateModel | POST | `/api/admin/models/{id}/activate` | 激活模型 |
| deleteModel | DELETE | `/api/admin/models/{id}` | 删除模型 |

### Axios 拦截器

- **请求拦截**: 自动从 `localStorage` 读取 `auth_token` 并附加到 `Authorization: Bearer` 头
- **响应拦截**: 统一错误处理，提取后端 `detail.message` 中文错误信息

## 功能模块

### 1. 用户认证
- 登录/注册页面，支持 JWT Token 持久化
- 角色区分：普通用户 (`user`) 和管理员 (`admin`)

### 2. 评估标准管理
- 左侧边栏展示标准分类（国际标准/公司标准/项目组标准/自定义文档）
- 支持文件上传、状态切换、优先级设置
- 异味规则独立管理（模糊词汇/缺失性/矛盾性/自定义异味）

### 3. 基准需求库
- 右侧边栏展示基准版本树
- 支持版本链浏览、删除预览（波及子孙版本提示）
- 基准详情页支持版本对比和积木块查看

### 4. 智能评估
- 四步流程：选择模式 → 输入需求 → 选择标准 → 查看报告
- 支持文本输入和文档上传两种模式
- 卡片化编辑器：需求按积木块组织，支持新增/修改/删除/未变更标记
- 草稿-提交模式：先创建草稿，编辑卡片后提交评估
- 状态轮询机制：兼容后端长任务处理，实时显示进度
- AI 生成问题诊断与优化建议

### 5. 管理后台
- 大模型配置管理（新增/编辑/激活/删除）
- 评估标准与异味规则的分类管理
- 标准文件上传与向量化入库

### 6. 历史记录
- 聚合视图：按基准版本树分组展示
- 独立评估按项目名分组
- 支持异步加载详情及跨版本管理
