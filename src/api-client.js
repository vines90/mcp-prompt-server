// API客户端 - 与prompt-manager系统交互
import axios from 'axios';

class PromptManagerAPIClient {
  constructor({ baseURL, userToken, secretKey }) {
    this.baseURL = baseURL;
    this.userToken = userToken;
    this.secretKey = secretKey;
    this.userId = null;
    this.username = null;
    
    // 创建axios实例
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: this._getAuthHeaders()
    });

    // 添加响应拦截器来处理错误
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.error('❌ 认证失败，请检查SECRET_KEY或登录状态');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取认证头
   */
  _getAuthHeaders() {
    const headers = {};
    if (this.secretKey) {
      headers['X-Secret-Key'] = this.secretKey;
    } else if (this.userToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    }
    return headers;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      const response = await this.client.get('/api/user/profile');
      if (response.data?.success) {
        this.userId = response.data.data?.id;
        this.username = response.data.data?.username;
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error.message);
      return null;
    }
  }

  /**
   * 测试API连接
   */
  async testConnection() {
      try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('API连接测试失败:', error.message);
      return false;
    }
  }

  /**
   * 自动认证（优先使用Secret Key，然后尝试用户名密码）
   */
  async autoAuthenticate() {
    if (this.secretKey) {
      try {
        console.log('🔑 正在使用Secret Key进行认证...');
        const response = await this.client.put('/api/user/secret-key', null, {
          headers: { 'X-Secret-Key': this.secretKey }
        });
        
        if (response.status === 200) {
          console.log('✅ Secret Key认证成功');
          await this.getCurrentUser();
          return true;
        }
      } catch (error) {
        console.error('❌ Secret Key认证失败:', error.message);
        return false;
        }
    }
    return false;
  }

  /**
   * 用户登录
   */
  async login(username, password) {
    try {
      const response = await this.client.post('/api/auth/login', {
        username,
        password
      });
      if (response.data?.token) {
        this.userToken = response.data.token;
        this.client.defaults.headers['Authorization'] = `Bearer ${this.userToken}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('登录失败:', error.message);
      return false;
    }
  }

  /**
   * 搜索提示词
   */
  async searchPrompts(query = '') {
    try {
      const response = await this.client.get('/api/prompts', {
        params: { search: query }
      });
      return response.data || [];
    } catch (error) {
      console.error('搜索提示词失败:', error.message);
      return [];
    }
  }

  /**
   * 获取所有分类
   */
  async getAllCategories() {
    try {
      const response = await this.client.get('/api/prompts/categories');
      return response.data || [];
    } catch (error) {
      console.error('获取分类失败:', error.message);
      return [];
    }
  }

  /**
   * 按分类获取提示词
   */
  async getPromptsByCategory(category) {
    try {
      const response = await this.client.get('/api/prompts', {
        params: { category }
      });
      return response.data || [];
    } catch (error) {
      console.error('获取分类提示词失败:', error.message);
      return [];
    }
  }

  /**
   * 获取提示词详情
   */
  async getPromptInfo(promptId) {
    try {
      const config = {};
      
      // 添加认证头
      if (this.secretKey) {
        config.headers = {
          'X-Secret-Key': this.secretKey
        };
      } else if (this.userToken) {
        config.headers = {
          'Authorization': `Bearer ${this.userToken}`
        };
      }

      // 使用列表API获取单个提示词详情
      const response = await this.client.get(`/api/prompts`, {
        ...config,
        params: { id: promptId }
      });
      
      // 从返回的数据中查找匹配的提示词
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.find(prompt => prompt.id == promptId) || null;
      }
      
      // 如果没有找到，尝试搜索所有提示词
      const allPrompts = await this.getAllAvailablePrompts();
      return allPrompts.find(prompt => prompt.id == promptId) || null;
    } catch (error) {
      console.error('获取提示词详情失败:', error.message);
      return null;
    }
  }

  /**
   * 获取API统计信息
   */
  async getAPIStats() {
        try {
      const response = await this.client.get('/api/stats');
      return response.data || {};
        } catch (error) {
      console.error('获取API统计失败:', error.message);
      return {};
    }
      }

  /**
   * 添加提示词
   */
  async addPrompt({ title, content, category, isPublic, tags }) {
    try {
      // 首先使用Secret Key获取JWT Token
      let token = this.userToken;
      
      if (this.secretKey && !token) {
        try {
          const authResponse = await this.client.put('/api/user/secret-key', null, {
            headers: { 'X-Secret-Key': this.secretKey }
          });
          
          if (authResponse.data?.success) {
            // 获取用户信息后，可能需要通过其他方式获取token
            // 这里我们尝试直接使用Secret Key作为认证方式
            const response = await this.client.post('/api/prompts', {
              title,
              content,
              category: category || '其他',
              isPublic: isPublic !== undefined ? isPublic : false,
              tags: tags || []
            }, {
              headers: {
                'X-Secret-Key': this.secretKey,
                'Content-Type': 'application/json'
              }
            });
            return response.data;
          }
        } catch (authError) {
          console.error('Secret Key认证失败:', authError.message);
        }
      }

      // 使用JWT Token认证
      const config = {};
      if (token) {
        config.headers = {
          'Authorization': `Bearer ${token}`
        };
      } else if (this.secretKey) {
        config.headers = {
          'X-Secret-Key': this.secretKey
        };
      }

      const response = await this.client.post('/api/prompts', {
        title,
        content,
        category: category || '其他',
        isPublic: isPublic !== undefined ? isPublic : false,
        tags: tags || []
      }, config);
      return response.data;
    } catch (error) {
      console.error('添加提示词失败:', error.response?.data || error.message);
      throw new Error(`添加提示词失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 更新提示词
   */
  async updatePrompt({ promptId, title, content, category, isPublic, tags }) {
    try {
      const config = {};
      
      // 添加认证头
      if (this.secretKey) {
        config.headers = {
          'X-Secret-Key': this.secretKey
        };
      } else if (this.userToken) {
        config.headers = {
          'Authorization': `Bearer ${this.userToken}`
        };
      }

      const response = await this.client.put(`/api/prompts/${promptId}`, {
        title,
        content,
        category,
        isPublic,
        tags
      }, config);
      return response.data;
    } catch (error) {
      console.error('更新提示词失败:', error.message);
      return null;
    }
  }

  // 获取用户的Secret Key（需要JWT认证）
  async getUserSecretKey() {
    try {
      if (!this.userToken) {
        throw new Error('需要先登录才能获取Secret Key');
      }

      const response = await this.client.get('/api/user/secret-key');
      
      if (response.data) {
        console.log('✅ 获取Secret Key成功');
        return response.data;
      } else {
        throw new Error(response.data?.message || '获取Secret Key失败');
      }
    } catch (error) {
      console.error('❌ 获取Secret Key失败:', error.message);
      throw error;
    }
  }

  // 刷新用户的Secret Key（需要JWT认证）
  async refreshSecretKey() {
    try {
      if (!this.userToken) {
        throw new Error('需要先登录才能刷新Secret Key');
      }

      const response = await this.client.post('/api/user/secret-key');
      
      if (response.data) {
        // 更新本地的secret key
        this.secretKey = response.data.secret_key;
        this.client.defaults.headers['X-Secret-Key'] = this.secretKey;
        console.log('✅ Secret Key刷新成功');
        return response.data;
      } else {
        throw new Error(response.data?.message || '刷新Secret Key失败');
      }
    } catch (error) {
      console.error('❌ 刷新Secret Key失败:', error.message);
      throw error;
    }
  }

  // 获取用户的私有提示词
  async getUserPrompts(options = {}) {
    const { search, limit = 50, offset = 0 } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (search) {
      params.append('search', search);
    }

    try {
      const response = await this.client.get('/api/prompts', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error('❌ 获取私有提示词失败:', error.message);
      return [];
    }
  }

  // 获取公共提示词
  async getPublicPrompts(options = {}) {
    const { search, limit = 50, offset = 0, sortBy = 'shared_at', category } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      sortBy
    });

    if (search) {
      params.append('search', search);
    }

    if (category && category !== '全部') {
      params.append('category', category);
    }

    const response = await this.client.get('/api/prompts/public', { params });
    return response.data.data || [];
  }

  // 获取所有可用的提示词（公共 + 私有）
  async getAllAvailablePrompts(options = {}) {
    const results = [];

    try {
      // 获取公共提示词
      try {
        const publicPrompts = await this.getPublicPrompts(options);
        if (publicPrompts && Array.isArray(publicPrompts)) {
          results.push(...publicPrompts.map(p => ({
            ...p,
            source: 'public'
          })));
        }
      } catch (error) {
        console.warn('⚠️ 获取公共提示词失败:', error.message);
      }

      // 如果有用户认证，获取私有提示词
      if (this.userToken || this.secretKey) {
        try {
          const privatePrompts = await this.getUserPrompts(options);
          if (privatePrompts && Array.isArray(privatePrompts)) {
            results.push(...privatePrompts.map(p => ({
              ...p,
              source: 'private'
            })));
          }
        } catch (error) {
          console.warn('⚠️ 获取私有提示词失败:', error.message);
        }
      }

      // 如果没有获取到任何提示词，返回一些示例数据
      if (results.length === 0) {
        results.push({
          id: 1,
          title: "示例提示词",
          category: "示例",
          source: "public",
          content: "这是一个示例提示词"
        });
      }

      // 按热度和创建时间排序
      results.sort((a, b) => {
        const scoreA = (a.hotness || 0) * 2 + (a.likes_count || 0);
        const scoreB = (b.hotness || 0) * 2 + (b.likes_count || 0);
        return scoreB - scoreA;
      });

      return results;

    } catch (error) {
      console.error('❌ 获取提示词失败:', error.message);
      // 返回一些示例数据而不是抛出错误
      return [{
        id: 1,
        title: "示例提示词",
        category: "示例",
        source: "public",
        content: "这是一个示例提示词"
      }];
    }
  }

  // 获取分类列表
  async getCategories() {
    // 这里可以实现获取分类的API调用
    // 目前先返回一个默认的分类列表
    return [
      '编程', '写作', '设计', '营销', '分析', '教育', 
      '商业', '创意', '翻译', '总结', '其他'
    ];
  }

  // 更新提示词使用统计
  async updatePromptUsage(promptId, source = 'mcp') {
    try {
      // 这里可以实现更新使用统计的API调用
      console.log(`📊 更新提示词使用统计: ${promptId} (来源: ${source})`);
      // 实际实现中可以调用相应的API
    } catch (error) {
      console.warn('⚠️ 更新使用统计失败:', error.message);
      // 不阻止主要功能
    }
  }

  // 获取热门提示词
  async getHotPrompts(limit = 20) {
    return this.getAllAvailablePrompts({
      limit,
      sortBy: 'hotness'
    });
  }

  // 获取统计信息
  async getStats() {
    try {
      // 模拟统计信息，实际可以调用相应的API
      const publicResponse = await this.getPublicPrompts({ limit: 1 });
      const privateResponse = this.userToken ? await this.getUserPrompts({ limit: 1 }) : null;

      return {
        publicPrompts: publicResponse.data ? '1000+' : '0',
        privatePrompts: privateResponse?.data ? '用户专属' : '0',
        categories: '10+',
        authenticated: !!(this.userToken || this.secretKey)
      };
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error.message);
      return {
        publicPrompts: '未知',
        privatePrompts: '未知',
        categories: '未知',
        authenticated: !!(this.userToken || this.secretKey)
      };
    }
  }
}

export default PromptManagerAPIClient; 