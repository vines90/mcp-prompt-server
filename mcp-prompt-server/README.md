# MCP Prompt Server (Database Edition)

基于PostgreSQL数据库的Model Context Protocol (MCP) 提示词服务器 v2.0.0

## 🆕 新功能

- ✅ **数据库驱动**: 从PostgreSQL数据库加载1000+个提示词
- ✅ **智能限制**: 自动限制工具数量以避免性能问题  
- ✅ **名称清理**: 自动清理工具名称以符合MCP规范
- ✅ **热度排序**: 优先加载热门和高使用量的提示词
- ✅ **去重处理**: 自动处理重复名称的提示词
- ✅ **实时统计**: 提供数据库和使用统计信息
- ✅ **文件备用**: 数据库失败时自动回退到文件系统

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
数据库连接信息已预配置，无需额外设置。

### 3. 启动服务器
```bash
npm start
```

### 4. 集成到Cursor
在Cursor中配置MCP服务器(`~/.cursor/mcp_config.json`):
```json
{
  "mcpServers": {
    "prompt-server-db": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-prompt-server/src/index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

## ⚙️ 配置选项

### 工具数量限制
为了避免性能问题，服务器默认限制为35个prompt工具（加上10个管理工具，总共45个）。

你可以通过环境变量调整此限制：

```bash
# 设置最大prompt工具数量为20
export MAX_PROMPT_TOOLS=20
npm start

# 或者在Windows上
set MAX_PROMPT_TOOLS=20
npm start
```

**建议配置:**
- `≤30`: 最佳性能，所有模型支持
- `31-40`: 良好性能，大部分模型支持  
- `41-50`: 可能影响性能，部分模型可能不支持
- `>50`: 不推荐，可能导致性能问题

### 工具名称规范
服务器会自动清理工具名称，确保只包含:
- 字母 (a-z, A-Z)
- 数字 (0-9)  
- 下划线 (_)

常见中文词汇会自动转换为英文:
- "设计" → "design"
- "编程" → "programming"
- "写作" → "writing"
- 等等...

## 🛠️ 可用工具

### Prompt工具 (35个，按热度排序)
每个数据库中的提示词都会生成一个对应的工具。

### 管理工具 (10个)
1. `reload_prompts` - 重新加载提示词
2. `get_prompt_names` - 获取所有可用提示词名称
3. `get_prompts_by_category` - 按分类获取提示词
4. `get_all_categories` - 获取所有分类
5. `search_prompts` - 搜索提示词
6. `get_prompt_info` - 获取提示词详细信息
7. `get_hot_prompts` - 获取热门提示词
8. `get_prompts_by_difficulty` - 按难度获取提示词
9. `get_database_stats` - 获取数据库统计信息

## 🔧 验证和测试

### 验证数据库连接
```bash
npm test
```

### 检查服务器状态
```bash
npm run verify
```

### 测试MCP协议
```bash
npm run test-mcp
```

## 📊 性能优化

1. **智能限制**: 自动限制工具数量避免超过50个
2. **热度排序**: 优先加载热门提示词
3. **名称清理**: 确保工具名称符合规范
4. **连接池**: 使用数据库连接池提高性能
5. **错误处理**: 完善的错误处理和日志记录

## 🔥 热门功能

- **热度算法**: 基于使用次数、点赞数和收藏数的综合排序
- **实时统计**: 每次使用后更新使用统计
- **智能搜索**: 支持按名称、内容和描述搜索
- **分类管理**: 按类别组织提示词
- **难度分级**: 支持不同难度级别的提示词

## 📈 升级日志

### v2.0.0 (Database Edition)
- 从文件系统迁移到PostgreSQL数据库
- 新增1000+个提示词
- 智能工具数量限制和名称清理
- 热度排序和去重处理
- 增强的管理工具和统计功能

### v1.0.0 (File Edition)  
- 基础文件系统版本
- 支持YAML/JSON格式提示词
- 基本MCP协议支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## �� 许可证

MIT License
