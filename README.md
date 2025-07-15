# AI Prompter MCP Server

一个功能完备的AI提示词管理MCP服务器，支持Secret-Key认证、提示词管理、公共广场访问等功能。

## 🚀 快速开始

### 安装

```bash
npm install -g aiprompter-mcp-server
```

### 基本配置

创建配置文件 `~/.aiprompter-mcp-config.json`：

```json
{
  "api_url": "https://www.aiprompter.cc",
  "secret_key": "your-secret-key-here"
}
```

### Cursor配置示例

在 `~/.cursor/mcp.json` 中添加：

```json
{
  "mcp": {
    "servers": {
      "aiprompter": {
        "command": "npx",
        "args": ["aiprompter-mcp-server"],
        "env": {
          "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
          "SECRET_KEY": "your-secret-key"
        }
      }
    }
  }
}
```

### Claude Desktop配置示例

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "aiprompter": {
      "command": "npx",
      "args": ["aiprompter-mcp-server"],
      "env": {
        "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
          "SECRET_KEY": "your-secret-key"
      }
    }
  }
}
```

## 🛠️ 功能特性

### 认证方式
- **Secret-Key认证**：64位密钥，无需用户名密码
- **JWT Token认证**：传统用户名密码方式

### 提示词管理
- **创建提示词**：支持分类、标签、公开/私有设置
- **搜索提示词**：关键词、分类、标签搜索
- **更新提示词**：完整CRUD操作，带版本记录
- **删除提示词**：级联删除相关数据

### 提示词库访问
- **公共提示词广场**：查看社区共享的提示词
- **私有提示词库**：个人专属提示词管理
- **热门提示词**：按热度排序的精选提示词

### 高级功能
- **Redis缓存**：提升查询性能
- **版本控制**：每次更新自动生成版本记录
- **响应式设计**：适配桌面和移动端
- **错误重试**：网络异常自动重试

## 📋 可用工具

### 认证相关
- `auth_status` - 检查当前认证状态
- `get_user_profile` - 获取用户信息

### 提示词操作
- `get_prompts` - 获取提示词列表（支持搜索、分页）
- `get_prompt_detail` - 获取单个提示词详情
- `get_public_prompts` - 获取公共提示词
- `get_trending_prompts` - 获取热门提示词
- `add_prompt` - 添加新提示词
- `update_prompt` - 更新提示词
- `delete_prompt` - 删除提示词

## 🔧 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PROMPT_MANAGER_API_URL` | API服务器地址 | `https://www.aiprompter.cc` |
| `SECRET_KEY` | 64位Secret-Key认证 | 必填 |
| `USER_TOKEN` | JWT Token认证（可选） | - |
| `USERNAME` | 用户名（JWT认证用） | - |
| `PASSWORD` | 密码（JWT认证用） | - |

## 📦 安装方式

### NPM安装（推荐）
```bash
npm install -g aiprompter-mcp-server
```

### 源码安装
```bash
git clone https://github.com/vines90/mcp-prompt-server.git
cd mcp-prompt-server
npm install
npm run build
```

## 🧪 测试

```bash
# 运行基础测试
npm test

# 运行生产环境测试
npm run test:production

# 验证配置
npm run verify-config
```

## 🔍 调试

### 日志级别
设置环境变量 `LOG_LEVEL`：
- `debug`：详细日志
- `info`：基本信息
- `warn`：警告信息
- `error`：错误信息

### 示例调试命令
```bash
LOG_LEVEL=debug npx aiprompter-mcp-server
```

## 📄 服务配置示例

### 最小配置
```json
{
  "command": "npx",
  "args": ["aiprompter-mcp-server"],
  "env": {
    "SECRET_KEY": "your-64-char-secret-key"
  }
}
```

### 完整配置
```json
{
  "command": "npx",
  "args": ["aiprompter-mcp-server"],
  "env": {
    "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
    "SECRET_KEY": "your-secret-key",
    "LOG_LEVEL": "info",
    "MAX_PROMPT_TOOLS": "10"
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

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

## 📞 支持与反馈

- 🌐 **官网**: https://www.aiprompter.cc
- 💬 **微信群**: 扫描网站二维码加入
- 🐛 **问题反馈**: 通过GitHub Issues

## 📄 许可证

MIT License
