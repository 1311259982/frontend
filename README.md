# 需求文档可测试性评估系统 (Requirement Testability Evaluation System)

本项目是一个基于 Vue 3 + TypeScript + Vite 的前端应用，旨在通过 AI 辅助评估需求文档的可测试性，提供评分、问题诊断及优化建议。

## 🚀 快速开始

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

---

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia
- **UI 组件库**: Element Plus
- **样式**: Tailwind CSS
- **图标**: @element-plus/icons-vue
- **路由**: Vue Router (目前主要为单页应用)

---

## 📂 项目结构

```
src/
├── assets/          # 静态资源 (图片, logo 等)
├── components/      # 公共组件
├── router/          # 路由配置
├── services/        # [NEW] 服务层 (API 调用与模拟数据)
│   ├── api.ts       # 真实 HTTP 请求 (axios)
│   ├── mock.ts      # 模拟数据服务 (包含所有假数据逻辑)
│   └── index.ts     # 服务统一入口，控制 Mock/Real 切换
├── store/           # Pinia 状态管理
│   ├── index.ts     # 重构后的 Store (通过 service 异步加载数据)
├── views/           # 页面视图
│   ├── User.vue     # 主工作台页面 (已重构为状态轮询模式)
│   ├── Admin.vue    # 管理后台
├── App.vue          # 根组件
├── main.ts          # 入口文件
└── index.css        # 全局样式 (Tailwind 引入)
```

## ⚙️ 配置与开发模式

本项目支持 **前端模拟 (Mock)** 和 **真实后端 (Real API)** 两种模式，通过 `.env.development` 文件无缝切换。

### 环境变量配置

在根目录创建或编辑 `.env.development` 文件：

```env
# 是否使用前端模拟数据 (true=开启模拟, false=连接真实后端)
VITE_USE_MOCK=true

# 后端 API 基础地址 (仅在 VITE_USE_MOCK=false 时生效)
VITE_API_BASE_URL=http://localhost:8000
```

### 模式说明

-   **模拟模式 (Mock Mode)**: 默认开启。UI 功能完整（进度条动画、评分生成、归档等），所有数据操作在内存中模拟完成，不会发送真实网络请求。适合纯 UI 开发和演示。
-   **真实模式 (Real API Mode)**: 将 `VITE_USE_MOCK` 设为 `false`。前端将按照标准的 RESTful API 向 `VITE_API_BASE_URL` 发送请求。

---

## 📝 后端开发参考

为了方便后端联调，本项目提供了详尽的设计文档：

1.  **[API 接口文档](./API_DOCUMENTATION.md)**: 包含 7 大模块、30+ 端点的详细定义、请求参数、返回示例及错误码。
2.  **[数据库设计建议](./DATABASE_DESIGN.md)**: 提供 ER 关系图、DDL 语句、版本号逻辑建议及索引策略。

---

## 📝 功能模块

1.  **评估标准管理**: 支持查看预置标准（如 ISO-29119）及上传自定义标准。**所有标准数据均通过服务层异步加载，支持 Mock/Real 分离。**
2.  **基准需求库**: 管理历史优秀的基准需求，支持版本控制和增量评估。
3.  **智能评估**:
    - 支持文本输入或文件上传。
    - 状态轮询机制（兼容真实后端的长任务处理）。
    - AI 生成问题诊断与优化建议。
4.  **历史记录**: 查看过往评估记录，支持异步加载详情及跨版本管理。

## 🤝 贡献指南

1.  Fork 本仓库
2.  创建特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 许可证

[MIT](LICENSE)
