# MCP Prompt Server - 数据库版本 v2.0.0

## 🎯 概述

这是 MCP Prompt Server 的数据库增强版本，**完全兼容原有文件版本的所有功能**，同时提供了强大的数据库驱动特性。

## ✨ 升级亮点

### 🔄 智能数据源
- **主要数据源**：PostgreSQL 数据库（当前包含 **1023个prompts**）
- **备用数据源**：文件系统（数据库不可用时自动降级）
- **无缝切换**：确保服务高可用性

### 📊 增强功能
数据库版本在保持原有功能基础上，新增以下强大特性：

#### 新增 MCP 工具
1. **`get_hot_prompts`** - 获取热门prompts（按热度、使用次数、点赞数排序）
2. **`get_prompts_by_difficulty`** - 按难度级别筛选prompts
3. **`get_database_stats`** - 获取详细的数据库统计信息
4. **增强版 `get_prompt_info`** - 包含热度、点赞数、收藏数等详细信息

#### 增强现有工具
- **`search_prompts`** - 支持名称、内容、描述的模糊搜索
- **`get_all_categories`** - 从数据库动态获取分类
- **`get_prompts_by_category`** - 支持数据库分类查询

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 测试数据库连接
```bash
npm test
```

### 4. 检查数据库信息
```bash
npm run inspect
```

## 📈 数据库统计

当前数据库包含丰富的prompt资源：
- **总prompts数量**：1023个
- **活跃用户数**：680个  
- **分类覆盖**：多种专业领域
- **功能类型**：代码生成、文案创作、分析总结、网页设计等

## 🛠️ 新增工具详解

### 热门内容发现
```bash
# 获取前20个热门prompts
get_hot_prompts

# 获取前10个热门prompts  
get_hot_prompts(limit=10)
```

### 智能分类筛选
```bash
# 按难度筛选
get_prompts_by_difficulty(difficulty="beginner")
get_prompts_by_difficulty(difficulty="advanced")

# 按分类筛选
get_prompts_by_category(category="创意")
```

### 详细信息查看
```bash
# 查看prompt详细信息（包含热度、统计数据）
get_prompt_info(name="AI生成UI-轻拟物风格")

# 获取数据库整体统计
get_database_stats
```

## 🔧 技术架构

```
用户请求 → MCP Client → MCP Server → PostgreSQL数据库
                                   ↘ (备用) 文件系统
```

### 核心特性
- **连接池管理**：最大20个并发连接
- **自动重试**：数据库失败时降级到文件系统
- **使用统计**：自动记录prompt使用次数
- **优雅退出**：进程退出时正确关闭数据库连接

## 📁 项目结构

```
mcp-prompt-server/
├── src/
│   ├── index.js         # 主服务器（数据库版本）
│   ├── database.js      # 数据库操作模块
│   └── prompts/         # 备用prompt文件
├── scripts/
│   ├── check_db.js      # 数据库检查脚本
│   └── inspect_db.js    # 数据库结构检查
├── test-db.js           # 数据库测试脚本
├── db_info.md          # 数据库详细文档
└── README_DATABASE.md  # 本文件
```

## 🔗 集成方式

### Cursor
```json
{
  "servers": [
    {
      "name": "Prompt Server DB",
      "command": "node",
      "args": ["/path/to/mcp-prompt-server/src/index.js"],
      "transport": "stdio"
    }
  ]
}
```

### Raycast
1. 搜索 "install server（MCP）"
2. 名称：`prompt-db`
3. Command：`node`
4. Argument：`/path/to/mcp-prompt-server/src/index.js`

## 📊 性能优势

### 相比文件版本
- **数据量**：从 11个 → **1023个** prompts
- **查询能力**：支持复杂搜索和排序
- **分类管理**：动态分类，更好的组织
- **统计分析**：实时使用数据统计
- **并发性能**：支持多用户同时访问

### 保持兼容性
- **API接口**：100% 兼容原有MCP工具
- **参数格式**：支持 `{{参数名}}` 占位符  
- **降级机制**：数据库不可用时自动使用文件系统

## 🐛 故障排除

### 数据库连接问题
1. 检查网络连接
2. 验证数据库凭据
3. 查看控制台日志

### 启动失败
```bash
# 检查数据库连接
npm test

# 查看详细信息
npm run inspect
```

### 无prompt加载
- 确认数据库中有 `is_public = true` 的prompts
- 检查表结构是否正确

## 🔄 版本说明

- **v1.0.0**：文件系统版本（11个prompts）
- **v2.0.0**：数据库版本（1023个prompts + 新功能）

## 📞 技术支持

如需技术支持或功能建议，请查看：
- `db_info.md` - 详细技术文档
- `scripts/` - 数据库诊断工具
- GitHub Issues - 问题反馈

---

**🎉 立即体验更强大的数据库版本 MCP Prompt Server！** 