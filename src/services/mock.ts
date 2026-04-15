/**
 * mock.ts — 前端模拟数据服务
 *
 * 当 VITE_USE_MOCK=true 时，此模块被 services/index.ts 导入并使用。
 * 包含从 User.vue 和 store/index.ts 迁移出的所有模拟逻辑。
 *
 * 所有函数签名与 api.ts 保持一致，以实现透明切换。
 */

import type { StartEvaluationPayload, ArchivePayload, CreateBaselinePayload } from './api';

// ─────────────────────────────────────────────
// 模拟种子数据（原来内嵌于 store/index.ts）
// ─────────────────────────────────────────────
let _nextId = Date.now();
const genId = () => ++_nextId;

export const SEED_BASELINES: any[] = [
    {
        id: 1001,
        name: '电商核心交易基准需求',
        title: '电商核心交易基准需求',
        version: 'V1.0',
        author: '管理员',
        date: '2024-01-15',
        score: 92,
        refCount: 45,
        scope: 'public',
        status: 'enabled',
        desc: '公司级核心交易链路基准文档。',
        parent_base_id: null,
        is_latest: true,
        full_content: '这是电商核心交易基准需求V1.0的完整内容...',
        categoryId: 1,
        categoryType: 'default',
    },
];

export const SEED_EVALUATIONS: any[] = [
    {
        id: 1,
        projectName: '电商系统',
        title: '电商系统订单模块需求',
        total_score: 85,
        increment_score: 88,
        consistency_score: 90,
        date: '2024-05-20',
        model: 'GPT-4o',
        standards: ['ISO-29119', '公司标准'],
        hasReference: true,
        references: ['电商核心交易基准需求'],
        parent_base_id: 1001,
        version: 'V1.1',
        task_type: 'incremental',
        is_archived: false,
        issues: [
            '需求 ID: REQ-001 描述中存在二义性词汇（如"尽快响应"），缺乏具体的毫秒级性能指标。',
            '需求 ID: REQ-004 缺乏明确的输入边界值定义，未说明超过 10000 条记录时的处理逻辑。',
        ],
        suggestions: '建议针对性能需求补充具体的 SLA 指标；对所有输入项增加边界值说明。',
    },
    {
        id: 2,
        projectName: '用户中心',
        title: '用户中心权限管理V2',
        total_score: 62,
        date: '2024-05-18',
        model: 'Claude 3.5',
        standards: ['项目组标准'],
        hasReference: false,
        task_type: 'full',
        is_archived: false,
        issues: [
            '安全需求描述过于笼统（"保证数据安全"），未指明具体的加密算法或访问控制级别。',
            '部分功能点（用户注销流程）未描述异常中断时的回滚机制，导致测试用例无法覆盖容错性。',
        ],
        suggestions: '建议将安全需求细化为身份认证、数据加密和权限控制三个子项；补充异常流程的分支描述。',
    },
];

export const SEED_STANDARDS: any[] = [
    { id: 1, name: '国际标准', type: 'default', files: [{ id: 101, name: 'ISO-29119.pdf', status: 'enabled', desc: '软件测试国际标准，涵盖测试过程、文档、技术等。' }] },
    { id: 2, name: '公司标准', type: 'default', files: [{ id: 201, name: 'Company-QA-Standard.docx', status: 'enabled', desc: '公司内部质量保证体系，包含需求评审规范。' }] },
    { id: 3, name: '项目组标准', type: 'default', files: [{ id: 301, name: 'Project-A-Reqs.txt', status: 'enabled', desc: '项目组特定需求编写建议与检查清单。' }] },
    { id: 4, name: '自定义文档', type: 'user', files: [] },
];

// 运行时内存状态（模拟数据库）
let _baselines: any[] = [...SEED_BASELINES];
let _evaluations: any[] = [...SEED_EVALUATIONS];
let _standards: any[] = [...SEED_STANDARDS];

// 正在进行中的模拟评估任务
const _pendingEvaluations: Map<number, {
    progress: number;
    report: any;
    timer: ReturnType<typeof setInterval> | null;
    onProgress?: (progress: number) => void;
    onComplete?: (report: any) => void;
}> = new Map();

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const randomScore = () => Math.floor(Math.random() * 20) + 75;

