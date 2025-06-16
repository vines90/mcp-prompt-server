# MCP Prompt Server - AI咖提示词库

## 🚀 项目简介

基于 **AI咖 [www.aiprompter.cc]** 提示词管理工具打造的MCP服务，可以自动通过MCP调取你在AI咖维护的提示词库。

### 🌟 关于AI咖
- **官网**: [www.aiprompter.cc](https://www.aiprompter.cc)
- **功能**: 专业的AI提示词管理和分享平台
- **特色**: 支持个人提示词库管理、公共提示词分享、分类管理等

## 📁 项目结构

```
mcp-prompt-server/
├── src/
│   ├── index.js              # 用户版MCP服务器（主版本，支持身份验证）
│   ├── index-public.js       # 公共版MCP服务器（无身份验证）
│   └── database.js           # 数据库操作函数
├── package.json              # 项目依赖
├── README.md                 # 项目主文档
└── README-USER-VERSION.md    # 详细使用文档
```

## 🔧 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置Cursor MCP
在Cursor的MCP配置中添加：

```json
{
  "mcpServers": {
    "ai-prompter-mcp": {
      "command": "node",
      "args": ["path/to/mcp-prompt-server/src/index.js"],
      "transport": "stdio"
    }
  }
}
```

### 3. 身份验证
使用 `authenticate_user` 工具：
```
用户令牌: username:password
```

### 4. 开始使用
- 🔍 `search_user_prompts` - 搜索提示词
- 🚀 `use_user_prompt` - 调用提示词
- 📋 `get_user_prompt_info` - 查看详情
- 📝 `list_user_prompts` - 列出提示词

## 💡 主要特性

- 🔐 **用户身份验证**: 支持AI咖账户登录
- 👤 **个人提示词库**: 访问你的私有提示词
- 🌐 **公共提示词**: 使用平台优质公共提示词
- 🔍 **智能搜索**: 多关键词OR逻辑搜索
- 📊 **数据统计**: 区分个人和公共提示词

## 📖 版本说明

### 用户版 (index.js) - 推荐
- ✅ 支持用户身份验证
- ✅ 个人提示词库访问
- ✅ 公共提示词访问
- ✅ 数据隔离和权限控制

### 公共版 (index-public.js)
- ✅ 无需身份验证
- ✅ 仅访问公共提示词
- ❌ 无个人提示词访问

## 🔗 相关链接

- **详细文档**: [README-USER-VERSION.md](./README-USER-VERSION.md)
- **AI咖官网**: [www.aiprompter.cc](https://www.aiprompter.cc)
- **MCP协议**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Cursor编辑器**: [cursor.sh](https://cursor.sh/)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！
