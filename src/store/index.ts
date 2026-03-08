import { defineStore } from 'pinia';
import {
  getBaselines, createBaseline, deleteBaseline,
  getEvaluations, createEvaluation, deleteEvaluation,
  archiveEvaluation, getStandards, seedData,
  login, register, getCurrentUser
} from '@/services';

// ─────────────────────────────────────────────
// Auth Store
// ─────────────────────────────────────────────
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    role: 'user' as 'admin' | 'user',
    isLoggedIn: false,
  }),
  actions: {
    async login(username: string, password: string) {
      try {
        const response = await login(username, password);
        localStorage.setItem('auth_token', response.access_token);
        this.user = response.user;
        this.role = response.user.role as 'admin' | 'user';
        this.isLoggedIn = true;
        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    async register(username: string, password: string) {
      try {
        const response = await register(username, password);
        return response;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },
    logout() {
      localStorage.removeItem('auth_token');
      this.user = null;
      this.role = 'user';
      this.isLoggedIn = false;
    },
    async checkAuth() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          this.isLoggedIn = false;
          return false;
        }
        const user = await getCurrentUser();
        this.user = user;
        this.role = user.role as 'admin' | 'user';
        this.isLoggedIn = true;
        return true;
      } catch (error) {
        console.error('Auth check failed:', error);
        this.logout();
        return false;
      }
    },
  },
});

// ─────────────────────────────────────────────
// Model Store
// ─────────────────────────────────────────────
export const useModelStore = defineStore('models', {
  state: () => ({
    models: [
      { id: 1, name: 'GPT-4o', provider: 'OpenAI', apiKey: 'sk-proj-1234567890abcdef', status: 'available', usageCount: 1240 },
      { id: 2, name: 'Claude 3.5 Sonnet', provider: 'Anthropic', apiKey: 'sk-ant-api03-1234567890', status: 'available', usageCount: 856 },
      { id: 3, name: 'Gemini 1.5 Pro', provider: 'Google', apiKey: 'AIzaSyA1234567890', status: 'available', usageCount: 432 },
    ],
    prompts: {
      system: '你是一个专业的软件需求测试性评估专家。请根据提供的知识库标准，对需求文档进行评估。',
      format: '评估报告应包含：1. 可测试性评分 (0-100)；2. 问题点分析；3. 改进建议。',
    },
  }),
  actions: {
    addModel(model: any) {
      this.models.push({ ...model, id: Date.now() });
    },
    removeModel(id: number) {
      this.models = this.models.filter(m => m.id !== id);
    },
    updateModel(updatedModel: any) {
      const index = this.models.findIndex(m => m.id === updatedModel.id);
      if (index !== -1) {
        this.models[index] = { ...updatedModel };
      }
    },
    updatePrompt(type: 'system' | 'format', value: string) {
      this.prompts[type] = value;
    },
  },
});