const generateMockReport = (payload: StartEvaluationPayload) => ({
    total_score: randomScore(),
    task_type: payload.referenced_baseline_id ? 'incremental' : 'full',
    parent_base_id: payload.referenced_baseline_id || null,
    issues: [
        '需求 ID: REQ-001 描述中存在二义性词汇（如"尽快响应"），缺乏具体的毫秒级性能指标。',
        '需求 ID: REQ-004 缺乏明确的输入边界值定义，未说明超过 10000 条记录时的处理逻辑。',
        '部分功能点（用户注销流程）未描述异常中断时的回滚机制，导致测试用例无法覆盖容错性。',
        '安全需求描述过于笼统（"保证数据安全"），未指明具体的加密算法或访问控制级别。',
    ],
    suggestions:
        '建议针对性能需求补充具体的 SLA 指标；对所有输入项增加边界值说明；补充异常流程的分支描述。同时，建议将安全需求细化为身份认证、数据加密和权限控制三个子项。',
});

// ─────────────────────────────────────────────
// 评估相关 Mock
// ─────────────────────────────────────────────

/**
 * 发起模拟评估任务
 * 模拟服务器接受请求，返回 evaluation_id，实际处理通过 getEvaluationStatus 轮询
 */
export const startEvaluation = async (
    payload: StartEvaluationPayload
): Promise<{ evaluation_id: number; status: string }> => {
    await delay(300);
    const id = genId();
    const report = generateMockReport(payload);

    let progress = 0;
    const taskState = { progress, report, timer: null as any };
    _pendingEvaluations.set(id, taskState);

    taskState.timer = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress >= 100) {
            progress = 100;
            taskState.progress = progress;
            clearInterval(taskState.timer);
        } else {
            taskState.progress = progress;
        }
    }, 500);

    return { evaluation_id: id, status: 'processing' };
};

export const createDraft = async (payload: any): Promise<{ evaluation_id: number; status: string }> => {
    await delay(100);
    const id = genId();
    return { evaluation_id: id, status: 'draft' };
};

export const syncDraftItems = async (evaluationId: number, items: any[]): Promise<{ message: string }> => {
    await delay(100);
    return { message: "synced" };
};

export const submitDraft = async (evaluationId: number, payload: any): Promise<{ evaluation_id: number; status: string }> => {
    await delay(200);
    const report = generateMockReport({ referenced_baseline_id: null } as any);
    
    let progress = 0;
    const taskState = { progress, report, timer: null as any };
    _pendingEvaluations.set(evaluationId, taskState);

    taskState.timer = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress >= 100) {
            progress = 100;
            taskState.progress = progress;
            clearInterval(taskState.timer);
        } else {
            taskState.progress = progress;
        }
    }, 500);

    return { evaluation_id: evaluationId, status: 'processing' };
};

/**
 * 轮询模拟评估状态
 */
export const getEvaluationStatus = async (id: number): Promise<{
    status: string;
    progress: number;
    report?: any;
}> => {
    const task = _pendingEvaluations.get(id);
    if (!task) {
        return { status: 'not_found', progress: 0 };
    }
    if (task.progress >= 100) {
        _pendingEvaluations.delete(id);
        return { status: 'completed', progress: 100, report: task.report };
    }
    return { status: 'processing', progress: task.progress };
};

/**
 * 取消模拟评估
 */
export const cancelEvaluation = async (id: number): Promise<void> => {
    const task = _pendingEvaluations.get(id);
    if (task?.timer) clearInterval(task.timer);
    _pendingEvaluations.delete(id);
};

/**
 * 模拟更新评估内容
 */
export const updateEvaluation = async (id: number, payload: { text_content: string; reevaluate?: boolean; standard_ids?: number[] }): Promise<any> => {
    await delay(300);
    const evaluation = _evaluations.find(e => e.id === id);
    if (evaluation) {
        evaluation.textContent = payload.text_content;
    }
    return { success: true, message: '模拟更新成功' };
};

/**
 * 获取评估历史列表（内存模拟数据）
 */
export const getEvaluations = async (): Promise<any[]> => {
    await delay(200);
    return [..._evaluations];
};

/**
 * 获取单条评估详情
 */
export const getEvaluationDetail = async (id: number): Promise<any> => {
    await delay(200);
    const evaluation = _evaluations.find(e => e.id === id);
    if (!evaluation) throw new Error('评估记录不存在');
    return { ...evaluation };
};

/**
 * 归档评估结果
 */
export const archiveEvaluation = async (id: number, payload: ArchivePayload): Promise<any> => {
    await delay(300);
    const evaluation = _evaluations.find(e => e.id === id);
    if (evaluation) {
        evaluation.is_archived = true;
    }
    return { success: true };
};

/**
 * 添加评估历史记录（由 store.addHistory 调用）
 */
export const createEvaluation = async (record: any): Promise<any> => {
    await delay(100);
    const newRecord = { ...record, id: genId() };
    _evaluations.unshift(newRecord);
    return newRecord;
};

/**
 * 删除评估历史记录
 */
