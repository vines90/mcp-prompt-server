# ModelScope MCP 广场提交指南

本文档详细介绍了如何将 AI Prompter MCP Server 提交到 ModelScope MCP 广场。

## 🎯 快速创建方式（推荐）

### 1. 准备GitHub仓库
已自动完成，仓库地址：`https://github.com/vines90/mcp-prompt-server`

### 2. 填写创建表单

在 [ModelScope MCP创建页面](https://modelscope.cn/mcp/create) 填写以下信息：

#### 基础信息
- **GitHub地址**：`https://github.com/vines90/mcp-prompt-server`
- **英文名称**：`aiprompter-mcp-server`
- **展示名称**：`AI Prompter 提示词管理`
- **所有者**：vines90
- **是否公开**：✅ 公开
- **托管类型**：✅ 可托管部署
- **服务图标**：使用仓库中的图标

#### 服务配置（JSON格式）
```json
{
  "command": "npx",
  "args": ["aiprompter-mcp-server@latest"],
  "env": {
    "SECRET_KEY": "YOUR_64_CHARACTER_SECRET_KEY",
    "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc"
  }
}
```

### 3. 环境变量说明

| 变量名 | 类型 | 描述 | 必填 | 示例 |
|--------|------|------|------|------|
| `SECRET_KEY` | string | 64位Secret-Key用于认证 | ✅ | `a1b2c3d4e5f6...` |
| `PROMPT_MANAGER_API_URL` | string | API服务器地址 | ❌ | `https://www.aiprompter.cc` |

## 🔧 自定义创建方式

### 完整配置信息

#### 服务介绍
AI Prompter MCP Server 是一个专为AI编程工具设计的提示词管理系统。它支持：
- 通过Secret-Key进行安全认证
- 管理个人和公共提示词库
- 完整的CRUD操作（创建、读取、更新、删除）
- 智能搜索和分类功能
- 版本控制和历史记录

#### 服务描述
提供完整的AI提示词管理功能，包括个人提示词库管理、公共提示词广场访问、智能搜索和分类管理。支持Secret-Key认证方式，无需用户名密码即可安全访问。

#### 服务类型
`工具管理` - 专注于AI提示词和工具的管理

#### 服务配置
```json
[
  {
    "command": "npx",
    "args": ["aiprompter-mcp-server@latest"],
    "env": {
      "SECRET_KEY": "YOUR_SECRET_KEY_HERE"
    }
  },
  {
    "command": "npx",
    "args": ["aiprompter-mcp-server@latest"],
    "env": {
      "SECRET_KEY": "YOUR_SECRET_KEY_HERE",
      "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc"
    }
  }
]
```

#### 环境变量配置
```json
{
  "SECRET_KEY": {
    "description": "64位Secret-Key用于认证，从 https://www.aiprompter.cc 获取",
    "required": true,
    "example": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
  },
  "PROMPT_MANAGER_API_URL": {
    "description": "API服务器地址（可选，默认使用官方服务器）",
    "required": false,
    "example": "https://www.aiprompter.cc"
  }
}
```

## 📋 使用指引

### 获取Secret-Key
1. 访问 [AI Prompter官网](https://www.aiprompter.cc)
2. 注册/登录账号
3. 进入"用户设置" → "Secret Key"
4. 复制生成的64位密钥

### Cursor集成
在 `~/.cursor/mcp.json` 中添加：
```json
{
  "mcp": {
    "servers": {
      "aiprompter": {
        "command": "npx",
        "args": ["aiprompter-mcp-server@latest"],
        "env": {
          "SECRET_KEY": "YOUR_SECRET_KEY"
        }
      }
    }
  }
}
```

### Claude Desktop集成
在 `claude_desktop_config.json` 中添加：
```json
{
  "mcpServers": {
    "aiprompter": {
      "command": "npx",
      "args": ["aiprompter-mcp-server@latest"],
      "env": {
        "SECRET_KEY": "YOUR_SECRET_KEY"
      }
    }
  }
}
```

## 🎯 使用场景

### 个人用户
- 管理个人AI提示词库
- 发现和使用社区优质提示词
- 跨设备同步提示词

### 团队用户
- 共享团队提示词资源
- 维护提示词版本历史
- 权限管理和协作

### 开发者
- 构建AI应用的基础提示词管理
- 快速集成提示词功能
- 提供标准化API接口

## 🔍 功能列表

### 认证工具
- `auth_status` - 检查当前认证状态
- `get_user_profile` - 获取用户信息

### 提示词查询
- `get_prompts` - 获取提示词列表（支持公共/私有库）
- `get_prompt_detail` - 获取单个提示词详情
- `get_public_prompts` - 获取公共提示词广场
- `search_prompts` - 按关键词搜索提示词

### 提示词管理
- `add_prompt` - 添加新提示词到个人库
- `update_prompt` - 更新已有提示词
- `delete_prompt` - 删除提示词

## 🚀 快速测试

安装完成后，可以通过以下命令测试：
```bash
# 测试认证
npx aiprompter-mcp-server --test-auth

# 测试获取提示词
npx aiprompter-mcp-server --test-prompts
```

## 📈 版本历史

- **v4.0.0**: 增强Secret-Key认证，完整CRUD支持
- **v3.0.0**: 完全API架构，移除数据库依赖
- **v2.0.0**: PostgreSQL数据库支持
- **v1.0.0**: 基础文件系统版本

## 🔗 相关链接

- [GitHub仓库](https://github.com/vines90/mcp-prompt-server)
- [AI Prompter官网](https://www.aiprompter.cc)
- [ModelScope MCP广场](https://modelscope.cn/mcp)

## 📞 技术支持

- GitHub Issues: [提交问题](https://github.com/vines90/mcp-prompt-server/issues)
- 邮箱支持: support@aiprompter.cc

---

**准备好提交到ModelScope MCP广场了吗？** 
使用GitHub地址：`https://github.com/vines90/mcp-prompt-server` 即可快速创建！