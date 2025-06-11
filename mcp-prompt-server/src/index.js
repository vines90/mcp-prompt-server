import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  testConnection,
  getAllActivePrompts,
  getPromptsByUserId,
  getPromptsByCategory,
  incrementPromptUsage,
  getUserById,
  getAllCategories,
  searchPromptsByName,
  getHotPrompts,
  getPromptsByDifficulty,
  getStats,
  closePool
} from './database.js';

// 配置常量
const CONFIG = {
  // 最大prompt工具数量（建议不超过40以避免性能问题）
  MAX_PROMPT_TOOLS: process.env.MAX_PROMPT_TOOLS ? parseInt(process.env.MAX_PROMPT_TOOLS) : 25,
  // 服务器信息
  SERVER_NAME: "mcp-prompt-server-db",
  SERVER_VERSION: "2.0.0"
};

// 全局变量
let loadedPrompts = [];

/**
 * 将数据库prompt转换为标准格式
 */
function convertDbPromptToStandard(dbPrompt) {
  let parsedArguments = [];
  
  // 尝试解析tags字段作为arguments
  if (dbPrompt.arguments) {
    try {
      // 如果是JSON字符串，尝试解析
      if (typeof dbPrompt.arguments === 'string') {
        // 尝试解析JSON
        if (dbPrompt.arguments.startsWith('[') || dbPrompt.arguments.startsWith('{')) {
          parsedArguments = JSON.parse(dbPrompt.arguments);
        } else {
          // 如果是逗号分隔的标签，转换为参数格式
          const tags = dbPrompt.arguments.split(',').map(tag => tag.trim()).filter(tag => tag);
          parsedArguments = []; // 暂时不设置参数，因为tags不等同于参数
        }
      } else if (Array.isArray(dbPrompt.arguments)) {
        parsedArguments = dbPrompt.arguments;
      }
    } catch (error) {
      console.warn(`Warning: Could not parse arguments for prompt ${dbPrompt.name}:`, error.message);
      parsedArguments = [];
    }
  }

  return {
    id: dbPrompt.id,
    name: dbPrompt.name || dbPrompt.title,
    description: dbPrompt.description || `从数据库加载的提示词: ${dbPrompt.name || dbPrompt.title}` + (dbPrompt.category ? ` (分类: ${dbPrompt.category})` : ''),
    arguments: parsedArguments,
    content: dbPrompt.content,
    category: dbPrompt.category,
    usage_count: dbPrompt.usage_count || 0,
    likes_count: dbPrompt.likes_count || 0,
    favorites_count: dbPrompt.favorites_count || 0,
    difficulty_level: dbPrompt.difficulty_level,
    hotness: dbPrompt.hotness || 0,
    created_at: dbPrompt.created_at,
    tags: dbPrompt.arguments // 保存原始tags
  };
}

/**
 * 清理工具名称，确保只包含字母数字和下划线
 */
function sanitizeToolName(name) {
  if (!name) return 'unnamed_tool';
  
  // 移除所有非字母数字和下划线的字符
  let sanitized = name
    .replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '_')  // 替换特殊字符为下划线（保留中文）
    .replace(/^[^a-zA-Z_]/, '_')  // 确保开头是字母或下划线
    .replace(/_{2,}/g, '_')       // 多个连续下划线合并为一个
    .replace(/^_+|_+$/g, '');     // 移除开头和结尾的下划线
  
  // 如果是中文，转换为拼音或英文描述
  if (/[\u4e00-\u9fff]/.test(sanitized)) {
    // 常见中文转换映射
    const chineseMap = {
      '设计': 'design',
      '编程': 'programming', 
      '写作': 'writing',
      '营销': 'marketing',
      '分析': 'analysis',
      '创意': 'creative',
      '学习': 'learning',
      '商业': 'business',
      '技术': 'tech',
      '管理': 'management',
      '数据': 'data',
      '人工智能': 'AI',
      '机器学习': 'ML',
      '深度学习': 'DL',
      '前端': 'frontend',
      '后端': 'backend',
      '全栈': 'fullstack',
      'UI': 'UI',
      'UX': 'UX'
    };
    
    // 尝试替换常见中文词汇
    for (const [chinese, english] of Object.entries(chineseMap)) {
      sanitized = sanitized.replace(new RegExp(chinese, 'g'), english);
    }
    
    // 如果仍有中文字符，添加前缀
    if (/[\u4e00-\u9fff]/.test(sanitized)) {
      sanitized = `prompt_${sanitized.replace(/[\u4e00-\u9fff]/g, '')}_${Math.random().toString(36).substr(2, 5)}`;
    }
  }
  
  // 确保名称不为空
  if (!sanitized || sanitized.length === 0) {
    sanitized = `tool_${Math.random().toString(36).substr(2, 8)}`;
  }
  
  // 确保以字母或下划线开头
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = `t_${sanitized}`;
  }
  
  return sanitized;
}

