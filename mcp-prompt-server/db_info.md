# MCP Prompt Server - 数据库版本

## 概述

这是 MCP Prompt Server 的数据库增强版本，将原来的文件系统存储改为 PostgreSQL 数据库存储，提供更强大的数据管理和查询功能。

## 数据库结构

### Users 表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 主键，用户ID |
| sub | text | 用户唯一标识符 |
| user_id | integer | 用户编号 |
| email | text | 用户邮箱 |
| plan | text | 套餐类型 (beginner/advanced/expert) |
| tokens_used | integer | 已使用的token数量 |
| requests_today | integer | 今日请求次数 |
| total_requests | integer | 总请求次数 |
| created_at | timestamp | 创建时间 |
| is_active | boolean | 是否激活 |

### Prompts 表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 主键，提示词ID |
| user_id | integer | 用户ID (外键) |
| name | text | 提示词名称 |
| content | text | 提示词内容 |
| arguments | text | 参数定义 (JSON格式) |
| category | text | 分类 |
| usage_count | integer | 使用次数 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |
| is_active | boolean | 是否激活 |

## 功能特性

### 🔄 数据库驱动
- 从 PostgreSQL 数据库加载提示词
- 支持实时数据更新和统计
- 自动备份到文件系统（当数据库不可用时）

### 📊 增强功能
1. **分类管理**
   - `get_all_categories` - 获取所有分类
   - `get_prompts_by_category` - 按分类查询提示词

2. **搜索功能**
   - `search_prompts` - 根据关键词搜索提示词
   - 支持名称、内容、描述的模糊搜索

3. **统计功能**
   - `get_prompt_info` - 获取详细信息（使用次数、创建时间等）
   - 自动记录使用统计

4. **管理功能**
   - `reload_prompts` - 热重载数据库数据
   - `get_prompt_names` - 获取所有提示词列表

### 🛡️ 容错机制
- 数据库连接失败时自动降级到文件系统
- 连接池管理，支持并发访问
- 优雅的进程退出和资源清理

## 使用方式

### 1. 环境变量配置
```bash
# 可选：自定义数据库连接字符串
export DATABASE_URL="postgresql://username:password@host:port/database"
```

### 2. 启动服务器
```bash
npm start
```

### 3. 新增MCP工具
除了原有的提示词工具外，新增以下管理工具：

- `reload_prompts` - 重新加载数据库数据
- `get_prompt_names` - 获取所有提示词名称
- `get_all_categories` - 获取所有分类
- `get_prompts_by_category` - 按分类查询
- `search_prompts` - 搜索提示词
- `get_prompt_info` - 获取详细信息

## 数据库统计

当前数据库包含：
- **680** 个用户
- **1023** 个提示词
- 涵盖多种分类和用途

## 升级优势

### 相比文件版本的优势：
1. **数据持久性** - 数据存储在专业数据库中
2. **并发支持** - 支持多用户同时访问
3. **查询能力** - 支持复杂查询和搜索
4. **统计分析** - 自动统计使用数据
5. **分类管理** - 更好的内容组织
6. **扩展性** - 易于添加新功能

### 保持的兼容性：
1. **MCP接口** - 完全兼容原有的MCP工具调用
2. **参数格式** - 支持原有的 `{{参数名}}` 占位符
3. **备份机制** - 数据库不可用时降级到文件系统

## 技术架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │◄──►│  MCP Server      │◄──►│  PostgreSQL     │
│  (Cursor/etc)   │    │  (index.js)      │    │  Database       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              ▼                          │
                       ┌──────────────────┐             │
                       │  File System     │◄────────────┘
                       │  (Fallback)      │   Backup when
                       └──────────────────┘   DB unavailable
```

## 配置说明

### 数据库连接
默认连接字符串：
```
postgresql://postgres:9lxnx6j9@dbconn.sealosgzg.site:31740/?directConnection=true
```

### 连接池配置
- 最大连接数：20
- 空闲超时：30秒
- 连接超时：2秒

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查网络连接
   - 验证数据库凭据
   - 查看服务器日志

2. **提示词加载为空**
   - 确认数据库中有活跃的提示词 (`is_active = true`)
   - 检查数据库表结构

3. **参数解析错误**
   - 确认 `arguments` 字段为有效的JSON格式
   - 检查参数名称和类型

### 日志输出
服务器启动时会显示：
```
✅ Database connection established successfully
✅ Successfully loaded 1023 prompts from database
🚀 MCP Prompt Server (Database Edition) is running...
```

## 开发说明

### 添加新功能
1. 在 `database.js` 中添加数据库操作函数
2. 在 `index.js` 中注册新的MCP工具
3. 更新文档说明

### 数据库迁移
如需修改表结构，请：
1. 备份现有数据
2. 执行数据库迁移脚本
3. 更新相关代码
4. 测试功能完整性

---

**版本**: v2.0.0  
**更新时间**: 2024年  
**兼容性**: 完全向后兼容v1.0.0 