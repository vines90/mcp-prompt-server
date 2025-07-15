import 'dotenv/config';
import { McpServer } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js';
import { StdioServerTransport } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js';
import { z } from 'zod';
import PromptManagerAPIClient from './api-client.js';

// 配置常量
const CONFIG = {
  // API配置
  API_BASE_URL: process.env.PROMPT_MANAGER_API_URL || 'https://www.aiprompter.cc',
  USER_TOKEN: process.env.USER_TOKEN,
  SECRET_KEY: process.env.SECRET_KEY,
  USERNAME: process.env.USERNAME,
  PASSWORD: process.env.PASSWORD,
  // 环境配置
  NODE_ENV: process.env.NODE_ENV || 'development'
};

console.log('🔧 当前配置:', {
  API_BASE_URL: CONFIG.API_BASE_URL,
  USERNAME: CONFIG.USERNAME,
  NODE_ENV: CONFIG.NODE_ENV
});

// 全局变量
let apiClient = null;

/**
 * 初始化API客户端
 */
async function initializeAPIClient() {
  if (!apiClient) {
    console.log('🔄 初始化API客户端...');
    apiClient = new PromptManagerAPIClient({
      baseURL: CONFIG.API_BASE_URL,
      userToken: CONFIG.USER_TOKEN,
      secretKey: CONFIG.SECRET_KEY
    });
    
    // 测试连接
    console.log('🔄 测试API连接...');
    const isConnected = await apiClient.testConnection();
    if (!isConnected) {
      console.warn('⚠️ API连接测试失败');
      return false;
    }
    console.log('✅ API连接测试成功');
    
    // 尝试认证
    console.log('🔄 尝试认证...');
    const isAuthenticated = await apiClient.autoAuthenticate();
    if (!isAuthenticated && CONFIG.USERNAME && CONFIG.PASSWORD) {
      console.log('🔄 使用用户名密码登录...');
      const loginSuccess = await apiClient.login(CONFIG.USERNAME, CONFIG.PASSWORD);
      if (!loginSuccess) {
        console.error('❌ 登录失败');
        return false;
      }
      console.log('✅ 登录成功');
      return true;
    }
    return isAuthenticated;
  }
  return true;
}
  
// 创建MCP服务器实例
const mcpServer = new McpServer({
  name: "mcp-prompt-server",
  version: "4.0.0",
});
  
