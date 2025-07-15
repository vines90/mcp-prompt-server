# MCP Prompt Server

## Have You Experienced These Pain Points?

Ever found yourself with a collection of prompts but struggling to remember when to use them?

Tired of copying and pasting prompts every time you need them?

Some people store prompts in AI programming tools' Rules, which solves part of the problem.

But what if we could turn common prompts into MCP tools?

By designing prompt templates as tools, we can invoke various prompts through natural language conversations.

After searching online, I found a similar MCP project at:
https://github.com/gdli6177/mcp-prompt-server

I forked it and customized my commonly used prompts - the results are amazing!

## The Magic of This MCP

No more copying and pasting lengthy prompts.

Just use natural language conversations to automatically:
- Generate visualized web pages
- Design PRDs
- Create catchy titles
- And much more...

AI automatically finds and uses the appropriate prompt.

Works with any MCP-supported tool like Raycast, Cursor, Windsurf, Cherrystudio, etc.

**Example with Raycast**

@prompt Design a product prototype and write a PRD

![](https://img.t5t6.com/1747729312139-9472ed65-469e-46a6-b620-1187b089a0e3.png)

You can even combine multiple MCP tools for complex workflows.

Here's me asking AI to generate WeChat article titles based on content I'm browsing:
![](https://img.t5t6.com/1747729449379-4a37c8ec-a1b6-4baa-b446-5782bdf4f82f.png)

---

## Main Features

- 📦 **Rich Prompt Templates**: Built-in high-quality prompts for code, writing, product, knowledge cards, web page generation, structured summarization, and more.
- 🛠️ **Plug-and-Play MCP Tools**: All prompts are auto-registered as MCP tools, support parameterized calls, and are compatible with mainstream editors.
- 🔄 **Hot Reload & Management**: Instantly reload new prompts without restarting the server.
- 🧩 **Easy Extension**: Add new YAML/JSON files to expand features, no need to modify core code.
- 🏷️ **Multi-language & Multi-domain**: Suitable for Chinese/English content, product, education, media, AI, and more.

---

## Directory Structure

```
mcp-prompt-server/
├── package.json
├── src/
│   ├── index.js                # Server entry point
│   └── prompts/                # All prompt templates
│       ├── gen_summarize.yaml
│       ├── gen_title.yaml
│       ├── gen_html_web_page.yaml
│       ├── gen_3d_webpage_html.yaml
│       ├── gen_bento_grid_html.yaml
│       ├── gen_knowledge_card_html.yaml
│       ├── gen_magazine_card_html.yaml
│       ├── gen_prd_prototype_html.yaml
│       ├── ...                # More prompt templates
│   └── MorePrompts/           # Optional extra prompts
└── README.md
```

---

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   ```bash
   npm start
   ```

   The MCP Prompt Server will automatically load all prompt templates in `src/prompts/` and expose them as MCP tools.

---

## How to Use

### Tool Integration

#### Raycast

1. In Raycast, search for `install server (MCP)`

   ![](https://img.t5t6.com/1747728547294-26c78178-6e42-4e02-a7f3-c9bd9cdbc1fe.png)

2. Give your MCP a simple name, e.g. `prompt` (easy to @ in the future)
3. Command: `node`
4. Argument: your `index.js` path

   ![](https://img.t5t6.com/1747728622599-82551d14-937b-4e7c-9429-68d72b7036ce.png)

5. Save and Raycast will auto-integrate MCP Prompt Server.

##### Notes
- When adding new prompts, you can copy an existing template and let AI help generate a YAML file.
- **In the template, `arguments: []` must be empty or all parameters set as not required (`false`), otherwise Raycast will throw an error.**
- If you encounter errors, search "manage server (MCP)" in Raycast to uninstall and reinstall.
- Each time you add a new prompt, you need to uninstall and reinstall MCP in Raycast (no better solution yet).

---

#### Cursor

- Edit `~/.cursor/mcp_config.json` and add the following (replace the path with your actual project path):

  ```json
  {
    "servers": [
      {
        "name": "Prompt Server",
        "command": "node",
        "args": [
          "/your/actual/path/mcp-prompt-server/src/index.js"
        ],
        "transport": "stdio"
      }
    ]
  }
  ```

- Save and restart Cursor. All prompt tools will appear in the tool panel.

#### Windsurf

- Edit `~/.codeium/windsurf/mcp_config.json` and add:

  ```json
  {
    "mcpServers": {
      "prompt-server": {
        "command": "node",
        "args": ["/path/to/mcp-prompt-server/src/index.js"],
        "transport": "stdio"
      }
    }
  }
  ```

- Refresh Windsurf settings. Prompt Server will be available immediately.

#### Trae

- Edit the configuration file and add:

  ```json
  {
    "mcpServers": {
      "Prompt Server": {
        "command": "node",
        "args": [
          "/your/actual/path/mcp-prompt-server/src/index.js"
        ]
      }
    }
  }
  ```

- Save and restart Trae to apply changes.

---

## How to Extend Prompts

1. **Create a new YAML or JSON file** in the `src/prompts/` directory.
2. **Template example**:

   ```yaml
   name: your_prompt_name
   description: What this prompt does
   arguments: []
   messages:
     - role: user
       content:
         type: text
         text: |
           Your prompt content, supports parameter placeholders like {{param}}
   ```

3. **Hot reload prompts**  
   - Use the `reload_prompts` tool in your editor, or restart the server.

---

## Management & Debugging

- `reload_prompts`: Hot reload all prompt templates
- `get_prompt_names`: List all available prompt names

---

## Advanced Usage & Extension

- Supports multi-turn dialogue prompts, complex parameters, cross-language content, data visualization, and more
- You can copy templates from `src/prompts/MorePrompts/` to the main directory to enable them

---

## FAQ

- **Prompt not working?**  
  Check YAML format, unique name field, and reload or restart the service.
- **Parameters not working?**  
  Ensure the `arguments` field is correct and parameters are passed properly.

---

## Contribution & Feedback

- Contributions, new prompts, suggestions, and bug reports are welcome!
- Contact: Xiangyang Qiaomu

---

## License

MIT

---

For further customization, batch prompt generation, or enterprise integration, feel free to contact the author or submit an issue! 