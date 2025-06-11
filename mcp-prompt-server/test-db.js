import { testConnection, getAllActivePrompts } from './src/database.js';

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  // 测试连接
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('❌ Database connection failed');
    return;
  }
  
  // 测试获取数据
  try {
    console.log('📊 Fetching prompts from database...');
    const prompts = await getAllActivePrompts();
    console.log(`✅ Successfully loaded ${prompts.length} prompts`);
    
    if (prompts.length > 0) {
      console.log('\n📝 Sample prompt:');
      const sample = prompts[0];
      console.log(`- Name: ${sample.name}`);
      console.log(`- Category: ${sample.category || 'None'}`);
      console.log(`- Content length: ${sample.content ? sample.content.length : 0} chars`);
      console.log(`- Created: ${sample.created_at}`);
    }
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
  }
}

testDatabase(); 