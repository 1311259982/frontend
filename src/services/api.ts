/**
 * api.ts — 真实后端 HTTP 请求服务
 *
 * 当 VITE_USE_MOCK=false 时，此模块被 services/index.ts 导入并使用。
 * 所有函数签名与 mock.ts 保持一致，以实现透明切换。
 *
 * 后端基础 URL 由环境变量 VITE_API_BASE_URL 控制。
 */

import axios from 'axios';

// ─────────────────────────────────────────────
// Axios 实例配置
// ─────────────────────────────────────────────
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 Authorization Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理（支持后端 detail.message 中文错误信息）
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const detail = error.response?.data?.detail;
    const message =
      (typeof detail === 'object' ? detail?.message : detail) ||
      error.message ||
      '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────
// 认证相关类型 & API
// ─────────────────────────────────────────────
export interface AuthUserInfo {
  id: number;
  username: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUserInfo;
}

/**
 * 用户登录
 * POST /api/auth/login
 */
export const login = (username: string, password: string): Promise<AuthResponse> => {
  return http.post('/api/auth/login', { username, password });
};

/**
 * 用户注册（默认角色 user）
 * POST /api/auth/register
 */
export const register = (username: string, password: string): Promise<AuthResponse> => {
  return http.post('/api/auth/register', { username, password });
};



// ─────────────────────────────────────────────
// 类型定义（与后端 API 文档对应）
// ─────────────────────────────────────────────
export interface EvaluationItemCreate {
  parent_item_id?: number | null;
  title: string;
  content: string;
  status: 'new' | 'modified' | 'unchanged' | 'deleted';
  sort_order: number;
}

export interface RetrievalConfig {
  strategy: 'vector' | 'keyword' | 'hybrid' | 'multi_sample';
  top_k: number;
  rerank_rule: 'relevance' | 'timestamp' | 'priority';
  incremental: boolean;
}

export interface StartEvaluationPayload {
  project_name: string;
  requirement_title: string;
  requirement_type: 'text' | 'document';
  text_content?: string;
  document_file_id?: number;
  standard_ids: number[];
  referenced_baseline_id?: number | null;
  only_evaluate_new?: boolean;
  instructions?: string;
  model_id?: number;
  edit_mode?: string;
  items?: EvaluationItemCreate[];
  retrieval_config?: RetrievalConfig;
}

export interface DraftEvaluationPayload {
  project_name: string;
  requirement_title?: string;
  requirement_type?: 'text' | 'document';
  referenced_baseline_id?: number | null;
  text_content?: string;
  parent_category_title?: string;
}

export interface SubmitDraftPayload {
  standard_ids: number[];
  instructions?: string;
  model_id?: number;
  retrieval_config?: RetrievalConfig;
}

