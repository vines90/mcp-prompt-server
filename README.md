# MCP Prompt Server - Database Edition 🚀

[![GitHub license](https://img.shields.io/github/license/your-username/mcp-prompt)](https://github.com/your-username/mcp-prompt/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.7.0-blue)](https://github.com/modelcontextprotocol/sdk)

基于PostgreSQL数据库的Model Context Protocol (MCP) 提示词服务器，提供1000+个专业提示词工具。

## ✨ 特色功能

- 🗄️ **数据库驱动** - 基于PostgreSQL的1000+提示词库
- 🎯 **智能限制** - 自动限制工具数量，优化性能
- 🧹 **名称清理** - 自动处理工具名称，符合MCP规范
- 🔥 **热度排序** - 优先加载热门和高使用量提示词
- 🔄 **去重处理** - 智能处理重复名称
- 📊 **实时统计** - 提供使用统计和数据分析
- 💾 **文件备用** - 数据库失败时自动回退到文件系统

## 🚀 快速开始

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/your-username/mcp-prompt.git
cd mcp-prompt/mcp-prompt-server

# 安装依赖
npm install

# 启动服务器
npm start
```

### 集成到Cursor

在Cursor中配置MCP服务器(`~/.cursor/mcp_config.json`):

```json
{
  "mcpServers": {
    "prompt-server-db": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-prompt/mcp-prompt-server/src/index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

## ⚙️ 配置选项

### 工具数量限制

默认限制为25个prompt工具（总共35个工具）。可通过环境变量调整：

```bash
# Windows PowerShell
$env:MAX_PROMPT_TOOLS=30
npm start

# Windows CMD
set MAX_PROMPT_TOOLS=30
npm start

# macOS/Linux
export MAX_PROMPT_TOOLS=30
npm start
```

### 推荐配置

| 工具总数 | 性能 | 兼容性 | 推荐场景 |
|---------|------|--------|----------|
| ≤ 30    | 🟢 最佳 | 🟢 所有模型 | 日常使用 |
| 31-40   | 🟡 良好 | 🟡 大部分模型 | 专业用户 |
| 41-50   | 🟠 一般 | 🟠 部分模型 | 特殊需求 |
| > 50    | 🔴 差   | 🔴 可能不支持 | 不推荐 |

## 🛠️ 可用工具

### Prompt工具（25个，按热度排序）
每个数据库中的提示词都会生成一个对应的工具，包含：
- 数据大屏制作
- UI/UX设计
- 编程开发
- 创意写作
- 营销文案
- 等等...

### 管理工具（10个）
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

```bash
# 验证数据库连接
npm test

# 检查服务器状态
npm run verify

# 测试MCP协议
npm run test-mcp
```

## 📊 版本信息

### v2.0.0 (Database Edition) - 当前版本
- ✅ 从文件系统迁移到PostgreSQL数据库
- ✅ 新增1000+个提示词
- ✅ 智能工具数量限制和名称清理
- ✅ 热度排序和去重处理
- ✅ 增强的管理工具和统计功能

### v1.0.0 (File Edition)
- 基础文件系统版本
- 支持YAML/JSON格式提示词
- 基本MCP协议支持

## 📖 详细文档

- [性能优化指南](mcp-prompt-server/PERFORMANCE_GUIDE.md) - 解决工具数量过多问题
- [数据库版详细说明](mcp-prompt-server/README.md) - 技术细节和使用指南

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

该项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Model Context Protocol](https://github.com/modelcontextprotocol) - 核心协议支持
- [PostgreSQL](https://www.postgresql.org/) - 数据库支持
- 所有贡献提示词的开发者们

---

⭐ 如果这个项目对你有帮助，请给它一个Star！ 