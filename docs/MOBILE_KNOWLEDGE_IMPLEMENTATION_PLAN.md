# 移动端知识库实现方案

## 🚨 重要架构适配说明

**基于现有信息块系统设计**：本方案严格遵循移动端现有的信息块架构（参考：`docs/MESSAGE_BLOCK_DEVELOPMENT_GUIDE.md`），确保知识库功能与现有系统完美集成。

### 关键适配要点：
1. **数据存储**：基于现有DexieStorageService架构，扩展到版本7
2. **信息块集成**：创建KnowledgeReferenceMessageBlock，遵循现有信息块创建和关联模式
3. **文件处理**：复用现有MobileFileStorageService和files表
4. **状态管理**：遵循Redux + Entity Adapter模式
5. **UI组件**：参考现有message blocks的设计模式

## 核心技术方案

### 1. 轻量级向量搜索引擎

```typescript
// 基于余弦相似度的向量搜索
class MobileVectorSearch {
  // 计算余弦相似度
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // 向量搜索
  async search(queryVector: number[], threshold: number = 0.7): Promise<SearchResult[]> {
    const vectors = await this.getStoredVectors();
    const results = vectors
      .map(item => ({
        ...item,
        similarity: this.cosineSimilarity(queryVector, item.vector)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  }
}
```

### 2. IndexedDB向量存储（基于现有DexieStorageService架构）

```typescript
// 🚨 重要：基于现有信息块架构设计知识库存储
// 参考：docs/MESSAGE_BLOCK_DEVELOPMENT_GUIDE.md

// 知识库相关数据结构
interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  model: string;
  dimensions: number;
  chunkSize?: number;
  chunkOverlap?: number;
  threshold?: number;
  created_at: string;
  updated_at: string;
}

interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  content: string;
  vector: number[];
  metadata: {
    source: string;
    fileName?: string;
    chunkIndex: number;
    timestamp: number;
    fileId?: string; // 关联到files表
  };
}

// 扩展现有DexieStorageService（版本7）
this.version(7).stores({
  // 现有表保持不变...
  assistants: 'id',
  topics: 'id, _lastMessageTimeNum, messages',
  settings: 'id',
  images: 'id',
  imageMetadata: 'id, topicId, created',
  metadata: 'id',
  message_blocks: 'id, messageId',
  messages: 'id, topicId, assistantId',
  files: 'id, name, origin_name, size, ext, type, created_at, count, hash',
  // 新增知识库相关表
  knowledge_bases: 'id, name, model, dimensions, created_at, updated_at',
  knowledge_documents: 'id, knowledgeBaseId, content, metadata.source, metadata.timestamp',
  knowledge_vectors: 'id, knowledgeBaseId, vector' // 单独存储向量数据优化查询
});
```

### 3. 移动端嵌入API集成

