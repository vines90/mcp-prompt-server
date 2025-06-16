import { getAllActivePrompts } from './src/database.js';

// 模拟全局变量
let loadedPrompts = [];

// 复制服务器中的 convertDbPromptToStandard 函数
function convertDbPromptToStandard(dbPrompt) {
  let parsedArguments = [];
  
  if (dbPrompt.arguments) {
    try {
      if (typeof dbPrompt.arguments === 'string') {
        if (dbPrompt.arguments.startsWith('[') || dbPrompt.arguments.startsWith('{')) {
          parsedArguments = JSON.parse(dbPrompt.arguments);
        } else {
          const tags = dbPrompt.arguments.split(',').map(tag => tag.trim()).filter(tag => tag);
          parsedArguments = [];
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
    description: dbPrompt.description || `从数据库加载的提示词: ${dbPrompt.name || dbPrompt.title}` + (dbPrompt.category ? ` (分类: ${dbPrompt.category})` : ''),
    arguments: parsedArguments,
    content: dbPrompt.content,
    category: dbPrompt.category,
    usage_count: dbPrompt.usage_count || 0,
    likes_count: dbPrompt.likes_count || 0,
    favorites_count: dbPrompt.favorites_count || 0,
    difficulty_level: dbPrompt.difficulty_level,
    hotness: dbPrompt.hotness || 0,
    created_at: dbPrompt.created_at,
    tags: dbPrompt.arguments
  };
}

// 复制服务器中的 loadPromptsFromDatabase 函数
async function loadPromptsFromDatabase() {
  try {
    console.log('🔄 Loading prompts from database...');
    
    // 获取所有活跃的prompts
    const dbPrompts = await getAllActivePrompts();
    console.log(`   📊 从数据库获取到 ${dbPrompts.length} 个提示词`);
    
    // 转换为标准格式
    const convertedPrompts = dbPrompts.map(convertDbPromptToStandard);
    console.log(`   🔄 转换完成，共 ${convertedPrompts.length} 个提示词`);
    
    // 按热度和使用量排序
    convertedPrompts.sort((a, b) => {
      const scoreA = (a.hotness || 0) * 2 + (a.usage_count || 0) + (a.likes_count || 0);
      const scoreB = (b.hotness || 0) * 2 + (b.usage_count || 0) + (b.likes_count || 0);
      return scoreB - scoreA;
    });
    console.log(`   📈 排序完成`);
    
    loadedPrompts = convertedPrompts;
    console.log(`   ✅ loadedPrompts 变量已赋值，长度: ${loadedPrompts.length}`);
    
    console.log(`✅ Successfully loaded ${loadedPrompts.length} prompts from database`);
    
    return loadedPrompts;
  } catch (error) {
    console.error('❌ Error loading prompts from database:', error);
    return [];
  }
}

// 模拟 list_prompts 工具的逻辑
async function testListPromptsLogic(args = {}) {
  console.log('\n🧪 测试 list_prompts 工具逻辑...');
  console.log(`   📊 loadedPrompts.length = ${loadedPrompts.length}`);
  
  try {
    let filteredPrompts = loadedPrompts;
    console.log(`   📊 初始 filteredPrompts.length = ${filteredPrompts.length}`);
    
    // 按分类筛选
    if (args.category) {
      filteredPrompts = loadedPrompts.filter(p => 
        p.category && p.category.toLowerCase().includes(args.category.toLowerCase())
      );
      console.log(`   📊 按分类"${args.category}"筛选后: ${filteredPrompts.length} 个`);
    }
    
    const limit = args.limit || 50;
    const limitedPrompts = filteredPrompts.slice(0, limit);
    console.log(`   📊 限制到 ${limit} 个后: ${limitedPrompts.length} 个`);
    
    const promptList = limitedPrompts.map((p, index) => {
      return `${index + 1}. 📝 ${p.name} ${p.category ? `[${p.category}]` : ''} (🔥${p.hotness || 0})`;
    });
    
    const categoryInfo = args.category ? ` (分类: ${args.category})` : '';
    const result = `📋 提示词列表${categoryInfo} (显示${limitedPrompts.length}个，共${filteredPrompts.length}个):\n\n${promptList.join('\n')}\n\n💡 使用 get_prompt_info 获取详细信息，使用 use_prompt 调用提示词`;
    
    console.log('\n   🎯 工具输出结果:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ${result.split('\n').slice(0, 10).join('\n   ')}`);
    if (result.split('\n').length > 10) {
      console.log('   ... (更多内容)');
    }
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      promptCount: limitedPrompts.length,
      totalCount: filteredPrompts.length
    };
    
  } catch (error) {
    console.error('   ❌ 测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 主测试函数
async function debugServer() {
  console.log('🚀 开始调试服务器启动过程...\n');
  
  // 步骤1: 模拟数据加载
  console.log('1️⃣ 模拟 loadPromptsFromDatabase()...');
  await loadPromptsFromDatabase();
  
  // 步骤2: 检查全局变量状态
  console.log('\n2️⃣ 检查全局变量状态...');
  console.log(`   loadedPrompts 是否为数组: ${Array.isArray(loadedPrompts)}`);
  console.log(`   loadedPrompts 长度: ${loadedPrompts.length}`);
  if (loadedPrompts.length > 0) {
    console.log(`   第一个提示词名称: ${loadedPrompts[0].name}`);
    console.log(`   第一个提示词分类: ${loadedPrompts[0].category}`);
  }
  
  // 步骤3: 测试工具逻辑
  console.log('\n3️⃣ 测试工具逻辑...');
  const test1 = await testListPromptsLogic();
  console.log(`   测试结果: ${test1.success ? '✅ 成功' : '❌ 失败'}`);
  if (test1.success) {
    console.log(`   显示了 ${test1.promptCount} 个提示词，总共 ${test1.totalCount} 个`);
  }
  
  // 步骤4: 测试分类筛选
  console.log('\n4️⃣ 测试分类筛选...');
  const test2 = await testListPromptsLogic({ category: '创意', limit: 5 });
  console.log(`   测试结果: ${test2.success ? '✅ 成功' : '❌ 失败'}`);
  if (test2.success) {
    console.log(`   显示了 ${test2.promptCount} 个创意类提示词，总共 ${test2.totalCount} 个`);
  }
  
  console.log('\n🎯 调试完成！');
}

debugServer(); 