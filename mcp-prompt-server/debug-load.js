import { getAllActivePrompts } from './src/database.js';

async function debugLoad() {
  try {
    console.log('🔍 开始调试数据加载过程...\n');
    
    console.log('1️⃣ 调用 getAllActivePrompts()...');
    const dbPrompts = await getAllActivePrompts();
    console.log(`   ✅ 从数据库获取到 ${dbPrompts.length} 个提示词`);
    
    if (dbPrompts.length > 0) {
      console.log('\n2️⃣ 前3个提示词的基本信息:');
      dbPrompts.slice(0, 3).forEach((prompt, index) => {
        console.log(`   ${index + 1}. ID: ${prompt.id}, Name: ${prompt.name || prompt.title}, Category: ${prompt.category}`);
      });
      
      console.log('\n3️⃣ 数据转换测试...');
      // 模拟 convertDbPromptToStandard 函数
      const convertedPrompt = {
        id: dbPrompts[0].id,
        name: dbPrompts[0].name || dbPrompts[0].title,
        description: dbPrompts[0].description || `从数据库加载的提示词: ${dbPrompts[0].name || dbPrompts[0].title}`,
        content: dbPrompts[0].content,
        category: dbPrompts[0].category
      };
      console.log('   ✅ 转换后的第一个提示词:');
      console.log(`      Name: ${convertedPrompt.name}`);
      console.log(`      Category: ${convertedPrompt.category}`);
      console.log(`      Content length: ${convertedPrompt.content ? convertedPrompt.content.length : 0}`);
    }
    
    console.log('\n4️⃣ 检查数据结构...');
    if (dbPrompts.length > 0) {
      const firstPrompt = dbPrompts[0];
      console.log('   第一个提示词的字段:');
      Object.keys(firstPrompt).forEach(key => {
        const value = firstPrompt[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(`      ${key}: ${type} = ${preview}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

debugLoad(); 