/**
 * 从数据库加载prompts（带数量限制）
 */
async function loadPromptsFromDatabase() {
  try {
    console.log('🔄 Loading prompts from database...');
    
    // 获取所有活跃的prompts
    const dbPrompts = await getAllActivePrompts();
    
    // 转换为标准格式
    const convertedPrompts = dbPrompts.map(convertDbPromptToStandard);
    
    // 按热度和使用量排序，优先保留热门的prompts
    convertedPrompts.sort((a, b) => {
      const scoreA = (a.hotness || 0) * 2 + (a.usage_count || 0) + (a.likes_count || 0);
      const scoreB = (b.hotness || 0) * 2 + (b.usage_count || 0) + (b.likes_count || 0);
      return scoreB - scoreA;
    });
    
    // 限制工具数量 - 为了避免超过50个工具，我们限制为35个prompt工具
    // 因为还有额外的管理工具（约10个）
    const MAX_PROMPT_TOOLS = CONFIG.MAX_PROMPT_TOOLS;
    const limitedPrompts = convertedPrompts.slice(0, MAX_PROMPT_TOOLS);
    
    // 去重和名称清理
    const uniquePrompts = [];
    const nameCountMap = new Map();
    const sanitizedNames = new Set();
    
    for (const prompt of limitedPrompts) {
      // 清理工具名称
      const sanitizedName = sanitizeToolName(prompt.name);
      let finalName = sanitizedName;
      
      // 处理重复的已清理名称
      let counter = 1;
      while (sanitizedNames.has(finalName)) {
        finalName = `${sanitizedName}_${counter}`;
        counter++;
      }
      
      // 检查原始名称重复
      const originalName = prompt.name;
      const count = nameCountMap.get(originalName) || 0;
      
      if (count > 0) {
        console.warn(`发现重复prompt名称: "${originalName}", 已处理为: "${finalName}"`);
        prompt.description = `${prompt.description} [重复名称已重命名]`;
      }
      
      // 更新prompt名称
      prompt.name = finalName;
      sanitizedNames.add(finalName);
      nameCountMap.set(originalName, count + 1);
      uniquePrompts.push(prompt);
    }
    
    loadedPrompts = uniquePrompts;
    
    console.log(`✅ Successfully loaded ${loadedPrompts.length} prompts from database (limited from ${convertedPrompts.length} total)`);
    if (convertedPrompts.length > MAX_PROMPT_TOOLS) {
      console.log(`⚠️  为了性能考虑，限制了工具数量为 ${MAX_PROMPT_TOOLS} 个 (热门优先)`);
      console.log(`   💡 您可以通过设置环境变量 MAX_PROMPT_TOOLS 来调整此限制`);
    }
    if (limitedPrompts.length !== uniquePrompts.length) {
      console.log(`⚠️  处理了命名冲突和格式问题`);
    }
    
    return loadedPrompts;
  } catch (error) {
    console.error('❌ Error loading prompts from database:', error);
    // 如果数据库加载失败，尝试从文件系统加载作为备用
    console.log('Falling back to file system...');
    return await loadPromptsFromFiles();
  }
}

