import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:9lxnx6j9@dbconn.sealosgzg.site:31740/?directConnection=true'
});

async function inspectDatabase() {
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // 查看prompts表的详细结构
    console.log('\n=== PROMPTS TABLE DETAILED STRUCTURE ===');
    const promptsSchema = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'prompts' 
      ORDER BY ordinal_position
    `);
    console.table(promptsSchema.rows);
    
    // 查看prompts表的前几行数据
    console.log('\n=== PROMPTS TABLE SAMPLE DATA ===');
    const promptsData = await client.query('SELECT * FROM prompts LIMIT 3');
    console.log('Columns:', promptsData.fields.map(f => f.name));
    console.table(promptsData.rows);
    
    // 查看表中的列名
    console.log('\n=== ACTUAL COLUMN NAMES ===');
    if (promptsData.rows.length > 0) {
      console.log(Object.keys(promptsData.rows[0]));
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
  }
}

inspectDatabase(); 