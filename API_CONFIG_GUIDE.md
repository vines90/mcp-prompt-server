# MCP Prompt Server API版本配置指南

## 🎯 概述

新的API版本（v3.0.0）将MCP服务器改为通过API调用方式获取提示词，而不是直接连接数据库。这样做有以下优势：

### ✅ 改进优势

1. **安全性提升**：
   - 不再硬编码数据库连接信息
   - 通过JWT认证保护用户数据
   - API层提供额外的安全防护

2. **功能增强**：
   - 支持获取用户私有提示词
   - 基于用户权限的访问控制
   - 统一的缓存和性能优化

3. **维护性**：
   - 与主系统统一管理
   - 统一的监控和日志
   - 更容易扩展新功能

## 🛠️ 配置方法

### 1. 环境变量配置

创建 `.env` 文件（参考以下配置）：

```bash
# API服务地址 - prompt-manager的部署地址
PROMPT_MANAGER_API_URL=http://localhost:3001
# 或者使用Vercel部署的地址
# PROMPT_MANAGER_API_URL=https://your-prompt-manager.vercel.app

# 用户认证 - 可选，如果设置了会自动登录获取私有提示词
USERNAME=your_username
PASSWORD=your_password

# 或者直接使用JWT Token（优先级高于用户名密码）
# USER_TOKEN=your_jwt_token_here

# 工具数量限制（默认25，建议不超过40）
MAX_PROMPT_TOOLS=25

# 调试模式
NODE_ENV=development
```

### 2. Cursor配置

更新 `~/.cursor/mcp_config.json`：

```json
{
  "mcpServers": {
    "prompt-server-api": {
      "command": "node",
      "args": [
        "/path/to/mcp-prompt-server/src/index-api.js"
      ],
      "transport": "stdio",
      "env": {
        "PROMPT_MANAGER_API_URL": "http://localhost:3001",
        "USERNAME": "your_username",
        "PASSWORD": "your_password",
        "MAX_PROMPT_TOOLS": "25"
      }
    }
  }
}
```

## 🚀 使用方式

### 启动API版本的MCP服务器

```bash
cd mcp-prompt-server

# 安装依赖（如果还没有）
npm install

# 启动API版本
node src/index-api.js
```

### 在Cursor中使用

1. **匿名模式**（仅公共提示词）：
   - 无需配置用户认证信息
   - 只能访问公共提示词

2. **认证模式**（公共 + 私有提示词）：
   - 配置用户名密码或JWT Token
   - 可以访问个人私有提示词

## 🔧 新增功能

### 用户认证工具

- `user_login`：在MCP中直接登录获取私有提示词

```
用户名: your_username
密码: your_password
```

### 增强的管理工具

1. `reload_prompts` - 重新从API加载提示词
2. `get_prompt_names` - 获取所有可用提示词（标记公共/私有）
3. `get_prompts_by_category` - 按分类查询
4. `get_all_categories` - 获取所有分类
5. `search_prompts` - 搜索提示词
6. `get_prompt_info` - 获取详细信息（包含来源、作者等）
7. `get_api_stats` - 获取API服务统计信息
8. `user_login` - 用户登录认证

## 🔄 迁移步骤

### 从数据库版本迁移到API版本

1. **备份现有配置**：
   ```bash
   cp ~/.cursor/mcp_config.json ~/.cursor/mcp_config.json.backup
   ```

2. **更新配置文件**：
   - 将 `src/index.js` 改为 `src/index-api.js`
   - 添加环境变量配置

3. **启动prompt-manager服务**：
   - 确保prompt-manager服务在运行
   - 验证API地址可访问

4. **测试连接**：
   ```bash
   # 测试API连接
   curl http://localhost:3001/api/health
   ```

5. **重启Cursor**：
   - 完全关闭Cursor
   - 重新启动Cursor
   - 验证MCP工具可用

## 🔍 故障排除

### 常见问题

1. **API连接失败**：
   - 检查 `PROMPT_MANAGER_API_URL` 是否正确
   - 确认prompt-manager服务正在运行
   - 检查防火墙和网络连接

2. **认证失败**：
   - 验证用户名密码是否正确
   - 检查JWT Token是否有效
   - 确认用户账号是否激活

3. **无法加载私有提示词**：
   - 确认已正确配置认证信息
   - 使用 `user_login` 工具重新认证
   - 检查用户权限设置

### 调试命令

```bash
# 检查API连接
curl -X GET http://localhost:3001/api/prompts/public

# 测试用户认证
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

## 📊 性能对比

| 特性 | 数据库版本 | API版本 |
|-----|----------|--------|
| 安全性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 功能丰富度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 维护性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 扩展性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 用户权限 | ❌ | ✅ |
| 私有提示词 | ❌ | ✅ |
| 统一管理 | ❌ | ✅ |

## 🎉 总结

API版本提供了更安全、更功能丰富、更易维护的解决方案。建议所有用户迁移到API版本以获得最佳体验。 