/**
 * 从文件系统加载prompts（备用方案）
 */
async function loadPromptsFromFiles() {
  const fs = await import('fs-extra');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const YAML = await import('yaml');

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const PROMPTS_DIR = path.join(__dirname, 'prompts');

    await fs.ensureDir(PROMPTS_DIR);
    const files = await fs.readdir(PROMPTS_DIR);
    const promptFiles = files.filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
    );
    
    const prompts = [];
    for (const file of promptFiles) {
      const filePath = path.join(PROMPTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      let prompt;
      if (file.endsWith('.json')) {
        prompt = JSON.parse(content);
      } else {
        prompt = YAML.parse(content);
      }
      
      if (!prompt.name) {
        console.warn(`Warning: Prompt in ${file} is missing a name field. Skipping.`);
        continue;
      }
      
      // 添加文件来源标识
      prompt.source = 'file';
      prompt.description = prompt.description || `File-based prompt: ${prompt.name}`;
      
      prompts.push(prompt);
    }
    
    loadedPrompts = prompts;
    console.log(`📁 Loaded ${prompts.length} prompts from file system as fallback`);
    return prompts;
  } catch (error) {
    console.error('Error loading prompts from files:', error);
    return [];
  }
}

/**
 * 处理prompt内容，替换参数占位符
 */
