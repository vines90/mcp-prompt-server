import { spawn } from 'child_process';
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { ChildProcessTransport } from '@modelcontextprotocol/sdk/client/transport.js';

async function testMcpServer() {
  console.log('🔍 Starting MCP Server test...');
  
  // 启动MCP服务器进程
  const serverProcess = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // 创建传输层
  const transport = new ChildProcessTransport(serverProcess);
  
  // 创建MCP客户端
  const client = new McpClient({
    name: "mcp-test-client",
    version: "1.0.0"
  });
  
  try {
    // 连接到服务器
    await client.connect(transport);
    console.log('✅ Connected to MCP Server');
    
    // 获取可用工具列表
    const tools = await client.listTools();
    console.log(`\n📋 Available tools (${tools.tools.length}):`);
    
    // 显示前10个工具
    tools.tools.slice(0, 10).forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description || 'No description'}`);
    });
    
    if (tools.tools.length > 10) {
      console.log(`... and ${tools.tools.length - 10} more tools`);
    }
    
    // 测试一些管理工具
    console.log('\n🧪 Testing management tools...');
    
    // 测试获取统计信息
    if (tools.tools.find(t => t.name === 'get_database_stats')) {
      try {
        const statsResult = await client.callTool({ name: 'get_database_stats', arguments: {} });
        console.log('✅ get_database_stats:', statsResult.content[0].text.split('\n')[0]);
      } catch (error) {
        console.log('❌ get_database_stats failed:', error.message);
      }
    }
    
    // 测试获取prompt列表
    if (tools.tools.find(t => t.name === 'get_prompt_names')) {
      try {
        const namesResult = await client.callTool({ name: 'get_prompt_names', arguments: {} });
        const lines = namesResult.content[0].text.split('\n');
        console.log('✅ get_prompt_names:', lines[0]);
        console.log(`   Sample prompts: ${lines.slice(1, 4).join(', ')}...`);
      } catch (error) {
        console.log('❌ get_prompt_names failed:', error.message);
      }
    }
    
    // 测试搜索功能
    if (tools.tools.find(t => t.name === 'search_prompts')) {
      try {
        const searchResult = await client.callTool({ 
          name: 'search_prompts', 
          arguments: { query: 'AI' } 
        });
        const lines = searchResult.content[0].text.split('\n');
        console.log('✅ search_prompts (AI):', lines[0]);
      } catch (error) {
        console.log('❌ search_prompts failed:', error.message);
      }
    }
    
    console.log('\n🎉 MCP Server test completed successfully!');
    
  } catch (error) {
    console.error('❌ MCP Server test failed:', error);
  } finally {
    // 清理资源
    try {
      await client.close();
    } catch (e) {
      // 忽略关闭错误
    }
    
    // 终止服务器进程
    serverProcess.kill('SIGTERM');
    
    // 等待进程结束
    await new Promise((resolve) => {
      serverProcess.on('exit', resolve);
      setTimeout(resolve, 2000); // 超时保护
    });
  }
}

// 运行测试
testMcpServer().catch(console.error); 