export const deleteEvaluation = async (id: number): Promise<void> => {
    await delay(100);
    _evaluations = _evaluations.filter(e => e.id !== id);
};

// ─────────────────────────────────────────────
// 基准需求相关 Mock
// ─────────────────────────────────────────────

/**
 * 获取所有基准需求
 */
export const getBaselines = async (): Promise<any[]> => {
    await delay(200);
    return [..._baselines];
};

export const createBaseline = async (payload: CreateBaselinePayload): Promise<any> => {
    await delay(300);

    // MOCK 模拟后端的版本号计算分配（简单的 V1.0 或者自增），不需要像旧版那么复杂
    let version = payload.parent_base_id ? 'V1.1' : 'V1.0';
    if (payload.parent_base_id) {
        // 旧版本标记为非最新（仅做简单的 mock 级处理）
        _baselines.forEach(f => {
            if (f.parent_base_id === payload.parent_base_id || f.id === payload.parent_base_id) {
                f.is_latest = false;
            }
        });
    }

    const newBaseline = {
        ...payload,
        id: genId(),
        version,
        author: '当前用户',
        date: new Date().toISOString().split('T')[0],
        refCount: 0,
        status: 'enabled',
        is_latest: true,
        categoryId: 2,
        categoryType: 'user',
    };

    _baselines.unshift(newBaseline);
    return newBaseline;
};

/**
 * 获取基准需求的合并全文
 */
export const getBaselineContent = async (id: number): Promise<{ content: string }> => {
    await delay(200);
    const baseline = _baselines.find(f => f.id === id);
    return { content: baseline?.full_content || '这是模拟的基准需求全文内容...' };
};

export const getBaselineItems = async (id: number): Promise<any[]> => {
    await delay(200);
    return [
        {
            id: 1, version_id: 1, parent_item_id: null, origin_version_id: 1,
            title: 'Mock 标题1', content: 'Mock 内容1',
            is_new: false, is_deleted: false, sort_order: 0
        }
    ];
};

/**
 * 删除基准需求（及其子版本）
 */
export const deleteBaseline = async (id: number): Promise<void> => {
    await delay(200);
    _baselines = _baselines.filter(f => f.id !== id && f.parent_base_id !== id);
};

/**
 * 删除预览（Mock：直接返回简单的影响分析）
 */
export const getDeletePreview = async (id: number): Promise<{
    target_version: string;
    affected_count: number;
    affected_versions: string[];
    will_delete_project: boolean;
}> => {
    await delay(100);
    const target = _baselines.find(f => f.id === id);
    if (!target) throw new Error('基准需求不存在');

    // 找出所有子版本（仅一级，mock 不做深度递归）
    const children = _baselines.filter(f => f.parent_base_id === id);
    const affected = [target, ...children];
    const sameProject = _baselines.filter(f =>
        f.id === id || f.parent_base_id === id ||
        (target.parent_base_id && (f.id === target.parent_base_id || f.parent_base_id === target.parent_base_id))
    );

    return {
        target_version: target.version,
        affected_count: affected.length,
        affected_versions: affected.map(f => f.version),
        will_delete_project: affected.length >= sameProject.length,
    };
};

// ─────────────────────────────────────────────
// 评估标准相关 Mock
// ─────────────────────────────────────────────

export const getStandards = async (): Promise<any[]> => {
    await delay(100);
    return [..._standards];
};

export const uploadStandardFile = async (categoryId: number, file: File): Promise<any> => {
    await delay(500);
    return { file_id: genId(), name: file.name, size: `${(file.size / 1024).toFixed(2)} KB` };
};

export const uploadRequirementFile = async (file: File): Promise<{ file_id: number; name: string; size: string; parsed_text?: string }> => {
    await delay(500);
    return { 
        file_id: genId(), 
        name: file.name, 
        size: `${(file.size / 1024).toFixed(2)} KB`,
        parsed_text: `这是从模拟文件 ${file.name} 中解析出的文本内容...\n1. 需求点 A\n2. 需求点 B`
    };
};

export const createCategory = async (payload: { name: string; type: string }): Promise<any> => {
    return { id: Date.now(), ...payload, files: [] };
};

export const deleteCategory = async (_id: number): Promise<void> => {
    return;
};

export const deleteStandardFile = async (_id: number): Promise<void> => {
    return;
};

export const updateStandardStatus = async (_id: number, _status: string): Promise<void> => {
    return;
};

/**
 * 移除上传需求文档（Mock 物理删除）
 */
export const deleteUpload = async (fileId: number): Promise<void> => {
    await delay(200);
    console.log(`[Mock] Deleting upload file_id=${fileId}`);
};
