# Pixso AI Integration

This repository is a Figma-style Pixso plugin package. The repository root is the installable artifact for Claude Code, Cursor, and Codex-compatible local plugin workflows.

## Structure

```text
.claude-plugin/       Claude Code plugin manifest
.cursor-plugin/       Cursor plugin manifest
.github/plugin/       Codex/GitHub-style plugin manifest
gemini-extension.json Gemini extension MCP configuration
.mcp.json             Pixso MCP server configuration
skills/               Shared Pixso skills used by plugin-capable clients
source/rules/         English reference copy of the skill content
source/rules-zh/      Chinese review/reference translations
source/knowledge/     Fuller human-readable workflow references
docs/                 Planning and analysis documents
```

The active plugin skills live under `skills/`. Keep `source/rules/` and `source/rules-zh/` in sync when editing reference material, but there is no build step required for plugin installation.

## Requirements

- Pixso Desktop installed
- Pixso MCP server running at `http://localhost:3667/mcp`
- A plugin-capable AI coding client such as Claude Code, Cursor, Gemini, or Codex-compatible local plugin tooling

## Claude Code

Run Claude Code with this repository as a local plugin directory:

```powershell
claude --plugin-dir "D:\AI\MCP\pixso-ai-integration"
```

Inside Claude Code, check:

```text
/plugin
/mcp
```

You should see the Pixso plugin loaded and the Pixso MCP server connected.

Validate the plugin manifest and skills with:

```powershell
npm run validate:claude
```

or directly:

```powershell
claude plugin validate "D:\AI\MCP\pixso-ai-integration"
```

## Cursor

Use this repository as the local Pixso plugin package. The Cursor manifest is:

```text
.cursor-plugin/plugin.json
```

It points to:

```text
skills: ./skills/
mcpServers: ./.mcp.json
```

## Gemini

Use the root Gemini extension config:

```text
gemini-extension.json
```

It points Gemini to the local Pixso MCP server at `http://localhost:3667/mcp`.

## Codex-compatible local plugin workflows

Use this repository as the plugin package. The Codex/GitHub-style manifest is:

```text
.github/plugin/plugin.json
```

The shared skills are in `skills/`, and the Pixso MCP server config is in `.mcp.json`, matching the same general layout as the Figma plugin reference.

## Available skills

```text
pixso-use
pixso-design-to-code
pixso-code-to-design
pixso-design-editing
pixso-design-system
pixso-resource-handling
pixso-visual-verify
```

## Maintenance rule

Edit the root `skills/` files for active plugin behavior. If you maintain mirrored English or Chinese references under `source/rules/` and `source/rules-zh/`, update them manually in the same change.
