import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  testConnection,
  getUserAllPrompts,
  getUserPrivatePrompts,
  searchUserPrompts,
  incrementPromptUsage,
  getUserById,
  authenticateUser,
  closePool
} from './database.js';

// 配置常量
const CONFIG = {
  // 服务器信息
  SERVER_NAME: "mcp-prompt-server-user",
  SERVER_VERSION: "3.0.0"
};

// 全局变量
let currentUser = null;
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
    description: dbPrompt.description || `提示词: ${dbPrompt.name || dbPrompt.title}` + (dbPrompt.category ? ` (分类: ${dbPrompt.category})` : ''),
    arguments: parsedArguments,
    content: dbPrompt.content,
    category: dbPrompt.category,
    usage_count: dbPrompt.usage_count || 0,
    likes_count: dbPrompt.likes_count || 0,
    favorites_count: dbPrompt.favorites_count || 0,
    difficulty_level: dbPrompt.difficulty_level,
    hotness: dbPrompt.hotness || 0,
    created_at: dbPrompt.created_at,
    tags: dbPrompt.arguments, // 保存原始tags
    is_public: dbPrompt.is_public,
    user_id: dbPrompt.user_id,
    ownership: dbPrompt.ownership || (dbPrompt.user_id === currentUser?.id ? 'owned' : 'public')
  };
}

/**
 * 用户身份验证
 */
async function authenticateUserSession(userToken) {
  try {
    console.log('🔐 验证用户身份...');
    const user = await authenticateUser(userToken);
    
    if (!user) {
      console.log('❌ 用户身份验证失败');
      return false;
    }
    
    currentUser = user;
    console.log(`✅ 用户身份验证成功: ${user.email} (ID: ${user.id})`);
    
    // 加载用户的提示词
    await loadUserPrompts(user.id);
    
    return true;
  } catch (error) {
    console.error('❌ 用户身份验证错误:', error);
    return false;
  }
}

/**
 * 加载用户的提示词
 */
