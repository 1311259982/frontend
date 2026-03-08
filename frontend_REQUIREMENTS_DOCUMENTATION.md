# 需求文档可测试性评估系统 - 需求规格说明书

> **文档版本**: v1.0.0  
> **文档日期**: 2026-03-08  
> **系统名称**: 需求文档可测试性评估系统  
> **技术架构**: Vue 3 + TypeScript + Element Plus + Pinia

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心功能模块](#2-核心功能模块)
3. [非功能需求](#3-非功能需求)
4. [交互设计规范](#4-交互设计规范)
5. [数据结构定义](#5-数据结构定义)
6. [技术栈说明](#6-技术栈说明)
7. [关键技术实现细节](#7-关键技术实现细节)
8. [API接口规范](#8-api接口规范)

---

## 1. 产品概述

### 1.1 产品定位

需求文档可测试性评估系统是一个基于大语言模型（LLM）的智能化需求评估平台，旨在帮助产品经理、需求分析师和测试工程师快速评估需求文档的可测试性，识别需求中的模糊性、不完整性和潜在测试难点，提供专业的改进建议。

### 1.2 目标用户

| 用户角色 | 职责描述 | 权限级别 |
|---------|---------|---------|
| 产品经理 | 提交需求文档进行评估，查看评估结果，管理评估历史 | 普通用户 |
| 需求分析师 | 引用基准需求，进行增量评估，归档评估结果 | 普通用户 |
| 系统管理员 | 管理AI模型配置，维护知识库标准，管理基准需求文档 | 管理员 |

### 1.3 核心价值

- **智能化评估**: 基于LLM自动分析需求文档的可测试性，提供0-100分评分
- **多标准支持**: 支持国际标准、公司标准、项目组标准等多种评估维度
- **增量评估**: 支持基于历史基准需求的增量评估，识别新增内容的测试性
- **历史追溯**: 完整的评估历史记录，支持版本管理和基准归档
- **灵活配置**: 管理员可自定义AI模型、评估标准和系统提示词

---

## 2. 核心功能模块

### 2.1 用户认证模块

#### 2.1.1 功能描述

提供用户登录认证功能，支持产品经理和管理员两种角色登录，根据角色权限跳转到相应的工作界面。

#### 2.1.2 用户流程

```
用户访问系统 → 输入用户名 → 选择角色 → 点击登录 → 系统验证 → 跳转至对应页面
```

#### 2.1.3 界面元素

| 元素名称 | 组件类型 | 说明 |
|---------|---------|------|
| 用户名输入框 | Input | 支持输入任意用户名，默认值"Demo User" |
| 角色选择器 | Radio Group | 提供"产品经理"和"管理员"两个选项 |
| 登录按钮 | Button | 触发登录操作，显示加载状态 |
| 系统标题 | Text | "需求文档评估系统" + 英文副标题 |

#### 2.1.4 交互逻辑

- 点击登录按钮后，按钮显示加载状态（800ms模拟延迟）
- 登录成功后，根据角色跳转：
  - 产品经理 → `/` (User.vue)
  - 管理员 → `/admin` (Admin.vue)
- 用户信息存储在Pinia Store中，包含username和role
- 支持退出登录，清除用户信息并跳转至登录页

---

### 2.2 需求评估模块（普通用户）

#### 2.2.1 功能描述

提供完整的需求文档评估流程，包括选择评估标准、提交需求内容、配置评估参数、查看评估结果四个步骤。

#### 2.2.2 用户流程

```
选择评估标准 → 提交需求内容（文本/文档）→ 引用基准需求（可选）→ 配置评估参数 → 启动评估 → 查看结果 → 归档基准（可选）
```

#### 2.2.3 界面布局

采用三栏布局设计：

| 区域 | 宽度占比 | 功能描述 |
|-----|---------|---------|
| 左侧边栏 | 20% | 评估标准选择面板，支持分类浏览和搜索 |
| 中间主区 | 55% | 需求输入、评估配置、结果展示 |
| 右侧面板 | 25% | 评估历史记录、基准需求引用 |

#### 2.2.4 步骤一：选择评估标准

**界面元素**:
- 标准分类折叠面板（国际标准、公司标准、项目组标准、自定义文档）
- 文件列表，每个文件包含：
  - 复选框（用于选择）
  - 文件名称
  - 描述提示图标（悬停显示文件描述）
- 搜索框（支持按名称搜索标准文件）
- 已选文档摘要区域（显示已选数量和标签列表）

**交互逻辑**:
- 点击分类标题可展开/折叠该分类下的文件列表
- 点击文件或复选框可选中/取消选中该文件
- 至少需要选择1个评估标准才能进入下一步
- 支持实时搜索，输入关键词后过滤显示匹配的文件
- 已选文档以标签形式展示，可点击关闭按钮取消选择

**数据结构**:
```typescript
interface StandardFile {
  id: number;
  name: string;
  status: 'enabled' | 'disabled';
  desc: string;
}

interface StandardCategory {
  id: number;
  name: string;
  type: 'default' | 'user';
  files: StandardFile[];
}
```

#### 2.2.5 步骤二：提交需求内容

**界面元素**:
- 需求类型切换器（文本输入 / 文档上传）
- 项目名称输入框（当未引用基准时显示）
- 需求标题输入框
- 文本输入区域（12行文本框，支持实时字数统计）
- 文档上传区域（拖拽上传，支持PDF、DOCX、TXT格式）
- 引用历史基准需求按钮
- 基准上下文展示区域（当引用基准后显示）
- 仅评估新增内容开关（当引用基准后显示）
- 补充评估指令输入框（可选）

**交互逻辑**:
- 需求类型切换：
  - 文本模式：显示文本输入框，支持输入任意长度的需求文本
  - 文档模式：显示上传区域，支持拖拽或点击上传
- 引用基准需求：
  - 点击按钮打开右侧基准需求抽屉
  - 选择基准后，基准信息以卡片形式展示
  - 可查看基准全文、取消引用
- 仅评估新增内容：
  - 开启：仅对新增内容进行评分
  - 关闭：生成三维评分（新增、一致性、整体）
- 文档上传：
  - 支持拖拽上传
  - 上传成功后显示文件信息（名称、大小）
  - 可移除已上传文件

**数据结构**:
```typescript
interface RequirementInput {
  type: 'text' | 'document';
  projectName: string;
  title: string;
  textContent: string;
  uploadedFile: {
    name: string;
    size: string;
    file_id?: number;
  } | null;
  referencedBaselineIds: number[];
  onlyEvaluateNew: boolean;
  instructions: string;
}
```

#### 2.2.6 步骤三：评估参数配置

**界面元素**:
- 评估深度滑块（1-3级）
- AI模型选择下拉框（GPT-4o、Claude 3.5、Gemini 1.5 Pro等）
- 启动评估按钮

**交互逻辑**:
- 评估深度：控制评估的详细程度
- 模型选择：显示可用模型列表，推荐模型标记"(推荐)"
- 点击启动评估后：
  - 显示评估进度（圆形进度条）
  - 显示当前处理状态文本
  - 评估完成后自动跳转至结果页面

**数据结构**:
```typescript
interface EvaluationSettings {
  depth: number;
  model: string;
}
```

#### 2.2.7 步骤四：查看评估结果

**界面元素**:
- 综合评分展示（大字号数字 + 环形进度条）
- 评分等级标签（优秀/良好/一般/较差）
- 问题点列表（可展开/折叠）
- 改进建议区域
- 操作按钮组：
  - 重新评估
  - 归档为基准需求
  - 导出报告
  - 返回首页

**交互逻辑**:
- 评分展示：
  - 0-59分：较差（红色）
  - 60-79分：一般（橙色）
  - 80-89分：良好（蓝色）
  - 90-100分：优秀（绿色）
- 问题点列表：
  - 每个问题点可点击展开查看详情
  - 支持复制问题点文本
- 归档为基准需求：
  - 点击后弹出归档配置对话框
  - 填写基准名称、需求标题、共享范围
  - 归档成功后添加至基准需求库

**数据结构**:
```typescript
interface EvaluationReport {
  id: number;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  issues: string[];
  suggestions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}
```

#### 2.2.8 评估历史管理

**界面元素**:
- 历史记录列表（按项目分组）
- 每条记录显示：
  - 需求标题
  - 评分
  - 评估日期
  - 使用的模型
  - 引用的基准（如有）
  - 操作按钮（查看详情、归档、删除）

**交互逻辑**:
- 历史记录按项目名称分组显示
- 支持按项目名称搜索过滤
- 点击记录可查看详细评估报告
- 支持将评估结果归档为基准需求
- 支持删除历史记录（仅本地删除）

**数据结构**:
```typescript
interface EvaluationHistoryItem {
  id: number;
  projectName: string;
  title: string;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  version: string;
  date: string;
  model: string;
  is_archived: boolean;
  has_reference: boolean;
  references: string[];
}
```

---

### 2.3 管理后台模块（管理员）

#### 2.3.1 功能描述

提供系统配置和管理功能，包括AI模型管理、知识库标准管理、基准需求管理、系统设置等。

#### 2.3.2 界面布局

采用左侧导航 + 右侧内容区的经典布局：

| 区域 | 宽度 | 功能描述 |
|-----|------|---------|
| 左侧导航栏 | 256px | 功能菜单导航 |
| 右侧内容区 | 自适应 | 各功能模块的具体内容 |

#### 2.3.3 AI模型管理

**界面元素**:
- 模型卡片列表（网格布局，每行3个）
- 每个模型卡片显示：
  - 模型名称和厂商
  - 状态标签（可用/离线）
  - API Key（脱敏显示）
  - 调用次数统计
  - 编辑和删除按钮
- 新增模型按钮

**交互逻辑**:
- 点击"新增配置"打开新增模型对话框
- 对话框包含：
  - 模型名称输入
  - 厂商选择（OpenAI、Anthropic、Google、Zhipu）
  - API Key输入（密码类型）
  - Base URL输入（可选）
- 点击编辑打开编辑对话框，支持修改所有字段
- 点击删除弹出确认对话框，确认后删除模型

**数据结构**:
```typescript
interface AIModel {
  id: number;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Zhipu';
  apiKey: string;
  baseUrl?: string;
  status: 'available' | 'unavailable';
  usageCount: number;
}
```

#### 2.3.4 知识库标准管理

**界面元素**:
- 系统默认分组区域（管理员管控）
  - 分类卡片列表
  - 每个卡片显示分类名称和文件数量
  - 支持添加新分类、删除分类
- 用户自定义分组区域（用户归档）
  - 分类卡片列表
  - 支持添加新分类、删除分类
- 选中分类的文件列表表格
  - 列：标准名称、关联基准、状态、最后更新、操作
  - 支持上传标准文件、预览、删除

**交互逻辑**:
- 点击分类卡片选中该分类，显示其文件列表
- 点击"添加分类"打开对话框，输入分类名称
- 点击分类卡片上的删除按钮可删除该分类
- 点击"上传标准"打开文件选择对话框
- 文件列表支持：
  - 切换文件启用/禁用状态
  - 预览文件内容
  - 删除文件

**数据结构**:
```typescript
interface KnowledgeCategory {
  id: number;
  name: string;
  type: 'default' | 'user';
  files: StandardFile[];
}
```

#### 2.3.5 基准需求管理

**界面元素**:
- 统计仪表板（4个指标卡片）
  - 总基准数
  - 公开基准数
  - 私有基准数
  - 总引用次数
- 基准需求分类区域
  - 分类卡片列表
  - 每个卡片显示分类名称、类型、文件数量
- 选中分类的基准文档列表表格
  - 列：需求文档名称、归档人、共享范围、引用次数、状态、操作
  - 支持预览、编辑、删除

**交互逻辑**:
- 点击分类卡片选中该分类，显示其基准文档列表
- 点击"新增分类"打开对话框，输入分类名称
- 基准文档列表支持：
  - 切换文档启用/禁用状态
  - 预览文档内容
  - 编辑文档信息
  - 删除文档（及其所有子版本）

**数据结构**:
```typescript
interface BaselineRequirement {
  id: number;
  name: string;
  title: string;
  version: string;
  author: string;
  date: string;
  score: number;
  refCount: number;
  scope: 'public' | 'private';
  status: 'enabled' | 'disabled';
  desc: string;
  parent_base_id: number | null;
  is_latest: boolean;
  full_content: string;
  categoryId: number;
  categoryType: 'default' | 'user';
}
```

#### 2.3.6 系统设置

**界面元素**:
- 系统提示词配置卡片
  - 文本输入框（5行）
  - 保存按钮
- 评估标准格式配置卡片
  - 文本输入框（5行）
  - 保存按钮

**交互逻辑**:
- 系统提示词：配置AI评估时的核心指令
- 评估标准格式：定义评估报告的输出结构和评分标准
- 点击保存按钮后，配置立即生效

**数据结构**:
```typescript
interface SystemPrompts {
  system: string;
  format: string;
}
```

---

## 3. 非功能需求

### 3.1 性能指标

| 指标项 | 要求 | 说明 |
|-------|------|------|
| 页面加载时间 | < 2秒 | 首屏渲染完成时间 |
| API响应时间 | < 500ms | 大部分API请求响应时间 |
| 文件上传速度 | > 1MB/s | 支持大文件上传 |
| 评估任务处理 | < 30秒 | 典型需求文档评估时间 |
| 并发用户数 | > 100 | 支持同时在线用户数 |

### 3.2 兼容性要求

| 浏览器 | 版本要求 | 说明 |
|-------|---------|------|
| Chrome | >= 90 | 推荐浏览器 |
| Firefox | >= 88 | 完全支持 |
| Safari | >= 14 | 完全支持 |
| Edge | >= 90 | 完全支持 |

**操作系统**:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

**分辨率**:
- 最低分辨率: 1366 x 768
- 推荐分辨率: 1920 x 1080

### 3.3 安全规范

| 安全项 | 要求 | 实现方式 |
|-------|------|---------|
| 用户认证 | Bearer Token | JWT Token存储在localStorage |
| API鉴权 | Token验证 | 所有API请求携带Authorization头 |
| 敏感信息保护 | 脱敏显示 | API Key等敏感信息部分隐藏 |
| XSS防护 | 输入过滤 | Vue自动转义，Element Plus内置防护 |
| CSRF防护 | Token验证 | 后端验证请求来源 |
| 文件上传安全 | 格式验证 | 仅允许PDF、DOCX、TXT格式 |

### 3.4 可用性要求

- **易学性**: 新用户无需培训即可完成首次评估
- **容错性**: 所有操作提供明确的错误提示和恢复机制
- **可访问性**: 支持键盘导航，符合WCAG 2.1 AA标准
- **响应式**: 适配不同屏幕尺寸，支持移动端浏览

---

## 4. 交互设计规范

### 4.1 色彩系统

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 主色调 | #3b82f6 | 主要按钮、链接、强调元素 |
| 成功色 | #10b981 | 成功状态、通过标识 |
| 警告色 | #f59e0b | 警告状态、待处理标识 |
| 危险色 | #ef4444 | 错误状态、删除操作 |
| 信息色 | #6366f1 | 提示信息、说明文字 |
| 中性灰 | #6b7280 | 次要文字、边框 |
| 背景色 | #f9fafb | 页面背景、卡片背景 |

### 4.2 字体规范

| 字体类型 | 字体族 | 字号 | 用途 |
|---------|-------|------|------|
| 标题 | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto | 24px/20px/18px | 页面标题、区块标题 |
| 正文 | 同上 | 14px/16px | 正文内容、描述文字 |
| 辅助 | 同上 | 12px/10px | 提示信息、标签文字 |
| 代码 | 'Courier New', monospace | 13px | 代码片段、ID显示 |

### 4.3 间距规范

| 间距类型 | 值 | 用途 |
|---------|---|------|
| 极小间距 | 4px | 图标与文字间距 |
| 小间距 | 8px | 相关元素间距 |
| 中间距 | 16px | 区块内元素间距 |
| 大间距 | 24px | 区块间距 |
| 超大间距 | 32px | 页面区块间距 |

### 4.4 圆角规范

| 元素类型 | 圆角值 | 示例 |
|---------|-------|------|
| 按钮 | 8px | 主要按钮、次要按钮 |
| 卡片 | 16px | 信息卡片、表单卡片 |
| 输入框 | 8px | 文本输入、下拉选择 |
| 标签 | 999px | 圆形标签、状态标签 |

### 4.5 阴影规范

| 阴影类型 | CSS值 | 用途 |
|---------|-------|------|
| 轻微阴影 | 0 1px 2px rgba(0,0,0,0.05) | 默认卡片 |
| 中等阴影 | 0 4px 6px rgba(0,0,0,0.1) | 悬浮卡片 |
| 强阴影 | 0 10px 15px rgba(0,0,0,0.1) | 弹窗、抽屉 |
| 彩色阴影 | 0 4px 6px rgba(59,130,246,0.2) | 强调元素 |

### 4.6 动画规范

| 动画类型 | 时长 | 缓动函数 | 用途 |
|---------|------|---------|------|
| 淡入淡出 | 200ms | ease-in-out | 页面切换、弹窗显示 |
| 滑动 | 300ms | cubic-bezier(0.4,0,0.2,1) | 抽屉、侧边栏 |
| 缩放 | 200ms | ease-out | 按钮点击反馈 |
| 旋转 | 300ms | ease-in-out | 折叠图标 |

---

## 5. 数据结构定义

### 5.1 用户认证数据

```typescript
interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  role: 'admin' | 'user';
  isLoggedIn: boolean;
}
```

### 5.2 评估标准数据

```typescript
interface StandardFile {
  id: number;
  name: string;
  status: 'enabled' | 'disabled';
  desc?: string;
}

interface StandardCategory {
  id: number;
  name: string;
  type: 'default' | 'user';
  files: StandardFile[];
}

interface KnowledgeState {
  searchQuery: string;
  activeTab: 'standards' | 'baselines';
  categories: StandardCategory[];
  selectedFiles: number[];
  selectedUserFiles: number[];
  collapsedCategories: number[];
  isLoaded: boolean;
}
```

### 5.3 基准需求数据

```typescript
interface BaselineRequirement {
  id: number;
  name: string;
  title: string;
  version: string;
  author: string;
  date: string;
  score: number;
  refCount: number;
  scope: 'public' | 'private';
  status: 'enabled' | 'disabled';
  desc: string;
  parent_base_id: number | null;
  is_latest: boolean;
  full_content: string;
  categoryId: number;
  categoryType: 'default' | 'user';
}

interface BaselineState {
  searchQuery: string;
  categories: {
    id: number;
    name: string;
    type: 'default' | 'user';
    files: BaselineRequirement[];
  }[];
  isLoaded: boolean;
}
```

### 5.4 评估任务数据

```typescript
interface EvaluationReport {
  id: number;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  issues: string[];
  suggestions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

interface EvaluationHistoryItem {
  id: number;
  projectName: string;
  title: string;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  version: string;
  date: string;
  model: string;
  is_archived: boolean;
  has_reference: boolean;
  references: string[];
  issues?: string[];
  suggestions?: string;
}

interface EvaluationState {
  currentStep: number;
  requirementType: 'text' | 'document';
  requirementTitle: string;
  projectName: string;
  textContent: string;
  uploadedFile: {
    name: string;
    size: string;
    file_id?: number;
  } | null;
  referencedBaselineIds: number[];
  onlyReference: boolean;
  instructions: string;
  isEvaluating: boolean;
  evaluationProgress: number;
  currentReport: EvaluationReport | null;
  onlyEvaluateNew: boolean;
  history: EvaluationHistoryItem[];
  isHistoryLoaded: boolean;
}
```

### 5.5 AI模型数据

```typescript
interface AIModel {
  id: number;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Zhipu';
  apiKey: string;
  baseUrl?: string;
  status: 'available' | 'unavailable';
  usageCount: number;
}

interface ModelState {
  models: AIModel[];
  prompts: {
    system: string;
    format: string;
  };
}
```

---

## 6. 技术栈说明

### 6.1 核心框架

| 技术 | 版本 | 用途 |
|-----|------|------|
| Vue.js | 3.5.29 | 前端核心框架，提供响应式数据绑定和组件化开发 |
| TypeScript | 5.8.2 | 类型安全的JavaScript超集，提供静态类型检查 |
| Vite | 6.2.0 | 现代化构建工具，提供快速的开发服务器和热更新 |

### 6.2 UI组件库

| 技术 | 版本 | 用途 |
|-----|------|------|
| Element Plus | 2.13.3 | Vue 3组件库，提供丰富的UI组件 |
| @element-plus/icons-vue | 2.3.2 | Element Plus图标库 |
| Tailwind CSS | 4.1.14 | 实用优先的CSS框架，提供原子化样式类 |

### 6.3 状态管理

| 技术 | 版本 | 用途 |
|-----|------|------|
| Pinia | 3.0.4 | Vue 3官方状态管理库，替代Vuex |

### 6.4 路由管理

| 技术 | 版本 | 用途 |
|-----|------|------|
| Vue Router | 5.0.3 | Vue官方路由管理器，提供页面导航和路由守卫 |

### 6.5 HTTP客户端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Axios | 1.13.6 | HTTP客户端，提供请求拦截和响应拦截 |

### 6.6 开发工具

| 技术 | 版本 | 用途 |
|-----|------|------|
| TypeScript Compiler | 5.8.2 | TypeScript编译器 |
| @vitejs/plugin-vue | 6.0.4 | Vite的Vue插件 |
| @tailwindcss/vite | 4.1.14 | Tailwind CSS的Vite插件 |

### 6.7 项目结构

```
d:\BCsystem\frontend\
├── src/
│   ├── router/          # 路由配置
│   │   └── index.ts     # 路由定义和守卫
│   ├── services/        # API服务层
│   │   ├── index.ts     # 服务统一入口
│   │   ├── api.ts       # 真实API服务
│   │   └── mock.ts      # 模拟数据服务
│   ├── store/           # Pinia状态管理
│   │   └── index.ts     # 所有Store定义
│   ├── views/           # 页面组件
│   │   ├── Login.vue    # 登录页
│   │   ├── User.vue     # 用户评估页
│   │   └── Admin.vue    # 管理后台页
│   ├── App.vue          # 根组件
│   ├── main.ts          # 应用入口
│   └── index.css        # 全局样式
├── .env.example         # 环境变量示例
├── package.json         # 项目依赖配置
├── tsconfig.json        # TypeScript配置
└── vite.config.ts       # Vite构建配置
```

---

## 7. 关键技术实现细节

### 7.1 服务层架构

系统采用分层架构设计，通过环境变量 `VITE_USE_MOCK` 实现真实API和模拟数据的透明切换。

**服务层统一入口** ([services/index.ts](file:///d:/BCsystem/frontend/src/services/index.ts)):
```typescript
const isMock = import.meta.env.VITE_USE_MOCK === 'true';
export const service = isMock ? mockService : apiService;
```

**优势**:
- 开发阶段可使用模拟数据，无需依赖后端
- 生产环境切换为真实API，无需修改业务代码
- 便于单元测试和集成测试

### 7.2 状态管理架构

使用Pinia实现模块化状态管理，每个功能模块对应一个独立的Store。

**Store模块划分** ([store/index.ts](file:///d:/BCsystem/frontend/src/store/index.ts)):
1. **AuthStore**: 用户认证状态
2. **ModelStore**: AI模型配置
3. **KnowledgeStore**: 知识库标准管理
4. **BaselineStore**: 基准需求管理
5. **EvaluationStore**: 评估任务管理

**Store设计模式**:
- State: 定义响应式状态
- Getters: 计算属性，派生状态
- Actions: 异步操作和状态修改

### 7.3 路由守卫机制

实现基于角色的访问控制，确保用户只能访问其权限范围内的页面。

**路由守卫实现** ([router/index.ts](file:///d:/BCsystem/frontend/src/router/index.ts)):
```typescript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.role && authStore.role !== to.meta.role) {
    if (to.meta.role === 'admin' && authStore.role !== 'admin') {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});
```

### 7.4 评估任务轮询机制

实现异步评估任务的进度轮询，确保用户能够实时查看评估进度。

**轮询实现逻辑**:
1. 发起评估任务，获取evaluation_id
2. 启动定时器，每500ms轮询一次任务状态
3. 根据返回的progress更新进度条
4. 任务完成后停止轮询，显示评估结果

**关键代码**:
```typescript
const pollEvaluationStatus = async (evaluationId: number) => {
  const timer = setInterval(async () => {
    const result = await getEvaluationStatus(evaluationId);
    evalStore.evaluationProgress = result.progress;
    
    if (result.status === 'completed') {
      clearInterval(timer);
      evalStore.currentReport = result.report;
      evalStore.isEvaluating = false;
    }
  }, 500);
};
```

### 7.5 增量评估逻辑

支持基于历史基准需求的增量评估，识别新增内容的测试性。

**增量评估流程**:
1. 用户选择基准需求作为上下文
2. 提交新增需求内容
3. 系统将基准需求和新增内容合并发送给AI
4. AI生成三维评分：
   - 新增内容评分
   - 一致性评分（与基准的一致程度）
   - 整体评分（综合评分）

**版本管理**:
- 基准需求支持版本管理，每个版本有唯一的version标识
- 归档新版本时，自动计算版本号（如V1.0 → V1.1）
- 旧版本的is_latest标记自动更新为false

### 7.6 文件上传处理

支持需求文档和标准文件的上传，提供拖拽上传和点击上传两种方式。

**文件上传流程**:
1. 用户选择文件（拖拽或点击）
2. 前端验证文件格式（PDF、DOCX、TXT）
3. 调用上传API，获取file_id
4. 显示上传成功的文件信息
5. 将file_id保存到评估任务中

**支持的文件格式**:
- PDF (.pdf)
- Word文档 (.docx)
- 纯文本 (.txt)

### 7.7 错误处理机制

实现统一的错误处理机制，提供友好的错误提示。

**错误处理策略**:
1. HTTP拦截器统一捕获错误
2. 根据错误码显示对应的错误消息
3. 网络错误时提供重试机制
4. 业务逻辑错误时提供具体的问题描述

**错误响应格式**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": {
    "standard_ids": "至少需要选择 1 个评估标准"
  }
}
```

### 7.8 响应式设计

采用Tailwind CSS实现响应式布局，适配不同屏幕尺寸。

**断点设置**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**响应式策略**:
- 小屏幕：隐藏侧边栏，使用抽屉式导航
- 中等屏幕：调整布局比例，优化信息展示
- 大屏幕：完整展示所有功能模块

---

## 8. API接口规范

### 8.1 认证接口

#### 8.1.1 用户登录

- **Endpoint**: `POST /api/auth/login`
- **Auth**: 不需要
- **Request Body**:
```json
{
  "username": "admin",
  "password": "your_password"
}
```
- **Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 8.2 评估任务接口

#### 8.2.1 发起评估任务

- **Endpoint**: `POST /api/evaluations`
- **Auth**: 必须
- **Request Body**:
```json
{
  "project_name": "电商系统",
  "requirement_title": "订单模块需求V2",
  "requirement_type": "text",
  "text_content": "1. 用户应能在5秒内完成下单流程...",
  "document_file_id": null,
  "standard_ids": [101, 201],
  "referenced_baseline_id": 1001,
  "only_evaluate_new": false,
  "instructions": "重点关注性能指标的可测试性"
}
```
- **Response** `202 Accepted`:
```json
{
  "evaluation_id": 10086,
  "status": "processing"
}
```

#### 8.2.2 轮询评估状态

- **Endpoint**: `GET /api/evaluations/{id}/status`
- **Auth**: 必须
- **Response** `200 OK`:
```json
{
  "status": "processing",
  "progress": 65
}
```
- **Response** `200 OK` (完成):
```json
{
  "status": "completed",
  "progress": 100,
  "report": {
    "total_score": 82,
    "task_type": "incremental",
    "parent_base_id": 1001,
    "issues": [
      "需求 ID: REQ-001 描述中存在二义性词汇..."
    ],
    "suggestions": "建议针对性能需求补充具体的 SLA 指标..."
  }
}
```

#### 8.2.3 获取评估历史列表

- **Endpoint**: `GET /api/evaluations`
- **Auth**: 必须
- **Query Params**:
  - `project_name` (可选): 按项目名称过滤
  - `page` (可选, 默认 1)
  - `page_size` (可选, 默认 20)
- **Response** `200 OK`:
```json
{
  "total": 42,
  "items": [
    {
      "id": 10086,
      "project_name": "电商系统",
      "title": "订单模块需求V2",
      "total_score": 82,
      "task_type": "incremental",
      "parent_base_id": 1001,
      "version": "V1.2",
      "date": "2024-06-01",
      "model": "GPT-4o",
      "is_archived": false,
      "has_reference": true
    }
  ]
}
```

#### 8.2.4 获取单条评估详情

- **Endpoint**: `GET /api/evaluations/{id}`
- **Auth**: 必须
- **Response** `200 OK`:
```json
{
  "id": 10086,
  "project_name": "电商系统",
  "title": "订单模块需求V2",
  "total_score": 82,
  "task_type": "incremental",
  "parent_base_id": 1001,
  "version": "V1.2",
  "date": "2024-06-01",
  "is_archived": false,
  "issues": ["..."],
  "suggestions": "..."
}
```

#### 8.2.5 归档评估结果为基准需求

- **Endpoint**: `POST /api/evaluations/{id}/archive`
- **Auth**: 必须
- **Request Body**:
```json
{
  "baseline_name": "电商系统",
  "requirement_title": "订单模块需求V2",
  "scope": "private"
}
```
- **Response** `201 Created`:
```json
{
  "baseline_id": 2001,
  "version": "V1.2",
  "message": "归档成功"
}
```

#### 8.2.6 取消评估任务

- **Endpoint**: `DELETE /api/evaluations/{id}`
- **Auth**: 必须
- **Response** `204 No Content`

### 8.3 基准需求接口

#### 8.3.1 获取基准需求列表

- **Endpoint**: `GET /api/baselines`
- **Auth**: 必须
- **Query Params**:
  - `scope`: `"public"` | `"private"` | `"all"` (默认 `"all"`)
  - `search`: 名称关键词搜索
- **Response** `200 OK`:
```json
[
  {
    "id": 1001,
    "name": "电商核心交易基准需求",
    "title": "电商核心交易基准需求",
    "version": "V1.0",
    "author": "管理员",
    "date": "2024-01-15",
    "score": 92,
    "ref_count": 45,
    "scope": "public",
    "status": "enabled",
    "desc": "公司级核心交易链路基准文档。",
    "parent_base_id": null,
    "is_latest": true,
    "category_id": 1,
    "category_type": "default"
  }
]
```

#### 8.3.2 创建基准需求

- **Endpoint**: `POST /api/baselines`
- **Auth**: 必须
- **Request Body**:
```json
{
  "name": "电商系统",
  "title": "订单模块需求V2",
  "desc": "由评估报告归档生成的基准需求文档。",
  "score": 82,
  "scope": "private",
  "parent_base_id": 1001,
  "full_content": "1. 用户应能在5秒内完成下单流程..."
}
```
- **Response** `201 Created`:
```json
{
  "id": 2001,
  "name": "电商系统",
  "version": "V1.2",
  "date": "2024-06-01"
}
```

#### 8.3.3 删除基准需求

- **Endpoint**: `DELETE /api/baselines/{id}`
- **Auth**: 必须
- **Response** `204 No Content`

### 8.4 评估标准（知识库）接口

#### 8.4.1 获取标准分类及文件列表

- **Endpoint**: `GET /api/standards`
- **Auth**: 必须
- **Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "国际标准",
    "type": "default",
    "files": [
      {
        "id": 101,
        "name": "ISO-29119.pdf",
        "status": "enabled",
        "desc": "软件测试国际标准，涵盖测试过程、文档、技术等。"
      }
    ]
  }
]
```

#### 8.4.2 上传标准文件

- **Endpoint**: `POST /api/standards/{categoryId}/files`
- **Auth**: 必须
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `file` (binary)
- **Response** `201 Created`:
```json
{
  "file_id": 302,
  "name": "my-standard.pdf",
  "size": "256.5 KB"
}
```

### 8.5 文件上传接口

#### 8.5.1 上传需求文档

- **Endpoint**: `POST /api/uploads/requirement`
- **Auth**: 必须
- **Content-Type**: `multipart/form-data`
- **支持格式**: PDF, DOCX, TXT
- **Form Fields**: `file` (binary)
- **Response** `201 Created`:
```json
{
  "file_id": 5001,
  "name": "requirement-v2.docx",
  "size": "128.3 KB"
}
```

### 8.6 错误码说明

| HTTP状态码 | 错误码 | 说明 |
|-----------|-------|------|
| `400` | `VALIDATION_ERROR` | 请求参数校验失败 |
| `401` | `UNAUTHORIZED` | 未认证或Token无效 |
| `403` | `FORBIDDEN` | 无权限访问该资源 |
| `404` | `NOT_FOUND` | 资源不存在 |
| `409` | `CONFLICT` | 资源冲突 |
| `422` | `EVALUATION_FAILED` | AI模型评估失败 |
| `500` | `INTERNAL_ERROR` | 服务端内部错误 |

---

## 附录

### A. 环境变量配置

```env
# API基础URL
VITE_API_BASE_URL=http://localhost:8000

# 是否使用模拟数据
VITE_USE_MOCK=false

# Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

### B. 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run lint
```

### C. 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

---

**文档结束**
