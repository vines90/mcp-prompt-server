# MCP Prompt Server

基于API的Model Context Protocol (MCP) 提示词服务器 v4.0.0

## 🎯 概述

MCP Prompt Server 是一个高性能的 MCP 服务器，通过 API 方式获取和管理提示词，为 Cursor、Windsurf 等 AI 编程工具提供丰富的提示词库。

## ✨ 核心特性

- 🔗 **API驱动**: 通过HTTP API获取1000+个提示词，无需本地数据库
- 🔐 **多重认证**: 支持Secret Key、JWT Token、用户名密码等多种认证方式
- 👤 **私有提示词**: 认证用户可访问个人专属提示词库
- 🚀 **智能限制**: 自动限制工具数量以优化性能
- 🔥 **热度排序**: 优先加载热门和高质量提示词
- 📂 **分类管理**: 按类别组织提示词，便于查找和使用
- 🔄 **容错机制**: API失败时自动降级到本地文件系统
- 🛠️ **丰富工具**: 提供搜索、分类、统计等管理工具

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置认证（可选）
创建 `.env` 文件：
```bash
# API服务地址
PROMPT_MANAGER_API_URL=https://www.aiprompter.cc

# 方式1: Secret Key认证（推荐）
SECRET_KEY=your_64_character_secret_key_here

# 方式2: 用户名密码认证
# USERNAME=your_username
# PASSWORD=your_password

# 方式3: JWT Token认证
# USER_TOKEN=your_jwt_token_here

# 环境模式（可选，默认development）
NODE_ENV=development
```

### 3. 启动服务器
```bash
npm start
```

### 4. 集成到Cursor
编辑 `~/.cursor/mcp_config.json`：
```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-prompt-server/src/index.js"
      ],
      "transport": "stdio",
      "env": {
        "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
        "SECRET_KEY": "your_secret_key_here",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🔐 认证配置

### Secret Key认证（推荐）
1. 登录 [AI咖网站](https://www.aiprompter.cc)
2. 进入用户菜单 -> Secret Key
3. 复制64位密钥到配置文件

**优势：**
- 🔒 高安全性，无需暴露密码
- 🔄 支持随时刷新和撤销
- 📝 可访问私有提示词

### 匿名模式
不配置认证信息时自动使用匿名模式，仅可访问公共提示词。

## ⚙️ 配置选项

### 服务器配置
```bash
# API服务地址
PROMPT_MANAGER_API_URL=https://www.aiprompter.cc

# Secret Key认证（推荐）
SECRET_KEY=your_64_character_secret_key_here

# 环境模式
NODE_ENV=development  # 开发模式，详细日志
NODE_ENV=production   # 生产模式，简化日志
```

**性能特点：**
- 🎯 **固定工具数量**: 恒定8个管理工具，无性能瓶颈
- ⚡ **高效架构**: 不再动态生成工具，启动快速
- 🔄 **按需获取**: 通过管理工具按需查找和获取提示词

### 工具名称规范
自动清理工具名称，确保MCP兼容性：
- 特殊字符转换为下划线
- 中文词汇自动转换为英文
- 重复名称自动去重

## 🛠️ 可用工具

### 管理工具（12个）
提供完整的提示词管理工具集：

**认证工具**：
1. `auth_status` - 检查当前认证状态

**查询工具**：
2. `get_prompts` - 获取提示词列表（支持公共/私有库）
3. `search_prompts` - 搜索提示词（按关键词查找）
4. `get_all_categories` - 获取所有分类
5. `get_prompts_by_category` - 按分类获取提示词
6. `get_prompt_names` - 获取所有提示词名称
7. `get_prompt_detail` - 获取提示词详细信息
8. `get_api_stats` - 获取API服务统计信息

**操作工具**：
9. `add_prompt` - 添加新提示词到个人库
10. `update_prompt` - 更新已有提示词

**用户工具**：
11. `user_login` - 用户登录认证

## 🔧 测试和验证

### 测试API连接
```bash
npm test
```

### 验证服务器配置
```bash
npm run verify
```

### 测试MCP协议
```bash
npm run test-mcp
```

## 📊 性能优化

### 智能特性
- 🎯 **热度排序**: 优先加载热门提示词
- 🔄 **智能缓存**: 减少API请求次数
- ⚡ **并发控制**: 优化网络请求性能
- 🛡️ **错误恢复**: 自动重试和降级机制

### 网络优化
- 📍 使用就近的API服务器
- ⏱️ 配置合适的超时时间
- 🔄 智能重试策略

## 🔥 高级功能

### 私有提示词支持
- 👤 个人专属提示词库
- 🔐 基于用户权限的访问控制
- 🔄 与网站数据实时同步

### 智能搜索
- 🔍 按名称、内容、描述搜索
- 📂 分类筛选
- 🎯 基于用户偏好推荐

### 使用统计
- 📈 自动记录使用次数
- 🏆 热门提示词排行
- 📊 个人使用报告

## 🐛 故障排除

### 常见问题

**API连接失败**
```bash
# 检查网络连接
curl https://www.aiprompter.cc/api/health

# 验证API地址配置
echo $PROMPT_MANAGER_API_URL
```

**认证失败**
```bash
# 验证Secret Key
curl -X PUT "https://www.aiprompter.cc/api/user/secret-key" \
  -H "X-Secret-Key: YOUR_SECRET_KEY"
```

**工具加载失败**
- 检查工具数量限制配置
- 验证网络连接稳定性
- 查看控制台错误日志

## 📈 版本历史

### v4.0.0 (Enhanced Edition)
- 🔐 增强Secret Key认证系统
- 🔍 新增高级搜索和筛选功能
- 📋 支持公共/私有提示词库分离
- 🛠️ 完整的CRUD操作支持
- 📊 详细的认证状态和统计信息

### v3.0.0 (API Edition)
- 🔄 完全迁移到API架构
- 🔐 新增Secret Key认证系统
- 👤 支持用户私有提示词
- ⚡ 优化性能和错误处理
- 🗑️ 移除数据库依赖

### v2.0.0 (Database Edition)
- 📊 PostgreSQL数据库支持
- 🎯 热度排序算法
- 🛠️ 丰富的管理工具

### v1.0.0 (File Edition)  
- 📁 基础文件系统版本
- 📄 YAML/JSON格式支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发流程
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

## 📞 支持与反馈

- 🌐 **官网**: https://www.aiprompter.cc
- 💬 **微信群**: 扫描网站二维码加入
- 🐛 **问题反馈**: 通过GitHub Issues

## �� 许可证

MIT License
