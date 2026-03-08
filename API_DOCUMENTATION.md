# 需求可测试性评估系统 — API 接口文档

> **版本**: v1.0.0  
> **基础 URL**: `http://localhost:8000`  
> **认证方式**: Bearer Token（`Authorization: Bearer <token>`）  
> **数据格式**: JSON (`Content-Type: application/json`)

---

## 目录

1. [认证接口](#1-认证接口)
2. [评估任务接口](#2-评估任务接口)
3. [基准需求接口](#3-基准需求接口)
4. [评估标准（知识库）接口](#4-评估标准知识库接口)
5. [文件上传接口](#5-文件上传接口)
6. [数据模型定义](#6-数据模型定义)
7. [错误码说明](#7-错误码说明)

---

## 1. 认证接口

### 1.1 用户登录

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

---

## 2. 评估任务接口

### 2.1 发起评估任务

- **Endpoint**: `POST /api/evaluations`
- **Auth**: 必须
- **Description**: 创建并启动一个新的评估任务。任务为异步执行，通过 `GET /api/evaluations/{id}/status` 轮询进度。
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

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `project_name` | string | 是 | 项目名称，用于历史记录分组 |
| `requirement_title` | string | 是 | 需求标题 |
| `requirement_type` | `"text"` \| `"document"` | 是 | 需求提交类型 |
| `text_content` | string | 条件必填 | `requirement_type=text` 时必填 |
| `document_file_id` | number | 条件必填 | `requirement_type=document` 时必填，文件 ID 由上传接口返回 |
| `standard_ids` | number[] | 是 | 选用的评估标准 ID 列表，至少 1 个 |
| `referenced_baseline_id` | number \| null | 否 | 引用的基准需求 ID（增量评估时必填） |
| `only_evaluate_new` | boolean | 否 | `true`=仅评估新增内容；`false`=合并基准做整体评估 |
| `instructions` | string | 否 | 额外评估指令 |

- **Response** `202 Accepted`:

```json
{
  "evaluation_id": 10086,
  "status": "processing"
}
```

---

### 2.2 轮询评估状态

- **Endpoint**: `GET /api/evaluations/{id}/status`
- **Auth**: 必须
- **建议轮询频率**: 500ms ~ 1s
- **Response** `200 OK`（处理中）:

```json
{
  "status": "processing",
  "progress": 65
}
```

- **Response** `200 OK`（完成）:

```json
{
  "status": "completed",
  "progress": 100,
  "report": {
    "total_score": 82,
    "task_type": "incremental",
    "parent_base_id": 1001,
    "issues": [
      "需求 ID: REQ-001 描述中存在二义性词汇（如\"尽快响应\"），缺乏具体的毫秒级性能指标。",
      "需求 ID: REQ-004 缺乏明确的输入边界值定义。"
    ],
    "suggestions": "建议针对性能需求补充具体的 SLA 指标..."
  }
}
```

| status 值 | 说明 |
|---|---|
| `processing` | 评估进行中 |
| `completed` | 评估完成，`report` 字段包含完整结果 |
| `failed` | 评估失败，`error` 字段包含错误信息 |

---

### 2.3 获取评估历史列表

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

---

### 2.4 获取单条评估详情

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

---

### 2.5 归档评估结果为基准需求

- **Endpoint**: `POST /api/evaluations/{id}/archive`
- **Auth**: 必须
- **Description**: 将一次评估结果归档为可复用的基准需求文档。
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

---

### 2.6 取消评估任务

- **Endpoint**: `DELETE /api/evaluations/{id}`
- **Auth**: 必须
- **Response** `204 No Content`

---

## 3. 基准需求接口

### 3.1 获取基准需求列表

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

---

### 3.2 创建基准需求

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

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | 是 | 基准名称（通常为项目名） |
| `title` | string | 是 | 需求标题 |
| `desc` | string | 否 | 描述 |
| `score` | number | 是 | 评估得分 |
| `scope` | `"public"` \| `"private"` | 是 | 共享范围 |
| `parent_base_id` | number \| null | 否 | 父基准 ID（增量归档时填写） |
| `full_content` | string | 否 | 需求全文 |

- **Response** `201 Created`（后端自动计算版本号）:

```json
{
  "id": 2001,
  "name": "电商系统",
  "version": "V1.2",
  "date": "2024-06-01"
}
```

---

### 3.3 删除基准需求

- **Endpoint**: `DELETE /api/baselines/{id}`
- **Auth**: 必须
- **Description**: 删除该基准需求及其所有子版本。
- **Response** `204 No Content`

---

## 4. 评估标准（知识库）接口

### 4.1 获取标准分类及文件列表

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

---

### 4.2 上传标准文件

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

---

## 5. 文件上传接口

### 5.1 上传需求文档

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

---

## 6. 数据模型定义

### EvaluationReport（评估报告）

```typescript
interface EvaluationReport {
  id: number;
  total_score: number;          // 0-100 综合评分
  task_type: 'full' | 'incremental'; // 全量/增量评估
  parent_base_id: number | null; // 引用的基准 ID
  issues: string[];             // 问题点列表
  suggestions: string;          // 优化建议
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;           // ISO 8601
}
```

### EvaluationHistoryItem（历史记录）

```typescript
interface EvaluationHistoryItem {
  id: number;
  project_name: string;
  title: string;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  version: string;              // 如 "V1.2"
  date: string;                 // YYYY-MM-DD
  model: string;                // 使用的 AI 模型名
  is_archived: boolean;
  has_reference: boolean;
  references: string[];         // 引用的基准名称列表
}
```

### BaselineRequirement（基准需求）

```typescript
interface BaselineRequirement {
  id: number;
  name: string;                 // 项目/基准名称
  title: string;                // 需求标题
  version: string;              // 如 "V1.0"
  author: string;
  date: string;
  score: number;
  ref_count: number;            // 被引用次数
  scope: 'public' | 'private';
  status: 'enabled' | 'disabled';
  desc: string;
  parent_base_id: number | null;
  is_latest: boolean;
  full_content: string;
  category_id: number;
  category_type: 'default' | 'user';
}
```

---

## 7. 错误码说明

| HTTP 状态码 | 错误码 | 说明 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 请求参数校验失败，`details` 字段包含字段级错误 |
| `401` | `UNAUTHORIZED` | 未认证或 Token 无效 |
| `403` | `FORBIDDEN` | 无权限访问该资源 |
| `404` | `NOT_FOUND` | 资源不存在 |
| `409` | `CONFLICT` | 资源冲突（如重复归档） |
| `422` | `EVALUATION_FAILED` | AI 模型评估失败（如 API Key 无效） |
| `500` | `INTERNAL_ERROR` | 服务端内部错误 |

**错误响应体格式**:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": {
    "standard_ids": "至少需要选择 1 个评估标准"
  }
}
```
