# 配置说明

## 数据库配置

### 环境变量

项目使用环境变量来配置数据库连接，确保安全性和灵活性。

#### DATABASE_URL

设置数据库连接字符串：

```bash
# Linux/Mac
export DATABASE_URL="postgresql://username:password@host:port/database_name"

# Windows (PowerShell)
$env:DATABASE_URL="postgresql://username:password@host:port/database_name"

# Windows (CMD)
set DATABASE_URL=postgresql://username:password@host:port/database_name
```

#### 配置示例

**AI咖平台连接：**
```bash
export DATABASE_URL="postgresql://postgres:your_password@your_host:5432/aiprompter_db"
```

**本地开发：**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/promptdb"
```

**远程数据库：**
```bash
export DATABASE_URL="postgresql://user:pass@remote-host:5432/dbname?ssl=true"
```

## GitHub 环境变量配置

### 1. Repository Secrets（敏感信息）

对于数据库密码等敏感信息，使用 GitHub Secrets：

**配置步骤：**
1. 进入 GitHub 仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加以下 Secrets：

| Name | Value | 描述 |
|------|-------|------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | 生产数据库连接字符串 |
| `DATABASE_URL_TEST` | `postgresql://user:pass@host:port/test_db` | 测试数据库连接字符串 |

### 2. Repository Variables（非敏感配置）

对于非敏感的配置变量：

**配置步骤：**
1. 在同一页面点击 `Variables` 标签
2. 点击 `New repository variable`
3. 添加以下 Variables：

| Name | Value | 描述 |
|------|-------|------|
| `MAX_PROMPT_TOOLS` | `50` | 最大提示词工具数量 |
| `NODE_ENV` | `production` | 运行环境 |

### 3. GitHub Actions 中使用

在 `.github/workflows/deploy.yml` 中引用：

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NODE_ENV: ${{ vars.NODE_ENV || 'production' }}
  MAX_PROMPT_TOOLS: ${{ vars.MAX_PROMPT_TOOLS || '50' }}
```

### 4. 环境隔离

建议为不同环境配置不同的 Secrets：

**开发环境：**
- `DATABASE_URL_DEV`: 开发数据库
- `DATABASE_URL_TEST`: 测试数据库  
- `DATABASE_URL`: 生产数据库

**使用示例：**
```yaml
env:
  DATABASE_URL: ${{ 
    github.ref == 'refs/heads/main' && secrets.DATABASE_URL ||
    github.ref == 'refs/heads/develop' && secrets.DATABASE_URL_DEV ||
    secrets.DATABASE_URL_TEST
  }}
```

### .env 文件（推荐）

创建 `.env` 文件来管理环境变量：

```env
# .env 文件内容
DATABASE_URL=postgresql://username:password@host:port/database_name

# 可选配置
NODE_ENV=production
PORT=3000
MAX_PROMPT_TOOLS=50
```

然后在项目中使用 dotenv 包：

```bash
npm install dotenv
```

在代码开头添加：
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### 默认配置

如果未设置 `DATABASE_URL` 环境变量，系统将使用默认配置：
```
postgresql://localhost:5432/promptdb
```

### 安全注意事项

1. **不要提交敏感信息到Git**：将 `.env` 文件添加到 `.gitignore`
2. **使用强密码**：确保数据库密码足够复杂
3. **SSL连接**：生产环境建议使用SSL连接
4. **权限控制**：确保数据库用户只有必要的权限
5. **定期轮换**：定期更换数据库密码和密钥
6. **最小权限原则**：GitHub Secrets 只授权给需要的工作流

### 连接测试

运行服务器时，系统会自动测试数据库连接：

```bash
node src/index.js
```

如果连接成功，会显示：
```
✅ Database connection established successfully
```

如果连接失败，会显示错误信息和可能的解决方案。

## 其他配置选项

### MAX_PROMPT_TOOLS
限制加载的提示词工具数量：
```bash
export MAX_PROMPT_TOOLS=30
```

### NODE_ENV
设置运行环境：
```bash
export NODE_ENV=production  # 或 development
```

### PORT
设置服务器端口（如果需要）：
```bash
export PORT=3000
```

## 部署最佳实践

### 1. 多环境配置
```
开发环境: DATABASE_URL_DEV
测试环境: DATABASE_URL_TEST  
生产环境: DATABASE_URL
```

### 2. 健康检查
在 GitHub Actions 中添加数据库连接测试：

```yaml
- name: Health Check
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run test:db
```

### 3. 回滚机制
保留多个版本的配置，便于快速回滚：

```yaml
- name: Backup config
  run: |
    echo "Backing up current configuration..."
    # 备份当前配置
``` 