```typescript
class MobileEmbeddingService {
  async getEmbedding(text: string, model: string): Promise<number[]> {
    const response = await universalFetch('/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: model
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

## 性能优化策略

### 1. 内存管理
- 分批处理大文档
- 限制同时处理的文档数量
- 实现向量数据的懒加载

### 2. 存储优化
- 压缩向量数据存储
- 使用索引优化查询性能
- 实现数据清理机制

### 3. 网络优化
- 批量请求嵌入API
- 实现请求缓存
- 添加离线支持

## 移植限制和解决方案

### 1. 无法移植的功能
- 本地嵌入模型 → 使用云端API
- 复杂并发处理 → 简化队列管理
- LibSqlDb → 使用IndexedDB

### 2. 需要适配的功能
- 文档解析 → 使用移动端兼容的解析库
- 向量存储 → 基于IndexedDB实现
- 搜索算法 → 纯JavaScript实现

### 3. 性能考虑
- 降低并发数量
- 减少内存使用
- 优化UI响应性

## 实现优先级

### P0 - 核心功能
1. 知识库创建和管理
2. 文档添加和向量化
3. 基础搜索功能

### P1 - 增强功能
1. 搜索结果排序和过滤
2. 文档分块优化
3. 批量操作支持

### P2 - 高级功能
1. 知识库导入导出
2. 搜索历史记录
3. 智能推荐

## 详细施工任务清单

### 🔴 阶段一：架构设计与分析 (P0 - 8小时)

#### :police_car_light: 任务1：深度分析知识库实现
- **操作类型**：:counterclockwise_arrows_button: 分析现有代码
- **文件路径**：`原版/src/main/services/KnowledgeService.ts`
- **完成标准**：
  - [ ] 理解RAG应用架构和向量数据库使用
  - [ ] 分析并发队列管理机制（80MB工作负载 + 30个并发）
  - [ ] 梳理嵌入模型和重排模型集成方式
  - [ ] 识别可移植和需要适配的功能点
  - [ ] 文档化关键技术要点和依赖关系

#### 任务2：设计移动端知识库架构
- **操作类型**：:new_button: 创建架构设计
- **文件路径**：`docs/MOBILE_KNOWLEDGE_ARCHITECTURE.md`
- **完成标准**：
  - [ ] 基于现有DexieStorageService设计数据存储方案
  - [ ] 设计轻量级向量搜索算法（余弦相似度）
  - [ ] 规划移动端嵌入API集成方案
  - [ ] 制定性能优化策略（20MB + 10个并发）
  - [ ] 绘制架构图和数据流图

#### 任务3：评估移植可行性和限制
- **操作类型**：:memo: 文档分析
- **完成标准**：
  - [ ] 识别功能在移动端的实现限制
  - [ ] 评估第三方依赖的移动端兼容性
  - [ ] 制定功能简化和替代方案
  - [ ] 确定无法移植的功能列表（约15%）

### 🔴 阶段二：核心服务实现 (P0 - 16小时)

#### :police_car_light: 任务4：实现MobileKnowledgeService核心服务
- **操作类型**：:new_button: 创建新服务
- **文件路径**：`src/shared/services/MobileKnowledgeService.ts`
- **完成标准**：
  - [ ] 实现知识库创建、删除、更新功能
  - [ ] 集成DexieStorageService进行数据持久化
  - [ ] 实现文档添加和管理功能
  - [ ] 提供搜索接口和结果排序
  - [ ] 添加错误处理和状态管理
  - [ ] 实现批量操作支持

#### 任务5：实现轻量级向量搜索引擎
- **操作类型**：:new_button: 创建搜索引擎
- **文件路径**：`src/shared/services/MobileVectorSearchService.ts`
- **完成标准**：
  - [ ] 实现基于余弦相似度的向量搜索
  - [ ] 支持向量存储和检索（IndexedDB）
  - [ ] 实现文档分块和向量化
  - [ ] 提供相似度阈值过滤（默认0.7）
  - [ ] 优化搜索性能和内存使用
  - [ ] 添加搜索结果缓存机制

#### 任务6：集成移动端嵌入API
- **操作类型**：:new_button: 创建嵌入服务
- **文件路径**：`src/shared/services/MobileEmbeddingService.ts`
- **完成标准**：
  - [ ] 支持OpenAI、Gemini等嵌入模型
  - [ ] 使用UniversalFetch处理网络请求
  - [ ] 实现批量文本向量化（优化API调用）
  - [ ] 添加错误处理和重试机制
  - [ ] 实现请求缓存和离线支持
  - [ ] 支持不同维度的嵌入模型

#### 任务7：实现文档处理适配器
- **操作类型**：:counterclockwise_arrows_button: 扩展现有服务
- **文件路径**：`src/shared/services/MobileFileStorageService.ts`
- **完成标准**：
  - [ ] 扩展文件读取功能支持知识库需求
  - [ ] 实现PDF、Office文档的文本提取
  - [ ] 添加文档分块处理（1000字符/块）
  - [ ] 优化大文件处理性能（分批处理）
  - [ ] 支持多种文档格式解析
  - [ ] 添加文档预处理和清理

#### 任务8：实现知识库数据模型（基于现有信息块架构）
- **操作类型**：:counterclockwise_arrows_button: 扩展数据库
- **文件路径**：`src/shared/services/DexieStorageService.ts`
- **完成标准**：
  - [ ] 扩展现有DexieStorageService到版本7（当前版本6）
  - [ ] 添加知识库相关数据表（knowledge_bases, knowledge_documents, knowledge_vectors）
  - [ ] 实现向量数据存储结构（参考message_blocks表设计）
  - [ ] 添加索引优化查询性能（knowledgeBaseId, timestamp等）
  - [ ] 实现数据迁移逻辑（upgradeToV7方法）
  - [ ] 集成现有files表（复用文件存储机制）
  - [ ] 添加数据完整性检查和事务支持
  - [ ] 遵循现有的数据库操作模式（save/get/update/delete）

### 🟠 阶段三：UI组件开发 (P1 - 12小时)

#### 任务9：创建知识库管理主页面
- **操作类型**：:new_button: 创建页面组件
- **文件路径**：`src/pages/KnowledgePage/index.tsx`
- **完成标准**：
  - [ ] 实现知识库列表展示（卡片式布局）
  - [ ] 添加创建、编辑、删除功能
  - [ ] 设计移动端友好的交互界面
  - [ ] 集成搜索功能和快速访问
  - [ ] 添加知识库统计信息显示
  - [ ] 实现下拉刷新和无限滚动

#### 任务10：实现知识库创建对话框
- **操作类型**：:new_button: 创建对话框组件
- **文件路径**：`src/components/KnowledgeManagement/CreateKnowledgeDialog.tsx`
- **完成标准**：
  - [ ] 支持知识库名称和描述输入
  - [ ] 集成嵌入模型选择（下拉列表）
  - [ ] 添加参数配置选项（分块大小、阈值等）
  - [ ] 实现表单验证和错误提示
  - [ ] 支持模板和预设配置
  - [ ] 优化移动端输入体验

#### 任务11：实现文档添加界面
- **操作类型**：:new_button: 创建文档管理组件
- **文件路径**：`src/components/KnowledgeManagement/DocumentManager.tsx`
- **完成标准**：
  - [ ] 支持文件上传和URL添加
  - [ ] 实现文档列表展示（支持搜索和过滤）
  - [ ] 添加处理进度显示（进度条和状态）
  - [ ] 支持文档删除和编辑
  - [ ] 实现批量操作（选择、删除、导出）
  - [ ] 添加文档预览功能

#### 任务12：实现知识库搜索界面
- **操作类型**：:new_button: 创建搜索组件
- **文件路径**：`src/components/KnowledgeManagement/KnowledgeSearch.tsx`
- **完成标准**：
  - [ ] 实现搜索输入和结果展示
  - [ ] 支持搜索结果高亮显示
  - [ ] 添加相似度分数显示（百分比）
  - [ ] 实现搜索历史记录
  - [ ] 支持高级搜索选项（阈值调整）
  - [ ] 添加搜索结果导出功能

### 🟠 阶段四：系统集成 (P1 - 4小时)

#### 任务13：创建知识库引用信息块（基于现有信息块系统）
- **操作类型**：:new_button: 创建新信息块类型
- **文件路径**：`src/shared/types/newMessage.ts`, `src/components/message/blocks/KnowledgeReferenceBlock.tsx`
- **完成标准**：
  - [ ] 定义KnowledgeReferenceMessageBlock类型（参考CitationMessageBlock）
  - [ ] 在MessageBlockType枚举中添加KNOWLEDGE_REFERENCE类型
  - [ ] 创建知识库引用块渲染组件
  - [ ] 在MessageBlockRenderer中添加处理逻辑
  - [ ] 实现引用内容展示和来源链接
  - [ ] 添加相似度分数显示
  - [ ] 支持点击查看原文档功能
  - [ ] 遵循现有信息块的创建和关联模式

#### 任务14：集成到聊天页面
- **操作类型**：:counterclockwise_arrows_button: 修改现有页面
- **文件路径**：`src/pages/ChatPage/index.tsx`
- **完成标准**：
  - [ ] 在聊天输入区添加知识库选择器
  - [ ] 实现知识库搜索和引用块创建
  - [ ] 集成知识库上下文到消息中
  - [ ] 优化移动端交互体验
  - [ ] 支持多知识库同时使用
  - [ ] 使用现有的BlockManager创建引用块

#### 任务15：添加设置页面配置
- **操作类型**：:counterclockwise_arrows_button: 扩展设置页面
- **文件路径**：`src/pages/Settings/KnowledgeSettings.tsx`
- **完成标准**：
  - [ ] 添加知识库全局设置
  - [ ] 实现嵌入模型配置
  - [ ] 添加搜索参数调整
  - [ ] 实现数据导入导出
  - [ ] 支持缓存清理和数据管理
  - [ ] 添加使用统计和分析

#### 任务16：实现路由和导航集成
- **操作类型**：:counterclockwise_arrows_button: 更新路由配置
- **文件路径**：`src/routes/index.tsx`
- **完成标准**：
  - [ ] 添加知识库页面路由
  - [ ] 更新底部导航栏（添加知识库图标）
  - [ ] 实现页面间跳转和深度链接
  - [ ] 添加权限控制和访问限制
  - [ ] 优化页面加载性能
  - [ ] 实现页面状态保持

## 测试策略

### 1. 单元测试
- [ ] 向量搜索算法测试（余弦相似度计算）
- [ ] 数据存储和检索测试（IndexedDB操作）
- [ ] API集成测试（嵌入模型调用）
- [ ] 文档处理测试（各种格式解析）

### 2. 集成测试
- [ ] 端到端知识库操作测试
- [ ] 性能压力测试（大量文档处理）
- [ ] 兼容性测试（不同设备和浏览器）
- [ ] 网络异常处理测试

### 3. 用户测试
- [ ] 移动端交互体验测试
- [ ] 功能完整性验证
- [ ] 性能表现评估
- [ ] 用户界面友好性测试

## 风险评估与应对策略

### 🚨 高风险项目 (需要重点关注)

#### 1. 向量搜索性能风险
- **风险描述**：移动端JavaScript实现的向量搜索可能性能不足
- **影响程度**：🔴 高 - 直接影响用户体验
- **应对措施**：
  - [ ] 实现向量数据分页加载
  - [ ] 使用Web Workers进行后台计算
  - [ ] 添加搜索结果缓存机制
  - [ ] 限制单次搜索的向量数量

#### 2. 内存使用风险
- **风险描述**：大量向量数据可能导致移动端内存溢出
- **影响程度**：🔴 高 - 可能导致应用崩溃
- **应对措施**：
  - [ ] 实现向量数据的懒加载
  - [ ] 添加内存使用监控
  - [ ] 设置向量数据大小限制
  - [ ] 实现自动垃圾回收机制

#### 3. 网络依赖风险
- **风险描述**：嵌入API完全依赖网络，离线无法使用
- **影响程度**：🟠 中 - 影响离线使用体验
- **应对措施**：
  - [ ] 实现嵌入结果缓存
  - [ ] 添加离线模式提示
  - [ ] 支持预计算常用查询
  - [ ] 实现网络状态检测

### 🟡 中等风险项目

#### 1. 数据迁移风险
- **风险描述**：数据库结构变更可能导致数据丢失
- **影响程度**：🟡 中 - 影响用户数据安全
- **应对措施**：
  - [ ] 实现完整的数据备份机制
  - [ ] 添加迁移前数据验证
  - [ ] 提供回滚功能
  - [ ] 分步骤渐进式迁移

#### 2. 兼容性风险
- **风险描述**：不同设备和浏览器的兼容性问题
- **影响程度**：🟡 中 - 影响部分用户使用
- **应对措施**：
  - [ ] 广泛的设备测试
  - [ ] 渐进式功能降级
  - [ ] 添加兼容性检测
  - [ ] 提供替代方案

## 质量控制标准

### 代码质量检查清单
- [ ] **语法正确**：所有TypeScript代码通过编译
- [ ] **逻辑完整**：知识库CRUD操作功能完整
- [ ] **异常处理**：网络错误、数据错误等异常处理完善
- [ ] **性能考虑**：向量搜索性能优化，内存使用合理
- [ ] **安全检查**：用户数据安全，API密钥保护
- [ ] **测试验证**：单元测试覆盖率>80%，集成测试通过
- [ ] **文档同步**：技术文档和用户文档更新

### 移动端特定质量标准
- [ ] **触屏优化**：所有交互元素适配触屏操作
- [ ] **响应式设计**：适配不同屏幕尺寸
- [ ] **性能优化**：页面加载时间<3秒，操作响应<1秒
- [ ] **离线支持**：核心功能支持离线使用
- [ ] **电池优化**：避免过度CPU和网络使用
- [ ] **存储管理**：合理使用本地存储空间

## 项目进度管控

### 施工准备检查清单
- [ ] **环境准备**：开发环境配置正确（Node.js, npm, Capacitor）
- [ ] **依赖确认**：所需依赖已安装/更新
- [ ] **备份完成**：重要代码已备份到Git
- [ ] **权限验证**：具备必要的代码修改权限
- [ ] **资源确认**：时间和人力资源已分配（40工时）

### 📊 实际进度统计
- **总任务数**：16个任务
- **已完成**：14/16 (88%) ✅
- **进行中**：0/16 (0%) 🔄
- **待开始**：2/16 (12%) ⏳
- **遇到问题**：0个

### 🎯 阶段完成状态
- [x] **阶段一：架构设计与分析** (3/3) - ✅ 已完成
  - [x] 任务1：深度分析知识库实现 ✅
  - [x] 任务2：设计移动端知识库架构 ✅
  - [x] 任务3：评估移植可行性和限制 ✅

- [x] **阶段二：核心服务实现** (5/5) - ✅ 已完成
  - [x] 任务4：实现MobileKnowledgeService核心服务 ✅
  - [x] 任务5：实现轻量级向量搜索引擎 ✅ (集成在MobileKnowledgeService中)
  - [x] 任务6：集成移动端嵌入API ✅ (MobileEmbeddingService)
  - [x] 任务7：实现文档处理适配器 ✅ (扩展MobileFileStorageService)
  - [x] 任务8：实现知识库数据模型 ✅ (DexieStorageService v7)

- [x] **阶段三：UI组件开发** (4/4) - ✅ 已完成
  - [x] 任务9：创建知识库管理主页面 ✅ (KnowledgeBaseList)
  - [x] 任务10：实现知识库创建对话框 ✅ (CreateKnowledgeDialog)
  - [x] 任务11：实现文档添加界面 ✅ (DocumentManager)
  - [x] 任务12：实现知识库搜索界面 ✅ (KnowledgeSearch)

- [x] **阶段四：系统集成** (4/4) - ✅ 已完成
  - [x] 任务13：创建知识库引用信息块 ✅ (KnowledgeReferenceBlock)
  - [x] 任务14：集成到聊天页面工具栏 ✅ (ChatToolbar和CompactChatInput已集成)
  - [x] 任务15：添加设置页面配置 ✅ (KnowledgeSettings页面已创建)
  - [x] 任务16：实现路由和导航集成 ✅ (已添加/knowledge/*和/settings/knowledge路由)

## 🚧 剩余任务详细说明

### ✅ 任务14：集成到聊天页面工具栏 (优先级：P0) - 已完成
**当前状态**：已完成
**实际工时**：2.5小时
**完成内容**：
- [x] **ChatToolbar（默认布局）**：在buttons数组中添加知识库按钮
- [x] **CompactChatInput（聚合输入框）**：在扩展功能面板中添加知识库功能
- [x] 实现知识库选择器对话框 (KnowledgeSelector组件)
- [x] 创建知识库图标配置和处理逻辑
- [x] 集成到inputIcons配置文件中
- [x] 优化移动端交互体验（触屏友好）
- [ ] 将知识库搜索结果作为上下文注入到消息中 (待后续完善)

### ✅ 任务15：添加设置页面配置 (优先级：P1) - 已完成
**当前状态**：已完成
**实际工时**：1.5小时
**完成内容**：
- [x] 创建`src/pages/Settings/KnowledgeSettings.tsx`页面
- [x] 添加知识库全局设置（默认嵌入模型、搜索阈值等）
- [x] 实现嵌入模型配置界面
- [x] 添加知识库数据管理功能（清理、导入、导出）
- [x] 集成到设置页面路由中
- [x] 添加知识库统计信息展示

### 关键里程碑
1. ✅ **架构设计完成** - 已完成
2. ✅ **核心服务实现** - 已完成
3. ✅ **UI组件开发** - 已完成
4. 🔄 **系统集成测试** - 进行中（剩余2个任务）

## 验收标准检查

### 功能验证
- [ ] **知识库管理**：创建、编辑、删除知识库功能正常
- [ ] **文档处理**：支持PDF、Office、文本等格式上传和解析
- [ ] **向量搜索**：搜索结果准确，相似度计算正确
- [ ] **移动端适配**：触屏操作流畅，界面适配良好
- [ ] **性能表现**：搜索响应时间<2秒，内存使用合理

### 兼容性验证
- [ ] **设备兼容**：iOS和Android设备正常运行
- [ ] **浏览器兼容**：主流移动浏览器支持
- [ ] **网络兼容**：4G/5G/WiFi网络环境正常
- [ ] **离线兼容**：基础功能支持离线使用

### 用户体验验证
- [ ] **操作直观**：用户无需培训即可使用
- [ ] **反馈及时**：操作有明确的视觉反馈
- [ ] **错误处理**：错误信息友好，提供解决建议
- [ ] **性能流畅**：无明显卡顿和延迟

## 部署和发布计划

### 测试环境部署
- [ ] 开发环境测试通过
- [ ] 测试环境部署验证
- [ ] 性能基准测试
- [ ] 用户接受度测试

### 生产环境发布
- [ ] 代码审查完成
- [ ] 安全检查通过
- [ ] 备份和回滚方案准备
- [ ] 监控和日志配置
- [ ] 用户文档更新
- [ ] 发布公告准备

## 后续维护计划

### 短期维护 (1-3个月)
- [ ] 用户反馈收集和处理
- [ ] 性能优化和bug修复
- [ ] 功能完善和增强
- [ ] 文档更新和维护

### 长期规划 (3-12个月)
- [ ] 高级功能开发（智能推荐、自动分类）
- [ ] 性能进一步优化
- [ ] 新的文档格式支持
- [ ] 与其他功能模块深度集成
