# GitHub 环境变量快速配置指南

## 🚀 5分钟快速设置

### 第1步：访问 GitHub 仓库设置

1. 打开您的 GitHub 仓库
2. 点击顶部的 `Settings` 标签
3. 在左侧菜单中找到 `Secrets and variables`
4. 点击 `Actions`

### 第2步：添加数据库连接 Secret

1. 点击 `New repository secret` 按钮
2. 填写以下信息：
   - **Name**: `DATABASE_URL`
   - **Secret**: `postgresql://username:password@host:port/database_name`
   
   **示例值：**
   ```
   postgresql://postgres:mypassword123@dbconn.sealosgzg.site:31740/aiprompter_db
   ```

3. 点击 `Add secret` 保存

### 第3步：添加其他配置变量

点击 `Variables` 标签，然后添加以下变量：

| Variable Name | Value | 说明 |
|---------------|-------|------|
| `MAX_PROMPT_TOOLS` | `50` | 最大提示词工具数量 |
| `NODE_ENV` | `production` | 运行环境 |

### 第4步：验证配置

1. 推送代码到 `main` 分支
2. 查看 `Actions` 标签中的工作流运行情况
3. 确认数据库连接测试通过

## 📋 完整的 Secrets 清单

推荐配置以下 Secrets：

### 🔒 必需的 Secrets
- `DATABASE_URL` - 生产数据库连接字符串

### 🔧 可选的 Secrets  
- `DATABASE_URL_TEST` - 测试数据库连接
- `DATABASE_URL_DEV` - 开发数据库连接

### ⚙️ 推荐的 Variables
- `MAX_PROMPT_TOOLS` - 提示词工具数量限制
- `NODE_ENV` - 运行环境设置

## 🎯 AI咖平台专用配置

如果您使用的是AI咖平台的数据库，请确保：

1. **DATABASE_URL 格式**：
   ```
   postgresql://username:password@host:port/database_name?ssl=true
   ```

2. **SSL 连接**：生产环境建议启用SSL
3. **用户权限**：确保数据库用户有适当的读取权限

## 🔍 常见问题解决

### 问题1: 数据库连接失败
**解决方案：**
- 检查 `DATABASE_URL` 格式是否正确
- 确认数据库服务器允许外部连接
- 验证用户名和密码是否正确

### 问题2: GitHub Actions 失败
**解决方案：**
- 检查 Secret 名称是否与代码中的变量名匹配
- 确认 Secret 值没有多余的空格
- 查看 Actions 日志获取详细错误信息

### 问题3: 环境变量未生效
**解决方案：**
- 确认变量名称大小写正确
- 重新运行 GitHub Actions 工作流
- 检查工作流文件中的环境变量引用语法

## 📞 获取帮助

如果遇到问题，可以：

1. 查看 [CONFIG.md](./CONFIG.md) 获取详细配置说明
2. 检查 GitHub Actions 的运行日志
3. 访问 [AI咖官网](https://www.aiprompter.cc) 获取技术支持

## ✅ 配置完成检查清单

- [ ] 已添加 `DATABASE_URL` Secret
- [ ] 已添加必要的 Variables
- [ ] GitHub Actions 运行成功
- [ ] 数据库连接测试通过
- [ ] MCP 服务器可以正常启动

完成以上步骤后，您的 MCP Prompt Server 就可以在 GitHub 环境中正常运行了！🎉 