function processPromptContent(prompt, args) {
  let promptText = '';
  
  // 处理数据库格式的content
  if (typeof prompt.content === 'string') {
    promptText = prompt.content;
    
    // 替换所有 {{arg}} 格式的参数
    for (const [key, value] of Object.entries(args)) {
      promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  } else if (prompt.messages && Array.isArray(prompt.messages)) {
    // 处理文件格式的messages结构
    const userMessages = prompt.messages.filter(msg => msg.role === 'user');
    
    for (const message of userMessages) {
      if (message.content && typeof message.content.text === 'string') {
        let text = message.content.text;
        
        // 替换所有 {{arg}} 格式的参数
        for (const [key, value] of Object.entries(args)) {
          text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        promptText += text + '\n\n';
      }
    }
  }
  
  return promptText.trim();
}

/**
 * 启动MCP服务器
 */
async function startServer() {
  // 从数据库加载所有预设的prompts
  await loadPromptsFromDatabase();
  
  // 创建MCP服务器
  const server = new McpServer({
    name: CONFIG.SERVER_NAME,
    version: CONFIG.SERVER_VERSION
  });
  
  // 为每个预设的prompt创建一个工具
  const registeredTools = new Set();
  
  loadedPrompts.forEach(prompt => {
    // 检查工具名称是否已经注册
    if (registeredTools.has(prompt.name)) {
      console.error(`⚠️  跳过重复的工具名称: ${prompt.name}`);
      return;
    }
    
    // 构建工具的输入schema
    const schemaObj = {};
    
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach(arg => {
        // 默认所有参数都是字符串类型
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }
    
    try {
    // 注册工具
    server.tool(
      prompt.name,
      schemaObj,
      async (args) => {
          try {
            // 更新使用统计（仅对数据库来源的prompt）
            if (prompt.id && !prompt.source) {
              await incrementPromptUsage(prompt.id);
            }
            
            // 处理prompt内容
            const promptText = processPromptContent(prompt, args);
        
        // 返回处理后的prompt内容
        return {
          content: [
            {
              type: "text",
                  text: promptText
                }
              ]
            };
          } catch (error) {
            console.error(`Error processing prompt ${prompt.name}:`, error);
            return {
              content: [
                {
                  type: "text",
                  text: `处理提示词时出错: ${error.message}`
            }
          ]
        };
          }
      },
      {
        description: prompt.description || `Prompt: ${prompt.name}`
      }
    );
      
      // 记录已注册的工具名称
      registeredTools.add(prompt.name);
      
    } catch (error) {
      console.error(`❌ 注册工具失败 "${prompt.name}":`, error.message);
    }
  });
  
  // 添加管理工具 - 重新加载prompts
  server.tool(
    "reload_prompts",
    {},
    async () => {
      try {
        await loadPromptsFromDatabase();
        return {
          content: [
            {
              type: "text",
              text: `✅ 成功重新加载了 ${loadedPrompts.length} 个prompts。`
            }
          ]
        };
      } catch (error) {
      return {
        content: [
          {
            type: "text",
              text: `❌ 重新加载prompts失败: ${error.message}`
          }
        ]
      };
      }
    },
    {
      description: "重新从数据库加载所有预设的prompts"
    }
  );
  
  // 添加管理工具 - 获取prompt名称列表
  server.tool(
    "get_prompt_names",
    {},
    async () => {
      const promptNames = loadedPrompts.map(p => `${p.name}${p.category ? ` (${p.category})` : ''}`);
      return {
        content: [
          {
            type: "text",
            text: `📋 可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
          }
        ]
      };
    },
    {
      description: "获取所有可用的prompt名称及分类"
    }
  );

  // 添加工具 - 按分类获取prompts
  server.tool(
    "get_prompts_by_category",
    {
      category: z.string().describe("要查询的分类名称")
    },
    async (args) => {
      try {
        const categoryPrompts = loadedPrompts.filter(p => p.category === args.category);
        const promptNames = categoryPrompts.map(p => p.name);
        
        return {
          content: [
            {
              type: "text",
              text: `📂 分类"${args.category}"下的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 查询分类失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "根据分类获取prompts列表"
    }
  );

  // 添加工具 - 获取所有分类
  server.tool(
    "get_all_categories",
    {},
    async () => {
      try {
        const categories = [...new Set(loadedPrompts.map(p => p.category).filter(Boolean))];
        return {
          content: [
            {
              type: "text",
              text: `📚 所有可用分类 (${categories.length}):\n${categories.join('\n')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取分类失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取所有可用的prompt分类"
    }
  );

  // 添加工具 - 搜索prompts
  server.tool(
    "search_prompts",
    {
      query: z.string().describe("搜索关键词")
    },
    async (args) => {
      try {
        const results = loadedPrompts.filter(p => 
          p.name.toLowerCase().includes(args.query.toLowerCase()) ||
          (p.content && p.content.toLowerCase().includes(args.query.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(args.query.toLowerCase()))
        );
        
        const resultNames = results.map(p => `${p.name}${p.category ? ` (${p.category})` : ''}`);
        
        return {
          content: [
            {
              type: "text",
              text: `🔍 搜索"${args.query}"的结果 (${results.length}):\n${resultNames.join('\n')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 搜索失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "根据关键词搜索prompts"
    }
  );

  // 添加工具 - 获取prompt详细信息
  server.tool(
    "get_prompt_info",
    {
      name: z.string().describe("prompt名称")
    },
    async (args) => {
      try {
        const prompt = loadedPrompts.find(p => p.name === args.name);
        if (!prompt) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 未找到名为"${args.name}"的prompt`
              }
            ]
          };
        }
        
        const info = [
          `📝 Prompt信息: ${prompt.name}`,
          `📋 描述: ${prompt.description || '无描述'}`,
          `📂 分类: ${prompt.category || '无分类'}`,
          `🔥 热度: ${prompt.hotness || 0}`,
          `🔢 使用次数: ${prompt.usage_count || 0}`,
          `👍 点赞数: ${prompt.likes_count || 0}`,
          `⭐ 收藏数: ${prompt.favorites_count || 0}`,
          `📊 难度: ${prompt.difficulty_level || '未设置'}`,
          `📅 创建时间: ${prompt.created_at ? new Date(prompt.created_at).toLocaleString('zh-CN') : '未知'}`,
          prompt.arguments && prompt.arguments.length > 0 ? 
            `🔧 参数: ${prompt.arguments.map(arg => arg.name).join(', ')}` : 
            '🔧 参数: 无',
          `🏷️ 标签: ${prompt.tags || '无'}`,
          `📄 内容长度: ${prompt.content ? prompt.content.length : 0} 字符`
        ];
        
        return {
          content: [
            {
              type: "text",
              text: info.join('\n')
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取prompt信息失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取指定prompt的详细信息"
    }
  );

  // 添加工具 - 获取热门prompts
  server.tool(
    "get_hot_prompts",
    {
      limit: z.number().optional().describe("返回数量限制，默认20")
    },
    async (args) => {
      try {
        const limit = args.limit || 20;
        const hotPrompts = await getHotPrompts(limit);
        const convertedPrompts = hotPrompts.map(convertDbPromptToStandard);
        const promptNames = convertedPrompts.map(p => 
          `${p.name} (🔥${p.hotness} 👍${p.likes_count} 🔢${p.usage_count})${p.category ? ` [${p.category}]` : ''}`
        );
        
        return {
          content: [
            {
              type: "text",
              text: `🔥 热门prompts (前${limit}个):\n${promptNames.join('\n')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取热门prompts失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取热门prompts列表"
    }
  );

  // 添加工具 - 按难度获取prompts
  server.tool(
    "get_prompts_by_difficulty",
    {
      difficulty: z.string().describe("难度级别 (如: beginner, intermediate, advanced, expert)")
    },
    async (args) => {
      try {
        const difficultyPrompts = loadedPrompts.filter(p => p.difficulty_level === args.difficulty);
        const promptNames = difficultyPrompts.map(p => `${p.name}${p.category ? ` (${p.category})` : ''}`);
        
        return {
          content: [
            {
              type: "text",
              text: `📊 难度"${args.difficulty}"的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 按难度查询失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "根据难度级别获取prompts"
    }
  );

  // 添加工具 - 获取统计信息
  server.tool(
    "get_database_stats",
    {},
    async () => {
      try {
        const stats = await getStats();
        const info = [
          `📊 数据库统计信息`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📝 总提示词数量: ${stats.total_prompts}`,
          `👥 独立用户数量: ${stats.unique_users}`,
          `📂 分类数量: ${stats.categories_count}`,
          `🔢 总使用次数: ${stats.total_usage}`,
          `📈 平均使用次数: ${parseFloat(stats.avg_usage).toFixed(2)}`,
          ``,
          `💾 当前已加载: ${loadedPrompts.length} 个prompts`,
          `⚙️ 工具数量限制: ${CONFIG.MAX_PROMPT_TOOLS} 个prompt工具`
        ];
        
        return {
          content: [
            {
              type: "text",
              text: info.join('\n')
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取统计信息失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取数据库统计信息"
    }
  );
  
  // 打印服务器统计信息
  const totalTools = loadedPrompts.length + 10; // prompt工具 + 管理工具
  console.log(`📊 服务器统计:`);
  console.log(`   🔧 Prompt工具: ${loadedPrompts.length} 个`);
  console.log(`   ⚙️ 管理工具: 10 个`);
  console.log(`   📈 总工具数: ${totalTools} 个`);
  
  if (totalTools > 50) {
    console.warn(`⚠️  警告: 工具总数 (${totalTools}) 超过了推荐的50个限制`);
    console.warn(`   💡 建议调整 MAX_PROMPT_TOOLS 环境变量为更小的值`);
  } else if (totalTools > 40) {
    console.warn(`⚠️  注意: 工具总数 (${totalTools}) 超过了40个，可能影响某些模型的性能`);
  } else {
    console.log(`✅ 工具数量在推荐范围内 (≤40)`);
  }
  
  // 创建stdio传输层
  const transport = new StdioServerTransport();
  
  // 处理进程退出时的清理工作
  process.on('SIGINT', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    await closePool();
    process.exit(0);
  });
  
  // 连接服务器
  await server.connect(transport);
  console.log('🚀 MCP Prompt Server (Database Edition) is running...');
  console.log(`📊 Loaded ${loadedPrompts.length} prompts from database`);
}

// 启动服务器
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});