// 注册工具
mcpServer.registerTool("auth_status", {
  description: "检查当前认证状态",
  inputSchema: {
    dummy: z.string().optional().describe("可选参数"),
  },
}, async () => {
  try {
    const initialized = await initializeAPIClient();
    if (!initialized) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 未认证 - 请配置SECRET_KEY或使用用户名密码登录",
          },
        ],
      };
    }
    
    const userInfo = await apiClient.getCurrentUser();
    const stats = await apiClient.getStats();
    
    return {
      content: [
        {
          type: "text",
          text: `✅ 已认证\n用户: ${userInfo?.username || '未知'}\n认证方式: ${apiClient.secretKey ? 'Secret Key' : 'JWT Token'}\n统计: ${JSON.stringify(stats, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `认证状态检查失败: ${error.message}`,
        },
      ],
    };
  }
});

mcpServer.registerTool("get_prompts", {
  description: "获取提示词列表，支持公共和私有库",
  inputSchema: {
    source: z.enum(['all', 'public', 'private']).optional().describe("提示词来源: all(全部), public(公共), private(私有)"),
    search: z.string().optional().describe("搜索关键词"),
    category: z.string().optional().describe("按分类筛选"),
    limit: z.number().min(1).max(100).optional().describe("返回数量限制(1-100)"),
    offset: z.number().min(0).optional().describe("分页偏移"),
  },
}, async ({ source = 'all', search, category, limit = 20, offset = 0 }) => {
  try {
    const initialized = await initializeAPIClient();
    if (!initialized) {
      throw new Error('API客户端初始化失败，请配置SECRET_KEY或使用用户名密码登录');
    }
    
    let prompts = [];
    const options = { search, category, limit, offset };
    
    switch (source) {
      case 'public':
        prompts = await apiClient.getPublicPrompts(options);
        break;
      case 'private':
        prompts = await apiClient.getUserPrompts(options);
        break;
      case 'all':
      default:
        prompts = await apiClient.getAllAvailablePrompts(options);
        break;
    }
    
    const formattedPrompts = prompts.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category || '未分类',
      tags: p.tags || [],
      source: p.source || (p.isPublic ? 'public' : 'private'),
      isPublic: p.isPublic,
      hotness: p.hotness || 0,
      createdAt: p.createdAt,
      preview: p.content ? p.content.substring(0, 100) + (p.content.length > 100 ? '...' : '') : ''
    }));
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total: prompts.length,
            source: source,
            prompts: formattedPrompts
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `获取提示词失败: ${error.message}`,
        },
      ],
    };
  }
});

mcpServer.registerTool("get_prompt_names", {
  description: "获取所有提示词名称",
  inputSchema: {
    random_string: z.string().describe("Dummy parameter for no-parameter tools"),
  },
}, async () => {
  try {
    console.log('🔄 获取提示词名称...');
    const initialized = await initializeAPIClient();
    if (!initialized) {
      throw new Error('API客户端初始化失败');
    }
    
    // 获取所有可用提示词（公共+私有）
    console.log('🔄 获取所有可用提示词...');
    const allPrompts = await apiClient.getAllAvailablePrompts();
    console.log(`✅ 获取到 ${allPrompts.length} 个提示词`);
    
    // 限制返回数量
    const limitedPrompts = allPrompts.slice(0, 50);
    
    const result = {
      total: allPrompts.length,
      showing: limitedPrompts.length,
      names: limitedPrompts.map(p => p.title)
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('❌ 获取提示词名称失败:', error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "获取提示词名称失败: " + error.message }),
        },
      ],
    };
  }
});

mcpServer.registerTool("get_prompts_by_category", {
  description: "按分类获取提示词",
  inputSchema: {
    category: z.string().describe("要查询的分类名称"),
    },
}, async ({ category }) => {
      try {
    const prompts = await apiClient.getPromptsByCategory(category);
        return {
          content: [
            {
              type: "text",
          text: JSON.stringify(prompts),
        },
      ],
        };
      } catch (error) {
    console.error('获取分类提示词失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "获取分类提示词失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("get_all_categories", {
  description: "获取所有分类",
  inputSchema: {
    random_string: z.string().describe("Dummy parameter for no-parameter tools"),
  },
}, async () => {
      try {
    const categories = await apiClient.getAllCategories();
        return {
          content: [
            {
              type: "text",
          text: JSON.stringify(categories),
        },
      ],
        };
      } catch (error) {
    console.error('获取分类失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "获取分类失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("search_prompts", {
  description: "搜索提示词",
  inputSchema: {
    query: z.string().describe("搜索关键词"),
    },
}, async ({ query }) => {
      try {
    // 使用getAllAvailablePrompts来搜索所有可用提示词（公共+私有）
    const allPrompts = await apiClient.getAllAvailablePrompts({ search: query });
    
    // 如果有搜索关键词，进行额外的客户端过滤
    let filteredPrompts = allPrompts;
    if (query && query.trim()) {
      filteredPrompts = allPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query.toLowerCase()) ||
        prompt.content.toLowerCase().includes(query.toLowerCase()) ||
        (prompt.category && prompt.category.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // 限制返回数量，避免数据过大
    const limitedPrompts = filteredPrompts.slice(0, 10);
    
    // 简化数据格式，只返回关键信息
    const simplifiedPrompts = limitedPrompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      category: prompt.category || '未分类',
      source: prompt.source || 'unknown',
      content_preview: prompt.content ? prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : '') : ''
    }));
    
    const result = {
      total_found: filteredPrompts.length,
      showing: limitedPrompts.length,
      query: query || '(全部)',
      prompts: simplifiedPrompts
    };
    
        return {
          content: [
            {
              type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
        };
      } catch (error) {
    console.error('搜索提示词失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "搜索提示词失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("get_prompt_detail", {
  description: "获取指定提示词的详细信息",
  inputSchema: {
    promptId: z.string().describe("提示词ID"),
  },
}, async ({ promptId }) => {
  try {
    const initialized = await initializeAPIClient();
    if (!initialized) {
      throw new Error('API客户端初始化失败');
    }
    
    const prompt = await apiClient.getPromptInfo(promptId);
    if (!prompt) {
      throw new Error('未找到该提示词');
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: prompt.id,
            title: prompt.title,
            content: prompt.content,
            category: prompt.category || '未分类',
            tags: prompt.tags || [],
            isPublic: prompt.isPublic,
            hotness: prompt.hotness || 0,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt,
            author: prompt.author || '匿名'
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `获取提示词详情失败: ${error.message}`,
        },
      ],
    };
  }
});

mcpServer.registerTool("get_api_stats", {
  description: "获取API统计信息",
  inputSchema: {
    random_string: z.string().describe("Dummy parameter for no-parameter tools"),
  },
}, async () => {
  try {
    const stats = await apiClient.getAPIStats();
        return {
          content: [
            {
              type: "text",
          text: JSON.stringify(stats),
        },
      ],
        };
      } catch (error) {
    console.error('获取API统计失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "获取API统计失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("user_login", {
  description: "用户登录",
  inputSchema: {
    username: z.string().describe("用户名或邮箱"),
    password: z.string().describe("密码"),
  },
}, async ({ username, password }) => {
      try {
    const success = await apiClient.login(username, password);
        return {
          content: [
            {
              type: "text",
          text: success ? "登录成功" : "登录失败",
        },
      ],
        };
      } catch (error) {
    console.error('登录失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "登录失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("add_prompt", {
  description: "添加提示词",
  inputSchema: {
    title: z.string().describe("提示词标题"),
    content: z.string().describe("提示词内容"),
    category: z.string().optional().describe("分类（可选，默认为'其他'）"),
    isPublic: z.boolean().optional().describe("是否公开（可选，默认为false）"),
    tags: z.array(z.string()).optional().describe("标签数组（可选）"),
  },
}, async ({ title, content, category, isPublic, tags }) => {
  try {
    const prompt = await apiClient.addPrompt({
      title,
      content,
      category,
      isPublic,
      tags,
    });
        return {
          content: [
            {
              type: "text",
          text: prompt ? "添加成功" : "添加失败",
        },
      ],
        };
      } catch (error) {
    console.error('添加提示词失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "添加提示词失败: " + error.message,
        },
      ],
        };
      }
});

mcpServer.registerTool("update_prompt", {
  description: "更新提示词",
  inputSchema: {
    promptId: z.string().describe("要更新的提示词ID"),
    title: z.string().optional().describe("新的标题（可选）"),
    content: z.string().optional().describe("新的内容（可选）"),
    category: z.string().optional().describe("新的分类（可选）"),
    isPublic: z.boolean().optional().describe("是否公开（可选）"),
    tags: z.array(z.string()).optional().describe("新的标签数组（可选）"),
  },
}, async ({ promptId, title, content, category, isPublic, tags }) => {
  try {
    const prompt = await apiClient.updatePrompt({
      promptId,
      title,
      content,
      category,
      isPublic,
      tags,
    });
        return {
          content: [
            {
              type: "text",
          text: prompt ? "更新成功" : "更新失败",
        },
      ],
        };
      } catch (error) {
    console.error('更新提示词失败:', error);
        return {
          content: [
            {
              type: "text",
          text: "更新提示词失败: " + error.message,
        },
      ],
        };
      }
});
  
// 启动服务器
async function startServer() {
  try {
    console.log('🚀 启动MCP服务器...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.log('✨ MCP Prompt Server 启动成功');
    
    // 初始化API客户端
    const initialized = await initializeAPIClient();
    if (!initialized) {
      console.warn('⚠️ API客户端初始化失败，部分功能可能不可用');
    } else {
      console.log('✅ API客户端初始化成功');
    }
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer(); 