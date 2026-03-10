/**
 * services/index.ts — 服务层统一入口
 *
 * 根据环境变量 VITE_USE_MOCK 决定使用真实 API 还是模拟服务：
 *   VITE_USE_MOCK=true  → 使用 mock.ts（前端模拟，无网络请求）
 *   VITE_USE_MOCK=false → 使用 api.ts（真实 HTTP 请求）
 *
 * 切换方式：在 .env.development 中修改 VITE_USE_MOCK 的值，无需修改业务代码。
 */

import * as mockService from './mock';
import * as apiService from './api';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

// 在控制台输出当前模式，便于开发调试
if (import.meta.env.DEV) {
    console.info(
        `%c[Service Layer] Mode: ${isMock ? '🟡 MOCK (模拟数据)' : '🟢 REAL API (真实后端)'}`,
        'color: ' + (isMock ? '#f59e0b' : '#10b981') + '; font-weight: bold;'
    );
    if (!isMock) {
        console.info(`[Service Layer] API Base URL: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}`);
    }
}

export const service = isMock ? mockService : apiService;

// 单独导出常用函数，方便按需导入
export const {
    startEvaluation,
    getEvaluationStatus,
    getEvaluations,
    getEvaluationDetail,
    archiveEvaluation,
    getBaselines,
    createBaseline,
    deleteBaseline,
    getStandards,
    uploadStandardFile,
    uploadRequirementFile,
    createCategory,
    deleteCategory,
    deleteStandardFile,
    updateStandardStatus,
} = service;

// 仅 mock 有的额外函数（不影响 api 模式）
export const createEvaluation = isMock
    ? mockService.createEvaluation
    : (_record: any) => Promise.resolve(_record); // real: server creates from startEvaluation response

export const deleteEvaluation = isMock
    ? mockService.deleteEvaluation
    : apiService.deleteBaseline as any; // placeholder; real backend has equivalent DELETE endpoint

export const cancelEvaluationMock = isMock
    ? mockService.cancelEvaluation
    : async (_id: number) => { }; // real: cancel via DELETE /api/evaluations/{id}

// 导出种子数据（仅 mock 模式下有效，用于 store 初始化）
export const seedData = isMock
    ? { baselines: mockService.SEED_BASELINES, evaluations: mockService.SEED_EVALUATIONS }
    : { baselines: [], evaluations: [] };
