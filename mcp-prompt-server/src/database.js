import pkg from 'pg';
const { Pool } = pkg;

// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:9lxnx6j9@dbconn.sealosgzg.site:31740/?directConnection=true',
  max: 20,        // 最大连接数
  idleTimeoutMillis: 30000,  // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
});

// 测试数据库连接
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection established successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// 获取所有活跃的prompts (根据实际表结构)
async function getAllActivePrompts() {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness
      FROM prompts 
      WHERE is_public = true
      ORDER BY 
        COALESCE(hotness, 0) DESC,
        COALESCE(usage_count, 0) DESC,
        title
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching prompts from database:', error);
    throw error;
  }
}

// 根据用户ID获取prompts (包括用户的私有提示词和公共提示词)
async function getPromptsByUserId(userId) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness,
        user_id
      FROM prompts 
      WHERE user_id = $1
      ORDER BY 
        COALESCE(hotness, 0) DESC,
        COALESCE(usage_count, 0) DESC,
        title
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user prompts from database:', error);
    throw error;
  }
}

// 新增：获取用户的所有提示词（私有 + 公共）
async function getUserAllPrompts(userId) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness,
        user_id,
        CASE 
          WHEN user_id = $1 THEN 'owned'
          ELSE 'public'
        END as ownership
      FROM prompts 
      WHERE user_id = $1 OR is_public = true
      ORDER BY 
        CASE WHEN user_id = $1 THEN 0 ELSE 1 END,  -- 用户自己的提示词排在前面
        COALESCE(hotness, 0) DESC,
        COALESCE(usage_count, 0) DESC,
        title
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user all prompts from database:', error);
    throw error;
  }
}

// 新增：仅获取用户私有提示词
async function getUserPrivatePrompts(userId) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness,
        user_id
      FROM prompts 
      WHERE user_id = $1 AND is_public = false
      ORDER BY 
        COALESCE(hotness, 0) DESC,
        COALESCE(usage_count, 0) DESC,
        title
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user private prompts from database:', error);
    throw error;
  }
}

// 新增：根据用户ID和关键词搜索提示词
async function searchUserPrompts(userId, searchTerm) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness,
        user_id,
        CASE 
          WHEN user_id = $1 THEN 'owned'
          ELSE 'public'
        END as ownership
      FROM prompts 
      WHERE (user_id = $1 OR is_public = true)
        AND (
          title ILIKE $2 
          OR content ILIKE $2
          OR description ILIKE $2
          OR category ILIKE $2
        )
      ORDER BY 
        CASE WHEN user_id = $1 THEN 0 ELSE 1 END,  -- 用户自己的提示词排在前面
        COALESCE(hotness, 0) DESC,
        COALESCE(usage_count, 0) DESC,
        title
      LIMIT 50
    `;
    
    const result = await pool.query(query, [userId, `%${searchTerm}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching user prompts from database:', error);
    throw error;
  }
}

// 新增：验证用户身份的函数（支持多种验证方式）
async function authenticateUser(userToken) {
  try {
    // 方式1：如果token包含冒号，则认为是 username:password 格式
    if (userToken.includes(':')) {
      const [username, password] = userToken.split(':');
      return await authenticateWithPassword(username, password);
    }
    
    // 方式2：如果是纯数字，则认为是用户ID（简单验证，仅用于测试）
    const userId = parseInt(userToken);
    if (!isNaN(userId)) {
      const user = await getUserById(userId);
      if (user && user.is_active) {
        return user;
      }
    }
    
    // 方式3：如果是JWT格式，则进行JWT验证（可扩展）
    if (userToken.includes('.') && userToken.split('.').length === 3) {
      // TODO: 实现JWT验证
      console.log('JWT验证暂未实现');
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// 新增：用户名密码验证函数
async function authenticateWithPassword(username, password) {
  try {
    // 导入bcrypt用于密码验证
    const bcrypt = await import('bcrypt');
    
    const query = `
      SELECT 
        id,
        username,
        password,
        avatar_url,
        bio,
        followers_count,
        following_count,
        public_prompts_count,
        created_at,
        display_name,
        location,
        website,
        twitter_url,
        updated_at
      FROM users 
      WHERE username = $1
    `;
    
    const result = await pool.query(query, [username]);
    const user = result.rows[0];
    
    if (!user) {
      console.log(`❌ 用户 ${username} 不存在`);
      return null;
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`❌ 用户 ${username} 密码错误`);
      return null;
    }
    
    console.log(`✅ 用户 ${username} 密码验证成功`);
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
    
  } catch (error) {
    console.error('Error authenticating with password:', error);
    return null;
  }
}

// 根据分类获取prompts
async function getPromptsByCategory(category) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness
      FROM prompts 
      WHERE category = $1 AND is_public = true 
      ORDER BY title
    `;
    
    const result = await pool.query(query, [category]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching prompts by category from database:', error);
    throw error;
  }
}

// 更新prompt使用次数
async function incrementPromptUsage(promptId) {
  try {
    const query = `
      UPDATE prompts 
      SET usage_count = usage_count + 1
      WHERE id = $1
    `;
    
    await pool.query(query, [promptId]);
  } catch (error) {
    console.error('Error updating prompt usage:', error);
    // 不抛出错误，因为这不应该影响主要功能
  }
}

// 获取用户信息
async function getUserById(userId) {
  try {
    const query = `
      SELECT 
        id,
        username,
        avatar_url,
        bio,
        followers_count,
        following_count,
        public_prompts_count,
        created_at,
        display_name,
        location,
        website,
        twitter_url,
        updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
}

// 获取所有分类
async function getAllCategories() {
  try {
    const query = `
      SELECT DISTINCT category 
      FROM prompts 
      WHERE is_public = true AND category IS NOT NULL AND category != ''
      ORDER BY category
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.category);
  } catch (error) {
    console.error('Error fetching categories from database:', error);
    throw error;
  }
}

// 根据名称搜索prompts
async function searchPromptsByName(searchTerm) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness
      FROM prompts 
      WHERE is_public = true 
        AND (
          title ILIKE $1 
          OR content ILIKE $1
          OR description ILIKE $1
        )
      ORDER BY usage_count DESC, hotness DESC, title
      LIMIT 50
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching prompts from database:', error);
    throw error;
  }
}

// 获取热门prompts
async function getHotPrompts(limit = 20) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness
      FROM prompts 
      WHERE is_public = true 
      ORDER BY hotness DESC, usage_count DESC, likes_count DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching hot prompts from database:', error);
    throw error;
  }
}

// 根据难度级别获取prompts
async function getPromptsByDifficulty(difficultyLevel) {
  try {
    const query = `
      SELECT 
        id,
        title as name,
        content,
        tags as arguments,
        category,
        description,
        created_at,
        usage_count,
        likes_count,
        favorites_count,
        difficulty_level,
        is_public,
        hotness
      FROM prompts 
      WHERE difficulty_level = $1 AND is_public = true 
      ORDER BY title
    `;
    
    const result = await pool.query(query, [difficultyLevel]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching prompts by difficulty from database:', error);
    throw error;
  }
}

// 获取统计信息
async function getStats() {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_prompts,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT category) as categories_count,
        SUM(usage_count) as total_usage,
        AVG(usage_count) as avg_usage
      FROM prompts 
      WHERE is_public = true
    `;
    
    const result = await pool.query(statsQuery);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching stats from database:', error);
    throw error;
  }
}

// 关闭数据库连接池
async function closePool() {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

export {
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
  closePool,
  getUserAllPrompts,
  getUserPrivatePrompts,
  searchUserPrompts,
  authenticateUser,
  authenticateWithPassword
}; 