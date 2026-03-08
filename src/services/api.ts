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
const http = axios.create({
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

// 响应拦截器：统一错误处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────
// 类型定义（与后端 API 文档对应）
// ─────────────────────────────────────────────
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
  desc: string;
  score: number;
  scope: 'public' | 'private';
  parent_base_id: number | null;
  full_content: string;
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
 * 获取评估历史列表
 * GET /api/evaluations
 */
export const getEvaluations = (): Promise<any[]> => {
  return http.get('/api/evaluations');
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
 * 删除基准需求（及其所有子版本）
 * DELETE /api/baselines/{id}
 */
export const deleteBaseline = (id: number): Promise<void> => {
  return http.delete(`/api/baselines/${id}`);
};

// ─────────────────────────────────────────────
// 评估标准（知识库）相关 API
// ─────────────────────────────────────────────

/**
 * 获取评估标准分类及文件列表
 * GET /api/standards
 */
export const getStandards = (): Promise<any[]> => {
  return http.get('/api/standards');
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
 * 上传需求文档（用于文档模式评估）
 * POST /api/uploads/requirement
 */
export const uploadRequirementFile = (file: File): Promise<{ file_id: number; name: string; size: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/uploads/requirement', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─────────────────────────────────────────────
// 认证相关 API
// ─────────────────────────────────────────────

/**
 * 用户登录
 * POST /api/auth/login
 */
export const login = (username: string, password: string): Promise<{
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}> => {
  return http.post('/api/auth/login', {
    username,
    password
  });
};

/**
 * 用户注册
 * POST /api/auth/register
 */
export const register = (username: string, password: string): Promise<{
  id: number;
  username: string;
  role: string;
}> => {
  return http.post('/api/auth/register', {
    username,
    password
  });
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = (): Promise<{
  id: number;
  username: string;
  role: string;
}> => {
  return http.get('/api/auth/me');
};