async function loadUserPrompts(userId) {
  try {
    console.log(`🔄 加载用户 ${userId} 的提示词...`);
    
    // 获取用户的所有提示词（私有 + 公共）
    const dbPrompts = await getUserAllPrompts(userId);
    console.log(`📊 获取到 ${dbPrompts.length} 个提示词`);
    
    // 转换为标准格式
    const convertedPrompts = dbPrompts.map(convertDbPromptToStandard);
    console.log(`🔄 转换完成，共 ${convertedPrompts.length} 个提示词`);
    
    loadedPrompts = convertedPrompts;
    console.log(`✅ 用户提示词加载完成，长度: ${loadedPrompts.length}`);
    
    // 显示统计信息
    const ownedCount = loadedPrompts.filter(p => p.ownership === 'owned').length;
    const publicCount = loadedPrompts.filter(p => p.ownership === 'public').length;
    
    console.log(`📊 提示词统计:`);
    console.log(`   👤 个人提示词: ${ownedCount} 个`);
    console.log(`   🌐 公共提示词: ${publicCount} 个`);
    console.log(`   📝 总计: ${loadedPrompts.length} 个`);
    
    return loadedPrompts;
  } catch (error) {
    console.error('❌ 加载用户提示词失败:', error);
    loadedPrompts = [];
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
 * 启动支持用户身份验证的MCP服务器
 */
async function startUserServer() {
  // 创建MCP服务器
  const server = new McpServer({
    name: CONFIG.SERVER_NAME,
    version: CONFIG.SERVER_VERSION
  });
  
  // 核心工具1: 用户身份验证
  server.tool(
    "authenticate_user",
    {
      user_token: z.string().describe("用户身份令牌（用户ID或JWT token）")
    },
    async (args) => {
      try {
        const success = await authenticateUserSession(args.user_token);
        
        if (success) {
          const ownedCount = loadedPrompts.filter(p => p.ownership === 'owned').length;
          const publicCount = loadedPrompts.filter(p => p.ownership === 'public').length;
          
          return {
            content: [
              {
                type: "text",
                text: `✅ 用户身份验证成功！\n\n👤 用户信息:\n   📧 邮箱: ${currentUser.email}\n   🆔 用户ID: ${currentUser.id}\n   📋 计划: ${currentUser.plan || '免费'}\n\n📊 提示词库统计:\n   👤 个人提示词: ${ownedCount} 个\n   🌐 可访问公共提示词: ${publicCount} 个\n   📝 总计可用: ${loadedPrompts.length} 个\n\n💡 现在您可以使用其他工具来搜索和调用您的个人提示词库了！`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `❌ 用户身份验证失败！\n\n请检查您的用户令牌是否正确。\n💡 提示：用户令牌应该是您的用户ID或有效的身份验证令牌。`
              }
            ]
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 身份验证过程中发生错误: ${error.message}`
            }
          ]
        };
      }
    },
    {
      description: "用户身份验证，验证成功后可访问个人提示词库"
    }
  );

  // 核心工具2: 搜索用户提示词
  server.tool(
    "search_user_prompts",
    {
      query: z.string().describe("搜索关键词")
    },
    async (args) => {
      try {
        if (!currentUser) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 请先使用 authenticate_user 工具进行身份验证！`
              }
            ]
          };
        }

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
          const ownershipIcon = p.ownership === 'owned' ? '👤' : '🌐';
          const ownershipText = p.ownership === 'owned' ? '个人' : '公共';
          
          const info = [
            `${index + 1}. ${ownershipIcon} ${p.name} [${ownershipText}]`,
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
        
        // 统计结果
        const ownedResults = results.filter(p => p.ownership === 'owned').length;
        const publicResults = results.filter(p => p.ownership === 'public').length;
        
        return {
          content: [
            {
              type: "text",
              text: `🔍 搜索"${args.query}"的结果 (显示前20个，共${results.length}个):${keywordInfo}\n📊 结果统计: 👤个人${ownedResults}个 | 🌐公共${publicResults}个\n\n${resultList.join('\n\n')}`
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
      description: "在用户的个人提示词库中搜索（包括个人私有和公共提示词）"
    }
  );

  // 核心工具3: 调用用户提示词
  server.tool(
    "use_user_prompt",
    {
      name: z.string().describe("提示词名称"),
      params: z.record(z.string()).optional().describe("提示词参数 (JSON对象格式)")
    },
    async (args) => {
      try {
        if (!currentUser) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 请先使用 authenticate_user 工具进行身份验证！`
              }
            ]
          };
        }

        const prompt = loadedPrompts.find(p => 
          p.name.toLowerCase() === args.name.toLowerCase() ||
          p.name.toLowerCase().includes(args.name.toLowerCase())
        );
        
        if (!prompt) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 未找到名为"${args.name}"的提示词。请使用 search_user_prompts 工具搜索可用的提示词。`
              }
            ]
          };
        }
        
        // 更新使用统计
        if (prompt.id) {
          await incrementPromptUsage(prompt.id);
        }
        
        // 处理prompt内容
        const promptText = processPromptContent(prompt, args.params || {});
        
        const ownershipInfo = prompt.ownership === 'owned' ? '👤 个人提示词' : '🌐 公共提示词';
        
        return {
          content: [
            {
              type: "text",
              text: `${ownershipInfo}: ${prompt.name}\n\n${promptText}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error using user prompt ${args.name}:`, error);
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
      description: "调用用户提示词库中的指定提示词"
    }
  );

  // 核心工具4: 获取用户提示词详情
  server.tool(
    "get_user_prompt_info",
    {
      name: z.string().describe("提示词名称")
    },
    async (args) => {
      try {
        if (!currentUser) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 请先使用 authenticate_user 工具进行身份验证！`
              }
            ]
          };
        }

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
        
        const ownershipIcon = prompt.ownership === 'owned' ? '👤' : '🌐';
        const ownershipText = prompt.ownership === 'owned' ? '个人提示词' : '公共提示词';
        
        const info = [
          `📝 提示词信息: ${prompt.name}`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `${ownershipIcon} 类型: ${ownershipText}`,
          `📋 描述: ${prompt.description || '无描述'}`,
          `📂 分类: ${prompt.category || '无分类'}`,
          `🔥 热度: ${prompt.hotness || 0}`,
          `🔢 使用次数: ${prompt.usage_count || 0}`,
          `👍 点赞数: ${prompt.likes_count || 0}`,
          `⭐ 收藏数: ${prompt.favorites_count || 0}`,
          `📊 难度: ${prompt.difficulty_level || '未设置'}`,
          `🔓 公开状态: ${prompt.is_public ? '公开' : '私有'}`,
          `📅 创建时间: ${prompt.created_at ? new Date(prompt.created_at).toLocaleString('zh-CN') : '未知'}`,
          prompt.arguments && prompt.arguments.length > 0 ? 
            `🔧 参数: ${prompt.arguments.map(arg => `${arg.name} (${arg.description || '无描述'})`).join(', ')}` : 
            '🔧 参数: 无参数',
          `🏷️ 标签: ${prompt.tags || '无'}`,
          `📄 内容长度: ${prompt.content ? prompt.content.length : 0} 字符`,
          ``,
          `💡 使用方法: use_user_prompt name="${prompt.name}" params={"参数名":"参数值"}`
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
      description: "获取用户提示词库中指定提示词的详细信息"
    }
  );

  // 核心工具5: 列出用户提示词
  server.tool(
    "list_user_prompts",
    {
      type: z.enum(["all", "owned", "public"]).optional().describe("提示词类型：all(全部)、owned(个人)、public(公共)"),
      category: z.string().optional().describe("按分类筛选"),
      limit: z.number().optional().describe("返回数量限制，默认50")
    },
    async (args) => {
      try {
        if (!currentUser) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 请先使用 authenticate_user 工具进行身份验证！`
              }
            ]
          };
        }

        let filteredPrompts = loadedPrompts;
        
        // 按类型筛选
        const type = args.type || "all";
        if (type === "owned") {
          filteredPrompts = loadedPrompts.filter(p => p.ownership === 'owned');
        } else if (type === "public") {
          filteredPrompts = loadedPrompts.filter(p => p.ownership === 'public');
        }
        
        // 按分类筛选
        if (args.category) {
          filteredPrompts = filteredPrompts.filter(p => 
            p.category && p.category.toLowerCase().includes(args.category.toLowerCase())
          );
        }
        
        const limit = args.limit || 50;
        const limitedPrompts = filteredPrompts.slice(0, limit);
        
        const promptList = limitedPrompts.map((p, index) => {
          const ownershipIcon = p.ownership === 'owned' ? '👤' : '🌐';
          return `${index + 1}. ${ownershipIcon} ${p.name} ${p.category ? `[${p.category}]` : ''} (🔥${p.hotness || 0})`;
        });
        
        const typeInfo = type === "all" ? "全部" : type === "owned" ? "个人" : "公共";
        const categoryInfo = args.category ? ` (分类: ${args.category})` : '';
        
        return {
          content: [
            {
              type: "text",
              text: `📋 ${typeInfo}提示词列表${categoryInfo} (显示${limitedPrompts.length}个，共${filteredPrompts.length}个):\n\n${promptList.join('\n')}\n\n💡 使用 get_user_prompt_info 获取详细信息，使用 use_user_prompt 调用提示词`
            }
          ]
        };
      } catch (error) {
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
      description: "列出用户提示词库中的提示词"
    }
  );
  
  // 打印服务器统计信息
  const totalTools = 5;
  console.log(`📊 用户版服务器统计:`);
  console.log(`   🔧 核心工具: ${totalTools} 个`);
  console.log(`   🔐 支持用户身份验证`);
  console.log(`   👤 支持个人提示词库`);
  console.log(`✅ 用户版服务器 - 支持个人提示词库访问`);
  
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
  console.log('🚀 MCP Prompt Server (用户版) is running...');
  console.log(`🔐 支持用户身份验证和个人提示词库访问`);
  console.log(`🔧 Registered ${totalTools} user-specific tools`);
  console.log(`💡 请先使用 authenticate_user 工具进行身份验证`);
}

// 启动用户版服务器
startUserServer().catch(error => {
  console.error('Failed to start user server:', error);
  process.exit(1);
}); 