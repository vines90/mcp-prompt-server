import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:9lxnx6j9@dbconn.sealosgzg.site:31740/?directConnection=true'
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // 查看users表结构
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.table(usersSchema.rows);
    
    // 查看prompts表结构
    console.log('\n=== PROMPTS TABLE STRUCTURE ===');
    const promptsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'prompts' 
      ORDER BY ordinal_position
    `);
    console.table(promptsSchema.rows);
    
    // 查看users表数据
    console.log('\n=== USERS TABLE DATA (SAMPLE) ===');
    const usersData = await client.query('SELECT * FROM users LIMIT 5');
    console.table(usersData.rows);
    
    // 查看prompts表数据
    console.log('\n=== PROMPTS TABLE DATA (SAMPLE) ===');
    const promptsData = await client.query('SELECT * FROM prompts LIMIT 5');
    console.table(promptsData.rows);
    
    // 查看总数
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const promptsCount = await client.query('SELECT COUNT(*) FROM prompts');
    
    console.log(`\n=== TABLE COUNTS ===`);
    console.log(`Users: ${usersCount.rows[0].count}`);
    console.log(`Prompts: ${promptsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase(); 