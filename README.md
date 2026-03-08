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
├── store/           # Pinia 状态管理 (核心逻辑)
│   ├── index.ts     # 主 Store (包含评估逻辑、历史记录、基准管理)
├── views/           # 页面视图
│   ├── User.vue     # 主工作台页面
├── App.vue          # 根组件
├── main.ts          # 入口文件
└── style.css        # 全局样式 (Tailwind 引入)
```

## ⚙️ 配置说明

本项目使用 `.env` 文件进行环境变量配置。

### 环境变量
在根目录创建 `.env` 文件：

```env
# API 基础路径 (若对接真实后端)
VITE_API_BASE_URL=http://localhost:8080/api

# 其他配置
VITE_APP_TITLE=需求评估系统
```

### 代理配置 (vite.config.ts)
如果需要解决跨域问题，可以在 `vite.config.ts` 中配置代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://backend-service:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

---

## 📝 功能模块

1.  **评估标准管理**: 支持查看预置标准（如 ISO-29119）及上传自定义标准。
2.  **基准需求库**: 管理历史优秀的基准需求，支持版本控制和增量评估。
3.  **智能评估**:
    - 支持文本输入或文件上传。
    - 多维度评分（完整性、一致性、可测试性）。
    - AI 生成问题诊断与优化建议。
4.  **历史记录**: 查看过往评估记录，支持归档为基准需求。

## 🤝 贡献指南

1.  Fork 本仓库
2.  创建特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 许可证

[MIT](LICENSE)
