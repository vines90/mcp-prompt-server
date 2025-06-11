// 简单的MCP服务器验证脚本
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function verifyMcpServer() {
  console.log('🔍 验证MCP服务器状态...\n');
  
  try {
    // 1. 检查数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const dbTest = await execAsync('node test-db.js');
    if (dbTest.stdout.includes('Successfully loaded')) {
      console.log('✅ 数据库连接正常');
      const match = dbTest.stdout.match(/Successfully loaded (\d+) prompts/);
      if (match) {
        console.log(`   📊 加载了 ${match[1]} 个prompts`);
      }
    } else {
      console.log('❌ 数据库连接失败');
    }
    
    // 2. 检查MCP SDK版本
    console.log('\n2️⃣ 检查MCP SDK...');
    try {
      const packageInfo = await execAsync('npm list @modelcontextprotocol/sdk');
      console.log('✅ MCP SDK已安装');
    } catch (error) {
      console.log('❌ MCP SDK未找到');
    }
    
    // 3. 检查服务器进程
    console.log('\n3️⃣ 检查服务器状态...');
    console.log('💡 如果您的服务器正在运行，您应该看到类似以下的输出：');
    console.log('   ✅ Database connection established successfully');
    console.log('   ✅ Successfully loaded X prompts from database');
    console.log('   🚀 MCP Prompt Server (Database Edition) is running...');
    
    // 4. 提供集成指南
    console.log('\n4️⃣ 集成到MCP客户端...');
    console.log('📋 Cursor配置 (~/.cursor/mcp_config.json):');
    console.log(`{
  "mcpServers": {
    "prompt-server-db": {
      "command": "node",
      "args": [
        "${process.cwd().replace(/\\/g, '/')}/src/index.js"
      ],
      "transport": "stdio"
    }
  }
}`);
    
    console.log('\n📋 Raycast配置:');
    console.log('   名称: prompt-db');
    console.log('   Command: node');
    console.log(`   Arguments: ${process.cwd()}/src/index.js`);
    
    // 5. 验证工具
    console.log('\n5️⃣ 可用的验证工具:');
    console.log('   npm test           # 测试数据库连接');
    console.log('   npm run inspect    # 检查数据库结构');
    console.log('   npm run check      # 查看数据库内容');
    
    console.log('\n🎉 验证完成！');
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
  }
}

verifyMcpServer(); 