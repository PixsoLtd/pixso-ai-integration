# Pixso AI Integration

Pixso AI Integration 是面向 Claude Code、Cursor 和 Gemini CLI 的 Pixso 本地 AI 插件。安装后，你可以让本地 agent 读取 Pixso 设计、生成代码、把网页导入 Pixso、编辑设计稿，或生成 Design-to-Code 组件解析配置。

Codex 用户请使用专用仓库：[PixsoLtd/pixso-ai-integration-codex](https://github.com/PixsoLtd/pixso-ai-integration-codex)。

## 前置要求

1. 安装 Pixso Desktop。
2. 打开需要操作的 Pixso 文件。
3. 启动 Pixso MCP 服务，默认地址为：

```text
http://localhost:3667/mcp
```

4. 安装目标本地 agent：
   - Claude Code
   - Cursor
   - Gemini CLI

如果 Pixso MCP 地址不是默认值，需要同步修改本仓库中的 `.mcp.json`；Gemini CLI 用户还需要修改 `gemini-extension.json`。

## 获取插件

```bash
git clone https://github.com/PixsoLtd/pixso-ai-integration.git
cd pixso-ai-integration
```

后续示例中的 `<repo>` 指这个仓库目录。

## Claude Code

启动 Claude Code 时加载本地插件目录：

```bash
claude --plugin-dir <repo>
```

Windows PowerShell 示例：

```powershell
claude --plugin-dir "D:\AI\pixso-ai-integration"
```

进入 Claude Code 后可以检查插件和 MCP 状态：

```text
/plugin
/mcp
```

更新插件：

```bash
cd <repo>
git pull
claude --plugin-dir <repo>
```

更新后需要重新启动 Claude Code 会话。

## Cursor

安装方式：

1. 打开 Cursor 设置。
2. 进入 Plugins / 插件相关页面。
3. 选择从本地目录安装或添加插件。
4. 指向 `pixso-ai-integration` 仓库根目录。
5. 重启或刷新 Cursor，使插件配置重新加载。

如果你的 Cursor 版本要求单独启用第三方插件或 MCP，请在设置里开启后再重启 Cursor。

更新插件：

```bash
cd <repo>
git pull
```

然后在 Cursor 中重新加载本地插件，或移除后重新添加同一个本地目录。

## Gemini CLI

从 GitHub 安装：

```bash
gemini extensions install https://github.com/PixsoLtd/pixso-ai-integration
```

从本地目录安装：

```bash
gemini extensions install <repo>
```

本地调试时可以直接 link：

```bash
gemini extensions link <repo>
```

检查安装结果：

```bash
gemini extensions list
```

更新插件：

```bash
gemini extensions update Pixso
```

如果 `gemini extensions list` 显示的名称不是 `Pixso`，以列表中的实际名称为准。link 模式下，执行 `git pull` 后重启 Gemini CLI 会话即可。

## 可以怎么用

安装后，可以直接用自然语言让本地 agent 调用 Pixso。

### 设计转代码

```text
Use Pixso to convert this selected frame to React code and save all generated assets locally.
```

也可以提供 Pixso URL：

```text
Convert this Pixso URL to Vue code: <Pixso node URL>
```

### 网页或 HTML 导入 Pixso

```text
Import this page into Pixso as editable design nodes: https://example.com
```

如果页面需要登录、权限、区域访问或资源不可抓取，agent 会先说明阻塞点，不会自动降级成近似重建设计。

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

或直接描述需求：

```text
Generate componentParsers for the current Pixso component library and Element Plus.
```

## 常见问题

### 插件加载了，但 Pixso 工具不可用

检查 Pixso MCP 是否启动：

```powershell
Invoke-WebRequest -UseBasicParsing -Method Head -Uri "http://localhost:3667/mcp"
```

如果请求失败，先启动 Pixso Desktop，并确认 MCP 服务已开启。

### 修改 MCP 端口后没有生效

确认修改了当前 agent 使用的配置文件，并重启或重新加载插件：

| Agent | 配置文件 |
| --- | --- |
| Claude Code | `.mcp.json` |
| Cursor | `.mcp.json` |
| Gemini CLI | `gemini-extension.json` |

### 看不到 `/pixso-d2c-plus-config`

通常是插件缓存或旧会话导致。更新插件后，重启当前 agent；Gemini CLI install 模式还需要运行 `gemini extensions update Pixso`。

## 参考

- [Claude Code plugins](https://code.claude.com/docs/en/plugins)
- [Cursor plugins specification](https://github.com/cursor/plugins)
- [Gemini CLI extensions](https://google-gemini.github.io/gemini-cli/docs/extensions/)
