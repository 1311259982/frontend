import { defineStore } from 'pinia';
import {
  getBaselines, createBaseline, deleteBaseline,
  getEvaluations, createEvaluation,
  updateEvaluation, cancelEvaluation,
  archiveEvaluation, getStandards, uploadStandardFile,
  createCategory, deleteCategory, deleteStandardFile, seedData,
  updateStandardStatus, uploadRequirementFile,
  deleteUpload, getBaselineItems,
  createDraft, syncDraftItems
} from '@/services';

// ─────────────────────────────────────────────
// Auth Store
// ─────────────────────────────────────────────
import { login as apiLogin, register as apiRegister } from '@/services/api';

// 从 localStorage 恢复初始状态
const _storedToken = localStorage.getItem('auth_token');
const _storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
})();

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: _storedToken as string | null,
    user: _storedUser as { id: number; username: string; role: string } | null,
    isLoggedIn: !!_storedToken,
    role: (_storedUser?.role || 'user') as 'admin' | 'user',
  }),
  actions: {
    async login(username: string, password: string) {
      const res = await apiLogin(username, password);
      this.token = res.token;
      this.user = res.user;
      this.role = res.user.role as 'admin' | 'user';
      this.isLoggedIn = true;
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    },
    async register(username: string, password: string) {
      const res = await apiRegister(username, password);
      this.token = res.token;
      this.user = res.user;
      this.role = res.user.role as 'admin' | 'user';
      this.isLoggedIn = true;
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    },
    logout() {
      this.token = null;
      this.user = null;
      this.role = 'user';
      this.isLoggedIn = false;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    },
  },
});


// ─────────────────────────────────────────────
// Model Store
// ─────────────────────────────────────────────
import { getModels, createModel, updateModel, activateModel, deleteModel } from '../services/api';

