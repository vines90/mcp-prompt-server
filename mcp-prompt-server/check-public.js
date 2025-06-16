import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:9lxnx6j9@dbconn.sealosgzg.site:31740/?directConnection=true'
});

async function checkPublicStatus() {
  try {
    console.log('检查is_public字段的分布:');
    const result = await pool.query('SELECT is_public, COUNT(*) as count FROM prompts GROUP BY is_public');
    console.table(result.rows);
    
    console.log('\n前5个提示词的详细信息:');
    const sample = await pool.query('SELECT id, title, is_public, category FROM prompts LIMIT 5');
    console.table(sample.rows);
    
    console.log('\n尝试获取所有提示词（不限制is_public）:');
    const all = await pool.query('SELECT COUNT(*) as total FROM prompts');
    console.log(`总提示词数量: ${all.rows[0].total}`);
    
    console.log('\n尝试获取is_public=true的提示词:');
    const publicOnly = await pool.query('SELECT COUNT(*) as total FROM prompts WHERE is_public = true');
    console.log(`公开提示词数量: ${publicOnly.rows[0].total}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPublicStatus(); 