export interface EvaluationReport {
  id: number;
  total_score: number;
  task_type: 'full' | 'incremental';
  parent_base_id: number | null;
  issues: string[];
  suggestions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface ArchivePayload {
  baseline_name: string;
  requirement_title: string;
  scope: 'public' | 'private';
}

export interface CreateBaselinePayload {
  name: string;
  title: string;
  desc?: string;
  score: number;
  scope?: string;
  parent_base_id?: number | null;
  full_content?: string;
  source_evaluation_id?: number | null;
}

// ─────────────────────────────────────────────
// 评估相关 API
// ─────────────────────────────────────────────

/**
 * 发起评估任务
 * POST /api/evaluations
 * 返回：{ evaluation_id: number, status: 'pending' }
 */
export const startEvaluation = (payload: StartEvaluationPayload): Promise<{ evaluation_id: number; status: string }> => {
  return http.post('/api/evaluations', payload);
};

export const createDraft = (payload: DraftEvaluationPayload): Promise<{ evaluation_id: number; status: string }> => {
  return http.post('/api/evaluations/draft', payload);
};

export const syncDraftItems = (evaluationId: number, items: EvaluationItemCreate[]): Promise<{ message: string }> => {
  return http.put(`/api/evaluations/${evaluationId}/items`, { items });
};

export const submitDraft = (evaluationId: number, payload: SubmitDraftPayload): Promise<{ evaluation_id: number; status: string }> => {
  return http.post(`/api/evaluations/${evaluationId}/submit`, payload);
};

export const deleteEvaluation = (evaluationId: number): Promise<void> => {
  return http.delete(`/api/evaluations/${evaluationId}`);
};

/**
 * 轮询评估任务状态与进度
 * GET /api/evaluations/{id}/status
 * 返回：{ status, progress: 0-100, report?: EvaluationReport }
 */
export const getEvaluationStatus = (id: number): Promise<{
  status: string;
  progress: number;
  report?: EvaluationReport;
}> => {
  return http.get(`/api/evaluations/${id}/status`);
};

/**
 * 更新评估任务内容并可选地重测
 * PUT /api/evaluations/{id}
 */
export const updateEvaluation = (id: number, payload: { text_content: string, reevaluate?: boolean, standard_ids?: number[] }): Promise<any> => {
  return http.put(`/api/evaluations/${id}`, payload);
};

/**
 * 彻底取消并物理清理评估任务
 * DELETE /api/evaluations/{id}
 */
export const cancelEvaluation = (id: number): Promise<void> => {
  return http.delete(`/api/evaluations/${id}`);
};

/**
 * 获取评估历史列表
 * GET /api/evaluations
 */
export const getEvaluations = async (): Promise<any[]> => {
  const res: any = await http.get('/api/evaluations');
  return res.items || [];
};

/**
 * 获取单条评估详情（用于加载历史记录）
 * GET /api/evaluations/{id}
 */
export const getEvaluationDetail = (id: number): Promise<any> => {
  return http.get(`/api/evaluations/${id}`);
};

/**
 * 归档评估结果为基准需求
 * POST /api/evaluations/{id}/archive
 */
export const archiveEvaluation = (id: number, payload: ArchivePayload): Promise<any> => {
  return http.post(`/api/evaluations/${id}/archive`, payload);
};

// ─────────────────────────────────────────────
// 基准需求相关 API
// ─────────────────────────────────────────────

/**
 * 获取基准需求列表
 * GET /api/baselines
 */
export const getBaselines = (): Promise<any[]> => {
  return http.get('/api/baselines');
};

/**
 * 创建基准需求
 * POST /api/baselines
 */
export const createBaseline = (payload: CreateBaselinePayload): Promise<any> => {
  return http.post('/api/baselines', payload);
};

/**
 * 删除基准需求（精准子树级联删除）
 * DELETE /api/baselines/{id}
 */
export const deleteBaseline = (id: number): Promise<void> => {
  return http.delete(`/api/baselines/${id}`);
};

/**
 * 删除预览：查询删除某版本将波及哪些子孙版本
 * GET /api/baselines/{id}/delete-preview
 */
export interface DeletePreview {
  target_version: string;
  affected_count: number;
  affected_versions: string[];
  will_delete_project: boolean;
}
export const getDeletePreview = (id: number): Promise<DeletePreview> => {
  return http.get(`/api/baselines/${id}/delete-preview`);
};

/**
 * 获取基准需求的合并全文
 * GET /api/baselines/{id}/content
 */
export const getBaselineContent = (id: number): Promise<{ content: string }> => {
  return http.get(`/api/baselines/${id}/content`);
};

// ─────────────────────────────────────────────
// 评估标准（知识库）相关 API
// ─────────────────────────────────────────────

/**
 * 获取评估标准分类及文件列表
 * GET /api/standards
 */
export const getStandards = (standardType?: string): Promise<any[]> => {
  const params: any = {};
  if (standardType) params.standard_type = standardType;
  return http.get('/api/standards', { params });
};

/**
 * 上传标准文件
 * POST /api/standards/{categoryId}/files
 */
export const uploadStandardFile = (categoryId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post(`/api/standards/${categoryId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * 创建标准分类
 * POST /api/standards
 */
export const createCategory = (payload: { name: string; type: string; standard_type?: string }): Promise<any> => {
  return http.post('/api/standards', payload);
};

/**
 * 删除标准分类
 * DELETE /api/standards/{categoryId}
 */
export const deleteCategory = (categoryId: number): Promise<void> => {
  return http.delete(`/api/standards/${categoryId}`);
};

/**
 * 删除标准文件
 * DELETE /api/standards/files/{standardId}
 */
export const deleteStandardFile = (standardId: number): Promise<void> => {
  return http.delete(`/api/standards/files/${standardId}`);
};

/**
 * 更新标准文件状态
 * PATCH /api/standards/files/{standardId}/status
 */
export const updateStandardStatus = (standardId: number, status: string): Promise<void> => {
  return http.patch(`/api/standards/files/${standardId}/status`, { status });
};

export const updateStandardPriority = (standardId: number, priority: string): Promise<any> => {
  return http.patch(`/api/standards/files/${standardId}/priority`, { priority });
};

/**
 * 上传需求文档（用于文档模式评估）
 * POST /api/uploads/requirement
 */
export const uploadRequirementFile = (file: File): Promise<{ file_id: number; name: string; size: string; parsed_text?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/uploads/requirement', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * 移除已上传的需求文档（物理删除）
 * DELETE /api/uploads/{fileId}
 */
export const deleteUpload = (fileId: number): Promise<void> => {
  return http.delete(`/api/uploads/${fileId}`);
};

// ─────────────────────────────────────────────
// 大语言模型管理 API
// ─────────────────────────────────────────────

/**
 * 获取所有模型配置
 * GET /api/admin/models
 */
export const getModels = (): Promise<any[]> => {
  return http.get('/api/admin/models');
};

/**
 * 新增模型配置
 * POST /api/admin/models
 */
export const createModel = (payload: any): Promise<any> => {
  return http.post('/api/admin/models', payload);
};

/**
 * 更新指定模型配置
 * PUT /api/admin/models/{id}
 */
export const updateModel = (id: number, payload: any): Promise<any> => {
  return http.put(`/api/admin/models/${id}`, payload);
};

/**
 * 激活指定模型（此操作会禁用其他模型）
 * POST /api/admin/models/{id}/activate
 */
export const activateModel = (id: number): Promise<any> => {
  return http.post(`/api/admin/models/${id}/activate`);
};

/**
 * 删除指定模型配置
 * DELETE /api/admin/models/{id}
 */
export const deleteModel = (id: number): Promise<void> => {
  return http.delete(`/api/admin/models/${id}`);
};

// ─────────────────────────────────────────────
// 基线积木块 (Baseline Items) API
// ─────────────────────────────────────────────

export interface BaselineItemDetail {
  id: number;
  version_id: number;
  parent_item_id: number | null;
  origin_version_id: number | null;
  title: string;
  content: string | null;
  storage_path: string | null;
  is_new: boolean;
  is_deleted: boolean;
  sort_order: number;
}

export interface BaselineContextInfo {
  id: number;
  version: string;
  project_id: number;
  project_name: string;
  items: BaselineItemDetail[];
  evaluation_report: any | null; // using any for EvaluationReport loosely
}

export interface BaselineFullContextResponse {
  current: BaselineContextInfo;
  parent: BaselineContextInfo | null;
}

export interface BaselineItemExport {
  version_id: number;
  version: string;
  project_name: string;
  markdown_content: string;
}

export interface DiffSegment {
  op: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface ItemDiffStats {
  addedChars: number;
  deletedChars: number;
  unchangedChars: number;
}

export interface ItemDiff {
  itemId: number;
  parentItemId: number | null;
  status: 'new' | 'deleted' | 'modified' | 'unchanged';
  titleDiff: DiffSegment[];
  contentDiff: DiffSegment[];
  stats: ItemDiffStats;
}

export interface BaselineDiffSummary {
  totalItems: number;
  newItems: number;
  deletedItems: number;
  modifiedItems: number;
  unchangedItems: number;
  totalAddedChars: number;
  totalDeletedChars: number;
}

export interface BaselineDiffResponse {
  currentVersion: string;
  parentVersion: string | null;
  items: ItemDiff[];
  summary: BaselineDiffSummary;
}

/**
 * 获取某版本的全部积木块
 * GET /api/baselines/{versionId}/items
 */
export const getBaselineItems = (versionId: number): Promise<BaselineItemDetail[]> => {
  return http.get(`/api/baselines/${versionId}/items`);
};

/**
 * 获取版本的双侧对比完整上下文（含父版本信息）
 * GET /api/baselines/{versionId}/full-context
 */
export const getBaselineFullContext = (versionId: number): Promise<BaselineFullContextResponse> => {
  return http.get(`/api/baselines/${versionId}/full-context`);
};

/**
 * 新增积木块
 * POST /api/baselines/{versionId}/items
 */
export const createBaselineItem = (versionId: number, payload: { title: string; content?: string; sort_order?: number }): Promise<BaselineItemDetail> => {
  return http.post(`/api/baselines/${versionId}/items`, payload);
};

/**
 * 修改积木块
 * PUT /api/baselines/{versionId}/items/{itemId}
 */
export const updateBaselineItem = (versionId: number, itemId: number, payload: { title?: string; content?: string; sort_order?: number }): Promise<BaselineItemDetail> => {
  return http.put(`/api/baselines/${versionId}/items/${itemId}`, payload);
};

/**
 * 软删除积木块
 * DELETE /api/baselines/{versionId}/items/{itemId}
 */
export const deleteBaselineItem = (versionId: number, itemId: number): Promise<void> => {
  return http.delete(`/api/baselines/${versionId}/items/${itemId}`);
};

/**
 * 导出积木块为 Markdown
 * GET /api/baselines/{versionId}/export
 */
export const exportBaselineItems = (versionId: number): Promise<BaselineItemExport> => {
  return http.get(`/api/baselines/${versionId}/export`);
};

/**
 * 获取当前版本与父版本的字符级 diff 对比结果
 * GET /api/baselines/{versionId}/diff
 */
export const getBaselineDiff = (versionId: number): Promise<BaselineDiffResponse> => {
  return http.get(`/api/baselines/${versionId}/diff`);
};