export const useModelStore = defineStore('models', {
  state: () => ({
    models: [] as any[],
    defaultModel: 'GPT-4o', 
    defaultModelId: null as number | null,
    isLoading: false,
    isLoaded: false,
    prompts: {
      system: '你是一个专业的软件需求测试性评估专家。请根据提供的知识库标准，对需求文档进行评估。',
      format: '评估报告应包含：1. 可测试性评分 (0-100)；2. 问题点分析；3. 改进建议。',
    },
  }),
  actions: {
    async fetchModels() {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const data = await getModels();
        // 映射后端字段到前端现有的使用习惯
        this.models = data.map((item: any) => ({
          ...item,
          status: item.is_active ? 'active' : 'available',
          apiKey: item.api_key, 
          baseUrl: item.base_url,
        }));
        
        // 关键逻辑：寻找后端标记为 is_active 的项并同步到前端默认模型
        const activeItem = data.find((m: any) => m.is_active);
        if (activeItem) {
          this.defaultModel = activeItem.name;
          this.defaultModelId = activeItem.id;
          console.log('[ModelStore] Syncing persistent default model:', activeItem.name, 'ID:', activeItem.id);
        }
        this.isLoaded = true;
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async addModel(model: any) {
      try {
        const payload = {
          name: model.name,
          provider: model.provider,
          model_name: model.model_name || model.name,
          api_key: model.apiKey || '',
          base_url: model.baseUrl || '',
          is_active: false
        };
        const newModel = await createModel(payload);
        await this.fetchModels(); // Refresh list to get accurate state
      } catch (error) {
        console.error('Failed to create model:', error);
        throw error;
      }
    },
    async removeModel(id: number) {
      try {
        await deleteModel(id);
        await this.fetchModels(); // Refresh list
      } catch (error) {
        console.error('Failed to delete model:', error);
        throw error;
      }
    },
    async updateModel(updatedModel: any) {
      try {
        const payload = {
          name: updatedModel.name,
          provider: updatedModel.provider,
          model_name: updatedModel.model_name || updatedModel.name,
          api_key: updatedModel.apiKey || '',
          base_url: updatedModel.baseUrl || '',
        };
        await updateModel(updatedModel.id, payload);
        await this.fetchModels(); // Refresh list
      } catch (error) {
        console.error('Failed to update model:', error);
        throw error;
      }
    },
    async activateModel(id: number) {
      try {
        await activateModel(id);
        await this.fetchModels(); // Refresh list to reflect single active model
      } catch (error) {
        console.error('Failed to activate model:', error);
        throw error;
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
    enabledDefaultCategories(state) {
      return state.categories
        .filter(c => c.type === 'default')
        .map(cat => ({
          ...cat,
          files: cat.files.filter(f => f.status === 'enabled')
        })); // Do not filter out empty default categories
    },
    enabledUserCategories(state) {
      return state.categories
        .filter(c => c.type === 'user')
        .map(cat => ({
          ...cat,
          files: cat.files.filter(f => f.status === 'enabled')
        }));
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
    async removeFile(categoryId: number, fileId: number) {
      try {
        await deleteStandardFile(fileId);
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
          category.files = category.files.filter(f => f.id !== fileId);
        }
      } catch (e) {
        console.error('[KnowledgeStore] removeFile failed:', e);
        throw e;
      }
    },
    async addCategory(name: string, type: 'default' | 'user' = 'default') {
      try {
        const res = await createCategory({ name, type });
        this.categories.push({
          id: res.id,
          name: res.name,
          type: res.type,
          files: []
        });
        return res;
      } catch (e) {
        console.error('[KnowledgeStore] addCategory failed:', e);
        throw e;
      }
    },
    async updateFileStatus(categoryId: number, fileId: number, status: string) {
      try {
        await updateStandardStatus(fileId, status);
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
          const file = category.files.find(f => f.id === fileId);
          if (file) {
            file.status = status;
          }
        }
      } catch (e) {
        console.error('[KnowledgeStore] updateFileStatus failed:', e);
        throw e;
      }
    },
    async removeCategory(id: number) {
      try {
        await deleteCategory(id);
        this.categories = this.categories.filter(c => c.id !== id);
      } catch (e) {
        console.error('[KnowledgeStore] removeCategory failed:', e);
        throw e;
      }
    },
    toggleCategory(id: number) {
      const index = this.collapsedCategories.indexOf(id);
      if (index > -1) this.collapsedCategories.splice(index, 1);
      else this.collapsedCategories.push(id);
    },
    async uploadStandard(categoryId: number, file: File) {
      try {
        const res = await uploadStandardFile(categoryId, file);
        // After successful upload, find the category and add the file to the local list
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
          // The backend returns StandardFileUploadResponse with file_id
          category.files.push({
            id: res.file_id || Date.now(),
            name: res.name || file.name,
            status: 'enabled',
            desc: null
          });
        }
        return res;
      } catch (e) {
        console.error('[KnowledgeStore] uploadStandard failed:', e);
        throw e;
      }
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

      const getFamilyIds = (parentId: number, currentIds: number[]): number[] => {
         const children = all.filter(f => f.parent_base_id === parentId).map(c => c.id);
         if (children.length === 0) return currentIds;
         let ids = [...currentIds, ...children];
         children.forEach(childId => {
            ids = getFamilyIds(childId, ids);
         });
         return ids;
      };

      return roots.map(root => {
        const familyIds = Array.from(new Set(getFamilyIds(root.id, [root.id])));

        const versions = all.filter(f => familyIds.includes(f.id))
          .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
          
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
        // 强制幂等：在填充前先清空旧数据，防止重复叠加
        this.categories.forEach(c => c.files = []);
        
        baselines.forEach(b => {
          if (b.categoryType === 'default' || b.scope === 'public') {
            const defaultCat = this.categories.find(c => c.id === 1);
            defaultCat?.files.push(b);
          } else {
            const userCat = this.categories.find(c => c.id === 2);
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
          desc: file.desc || '',
          score: file.score || 0,
          scope: file.scope || 'private',
          parent_base_id: file.parent_base_id || null,
          full_content: file.full_content || '',
          source_evaluation_id: file.source_evaluation_id || null,
        });

        const cat = this.categories.find(c => c.id === categoryId);
        if (cat) {
          // 在真实场景下，其实重新 fetchBaselines 刷新即可，这里保留简单的 UI 同步
          // 更新旧版本的 is_latest 标记（前端展示用）
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
        // 关键：标记为未加载，确保下一次 UI 请求或强制刷新时能拿到后端生成的最新版本链
        this.isLoaded = false;
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
     * 删除基准需求（调用 service 层，强制重新拉取列表确保状态一致）
     */
    async removeBaseline(versionId: number) {
      try {
        await deleteBaseline(versionId);
        // 强制重新拉取，而不是局部过滤（防止级联删除后幽灵节点残留）
        this.isLoaded = false;
        this.categories.forEach(cat => { cat.files = []; });
        await this.fetchBaselines();
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
    editMode: 'incremental' as 'incremental' | 'full',
    baselineContentItem: '',
    items: [] as any[], // NEW: 卡片流列表
    draftId: null as number | null,
    syncTimer: null as any,
    versionDesc: '', // 基准修订时传入备注
    isAutoStart: false, // 是否跳转后自动开始跑分
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

        // The initial evaluation (V1.0) has parent_base_id = null, so it went to 'independent'.
        // We link it here by matching project_name and is_archived.
        independent.forEach(indItem => {
          if ((indItem.project_name === base.name || indItem.projectName === base.name) && indItem.is_archived) {
             if (familyHistory.findIndex(h => h.id === indItem.id) === -1) {
                familyHistory.push(indItem);
             }
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

      const independentByProject = (Object.entries(
        independent
          .filter(i => !i.is_archived && !i.parent_base_id)
          .reduce((groups: Record<string, any[]>, item) => {
            const projectName = item.project_name || item.projectName || '未命名项目';
            if (!groups[projectName]) groups[projectName] = [];
            groups[projectName].push(item);
            return groups;
          }, {})
      ) as [string, any[]][])
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
        this.history = evaluations; // 直接赋值实现原子刷新，避免使用 push 导致重复
        this.isHistoryLoaded = true;
      } catch (e) {
        console.error('[EvaluationStore] fetchHistory failed:', e);
      }
    },

    async initDraft() {
      if (!this.projectName) return;
      try {
        const payload = {
          project_name: this.projectName,
          requirement_title: this.requirementTitle || undefined,
          referenced_baseline_id: this.referencedBaselineIds.length > 0 ? this.referencedBaselineIds[0] : null
        };
        const res = await createDraft(payload);
        this.draftId = res.evaluation_id;
        console.log('[EvaluationStore] initDraft created draftId:', this.draftId);
      } catch(e) {
        console.error('[EvaluationStore] Failed to initialize draft:', e);
      }
    },

    debouncedSyncItems() {
      if (!this.draftId) return;
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }
      this.syncTimer = setTimeout(async () => {
        try {
          await syncDraftItems(this.draftId!, this.items);
          console.log('[EvaluationStore] Synced draft items successfully.');
        } catch(e) {
          console.error('[EvaluationStore] Failed to sync draft items:', e);
        }
      }, 500);
    },

    setStep(step: number) {
      this.currentStep = step;
    },

    async toggleBaseline(id: number) {
      const index = this.referencedBaselineIds.indexOf(id);
      if (index > -1) {
        this.referencedBaselineIds.splice(index, 1);
        this.baselineContentItem = '';
        this.textContent = ''; // Clear if unselected
        this.editMode = 'incremental';
      } else {
        this.referencedBaselineIds = [id];
        
        // 继承基准的项目名（项目归属不变），但不继承标题（让用户为本次评估自定义名称）
        const baselineStore = useBaselineStore();
        const baseDoc = baselineStore.allFiles.find(f => f.id === id);
        if (baseDoc) {
          this.projectName = baseDoc.name;
          // requirementTitle 留空，让用户主动填写，避免历史记录中所有版本同名
          this.requirementTitle = '';
        }

        this.editMode = 'incremental';
        this.textContent = '';
        this.items = []; // Clear current items
        try {
          const fetchedItems = await getBaselineItems(id);
          this.items = fetchedItems.map((item: any) => ({
            parent_item_id: item.id,
            title: item.title,
            content: item.content,
            status: 'unchanged',
            sort_order: item.sort_order
          }));
        } catch (e) {
          console.error('[EvaluationStore] Failed to fetch baseline items:', e);
        }
      }
      if (this.referencedBaselineIds.length === 0) {
        this.onlyReference = false;
      }
      // Since baseline changed, re-init draft
      if (this.projectName) {
        this.initDraft();
      }
    },

    unlockBaselineToEditor() {
      this.editMode = 'full';
      if (this.textContent.trim()) {
        this.textContent = this.baselineContentItem + '\n\n' + this.textContent;
      } else {
        this.textContent = this.baselineContentItem;
      }
    },

    addItem(title: string, content: string) {
      this.items.push({
        parent_item_id: null,
        title,
        content,
        status: 'new',
        sort_order: this.items.length
      });
      this.debouncedSyncItems();
    },

    updateItem(index: number, title: string, content: string) {
      if (this.items[index]) {
        this.items[index].title = title;
        this.items[index].content = content;
        if (this.items[index].status === 'unchanged') {
          this.items[index].status = 'modified';
        }
        this.debouncedSyncItems();
      }
    },

    toggleDeleteItem(index: number) {
      if (this.items[index]) {
        if (this.items[index].status === 'new') {
          // If it's pure new, just remove it
          this.items.splice(index, 1);
        } else if (this.items[index].status === 'deleted') {
          // Restore
          this.items[index].status = this.items[index].parent_item_id ? 'unchanged' : 'new';
        } else {
          // Mark as deleted
          this.items[index].status = 'deleted';
        }
        this.debouncedSyncItems();
      }
    },

    clearBaselines() {
      // Clean up backend draft if abandoned
      if (this.draftId) {
         cancelEvaluation(this.draftId).catch(console.error);
         this.draftId = null;
      }
      this.referencedBaselineIds = [];
      this.onlyReference = false;
      this.baselineContentItem = '';
      this.items = [];
      this.editMode = 'incremental';
    },

    reset() {
      if (this.draftId) {
         cancelEvaluation(this.draftId).catch(console.error);
      }
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
      this.baselineContentItem = '';
      this.items = [];
      this.editMode = 'incremental';
      this.draftId = null;
      if (this.syncTimer) clearTimeout(this.syncTimer);
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
        title: this.requirementTitle || (this.requirementType === 'document' ? this.uploadedFile?.name : (this.textContent ? this.textContent.slice(0, 15) + '...' : projectName)),
        total_score: report.total_score || report.score,
        date: new Date().toISOString().split('T')[0],
        model: report.model_used || 'GPT-4o',
        standards: [],
        hasReference: references.length > 0,
        references,
        parent_base_id: parentBase ? parentBase.id : null,
        task_type: references.length > 0 ? (this.editMode === 'full' ? 'full_rebaseline' : 'incremental') : 'full',
        is_archived: false,
        version,
        issues: report.issues || [],
        suggestions: report.suggestions || '',
        edit_mode: this.editMode,
      };

      try {
        // MOCK 环境下会走 createEvaluation 新增记录；REAL 环境下后端在完成评估时自动在 evaluations 表落地记录，不需要手动 POST `createEvaluation`。
        // 为了两端兼容，我们实际上只需在评估完成后调用一次 fetchHistory() 刷新列表即可。
        // 这里的代码保留了 mock 环境的回退方案：
        await createEvaluation(newRecord);
        await this.fetchHistory(); // 请求服务器更新历史列表
      } catch (e) {
        // 降级：本地写入（避免 UI 中断）
        console.warn('[EvaluationStore] createEvaluation failed, using local fallback:', e);
        this.history.unshift({ ...newRecord, id: Date.now() });
      }
    },

    /**
     * 删除或撤销评估任务（物理清理）
     */
    async discardEvaluation(id: number) {
      try {
        await cancelEvaluation(id);
        this.history = this.history.filter(item => item.id !== id);
      } catch (e) {
        console.error('[EvaluationStore] discardEvaluation failed:', e);
      }
    },

        /**
     * 上传需求文件并同步解析预览
     */
    async uploadFile(file: File) {
      try {
        const res = await uploadRequirementFile(file);
        this.uploadedFile = { ...res, raw: file };
        if (res.parsed_text) {
          // SEED: If backend provided initial parse, put it in editor
          this.textContent = (this.textContent ? this.textContent + '\n\n' : '') + res.parsed_text;
        }
        return res;
      } catch (e) {
        console.error('[EvaluationStore] uploadFile failed:', e);
        throw e;
      }
    },

    /**
     * 移除已上传的需求文档（物理删除并清空状态）
     */
    async removeUploadedFile() {
      if (!this.uploadedFile?.file_id) {
        this.uploadedFile = null;
        return;
      }
      try {
        await deleteUpload(this.uploadedFile.file_id);
        this.uploadedFile = null;
      } catch (e) {
        console.error('[EvaluationStore] removeUploadedFile failed:', e);
        // 为了 UI 响应，哪怕后端删除失败，前端也会清空以便用户上传新文件
        this.uploadedFile = null;
      }
    },

    /**
     * 修改内容并重测
     */
    async updateAndRestart(id: number, standards?: number[]) {
      try {
        const res = await updateEvaluation(id, {
          text_content: this.textContent,
          reevaluate: true,
          standard_ids: standards
        });
        return res;
      } catch (e) {
        console.error('[EvaluationStore] updateAndRestart failed:', e);
        throw e;
      }
    }
  }
});
