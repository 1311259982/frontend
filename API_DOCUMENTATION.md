# API 接口文档

本文档定义了前端应用与后端服务交互所需的 API 接口规范。

## 基础信息

- **Base URL**: `/api` (开发环境可通过 Vite 代理配置)
- **Content-Type**: `application/json` (文件上传除外)
- **认证方式**: Bearer Token (Header: `Authorization: Bearer <token>`)

## 1. 认证模块 (Auth)

### 1.1 用户登录
`POST /auth/login`

**请求参数:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "username": "Demo User",
      "role": "admin"
    }
  },
  "message": "登录成功"
}
```

### 1.2 获取用户信息
`GET /auth/me`

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "Demo User",
    "avatar": "https://..."
  }
}
```

---

## 2. 知识库/标准管理 (Standards)

### 2.1 获取标准列表
`GET /standards`

返回所有评估标准，按分类组织。

**响应参数:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "international",
      "name": "国际标准",
      "type": "system", // system=预置, user=用户自定义
      "files": [
        {
          "id": 1,
          "name": "ISO-29119.pdf",
          "desc": "软件测试标准...",
          "url": "/files/iso-29119.pdf"
        }
      ]
    }
  ]
}
```

### 2.2 上传标准文档
`POST /standards/upload`

**Content-Type**: `multipart/form-data`

**请求参数:**
- `file`: File (二进制文件)
- `categoryId`: String (分类ID)

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "id": 101,
    "name": "新上传的标准.docx",
    "categoryId": "custom-1"
  }
}
```

### 2.3 删除标准文档
`DELETE /standards/:id`

**响应参数:**
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 3. 基准需求管理 (Baselines)

### 3.1 获取基准需求列表
`GET /baselines`

返回基准需求及其历史版本树。

**响应参数:**
```json
{
  "code": 200,
  "data": [
    {
      "id": 10,
      "name": "电商核心交易基准需求",
      "score": 85,
      "date": "2024-05-20",
      "versions": [
        {
          "id": 11,
          "version": "V1.1",
          "is_latest": true,
          "score": 85,
          "date": "2024-05-20"
        }
      ]
    }
  ]
}
```

### 3.2 新增/归档基准需求
`POST /baselines`

将评估结果归档为新的基准需求或新版本。

**请求参数:**
```json
{
  "name": "用户中心权限管理V2",
  "desc": "归档描述",
  "score": 92,
  "parent_base_id": 10, // 可选，若为增量版本则传父ID
  "full_content": "需求全文内容...",
  "source_report_id": "eval-123" // 关联的评估报告ID
}
```

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "id": 20,
    "name": "用户中心权限管理V2"
  }
}
```

### 3.3 删除基准需求
`DELETE /baselines/:id`

删除基准需求及其所有历史版本。

---

## 4. 评估核心 (Evaluation)

### 4.1 提交评估任务
`POST /evaluate/submit`

**请求参数:**
```json
{
  "type": "text", // text 或 document
  "content": "需求文本内容...", // 若type=text
  "file_id": "temp-file-id", // 若type=document
  "reference_standards": [1, 2], // 选中的标准ID列表
  "reference_baseline_id": 10, // 可选，引用的基准ID
  "settings": {
    "depth": 2,
    "model": "gemini-pro"
  },
  "instructions": "补充指令..."
}
```

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "task_id": "task-abc-123",
    "status": "processing" // processing, completed, failed
  }
}
```

### 4.2 获取评估结果
`GET /evaluate/result/:taskId`

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "id": "task-abc-123",
    "status": "completed",
    "total_score": 85,
    "dimensions": [
      { "name": "完整性", "score": 90, "weight": 0.3 },
      { "name": "一致性", "score": 80, "weight": 0.3 },
      { "name": "可测试性", "score": 85, "weight": 0.4 }
    ],
    "issues": [
      "需求 ID: REQ-001 描述模糊..."
    ],
    "suggestions": "建议补充SLA指标...",
    "report_content": "Markdown 格式的完整报告..."
  }
}
```

### 4.3 获取评估历史
`GET /evaluate/history`

**响应参数:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "hist-1",
      "title": "用户中心需求评估",
      "date": "2024-05-18",
      "total_score": 62,
      "is_archived": false,
      "parent_base_id": null
    }
  ]
}
```

### 4.4 更新历史状态 (归档/取消归档)
`PATCH /evaluate/history/:id`

**请求参数:**
```json
{
  "is_archived": true
}
```

---

## 5. 通用接口

### 5.1 文件上传 (通用)
`POST /upload`

用于上传待评估的需求文档。

**响应参数:**
```json
{
  "code": 200,
  "data": {
    "file_id": "temp-file-123",
    "url": "/uploads/temp/doc.pdf",
    "name": "需求规格说明书.pdf"
  }
}
```
