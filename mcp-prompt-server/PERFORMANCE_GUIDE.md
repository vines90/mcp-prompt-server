# MCP Prompt Server 性能优化指南

## 🚨 工具数量过多警告

如果你看到类似这样的警告：
- "You have 50 tools from enabled servers. Too many tools can degrade performance"
- "Some tools have naming issues and may be filtered out"

这表明你需要优化MCP服务器配置。

## 🎯 解决方案

### 方案1: 减少工具数量（推荐）

设置环境变量限制prompt工具数量：

#### Windows (PowerShell):
```powershell
$env:MAX_PROMPT_TOOLS=25
cd mcp-prompt-server
npm start
```

#### Windows (CMD):
```cmd
set MAX_PROMPT_TOOLS=25
cd mcp-prompt-server
npm start
```

#### macOS/Linux:
```bash
export MAX_PROMPT_TOOLS=25
cd mcp-prompt-server
npm start
```

### 方案2: 永久配置

创建 `.env` 文件（在 `mcp-prompt-server` 目录下）:
```env
MAX_PROMPT_TOOLS=25
```

然后正常启动：
```bash
npm start
```

### 方案3: 针对特定分类

如果你只想使用特定类别的提示词，可以：

1. 使用 `get_all_categories` 工具查看所有分类
2. 使用 `get_prompts_by_category` 工具查看特定分类的提示词
3. 只加载你需要的分类

## 📊 推荐配置

| 工具总数 | 性能 | 兼容性 | 推荐场景 |
|---------|------|--------|----------|
| ≤ 30    | 🟢 最佳 | 🟢 所有模型 | 日常使用 |
| 31-40   | 🟡 良好 | 🟡 大部分模型 | 专业用户 |
| 41-50   | 🟠 一般 | 🟠 部分模型 | 特殊需求 |
| > 50    | 🔴 差   | 🔴 可能不支持 | 不推荐 |

## 🛠️ 优化步骤

### 第1步: 检查当前状态
```bash
# 启动服务器并查看工具统计
npm start
```

### 第2步: 设置合适的限制
```bash
# 根据你的需求设置（建议25-30）
export MAX_PROMPT_TOOLS=25
npm start
```

### 第3步: 验证配置
服务器启动时会显示：
```
📊 服务器统计:
   🔧 Prompt工具: 25 个
   ⚙️ 管理工具: 10 个
   📈 总工具数: 35 个
✅ 工具数量在推荐范围内 (≤40)
```

### 第4步: 重启Cursor
1. 完全关闭Cursor
2. 重新打开Cursor
3. 检查MCP工具是否正常

## 🎨 工具名称问题

如果看到名称错误警告，服务器已自动处理：
- 移除特殊字符
- 转换中文为英文
- 添加数字后缀避免重复

## 🔧 高级配置

### 自定义排序优先级
修改 `src/index.js` 中的排序逻辑来调整哪些提示词被优先加载。

### 分类过滤
你可以修改代码只加载特定分类的提示词：

```javascript
// 在 loadPromptsFromDatabase() 函数中添加过滤
const allowedCategories = ['编程', '写作', '设计']; // 你想要的分类
const filteredPrompts = convertedPrompts.filter(p => 
  allowedCategories.includes(p.category)
);
```

## 🔍 故障排除

### 问题: 工具仍然超过50个
**解决**: 确认环境变量设置成功
```bash
echo $MAX_PROMPT_TOOLS  # macOS/Linux
echo %MAX_PROMPT_TOOLS% # Windows CMD
```

### 问题: 找不到需要的提示词
**解决**: 使用管理工具查找
- `get_hot_prompts` - 查看热门提示词
- `search_prompts` - 搜索特定提示词
- `get_prompts_by_category` - 按分类查看

### 问题: Cursor显示配置错误
**解决**: 检查配置文件格式
```json
{
  "mcpServers": {
    "prompt-server-db": {
      "command": "node",
      "args": ["完整路径/mcp-prompt-server/src/index.js"],
      "transport": "stdio"
    }
  }
}
```

## 💡 最佳实践

1. **开始时使用小数量**: 先设置 `MAX_PROMPT_TOOLS=20`
2. **逐步增加**: 根据需要和性能表现逐步增加
3. **关注热门**: 热门提示词通常更有用
4. **定期清理**: 使用 `get_database_stats` 查看使用统计
5. **按需分类**: 根据工作需要选择相关分类

## 📞 需要帮助？

如果遇到问题：
1. 查看控制台日志
2. 运行 `npm run verify` 验证配置
3. 检查 `cursor_mcp_config.json` 文件
4. 提交Issue到GitHub仓库 