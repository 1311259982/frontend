# 未归档任务组织优化 - 实现计划

## 问题分析
当前系统在未引用任何历史基准文档时，如果不归档就不会创建项目名，导致在未归档板块里混乱排列。同项目多次引用同一个版本，不归档，会覆盖之前的临时版本。

## 解决方案
为了解决这个问题，需要在未引用任何历史基准文档时，首先定义项目名，然后写需求标题，最后是内容。这样不管最后归档不归档都能以项目分类，就算不归档也会在历史评估未归档版块产生一个临时版本。

## 实施步骤

### [ ] 任务 1: 在需求提交界面添加项目名输入字段
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 在Step 2的需求提交界面中添加项目名输入字段
  - 确保在未引用基准文档时显示该字段
  - 当引用基准文档时，项目名自动填充为基准文档的名称
- **Success Criteria**: 
  - 界面上显示项目名输入字段
  - 字段在适当的时机显示和隐藏
  - 引用基准文档时自动填充项目名
- **Test Requirements**: 
  - `programmatic` TR-1.1: 未引用基准文档时，项目名字段显示
  - `programmatic` TR-1.2: 引用基准文档时，项目名字段自动填充并禁用
  - `human-judgement` TR-1.3: 字段位置合理，用户体验良好

### [ ] 任务 2: 修改Evaluation Store添加项目名字段
- **优先级**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 在evaluation store的state中添加projectName字段
  - 修改addHistory方法，将projectName添加到历史记录中
  - 确保projectName在reset方法中被重置
- **Success Criteria**: 
  - evaluation store中包含projectName字段
  - 历史记录中包含projectName信息
  - reset方法正确重置projectName
- **Test Requirements**: 
  - `programmatic` TR-2.1: 历史记录对象包含projectName字段
  - `programmatic` TR-2.2: 重置后projectName为空

### [ ] 任务 3: 修改历史记录聚合逻辑，按项目名分组
- **优先级**: P0
- **Depends On**: 任务 2
- **Description**: 
  - 修改aggregatedHistory getter，为未归档任务按项目名分组
  - 在未归档板块中显示项目分组
  - 确保同项目的未归档任务显示在同一分组下
- **Success Criteria**: 
  - 未归档任务按项目名分组显示
  - 同一项目的任务显示在同一分组下
  - 分组显示逻辑正确
- **Test Requirements**: 
  - `programmatic` TR-3.1: 未归档任务按项目名分组
  - `human-judgement` TR-3.2: 分组显示清晰，用户体验良好

### [ ] 任务 4: 实现同项目多次评估的版本管理
- **优先级**: P1
- **Depends On**: 任务 3
- **Description**: 
  - 为未归档任务添加版本管理
  - 同项目多次评估时，不归档的情况下覆盖之前的临时版本
  - 确保版本号正确递增
- **Success Criteria**: 
  - 同项目多次评估时版本号正确递增
  - 不归档的情况下覆盖之前的临时版本
  - 版本管理逻辑正确
- **Test Requirements**: 
  - `programmatic` TR-4.1: 同项目多次评估版本号递增
  - `programmatic` TR-4.2: 不归档时覆盖之前的临时版本

### [ ] 任务 5: 测试和验证
- **优先级**: P1
- **Depends On**: 任务 1-4
- **Description**: 
  - 测试未引用基准文档时的项目名输入
  - 测试引用基准文档时的项目名自动填充
  - 测试未归档任务的分组显示
  - 测试同项目多次评估的版本管理
- **Success Criteria**: 
  - 所有功能正常工作
  - 界面显示正确
  - 用户体验良好
- **Test Requirements**: 
  - `programmatic` TR-5.1: 所有功能测试通过
  - `human-judgement` TR-5.2: 界面显示正确，用户体验良好

## 预期结果
- 未引用基准文档时，用户可以输入项目名
- 未归档任务按项目名分组显示，不再混乱排列
- 同项目多次评估时，不归档的情况下会覆盖之前的临时版本
- 点击归档后项目下会迭代产生一个新版本

## 风险评估
- 低风险：修改主要集中在前端界面和状态管理，不涉及后端逻辑
- 中风险：需要确保历史记录的向后兼容性，不影响已有的归档记录
- 低风险：修改逻辑清晰，实现难度适中