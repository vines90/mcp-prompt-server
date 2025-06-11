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
      ORDER BY title
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching prompts from database:', error);
    throw error;
  }
}

// 根据用户ID获取prompts
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
        hotness
      FROM prompts 
      WHERE user_id = $1 AND is_public = true 
      ORDER BY title
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user prompts from database:', error);
    throw error;
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
        sub,
        email,
        plan,
        tokens_used,
        requests_today,
        total_requests,
        created_at,
        is_active
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
  closePool
}; 