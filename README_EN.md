# MCP Prompt Server

API-based Model Context Protocol (MCP) Prompt Server v3.0.0

## 🎯 Overview

MCP Prompt Server is a high-performance MCP server that fetches and manages prompts via API, providing rich prompt libraries for AI programming tools like Cursor and Windsurf.

## ✨ Core Features

- 🔗 **API-Driven**: Fetch 1000+ prompts via HTTP API, no local database required
- 🔐 **Multi-Authentication**: Support Secret Key, JWT Token, username/password authentication
- 👤 **Private Prompts**: Authenticated users can access personal exclusive prompt libraries
- 🚀 **Smart Limiting**: Automatically limit tool count for optimized performance
- 🔥 **Hotness Ranking**: Prioritize loading popular and high-quality prompts
- 📂 **Category Management**: Organize prompts by categories for easy search and use
- 🔄 **Fault Tolerance**: Auto-fallback to local file system when API fails
- 🛠️ **Rich Tools**: Provide search, categorization, statistics and other management tools

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Authentication (Optional)
Create `.env` file:
```bash
# API Server URL
PROMPT_MANAGER_API_URL=https://www.aiprompter.cc

# Method 1: Secret Key Authentication (Recommended)
SECRET_KEY=your_64_character_secret_key_here

# Method 2: Username/Password Authentication
# USERNAME=your_username
# PASSWORD=your_password

# Method 3: JWT Token Authentication
# USER_TOKEN=your_jwt_token_here

# Tool count limit (optional, default 25)
MAX_PROMPT_TOOLS=25
```

### 3. Start Server
```bash
npm start
```

### 4. Integrate with Cursor
Edit `~/.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-prompt-server/src/index.js"
      ],
      "transport": "stdio",
      "env": {
        "PROMPT_MANAGER_API_URL": "https://www.aiprompter.cc",
        "SECRET_KEY": "your_secret_key_here",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🔐 Authentication Configuration

### Secret Key Authentication (Recommended)
1. Login to [AI Prompter Website](https://www.aiprompter.cc)
2. Go to User Menu -> Secret Key
3. Copy the 64-character key to configuration file

**Advantages:**
- 🔒 High security, no password exposure
- 🔄 Support refresh and revoke anytime
- 📝 Access to private prompts

### Anonymous Mode
Automatically use anonymous mode when no authentication configured, only public prompts accessible.

## ⚙️ Configuration Options

### Server Configuration
```bash
# API Server URL
PROMPT_MANAGER_API_URL=https://www.aiprompter.cc

# Secret Key Authentication (Recommended)
SECRET_KEY=your_64_character_secret_key_here

# Environment Mode
NODE_ENV=development  # Development mode, detailed logs
NODE_ENV=production   # Production mode, simplified logs
```

**Performance Features:**
- 🎯 **Fixed Tool Count**: Constant 8 management tools, no performance bottlenecks
- ⚡ **Efficient Architecture**: No longer dynamically generate tools, fast startup
- 🔄 **On-Demand Retrieval**: Find and retrieve prompts as needed through management tools

### Tool Name Normalization
Auto-clean tool names for MCP compatibility:
- Special characters converted to underscores
- Chinese words auto-converted to English
- Duplicate names auto-deduplicated

## 🛠️ Available Tools

### Management Tools (8 tools)
Only provide management tools, no longer create individual tools for each prompt, ensuring optimal performance:

**Query Tools**:
1. `search_prompts` - Search prompts (by keyword)
2. `get_all_categories` - Get all categories
3. `get_prompts_by_category` - Get prompts by category
4. `get_prompt_info` - Get prompt detailed information

**Operation Tools**:
5. `add_prompt` - Add new prompt to personal library
6. `update_prompt` - Update existing prompt

**System Tools**:
7. `get_api_stats` - Get API service statistics
8. `user_login` - User login authentication

## 🔧 Testing and Verification

### Test API Connection
```bash
npm test
```

### Verify Server Configuration
```bash
npm run verify
```

### Test MCP Protocol
```bash
npm run test-mcp
```

## 📊 Performance Optimization

### Smart Features
- 🎯 **Hotness Ranking**: Prioritize loading popular prompts
- 🔄 **Smart Caching**: Reduce API request frequency
- ⚡ **Concurrency Control**: Optimize network request performance
- 🛡️ **Error Recovery**: Auto-retry and fallback mechanisms

### Network Optimization
- 📍 Use nearby API servers
- ⏱️ Configure appropriate timeout
- 🔄 Smart retry strategy

## 🔥 Advanced Features

### Private Prompt Support
- 👤 Personal exclusive prompt library
- 🔐 User permission-based access control
- 🔄 Real-time sync with website data

### Smart Search
- 🔍 Search by name, content, description
- 📂 Category filtering
- 🎯 User preference-based recommendations

### Usage Statistics
- 📈 Auto-record usage count
- 🏆 Popular prompts ranking
- 📊 Personal usage reports

## 🐛 Troubleshooting

### Common Issues

**API Connection Failed**
```bash
# Check network connection
curl https://www.aiprompter.cc/api/health

# Verify API URL configuration
echo $PROMPT_MANAGER_API_URL
```

**Authentication Failed**
```bash
# Verify Secret Key
curl -X PUT "https://www.aiprompter.cc/api/user/secret-key" \
  -H "X-Secret-Key: YOUR_SECRET_KEY"
```

**Tool Loading Failed**
- Check tool count limit configuration
- Verify network connection stability
- Check console error logs

## 📈 Version History

### v3.0.0 (API Edition)
- 🔄 Complete migration to API architecture
- 🔐 New Secret Key authentication system
- 👤 Support user private prompts
- ⚡ Optimized performance and error handling
- 🗑️ Removed database dependencies

### v2.0.0 (Database Edition)
- 📊 PostgreSQL database support
- 🎯 Hotness ranking algorithm
- 🛠️ Rich management tools

### v1.0.0 (File Edition)
- 📁 Basic file system version
- 📄 YAML/JSON format support

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this project!

### Development Process
1. Fork project
2. Create feature branch
3. Commit changes
4. Create Pull Request

## 📞 Support & Feedback

- 🌐 **Website**: https://www.aiprompter.cc
- 💬 **WeChat Group**: Scan QR code on website to join
- 🐛 **Issue Reports**: Via GitHub Issues

## 📄 License

MIT License
