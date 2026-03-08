import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    role: 'user' as 'admin' | 'user',
    isLoggedIn: false,
  }),
  actions: {
    login(username: string, role: 'admin' | 'user') {
      this.user = { username };
      this.role = role;
      this.isLoggedIn = true;
    },
    logout() {
      this.user = null;
      this.role = 'user';
      this.isLoggedIn = false;
    },
  },
});

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

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    searchQuery: '',
    activeTab: 'standards' as 'standards' | 'baselines',
    categories: [
      { id: 1, name: '国际标准', type: 'default', files: [{ id: 101, name: 'ISO-29119.pdf', status: 'enabled', desc: '软件测试国际标准，涵盖测试过程、文档、技术等。' }] },
      { id: 2, name: '公司标准', type: 'default', files: [{ id: 201, name: 'Company-QA-Standard.docx', status: 'enabled', desc: '公司内部质量保证体系，包含需求评审规范。' }] },
      { id: 3, name: '项目组标准', type: 'default', files: [{ id: 301, name: 'Project-A-Reqs.txt', status: 'enabled', desc: '项目组特定需求编写建议与检查清单。' }] },
      { id: 4, name: '自定义文档', type: 'user', files: [] as any[] },
    ],
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

export const useBaselineStore = defineStore('baseline', {
  state: () => ({
    searchQuery: '',
    categories: [
      { id: 1, name: '系统默认基准', type: 'default', files: [
        { 
          id: 1001, 
          name: '电商核心交易基准需求', 
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
          full_content: '这是电商核心交易基准需求V1.0的完整内容...'
        }
      ] },
      { id: 2, name: '用户归档基准', type: 'user', files: [] as any[] },
    ],
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
    addBaseline(file: any, categoryId: number = 2) {
      const cat = this.categories.find(c => c.id === categoryId);
      if (cat) {
        let version = file.version || 'V1.0';
        
        // Auto-increment version if it's a child baseline
        if (file.parent_base_id) {
          const siblings = this.allFiles.filter(f => 
            f.parent_base_id === file.parent_base_id || f.id === file.parent_base_id
          );
          if (siblings.length > 0) {
            // Simple version parser: V1.0 -> 1.0
            const maxVer = siblings.reduce((max, f) => {
              const v = parseFloat(f.version.replace(/[^0-9.]/g, ''));
              return v > max ? v : max;
            }, 0);
            version = `V${(maxVer + 0.1).toFixed(1)}`;
          }
        }

        const newBaseline = {
          ...file,
          id: Date.now(),
          version: version,
          author: '当前用户',
          date: new Date().toISOString().split('T')[0],
          refCount: 0,
          status: 'enabled',
          parent_base_id: file.parent_base_id || null,
          is_latest: true,
          full_content: file.full_content || ''
        };

        // If it's a new version, update the old latest
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
    },
    updateStatus(fileId: number, status: 'enabled' | 'disabled') {
      this.categories.forEach(cat => {
        const file = cat.files.find(f => f.id === fileId);
        if (file) file.status = status;
      });
    },
    removeBaseline(fileId: number) {
      this.categories.forEach(cat => {
        cat.files = cat.files.filter(f => f.id !== fileId && f.parent_base_id !== fileId);
      });
    }
  }
});

export const useEvaluationStore = defineStore('evaluation', {
  state: () => ({
    currentStep: 1,
    requirementType: 'text' as 'text' | 'document',
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
    history: [
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
        is_archived: false
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
        is_archived: false
      },
    ],
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
      
      // Map history to the correct baseline version structure
      const tree = baselines.map(base => {
        // Collect all history items that belong to this baseline family (any version)
        // Use Set to avoid duplicates if base.id is also in versions (which shouldn't happen but safe to guard)
        const familyIds = new Set([base.id, ...base.versions.map((v: any) => v.id)]);
        let familyHistory: any[] = [];
        
        familyIds.forEach(fid => {
           if (grouped[fid.toString()]) {
             familyHistory = familyHistory.concat(grouped[fid.toString()]);
           }
        });

        // Sort: parent first, then by version descending
        familyHistory.sort((a, b) => {
           // Parent item comes first
           if (a.id === base.id) return -1;
           if (b.id === base.id) return 1;
           // Then sort by version descending
           const vA = parseFloat(a.version.replace(/[^0-9.]/g, ''));
           const vB = parseFloat(b.version.replace(/[^0-9.]/g, ''));
           return vB - vA;
        });

        return {
          ...base,
          history: familyHistory
        };
      });
      
      // Group independent (unarchived) tasks by projectName
      const independentGrouped = independent.filter(i => !i.is_archived).reduce((groups: Record<string, any[]>, item) => {
        const projectName = item.projectName || '未命名项目';
        if (!groups[projectName]) {
          groups[projectName] = [];
        }
        groups[projectName].push(item);
        return groups;
      }, {});
      
      // Convert grouped object to array and sort by project name
      const independentByProject = Object.entries(independentGrouped)
        .map(([projectName, items]) => ({
          projectName,
          items: items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    setStep(step: number) {
      this.currentStep = step;
    },
    toggleBaseline(id: number) {
      const index = this.referencedBaselineIds.indexOf(id);
      if (index > -1) {
        this.referencedBaselineIds.splice(index, 1);
      } else {
        // Only allow one baseline for incremental evaluation as per requirements
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
      this.textContent = '';
      this.uploadedFile = null;
      this.referencedBaselineIds = [];
      this.onlyReference = false;
      this.instructions = '';
      this.currentReport = null;
      this.currentStep = 1;
      this.onlyEvaluateNew = false;
    },
    addHistory(report: any) {
      const baselineStore = useBaselineStore();
      const references = this.referencedBaselineIds.map(id => {
        const f = baselineStore.allFiles.find(bf => bf.id === id);
        return f ? f.name : '';
      }).filter(n => n);

      const parentBase = this.referencedBaselineIds.length > 0 ? 
        baselineStore.allFiles.find(f => f.id === this.referencedBaselineIds[0]) : null;
      
      const projectName = this.referencedBaselineIds.length > 0 ? parentBase?.name : this.projectName || '未命名项目';
      
      // Find existing unarchived tasks for the same project
      const existingUnarchived = this.history.filter(item => 
        item.projectName === projectName && 
        !item.is_archived && 
        !item.parent_base_id
      );
      
      // Calculate next version number
      let version = 'V1.0';
      if (parentBase) {
        // For incremental tasks, increment from parent base version
        version = `V${(parseFloat(parentBase.version.replace('V', '')) + 0.1).toFixed(1)}`;
      } else if (existingUnarchived.length > 0) {
        // For same project, increment from the latest version
        const latestVersion = existingUnarchived.reduce((max, item) => {
          const v = parseFloat(item.version.replace('V', ''));
          return v > max ? v : max;
        }, 0);
        version = `V${(latestVersion + 0.1).toFixed(1)}`;
        
        // Remove existing unarchived tasks for the same project
        this.history = this.history.filter(item => 
          !(item.projectName === projectName && 
            !item.is_archived && 
            !item.parent_base_id)
        );
      }

      this.history.unshift({
        id: Date.now(),
        projectName: projectName,
        title: this.requirementType === 'document' ? this.uploadedFile.name : (this.requirementTitle || this.textContent.slice(0, 15) + '...'),
        total_score: report.total_score || report.score,
        date: new Date().toISOString().split('T')[0],
        model: 'GPT-4o',
        standards: [],
        hasReference: references.length > 0,
        references,
        parent_base_id: parentBase ? parentBase.id : null,
        task_type: references.length > 0 ? 'incremental' : 'full',
        is_archived: false,
        version: version
      });
    }
  }
});
