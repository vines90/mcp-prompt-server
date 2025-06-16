# MCP Prompt Server - AI咖提示词库

## 🚀 项目介绍

基于 **AI咖 [www.aiprompter.cc]** 提示词管理工具打造的MCP服务，可以自动通过MCP调取你在AI咖维护的提示词库。

### 🌟 关于AI咖
- **官网**: [www.aiprompter.cc](https://www.aiprompter.cc)
- **功能**: 专业的AI提示词管理和分享平台
- **特色**: 支持个人提示词库管理、公共提示词分享、分类管理等

### 💡 项目特色
- 🔗 **无缝集成**: 直接连接AI咖平台数据库
- 🔐 **用户身份验证**: 支持个人账户登录
- 👤 **个人提示词库**: 访问你在AI咖创建的私有提示词
- 🌐 **公共提示词**: 同时可以使用平台上的优质公共提示词
- 🔍 **智能搜索**: 支持多关键词OR逻辑搜索
- 📊 **数据统计**: 区分个人和公共提示词的统计信息

## 概述

用户版 MCP Prompt Server 支持用户身份验证和个人提示词库访问。每个用户只能访问自己的私有提示词和公共提示词，实现了数据隔离和个性化服务。

**📁 文件结构：**
- `src/index.js` - **用户版MCP服务器**（主版本，支持身份验证）
- `src/index-public.js` - 公共版MCP服务器（无身份验证）
- `src/database.js` - 数据库操作函数

## 主要特性

- 🔐 **用户身份验证**: 支持用户令牌验证
- 👤 **个人提示词库**: 用户可以访问自己的私有提示词
- 🌐 **公共提示词**: 同时可以访问公共提示词
- 🔍 **智能搜索**: 支持多关键词OR逻辑搜索
- 📊 **数据统计**: 区分个人和公共提示词的统计信息

## 工具列表

### 1. authenticate_user
**用户身份验证**
- 参数: `user_token` (用户名:密码 或 用户ID)
- 功能: 验证用户身份并加载个人提示词库
- 必须首先调用此工具才能使用其他功能

### 2. search_user_prompts
**搜索用户提示词**
- 参数: `query` (搜索关键词)
- 功能: 在用户的个人提示词库中搜索（包括私有和公共提示词）
- 支持多关键词OR逻辑搜索

### 3. use_user_prompt
**调用用户提示词**
- 参数: `name` (提示词名称), `params` (可选参数)
- 功能: 调用用户提示词库中的指定提示词

### 4. get_user_prompt_info
**获取用户提示词详情**
- 参数: `name` (提示词名称)
- 功能: 获取用户提示词库中指定提示词的详细信息

### 5. list_user_prompts
**列出用户提示词**
- 参数: `type` (all/owned/public), `category` (分类), `limit` (数量限制)
- 功能: 列出用户提示词库中的提示词

## 使用方法

### 1. 配置 Cursor

在 Cursor 的 MCP 配置中添加用户版服务器：

```json
{
  "mcpServers": {
    "ai-prompter-mcp": {
      "command": "node",
      "args": ["E:/cursor/AILAB/mcp-prompt/mcp-prompt-server/src/index.js"],
      "transport": "stdio"
    }
  }
}
```

**如果需要使用公共版（无身份验证）：**
```json
{
  "mcpServers": {
    "ai-prompter-public": {
      "command": "node", 
      "args": ["E:/cursor/AILAB/mcp-prompt/mcp-prompt-server/src/index-public.js"],
      "transport": "stdio"
    }
  }
}
```

### 2. 身份验证

用户版服务器支持多种身份验证方式：

#### 方式1：用户名+密码验证（推荐）
```
用户令牌: username:password
例如: johndoe:mypassword123
```

#### 方式2：用户ID验证（仅用于测试）
```
用户令牌: 123  // 直接使用用户ID
```

#### 方式3：JWT令牌验证（待实现）
```
用户令牌: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**推荐使用方式1**，因为AI咖数据库中存储的是bcrypt哈希密码，这种方式最安全。

### 3. 搜索提示词

验证成功后，可以搜索个人提示词库：

```
搜索关键词: 报告 设计
```

### 4. 调用提示词

找到需要的提示词后，可以直接调用：

```
提示词名称: 网页提示词-报告
参数: {"项目名称": "季度销售报告"}
```

## 数据库结构要求

用户版服务器需要以下数据库表结构：

### prompts 表
- `id`: 提示词ID
- `title`: 提示词名称
- `content`: 提示词内容
- `user_id`: 用户ID (重要：用于数据隔离)
- `is_public`: 是否公开
- `category`: 分类
- `description`: 描述
- 其他统计字段...

### users 表
- `id`: 用户ID
- `username`: 用户名
- `password`: 密码（bcrypt哈希）
- `created_at`: 创建时间
- 其他用户信息...

## 安全特性

1. **数据隔离**: 每个用户只能访问自己的私有提示词
2. **身份验证**: 必须通过身份验证才能访问个人数据
3. **权限控制**: 区分个人提示词和公共提示词的访问权限
4. **密码安全**: 使用bcrypt哈希存储密码

## 与公共版本的区别

| 特性 | 公共版 (index-public.js) | 用户版 (index.js) |
|------|------------------|----------------------|
| 身份验证 | ❌ | ✅ |
| 个人提示词 | ❌ | ✅ |
| 公共提示词 | ✅ | ✅ |
| 数据隔离 | ❌ | ✅ |
| 工具数量 | 5个 | 5个 |

## 示例使用流程

1. **启动服务器**
   ```bash
   node src/index.js
   ```

2. **身份验证**
   - 工具: `authenticate_user`
   - 参数: `user_token: "username:password"`

3. **搜索提示词**
   - 工具: `search_user_prompts`
   - 参数: `query: "报告 设计"`

4. **查看详情**
   - 工具: `get_user_prompt_info`
   - 参数: `name: "网页提示词-报告"`

5. **调用提示词**
   - 工具: `use_user_prompt`
   - 参数: `name: "网页提示词-报告", params: {"项目": "Q4报告"}`

## 注意事项

1. **首次使用**: 必须先调用 `authenticate_user` 进行身份验证
2. **AI咖账户**: 需要在 [www.aiprompter.cc](https://www.aiprompter.cc) 注册账户并创建提示词
3. **数据库连接**: 确保数据库连接配置正确
4. **权限管理**: 用户只能访问自己创建的私有提示词和所有公共提示词

## 故障排除

1. **身份验证失败**: 检查用户名密码是否正确，确认在AI咖平台注册
2. **提示词加载失败**: 检查数据库连接和表结构
3. **搜索无结果**: 确认用户有相关的提示词数据

## 扩展功能

可以进一步扩展的功能：
- JWT token 验证
- 用户权限分级
- 提示词分享功能
- 使用统计分析
- 个人提示词管理（增删改）

## 🔗 相关链接

- **AI咖官网**: [www.aiprompter.cc](https://www.aiprompter.cc)
- **MCP协议**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Cursor编辑器**: [cursor.sh](https://cursor.sh/) 