// ─────────────────────────────────────────────
// Knowledge Store
// ─────────────────────────────────────────────
export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    searchQuery: '',
    activeTab: 'standards' as 'standards' | 'baselines',
    categories: [
      { id: 1, name: '国际标准', type: 'default', files: [] as any[] },
      { id: 2, name: '公司标准', type: 'default', files: [] as any[] },
      { id: 3, name: '项目组标准', type: 'default', files: [] as any[] },
      { id: 4, name: '自定义文档', type: 'user', files: [] as any[] },
    ],
    isLoaded: false,
    userDefinedFiles: [] as { id: number; name: string; status: string; desc?: string }[],
    selectedFiles: [] as number[],
    selectedUserFiles: [] as number[],
    collapsedCategories: [] as number[],
  }),
  getters: {
    defaultCategories(state) {
      return state.categories.filter(c => c.type === 'default');
    },
    userCategories(state) {
      return state.categories.filter(c => c.type === 'user');
    },
    allSelectedFiles(state) {
      const selected = [] as any[];
      state.categories.forEach(cat => {
        cat.files.forEach(f => {
          if (state.selectedFiles.includes(f.id)) selected.push({ ...f, isUser: cat.type === 'user' });
        });
      });
      return selected;
    },
    filteredCategories(state) {
      const cats = state.categories;
      if (!state.searchQuery) return cats;
      return cats.map(cat => ({
        ...cat,
        files: cat.files.filter(f => f.name.toLowerCase().includes(state.searchQuery.toLowerCase()))
      })).filter(cat => cat.files.length > 0);
    }
  },
  actions: {
    async fetchStandards() {
      if (this.isLoaded) return;
      try {
        const standards = await getStandards();
        if (standards && standards.length > 0) {
          this.categories = standards;
        }
        this.isLoaded = true;
      } catch (e) {
        console.error('[KnowledgeStore] fetchStandards failed:', e);
      }
    },
    toggleFile(id: number, isUserFile = false) {
      const list = isUserFile ? this.selectedUserFiles : this.selectedFiles;
      const index = list.indexOf(id);
      if (index > -1) {
        list.splice(index, 1);
      } else {
        list.push(id);
      }
    },
    removeSelected(id: number, isUserFile = false) {
      const list = isUserFile ? this.selectedUserFiles : this.selectedFiles;
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    },
    addUserFile(file: any) {
      let userCat = this.categories.find(c => c.type === 'user');
      if (!userCat) {
        this.addCategory('自定义文档', 'user');
        userCat = this.categories.find(c => c.type === 'user');
      }
      if (userCat) {
        userCat.files.push({ ...file, id: Date.now(), status: 'enabled' });
      }
    },
    addFile(categoryId: number, file: any) {
      const category = this.categories.find(c => c.id === categoryId);
      if (category) {
        category.files.push({ ...file, id: Date.now(), status: 'enabled' });
      }
    },
    removeFile(categoryId: number, fileId: number) {
      const category = this.categories.find(c => c.id === categoryId);
      if (category) {
        category.files = category.files.filter(f => f.id !== fileId);
      }
    },
    addCategory(name: string, type: 'default' | 'user' = 'default') {
      this.categories.push({ id: Date.now(), name, type, files: [] });
    },
    removeCategory(id: number) {
      this.categories = this.categories.filter(c => c.id !== id);
    },
    toggleCategory(id: number) {
      const index = this.collapsedCategories.indexOf(id);
      if (index > -1) this.collapsedCategories.splice(index, 1);
      else this.collapsedCategories.push(id);
    }
  },
});

