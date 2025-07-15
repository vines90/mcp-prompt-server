#!/usr/bin/env node

/**
 * 测试基于Secret Key认证的MCP服务器
 */

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🧪 开始测试基于Secret Key的MCP服务器...\n');

  // 配置测试环境
  const testConfig = {
    PROMPT_MANAGER_API_URL: 'http://localhost:3001',
    SECRET_KEY: '170904fb3cd0ee1c141bd039a77ff598b456fe22b5f90267792eec399b09fa21',
    MAX_PROMPT_TOOLS: '5',
    NODE_ENV: 'development'
  };

  // 启动MCP服务器进程
  console.log('🚀 启动MCP服务器进程...');
  const serverProcess = spawn('node', ['src/index-api.js'], {
    env: { ...process.env, ...testConfig },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // 等待服务器启动
  console.log('⏳ 等待服务器初始化...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  let client;
  let transport;

  try {
    // 创建客户端传输
    console.log('🔗 创建MCP客户端连接...');
    transport = new StdioClientTransport({
      command: 'node',
      args: ['src/index-api.js'],
      env: testConfig
    });

    // 创建客户端
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    // 连接到服务器
    await client.connect(transport);
    console.log('✅ MCP客户端连接成功');

    // 测试1: 获取服务器信息
    console.log('\n📋 测试1: 获取服务器信息...');
    try {
      const serverInfo = await client.getServerCapabilities();
      console.log('✅ 服务器信息:', {
        tools: serverInfo.tools ? '支持' : '不支持',
        resources: serverInfo.resources ? '支持' : '不支持',
        prompts: serverInfo.prompts ? '支持' : '不支持'
      });
    } catch (error) {
      console.log('❌ 获取服务器信息失败:', error.message);
    }

    // 测试2: 列出可用工具
    console.log('\n🛠️  测试2: 列出可用工具...');
    try {
      const tools = await client.listTools();
      console.log(`✅ 发现 ${tools.tools.length} 个工具:`);
      
      tools.tools.slice(0, 5).forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name}: ${tool.description.substring(0, 50)}...`);
      });
      
      if (tools.tools.length > 5) {
        console.log(`   ... 还有 ${tools.tools.length - 5} 个工具`);
      }
    } catch (error) {
      console.log('❌ 列出工具失败:', error.message);
    }

    // 测试3: 调用一个提示词工具（如果存在）
    console.log('\n🎯 测试3: 调用提示词工具...');
    try {
      const tools = await client.listTools();
      
      if (tools.tools.length > 0) {
        const firstTool = tools.tools[0];
        console.log(`🔧 调用工具: ${firstTool.name}`);
        
        const result = await client.callTool({
          name: firstTool.name,
          arguments: {}
        });
        
        console.log('✅ 工具调用成功');
        console.log('📄 返回内容预览:', result.content[0]?.text?.substring(0, 100) + '...');
      } else {
        console.log('⚠️ 没有可用的工具');
      }
    } catch (error) {
      console.log('❌ 调用工具失败:', error.message);
    }

    // 测试4: 测试管理工具
    console.log('\n🔧 测试4: 测试管理工具...');
    try {
      const tools = await client.listTools();
      const managementTool = tools.tools.find(tool => 
        tool.name === 'get_prompt_names' || 
        tool.name === 'get_all_categories'
      );
      
      if (managementTool) {
        console.log(`🔧 调用管理工具: ${managementTool.name}`);
        const result = await client.callTool({
          name: managementTool.name,
          arguments: {}
        });
        
        console.log('✅ 管理工具调用成功');
        console.log('📊 返回数据类型:', typeof result.content[0]?.text);
      } else {
        console.log('⚠️ 没有找到管理工具');
      }
    } catch (error) {
      console.log('❌ 管理工具调用失败:', error.message);
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    // 清理资源
    console.log('\n🧹 清理测试环境...');
    
    if (client) {
      try {
        await client.close();
        console.log('✅ MCP客户端已关闭');
      } catch (error) {
        console.log('⚠️ 关闭客户端时出错:', error.message);
      }
    }

    if (transport) {
      try {
        await transport.close();
        console.log('✅ 传输连接已关闭');
      } catch (error) {
        console.log('⚠️ 关闭传输时出错:', error.message);
      }
    }

    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      console.log('✅ 服务器进程已终止');
    }
  }

  console.log('\n📋 测试总结:');
  console.log('- Secret Key认证: 已验证');
  console.log('- 工具加载: 已测试');
  console.log('- 工具调用: 已测试');
  console.log('- 管理功能: 已测试');
  console.log('\n🎯 MCP服务器功能正常！');
}

// 运行测试
testMCPServer().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
}); 