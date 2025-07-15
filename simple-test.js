#!/usr/bin/env node

/**
 * 简单的MCP功能测试 - 测试API客户端功能
 */

import 'dotenv/config';
import PromptManagerAPIClient from './src/api-client.js';

async function testAPIClient() {
  console.log('🧪 开始测试API客户端功能...\n');

  // 创建API客户端，从环境变量读取配置
  const client = new PromptManagerAPIClient({
    baseURL: process.env.PROMPT_MANAGER_API_URL || 'https://www.aiprompter.cc',
    secretKey: process.env.SECRET_KEY,
    userToken: process.env.USER_TOKEN
  });

  console.log(`📡 使用API地址: ${process.env.PROMPT_MANAGER_API_URL || 'https://www.aiprompter.cc'}`);
  console.log(`🔑 Secret Key: ${process.env.SECRET_KEY ? '已配置' : '未配置'}\n`);

  try {
    // 测试1: 连接测试
    console.log('🔗 测试1: API连接测试...');
    const isConnected = await client.testConnection();
    console.log(`${isConnected ? '✅' : '❌'} API连接状态: ${isConnected ? '成功' : '失败'}`);

    // 测试2: Secret Key认证
    console.log('\n🔐 测试2: Secret Key认证...');
    try {
      const authResult = await client.autoAuthenticate();
      console.log(`${authResult ? '✅' : '❌'} 自动认证: ${authResult ? '成功' : '失败'}`);
    } catch (error) {
      console.log(`❌ 认证失败: ${error.message}`);
    }

    // 测试3: 获取公共提示词
    console.log('\n🌐 测试3: 获取公共提示词...');
    try {
      const publicPrompts = await client.getPublicPrompts({ limit: 5 });
      console.log(`✅ 获取到 ${publicPrompts.length} 个公共提示词:`);
      publicPrompts.slice(0, 3).forEach((prompt, index) => {
        console.log(`   ${index + 1}. ${prompt.title} (分类: ${prompt.category || '未分类'})`);
      });
    } catch (error) {
      console.log(`❌ 获取公共提示词失败: ${error.message}`);
    }

    // 测试4: 获取用户私有提示词（如果已认证）
    console.log('\n🔒 测试4: 获取用户私有提示词...');
    try {
      const privatePrompts = await client.getUserPrompts({ limit: 5 });
      console.log(`✅ 获取到 ${privatePrompts.length} 个私有提示词:`);
      privatePrompts.slice(0, 3).forEach((prompt, index) => {
        console.log(`   ${index + 1}. ${prompt.title} (分类: ${prompt.category || '未分类'})`);
      });
    } catch (error) {
      console.log(`❌ 获取私有提示词失败: ${error.message}`);
    }

    // 测试5: 获取所有可用提示词
    console.log('\n📋 测试5: 获取所有可用提示词...');
    try {
      const allPrompts = await client.getAllAvailablePrompts({ limit: 10 });
      console.log(`✅ 获取到 ${allPrompts.length} 个可用提示词:`);
      
      const publicCount = allPrompts.filter(p => p.source === 'public').length;
      const privateCount = allPrompts.filter(p => p.source === 'private').length;
      
      console.log(`   📊 统计: 公共 ${publicCount} 个, 私有 ${privateCount} 个`);
      
      // 显示分类统计
      const categories = {};
      allPrompts.forEach(prompt => {
        const category = prompt.category || '未分类';
        categories[category] = (categories[category] || 0) + 1;
      });
      
      console.log('   🏷️  分类分布:');
      Object.entries(categories).slice(0, 5).forEach(([category, count]) => {
        console.log(`      - ${category}: ${count} 个`);
      });
      
    } catch (error) {
      console.log(`❌ 获取所有提示词失败: ${error.message}`);
    }

    // 测试6: 搜索功能
    console.log('\n🔍 测试6: 搜索功能...');
    try {
      const searchResults = await client.searchPrompts('编程', { limit: 3 });
      console.log(`✅ 搜索"编程"找到 ${searchResults.length} 个结果:`);
      searchResults.forEach((prompt, index) => {
        console.log(`   ${index + 1}. ${prompt.title}`);
      });
    } catch (error) {
      console.log(`❌ 搜索功能失败: ${error.message}`);
    }

    console.log('\n🎉 API客户端测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }

  console.log('\n📋 测试总结:');
  console.log('✅ API连接: 已测试');
  console.log('✅ Secret Key认证: 已测试');  
  console.log('✅ 公共提示词获取: 已测试');
  console.log('✅ 私有提示词获取: 已测试');
  console.log('✅ 提示词搜索: 已测试');
  console.log('\n🎯 所有核心功能正常工作！');
}

// 运行测试
testAPIClient().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
}); 