// ─────────────────────────────────────────────
// Baseline Store
// ─────────────────────────────────────────────
export const useBaselineStore = defineStore('baseline', {
  state: () => ({
    searchQuery: '',
    /**
     * 基准需求按分类组织。
     * 初始 files 为空，通过 fetchBaselines() 从 service 层加载。
     * 在 MOCK 模式下，service 提供 SEED_BASELINES 数据；
     * 在 REAL 模式下，service 调用 GET /api/baselines。
     */
    categories: [
      { id: 1, name: '系统默认基准', type: 'default', files: [] as any[] },
      { id: 2, name: '用户归档基准', type: 'user', files: [] as any[] },
    ],
    isLoaded: false,
  }),
  getters: {
    allFiles(state) {
      const files = [] as any[];
      state.categories.forEach(cat => {
        cat.files.forEach(f => {
          files.push({ ...f, categoryId: cat.id, categoryType: cat.type });
        });
      });
      return files;
    },
    filteredFiles(state) {
      const files = this.allFiles;
      if (!state.searchQuery) return files;
      return files.filter(f => f.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
    },
    baselineTree(state) {
      const all = this.allFiles;
      const roots = all.filter(f => !f.parent_base_id);
      return roots.map(root => {
        const versions = all.filter(f => f.parent_base_id === root.id || f.id === root.id)
          .sort((a, b) => b.version.localeCompare(a.version));
        return {
          ...root,
          versions
        };
      });
    }
  },
  actions: {
    /**
     * 从 service 层加载初始基准需求数据。
     * 在 mock 模式下返回 SEED_BASELINES；在真实模式下调用 GET /api/baselines。
     */
    async fetchBaselines() {
      if (this.isLoaded) return;
      try {
        const baselines = await getBaselines();
        // 将数据按 categoryType 分发到对应分类
        const defaultCat = this.categories.find(c => c.id === 1);
        const userCat = this.categories.find(c => c.id === 2);
        baselines.forEach(b => {
          if (b.categoryType === 'default' || b.scope === 'public') {
            defaultCat?.files.push(b);
          } else {
            userCat?.files.push(b);
          }
        });
        this.isLoaded = true;
      } catch (e) {
        console.error('[BaselineStore] fetchBaselines failed:', e);
      }
    },

    /**
     * 归档基准需求（调用 service 层，同步更新本地状态）
     */
    async addBaseline(file: any, categoryId: number = 2) {
      try {
        const newBaseline = await createBaseline({
          name: file.name || '未命名基准',
          title: file.title || '未命名需求',
          desc: file.desc || '由评估报告归档生成的基准需求文档。',
          score: file.score || 0,
          scope: file.scope || 'private',
          parent_base_id: file.parent_base_id || null,
          full_content: file.full_content || '',
        });

        const cat = this.categories.find(c => c.id === categoryId);
        if (cat) {
          // 更新旧版本的 is_latest 标记
          if (newBaseline.parent_base_id) {
            this.categories.forEach(c => {
              c.files.forEach(f => {
                if (f.parent_base_id === newBaseline.parent_base_id || f.id === newBaseline.parent_base_id) {
                  f.is_latest = false;
                }
              });
            });
          }
          cat.files.unshift(newBaseline);
        }
        return newBaseline;
      } catch (e) {
        console.error('[BaselineStore] addBaseline failed:', e);
        throw e;
      }
    },

    updateStatus(fileId: number, status: 'enabled' | 'disabled') {
      this.categories.forEach(cat => {
        const file = cat.files.find(f => f.id === fileId);
        if (file) file.status = status;
      });
    },

    /**
     * 删除基准需求（调用 service 层，同步更新本地状态）
     */
    async removeBaseline(fileId: number) {
      try {
        await deleteBaseline(fileId);
        this.categories.forEach(cat => {
          cat.files = cat.files.filter(f => f.id !== fileId && f.parent_base_id !== fileId);
        });
      } catch (e) {
        console.error('[BaselineStore] removeBaseline failed:', e);
        throw e;
      }
    }
  }
});

// ─────────────────────────────────────────────
// Evaluation Store
// ─────────────────────────────────────────────
export const useEvaluationStore = defineStore('evaluation', {
  state: () => ({
    currentStep: 1,
    requirementType: 'text' as 'text' | 'document',
    requirementTitle: '',
    projectName: '',
    textContent: '',
    uploadedFile: null as any,
    referencedBaselineIds: [] as number[],
    onlyReference: false,
    instructions: '',
    isEvaluating: false,
    evaluationProgress: 0,
    currentReport: null as any,
    onlyEvaluateNew: false,
    /**
     * 评估历史记录。
     * 初始为空，通过 fetchHistory() 从 service 层加载。
     * 在 MOCK 模式下返回 SEED_EVALUATIONS；在真实模式下调用 GET /api/evaluations。
     */
    history: [] as any[],
    isHistoryLoaded: false,
  }),
  getters: {
    aggregatedHistory(state) {
      const baselineStore = useBaselineStore();
      const baselines = baselineStore.baselineTree;

      const grouped = {} as Record<string, any[]>;
      const independent = [] as any[];

      state.history.forEach(item => {
        if (item.parent_base_id) {
          const pid = item.parent_base_id.toString();
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(item);
        } else {
          independent.push(item);
        }
      });

      const tree = baselines.map(base => {
        const familyIds = new Set([base.id, ...base.versions.map((v: any) => v.id)]);
        let familyHistory: any[] = [];

        familyIds.forEach(fid => {
          if (grouped[fid.toString()]) {
            familyHistory = familyHistory.concat(grouped[fid.toString()]);
          }
        });

        familyHistory.sort((a, b) => {
          if (a.id === base.id) return -1;
          if (b.id === base.id) return 1;
          const vA = parseFloat(a.version?.replace(/[^0-9.]/g, '') || '0');
          const vB = parseFloat(b.version?.replace(/[^0-9.]/g, '') || '0');
          return vB - vA;
        });

        return { ...base, history: familyHistory };
      });

      const independentGrouped = independent.filter(i => !i.is_archived).reduce((groups: Record<string, any[]>, item) => {
        const projectName = item.projectName || '未命名项目';
        if (!groups[projectName]) groups[projectName] = [];
        groups[projectName].push(item);
        return groups;
      }, {});

      const independentByProject = (Object.entries(independentGrouped) as [string, any[]][])
        .map(([projectName, items]) => ({
          projectName,
          items: (items as any[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }))
        .sort((a, b) => a.projectName.localeCompare(b.projectName));

      return {
        baselines: tree,
        independent: independent.filter(i => !i.is_archived),
        independentByProject
      };
    }
  },
  actions: {
    /**
     * 从 service 层加载历史评估记录
     */
    async fetchHistory() {
      if (this.isHistoryLoaded) return;
      try {
        const evaluations = await getEvaluations();
        this.history = evaluations;
        this.isHistoryLoaded = true;
      } catch (e) {
        console.error('[EvaluationStore] fetchHistory failed:', e);
      }
    },

    setStep(step: number) {
      this.currentStep = step;
    },

    toggleBaseline(id: number) {
      const index = this.referencedBaselineIds.indexOf(id);
      if (index > -1) {
        this.referencedBaselineIds.splice(index, 1);
      } else {
        this.referencedBaselineIds = [id];
      }
      if (this.referencedBaselineIds.length === 0) {
        this.onlyReference = false;
      }
    },

    clearBaselines() {
      this.referencedBaselineIds = [];
      this.onlyReference = false;
    },

    reset() {
      this.projectName = '';
      this.requirementTitle = '';
      this.textContent = '';
      this.uploadedFile = null;
      this.referencedBaselineIds = [];
      this.onlyReference = false;
      this.instructions = '';
      this.currentReport = null;
      this.currentStep = 1;
      this.onlyEvaluateNew = false;
    },

    /**
     * 将评估报告写入历史记录（调用 service 层）
     */
    async addHistory(report: any) {
      const baselineStore = useBaselineStore();
      const references = this.referencedBaselineIds.map(id => {
        const f = baselineStore.allFiles.find(bf => bf.id === id);
        return f ? f.name : '';
      }).filter(n => n);

      const parentBase = this.referencedBaselineIds.length > 0
        ? baselineStore.allFiles.find(f => f.id === this.referencedBaselineIds[0])
        : null;

      const projectName = this.referencedBaselineIds.length > 0
        ? parentBase?.name
        : this.projectName || '未命名项目';

      // 找同项目下已有的未归档记录，计算版本号
      const existingUnarchived = this.history.filter(item =>
        item.projectName === projectName &&
        !item.is_archived &&
        !item.parent_base_id
      );

      let version = 'V1.0';
      if (parentBase) {
        version = `V${(parseFloat(parentBase.version.replace('V', '')) + 0.1).toFixed(1)}`;
      } else if (existingUnarchived.length > 0) {
        const latestVersion = existingUnarchived.reduce((max, item) => {
          const v = parseFloat(item.version?.replace('V', '') || '0');
          return v > max ? v : max;
        }, 0);
        version = `V${(latestVersion + 0.1).toFixed(1)}`;

        // 移除同项目旧的未归档记录（在本地，不删除服务端数据）
        this.history = this.history.filter(item =>
          !(item.projectName === projectName &&
            !item.is_archived &&
            !item.parent_base_id)
        );
      }

      const newRecord = {
        projectName,
        title: this.requirementType === 'document'
          ? this.uploadedFile?.name
          : (this.requirementTitle || this.textContent.slice(0, 15) + '...'),
        total_score: report.total_score || report.score,
        date: new Date().toISOString().split('T')[0],
        model: 'GPT-4o',
        standards: [],
        hasReference: references.length > 0,
        references,
        parent_base_id: parentBase ? parentBase.id : null,
        task_type: references.length > 0 ? 'incremental' : 'full',
        is_archived: false,
        version,
        issues: report.issues || [],
        suggestions: report.suggestions || '',
      };

      try {
        // 通过 service 层持久化（mock 写入内存，real 发 POST 请求）
        const saved = await createEvaluation(newRecord);
        this.history.unshift(saved);
      } catch (e) {
        // 降级：本地写入（避免 UI 中断）
        console.warn('[EvaluationStore] createEvaluation failed, using local fallback:', e);
        this.history.unshift({ ...newRecord, id: Date.now() });
      }
    }
  }
});
