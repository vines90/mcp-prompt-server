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
 * 从数据库加载prompts
 */
async function loadPromptsFromDatabase() {
  try {
    console.log('🔄 Loading prompts from database...');
    
    // 获取所有活跃的prompts
    const dbPrompts = await getAllActivePrompts();
    console.log(`📊 从数据库获取到 ${dbPrompts.length} 个提示词`);
    
    // 转换为标准格式
    const convertedPrompts = dbPrompts.map(convertDbPromptToStandard);
    console.log(`🔄 转换完成，共 ${convertedPrompts.length} 个提示词`);
    
    // 按热度和使用量排序
    convertedPrompts.sort((a, b) => {
      const scoreA = (a.hotness || 0) * 2 + (a.usage_count || 0) + (a.likes_count || 0);
      const scoreB = (b.hotness || 0) * 2 + (b.usage_count || 0) + (b.likes_count || 0);
      return scoreB - scoreA;
    });
    console.log(`📈 排序完成`);
    
    loadedPrompts = convertedPrompts;
    console.log(`✅ loadedPrompts 变量已赋值，长度: ${loadedPrompts.length}`);
    
    // 显示前3个提示词作为验证
    if (loadedPrompts.length > 0) {
      console.log(`📝 前3个提示词:`);
      loadedPrompts.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} [${p.category}] (🔥${p.hotness})`);
      });
    }
    
    console.log(`✅ Successfully loaded ${loadedPrompts.length} prompts from database`);
    
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
      
      prompt.source = 'file';
      prompts.push(prompt);
    }
    
    console.log(`✅ Loaded ${prompts.length} prompts from file system`);
    return prompts;
  } catch (error) {
    console.error('❌ Error loading prompts from file system:', error);
    return [];
  }
}

/**
 * 处理prompt内容，替换占位符
 */
function processPromptContent(prompt, args) {
  let promptText = prompt.content;
  
  // 如果没有内容，返回基本信息
  if (!promptText) {
    promptText = prompt.description || `This is the ${prompt.name} prompt.`;
  }
  
  // 替换占位符
  if (prompt.arguments && Array.isArray(prompt.arguments) && args) {
    prompt.arguments.forEach(arg => {
      const placeholder = `{${arg.name}}`;
      const value = args[arg.name] || `[${arg.name}]`;
      promptText = promptText.replace(new RegExp(placeholder, 'g'), value);
    });
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
  
  // 核心工具1: 搜索提示词
  server.tool(
    "search_prompts",
    {
      query: z.string().describe("搜索关键词")
    },
    async (args) => {
      try {
        // 将查询分割成多个关键词（OR逻辑）
        const keywords = args.query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        
        const results = loadedPrompts.filter(p => {
          // 合并所有可搜索的文本
          const searchableText = [
            p.name,
            p.content,
            p.description,
            p.category
          ].filter(Boolean).join(' ').toLowerCase();
          
          // 检查是否至少有一个关键词存在（OR逻辑）
          const anyKeywordMatch = keywords.some(keyword => 
            searchableText.includes(keyword)
          );
          
          return anyKeywordMatch;
        });
        
        const resultList = results.slice(0, 20).map((p, index) => {
          const info = [
            `${index + 1}. 📝 ${p.name}`,
            `   📋 ${p.description}`,
            `   📂 分类: ${p.category || '无'}`,
            `   🔥 热度: ${p.hotness || 0} | 👍 ${p.likes_count || 0} | 🔢 ${p.usage_count || 0}`
          ];
          return info.join('\n');
        });
        
        // 显示关键词分解信息
        const keywordInfo = keywords.length > 1 ? 
          `\n🔑 搜索关键词: [${keywords.join(', ')}] (OR逻辑)\n` : 
          `\n🔑 搜索关键词: ${keywords[0]}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: `🔍 搜索"${args.query}"的结果 (显示前20个，共${results.length}个):${keywordInfo}\n${resultList.join('\n\n')}`
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
      description: "根据关键词搜索提示词"
    }
  );

  // 核心工具2: 调用提示词
  server.tool(
    "use_prompt",
    {
      name: z.string().describe("提示词名称"),
      params: z.record(z.string()).optional().describe("提示词参数 (JSON对象格式)")
    },
    async (args) => {
      try {
        const prompt = loadedPrompts.find(p => 
          p.name.toLowerCase() === args.name.toLowerCase() ||
          p.name.toLowerCase().includes(args.name.toLowerCase())
        );
        
        if (!prompt) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 未找到名为"${args.name}"的提示词。请使用 search_prompts 工具搜索可用的提示词。`
              }
            ]
          };
        }
        
        // 更新使用统计（仅对数据库来源的prompt）
        if (prompt.id && !prompt.source) {
          await incrementPromptUsage(prompt.id);
        }
        
        // 处理prompt内容
        const promptText = processPromptContent(prompt, args.params || {});
        
        return {
          content: [
            {
              type: "text",
              text: promptText
            }
          ]
        };
      } catch (error) {
        console.error(`Error using prompt ${args.name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `❌ 调用提示词失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "调用指定的提示词"
    }
  );

  // 核心工具3: 获取提示词详情
  server.tool(
    "get_prompt_info",
    {
      name: z.string().describe("提示词名称")
    },
    async (args) => {
      try {
        const prompt = loadedPrompts.find(p => 
          p.name.toLowerCase() === args.name.toLowerCase() ||
          p.name.toLowerCase().includes(args.name.toLowerCase())
        );
        
        if (!prompt) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 未找到名为"${args.name}"的提示词`
              }
            ]
          };
        }
        
        const info = [
          `📝 提示词信息: ${prompt.name}`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📋 描述: ${prompt.description || '无描述'}`,
          `📂 分类: ${prompt.category || '无分类'}`,
          `🔥 热度: ${prompt.hotness || 0}`,
          `🔢 使用次数: ${prompt.usage_count || 0}`,
          `👍 点赞数: ${prompt.likes_count || 0}`,
          `⭐ 收藏数: ${prompt.favorites_count || 0}`,
          `📊 难度: ${prompt.difficulty_level || '未设置'}`,
          `📅 创建时间: ${prompt.created_at ? new Date(prompt.created_at).toLocaleString('zh-CN') : '未知'}`,
          prompt.arguments && prompt.arguments.length > 0 ? 
            `🔧 参数: ${prompt.arguments.map(arg => `${arg.name} (${arg.description || '无描述'})`).join(', ')}` : 
            '🔧 参数: 无参数',
          `🏷️ 标签: ${prompt.tags || '无'}`,
          `📄 内容长度: ${prompt.content ? prompt.content.length : 0} 字符`,
          ``,
          `💡 使用方法: use_prompt name="${prompt.name}" params={"参数名":"参数值"}`
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
              text: `❌ 获取提示词信息失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取指定提示词的详细信息"
    }
  );

  // 核心工具4: 列出所有提示词
  server.tool(
    "list_prompts",
    {
      category: z.string().optional().describe("按分类筛选"),
      limit: z.number().optional().describe("返回数量限制，默认50")
    },
    async (args) => {
      try {
        // 添加调试信息
        console.log(`🔍 list_prompts 被调用，loadedPrompts.length = ${loadedPrompts.length}`);
        
        let filteredPrompts = loadedPrompts;
        
        // 按分类筛选
        if (args.category) {
          filteredPrompts = loadedPrompts.filter(p => 
            p.category && p.category.toLowerCase().includes(args.category.toLowerCase())
          );
          console.log(`🔍 按分类"${args.category}"筛选后: ${filteredPrompts.length} 个`);
        }
        
        const limit = args.limit || 50;
        const limitedPrompts = filteredPrompts.slice(0, limit);
        console.log(`🔍 限制到 ${limit} 个后: ${limitedPrompts.length} 个`);
        
        const promptList = limitedPrompts.map((p, index) => {
          return `${index + 1}. 📝 ${p.name} ${p.category ? `[${p.category}]` : ''} (🔥${p.hotness || 0})`;
        });
        
        const categoryInfo = args.category ? ` (分类: ${args.category})` : '';
        
        return {
          content: [
            {
              type: "text",
              text: `📋 提示词列表${categoryInfo} (显示${limitedPrompts.length}个，共${filteredPrompts.length}个):\n\n${promptList.join('\n')}\n\n💡 使用 get_prompt_info 获取详细信息，使用 use_prompt 调用提示词`
            }
          ]
        };
      } catch (error) {
        console.error('❌ list_prompts 工具错误:', error);
        return {
          content: [
            {
              type: "text",
              text: `❌ 列出提示词失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "列出所有可用的提示词"
    }
  );

  // 核心工具5: 获取提示词名称列表
  server.tool(
    "get_prompt_names",
    {
      category: z.string().optional().describe("按分类筛选"),
      format: z.enum(["simple", "detailed"]).optional().describe("输出格式：simple(仅名称) 或 detailed(包含分类)")
    },
    async (args) => {
      try {
        let filteredPrompts = loadedPrompts;
        
        // 按分类筛选
        if (args.category) {
          filteredPrompts = loadedPrompts.filter(p => 
            p.category && p.category.toLowerCase().includes(args.category.toLowerCase())
          );
        }
        
        const format = args.format || "simple";
        let namesList;
        
        if (format === "simple") {
          // 简单格式：只返回名称
          namesList = filteredPrompts.map(p => p.name);
        } else {
          // 详细格式：包含分类信息
          namesList = filteredPrompts.map(p => {
            return p.category ? `${p.name} [${p.category}]` : p.name;
          });
        }
        
        const categoryInfo = args.category ? ` (分类: ${args.category})` : '';
        const formatInfo = format === "simple" ? "简单格式" : "详细格式";
        
        return {
          content: [
            {
              type: "text",
              text: `📝 提示词名称列表${categoryInfo} (${formatInfo}, 共${namesList.length}个):\n\n${namesList.join('\n')}\n\n💡 使用 use_prompt 调用提示词，使用 get_prompt_info 获取详细信息`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取提示词名称列表失败: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "获取所有提示词的名称列表"
    }
  );
  
  // 打印服务器统计信息
  const totalTools = 5; // 现在有5个核心工具
  console.log(`📊 服务器统计:`);
  console.log(`   🔧 核心工具: ${totalTools} 个`);
  console.log(`   📝 可用提示词: ${loadedPrompts.length} 个`);
  console.log(`✅ 精简版服务器 - 只保留核心查找和调用功能`);
  
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
  console.log('🚀 MCP Prompt Server (精简版) is running...');
  console.log(`📊 Loaded ${loadedPrompts.length} prompts from database`);
  console.log(`🔧 Registered ${totalTools} core tools only`);
}

// 启动服务器
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});