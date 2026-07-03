# Pixso AI Integration

Pixso AI Integration 是面向 Claude Code、Cursor 和 Gemini CLI 的本地 Pixso AI 插件包。它把 Pixso MCP、Design-to-Code、Code-to-Design、设计编辑和组件解析配置工作流打包成可被本地 AI agent 使用的 skills、commands 和 MCP 配置。

Codex 用户请使用专用仓库：[PixsoLtd/pixso-ai-integration-codex](https://github.com/PixsoLtd/pixso-ai-integration-codex)。

## 插件内容

```text
.claude-plugin/plugin.json     Claude Code plugin manifest
.cursor-plugin/plugin.json     Cursor plugin manifest
.github/plugin/plugin.json     Generic plugin manifest
gemini-extension.json          Gemini CLI extension manifest
.mcp.json                      Pixso MCP server config
commands/                      Slash command definitions
skills/                        Pixso workflows used by local agents
```

当前包含 4 个 skills：

| Skill | 用途 |
| --- | --- |
| `pixso-design-to-code` | 将 Pixso 节点、页面、组件或 URL 转成目标框架代码，并做资源本地化和安全 cleanup。 |
| `pixso-code-to-design` | 将网页 URL、HTML、ZIP 或静态 Web 产物导入 Pixso，优先走精确 capture + `code_to_design`。 |
| `pixso-design-editing` | 在 Pixso 内创建、修改、检查和优化 UI 设计稿。 |
| `pixso-component-config` | 生成或更新 Pixso Design-to-Code 的 `componentParsers` / component config JSON。 |

当前包含 1 个命令：

| Command | 用途 |
| --- | --- |
| `/pixso-d2c-plus-config` | 触发 `pixso-component-config`，生成或更新 Design-to-Code 组件解析配置。 |

## 前置要求

1. 安装 Pixso Desktop。
2. 打开目标 Pixso 文件。
3. 启动 Pixso MCP 服务，默认地址为：

```text
http://localhost:3667/mcp
```

4. 安装目标本地 agent：
   - Claude Code
   - Cursor
   - Gemini CLI

如果 Pixso MCP 地址不是默认值，请同步修改：

```text
.mcp.json
gemini-extension.json
```

## 获取插件

```bash
git clone https://github.com/PixsoLtd/pixso-ai-integration.git
cd pixso-ai-integration
```

后续示例中的 `<repo>` 指这个仓库目录。

## Claude Code 安装

Claude Code 支持用本地插件目录启动一个会话，适合本仓库这种本地插件包：

```bash
claude --plugin-dir <repo>
```

在 Windows PowerShell 中示例：

```powershell
claude --plugin-dir "D:\AI\pixso-ai-integration"
```

进入 Claude Code 后检查：

```text
/plugin
/mcp
```

你应该能看到 Pixso plugin 和 Pixso MCP server。

### Claude Code 校验

在仓库根目录运行：

```bash
claude plugin validate .
```

或：

```bash
npm run validate:claude
```

### Claude Code 更新

```bash
cd <repo>
git pull
claude --plugin-dir <repo>
```

重新启动 Claude Code 会话后，新版 skills 和 commands 才会被加载。

## Cursor 安装

Cursor 插件包入口是：

```text
.cursor-plugin/plugin.json
```

安装方式：

1. 打开 Cursor 设置。
2. 进入 Plugins / 插件相关页面。
3. 选择从本地目录安装或添加插件。
4. 指向本仓库根目录 `<repo>`，也就是包含 `.cursor-plugin/plugin.json` 的目录。
5. 重启或刷新 Cursor，使插件配置重新加载。

插件 manifest 会声明：

```text
skills: ./skills/
mcpServers: ./.mcp.json
commands: ./commands/*.md
```

### Cursor 配置检查

确认 Pixso MCP 配置指向：

```json
{
  "mcpServers": {
    "pixso": {
      "type": "http",
      "url": "http://localhost:3667/mcp"
    }
  }
}
```

如果你的 Cursor 版本要求在 UI 中单独启用第三方插件或 MCP，请在设置里开启后再重启 Cursor。

### Cursor 更新

```bash
cd <repo>
git pull
```

然后在 Cursor 里重新加载本地插件，或移除后重新添加同一个本地目录。

## Gemini CLI 安装

Gemini CLI extension 入口是：

```text
gemini-extension.json
```

从 GitHub 安装：

```bash
gemini extensions install https://github.com/PixsoLtd/pixso-ai-integration
```

从本地目录安装：

```bash
gemini extensions install <repo>
```

开发调试时可以直接 link 本地目录：

```bash
gemini extensions link <repo>
```

安装后检查：

```bash
gemini extensions list
```

### Gemini CLI 配置

`gemini-extension.json` 已声明：

```json
{
  "mcpServers": {
    "pixso": {
      "httpUrl": "http://localhost:3667/mcp"
    }
  }
}
```

如需改端口，更新 `gemini-extension.json` 后运行更新命令。

### Gemini CLI 更新

如果是 install 安装：

```bash
gemini extensions update Pixso
```

如果你的 Gemini CLI 对名称做了规范化，以 `gemini extensions list` 显示的名称为准。

如果是 link 安装：

```bash
cd <repo>
git pull
```

link 模式通常不需要重新 install，但建议重启 Gemini CLI 会话。

## 使用方式

插件安装后，可以直接用自然语言让本地 agent 调用 Pixso。

### 设计转代码

```text
Use Pixso to convert this selected frame to React code and save all generated assets locally.
```

也可以给 Pixso URL：

```text
Convert this Pixso URL to Vue code: <Pixso node URL>
```

### 网页或 HTML 导入 Pixso

```text
Import this page into Pixso as editable design nodes: https://example.com
```

如果页面需要登录、权限、区域访问或资源不可抓取，agent 会先报告阻塞点，不会自动降级成近似重建设计。

### Pixso 设计编辑

```text
Create a dashboard screen in the current Pixso file using the existing design tokens and components.
```

```text
Refine the selected Pixso frame: improve spacing, hierarchy, and visual consistency.
```

### 组件解析配置

使用命令：

```text
/pixso-d2c-plus-config
```

或直接说：

```text
Use pixso-component-config to generate componentParsers for the current Pixso component library and Element Plus.
```

## 常见问题

### 插件加载了，但 Pixso 工具不可用

检查 Pixso MCP 是否启动：

```powershell
Invoke-WebRequest -UseBasicParsing -Method Head -Uri "http://localhost:3667/mcp"
```

如果请求失败，先启动 Pixso Desktop 并确认 MCP 服务已开启。

### 修改 MCP 端口后没有生效

同时检查对应 agent 使用的配置文件：

| Agent | 配置文件 |
| --- | --- |
| Claude Code | `.mcp.json` |
| Cursor | `.mcp.json` |
| Gemini CLI | `gemini-extension.json` |

修改后重启本地 agent。

### 看不到 `/pixso-d2c-plus-config`

确认 agent 已重新加载插件，并且插件加载的是最新仓库目录。Claude Code 和 Cursor 通常需要重启会话；Gemini CLI install 模式需要运行 `gemini extensions update Pixso`。

## 参考

- Claude Code 插件文档：[Create plugins](https://code.claude.com/docs/en/plugins)
- Cursor plugins specification：[cursor/plugins](https://github.com/cursor/plugins)
- Gemini CLI extensions：[Gemini CLI Extensions](https://google-gemini.github.io/gemini-cli/docs/extensions/)
