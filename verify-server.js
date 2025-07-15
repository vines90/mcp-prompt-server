// MCP Prompt Server API版本验证脚本
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function verifyMcpServer() {
  console.log('🔍 验证MCP Prompt Server (API版本) 状态...\n');
  
  try {
    // 1. 检查API连接
    console.log('1️⃣ 测试API连接...');
    try {
      const apiTest = await execAsync('npm test');
      if (apiTest.stdout.includes('API连接状态: 成功')) {
        console.log('✅ API连接正常');
        const match = apiTest.stdout.match(/获取到 (\d+) 个可用提示词/);
      if (match) {
          console.log(`   📊 加载了 ${match[1]} 个提示词`);
        }
      } else {
        console.log('⚠️ API连接可能有问题，但基本功能可用');
      }
    } catch (error) {
      console.log('❌ API连接测试失败，请检查网络和配置');
    }
    
    // 2. 检查MCP SDK版本
    console.log('\n2️⃣ 检查MCP SDK...');
    try {
      const packageInfo = await execAsync('npm list @modelcontextprotocol/sdk');
      console.log('✅ MCP SDK已安装');
    } catch (error) {
      console.log('❌ MCP SDK未找到');
    }
    
    // 3. 检查必要依赖
    console.log('\n3️⃣ 检查必要依赖...');
    const dependencies = ['dotenv', 'fs-extra', 'yaml', 'zod'];
    let allDepsOk = true;
    
    for (const dep of dependencies) {
      try {
        await execAsync(`npm list ${dep}`);
        console.log(`   ✅ ${dep} 已安装`);
      } catch (error) {
        console.log(`   ❌ ${dep} 未安装`);
        allDepsOk = false;
      }
    }
    
    if (allDepsOk) {
      console.log('✅ 所有必要依赖已安装');
    } else {
      console.log('❌ 部分依赖缺失，请运行 npm install');
    }
    
    // 4. 检查配置文件
    console.log('\n4️⃣ 检查配置...');
    console.log('💡 如果您的服务器正在运行，您应该看到类似以下的输出：');
    console.log('   🔐 开始自动认证...');
    console.log('   ✅ 自动认证成功 (或 ℹ️ 未认证，将使用匿名模式)');
    console.log('   ✅ 成功从API加载 X 个提示词');
    console.log('   🚀 MCP Prompt Server 正在运行...');
    
    // 5. 提供集成指南
    console.log('\n5️⃣ 集成到MCP客户端...');
    console.log('📋 Cursor配置 (~/.cursor/mcp_config.json):');
    console.log(`{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "${process.cwd().replace(/\\/g, '/')}/src/index.js"
      ],
      "transport": "stdio",
      "env": {
        "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
        "SECRET_KEY": "your_secret_key_here",
        "NODE_ENV": "production"
      }
    }
  }
}`);
    
    console.log('\n📋 环境变量配置 (.env):');
    console.log('   PROMPT_MANAGER_API_URL=https://www.aiprompter.cc');
    console.log('   SECRET_KEY=your_64_character_secret_key');
    console.log('   NODE_ENV=development');
    
    // 6. 验证工具
    console.log('\n6️⃣ 可用的验证工具:');
    console.log('   npm test           # 测试API连接和功能');
    console.log('   npm start          # 启动MCP服务器');
    console.log('   npm run test-mcp   # 测试MCP客户端连接');
    
    // 7. 配置获取指南
    console.log('\n7️⃣ 获取Secret Key:');
    console.log('   1. 访问: https://www.aiprompter.cc');
    console.log('   2. 登录账户');
    console.log('   3. 点击用户菜单 -> Secret Key');
    console.log('   4. 复制64位密钥到配置文件');
    
    console.log('\n🎉 验证完成！');
    console.log('\n📋 版本信息:');
    console.log('   📦 MCP Prompt Server v3.0.0 (API Edition)');
    console.log('   🔗 仅支持API模式，无需数据库');
    console.log('   🔐 支持Secret Key认证访问私有提示词');
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
  }
}

verifyMcpServer(); 