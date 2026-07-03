---
name: pixso-component-config
description: "Generate or update Pixso Design-to-Code component parser JSON (`componentParsers` / component config) from the current Pixso desktop file, `get_all_components` output, a local component library, or an open source component library. Use when the user asks to create, extract, draft, validate, or update component parser config JSON. Always confirm the target code resource first, fetch current Pixso component facts through Pixso MCP, inspect representative node DSL before complex mappings, and never generate mappings from cached data, stale output, or guesses."
disable-model-invocation: false
references:
  - ./references/component-parser-json.md
  - ./references/component-parsers.md
  - ./references/component-config-tutorial.md
---

# Pixso Component Config

Use this skill to generate Pixso Design-to-Code component parser config JSON. The goal is to map stable Pixso component families to target code components, imports, props, text, icons, child traversal, object data, and table data rules.

## First-Action Gate

Before generating JSON, resolve which code resource the current Pixso file should map to:

- If the user already specified a target library, package, repo, resource path, or documentation link, use it and do not ask again.
- Otherwise ask:
  `Which code resource should this Pixso file map to for component config generation? 1. A local component library, in which case provide the resource path; 2. An open source component library, in which case provide the library name, documentation link, or local docs path.`
- If the user chooses `1` without a path, ask for the local resource path before continuing.
- If the user chooses `2` without enough information, ask for the library/package name and official documentation link or local docs path before continuing.

## Pixso MCP Hard Gate

Before generating any component config, verify Pixso MCP connectivity and fetch current-file component facts.

Prefer injected Pixso MCP tools when available:

```text
get_all_components({})
get_node_dsl({ "guid": "<node_id>" })
```

If injected tools are unavailable, use the fallback script bundled with this skill. Resolve the script path from this `SKILL.md` directory, not from an old external toolbox path. From the repository root, the command is:

```powershell
node --experimental-strip-types .\skills\pixso-component-config\scripts\fetch-pixso-components.ts --summary-only --max-families 80
```

Fetch representative node DSL through the same script:

```powershell
node --experimental-strip-types .\skills\pixso-component-config\scripts\fetch-pixso-components.ts --node-dsl "59194:149"
```

Default MCP endpoint: `http://127.0.0.1:3667/mcp`. If Pixso uses another port, pass `--mcp-url`.

If Pixso MCP cannot connect, or `get_all_components` / `get_node_dsl` fails, stop. Do not continue from cached data, stale output, inferred component names, or manual guesses. Ask the user to open the current Pixso desktop file, enable MCP, confirm endpoint/port, and retry.

## Required References

Read the bundled references as needed:

- Read [references/component-parser-json.md](references/component-parser-json.md) for every config generation task to confirm schema and safe defaults.
- Read [references/component-parsers.md](references/component-parsers.md) when generating or validating complex fields such as `icon.childComponent`, `attr`, `traverse`, `object`, `tableData`, `@icons`, or `@text`.
- Read [references/component-config-tutorial.md](references/component-config-tutorial.md) only when examples are useful for explaining, debugging, or authoring a complex parser rule.

## Required Workflow

1. **Resolve the target code resource.** Choose local component library mode or open source component library mode.
2. **Gather code facts.** Read the user's plan, docs, `package.json`, exports, component directories, props definitions, and style entry. Do not guess imports when a repo is available.
3. **Fetch Pixso components.** Use `get_all_components` or the fallback script to get raw components and a component-family summary.
4. **Sample node DSL.** For component families that need `text`, `icon`, `attr`, `traverse`, `object`, or `tableData`, inspect representative `nodeIds` with `get_node_dsl`; `get_all_components` only includes metadata, not full child layers.
5. **Normalize component families.** Use stable family names as config keys, not variant sample names.
6. **Generate JSON.** Output the component parser object directly. Do not wrap it in `codeOptions` unless the user explicitly asks.
7. **Report manual completion items.** Put private, helper, legacy, unknown, and unverified families into a "Manual Completion List".
8. **Validate output.** Confirm the JSON parses with `JSON.parse` and state whether `codeOptions` is absent.

## Component Family Normalization

- When using the fallback script with `--summary-only`, use `families[].name` as the processed component config key.
- Use `families[].rawNames` and `families[].keySources` only for review and manual correction; do not use raw variant names or `sampleNames` as keys.
- Prefer non-empty `aliasName`.
- Otherwise use `containing_frame.containingStateGroup.name`.
- Fall back to `name` only for standalone components.
- Treat variant `name` values such as `Size=small, State=disabled` as variant samples, not component family names.
- The fallback script applies generic component-name normalization: strip angle brackets, remove invalid component-name characters, remove leading digits, and fall back to `Component_<session>_<local>` from `node_id` when needed.

## Target Resource Modes

### Local Component Library

When the user provides a local path, treat it as a candidate code resource. First locate the real component-library boundary, then map components. Do not assume the path itself is the package root, and do not assume the library is Vue, React, or any fixed directory layout.

Use this general discovery order:

1. **Locate the library root.** From the user-provided path, search inward or upward for package/workspace signals such as `package.json`, `pnpm-workspace.yaml`, lockfiles, `rush.json`, `turbo.json`, `nx.json`, `lerna.json`, `tsconfig.json`, `vite.config.*`, `rollup.config.*`, and `unbuild.config.*`. In a monorepo, identify the package that actually exposes components instead of using the repo root directly.
2. **Confirm package identity.** Read the candidate package manifest for package name, version, `main` / `module` / `types` / `exports`, files, peer dependencies, dependencies, and style side effects. Do not infer package name from the directory name.
3. **Confirm public exports.** Follow manifest entry points, `src/index.*`, `components/index.*`, barrel exports, plugin installers, auto-import resolvers, or documentation examples to identify public component names and import paths.
4. **Identify framework and component shape.** Determine from source whether the package uses Vue SFC, Vue TSX, React, Web Components, Svelte, headless hooks, or mixed implementations. Read only the component rules relevant to the current target framework.
5. **Read component APIs.** Prefer type definitions, props schemas, variant / size / status constants, emits/events, slots, compound subcomponents, and icon handling. Common files include `props.*`, `types.*`, `interface.*`, `constants.*`, component entries, component implementations, and generated `.d.ts`.
6. **Confirm styles and dependencies.** Read style entry points, on-demand style paths, CSS variables, theme tokens, icon packages, peer dependencies, and whether a global import is required. Emit `__mainImports__` / `__package__` only when the config should be installable and runnable.
7. **Sample real usage.** Search demos, stories, docs, tests, or examples to confirm real tags/component names, prop values, slot syntax, icon syntax, and compound component usage.
8. **Limit read scope.** Start with manifests, entry points, and a few representative components; inspect implementations only when mapping fields are unclear. Do not traverse the entire repo before making initial decisions.

If the path points to an application rather than a component library, first find the actual component package that the app depends on or references locally. If that cannot be determined, ask the user which local package to map.

If source, types, examples, or docs conflict, prefer public exports and official examples. Put unresolved conflicts into the manual completion list.

### Open Source Component Library

When the user provides an open source library name, docs link, or local docs path, read official docs or local docs before generating imports, tag names, prop mappings, style entries, or package entries. Element Plus and Ant Design Vue are examples, not defaults.

If local source or documentation does not establish package, import, tag, or prop conventions, ask for those facts instead of guessing.

## JSON Generation Rules

- Output the component parser object directly; do not wrap it in `codeOptions` by default.
- Add `__imports__` for every emitted `name` tag.
- Add `__mainImports__` and `__package__` only when the target project needs them or the user asks for a complete installable config.
- Add `@icons` only if icon-prefixed layers or icon components are present.
- For each stable component family, emit only verified `name`, `props`, `text`, `icon`, `attr`, `traverse`, `object`, or `tableData` fields.
- Do not fabricate `nodeName`, visual `attr.mappings`, or imports.

## Node DSL Inspection

- Choose representative node IDs from `families[].nodeIds` in the summary output. Start with one representative node per component family; for variant-sensitive components, inspect at least the default variant and one non-default variant.
- Pass the value exactly as `guid` even though it comes from `node_id`:

```text
get_node_dsl({ "guid": "59194:149" })
```

- Parse JSON from `result.content[0].text` when using an injected MCP tool. The fallback script already parses this text and prints JSON.
- Expect a DSL document fragment, not always a bare node. Inspect `pixTreeNodes[0]` and, when present, `pixComponentTreeDslNodes[0]`; supporting maps such as `localStyleMap`, `variableMap`, and `svgGuidInfo` may appear at the same top level.
- Use `childNode` entries and child layer names to decide stable `text.nodeName`, `icon.nodeName`, slot/traverse rules, `object` mappings, and `tableData` structure.
- Use visual properties from node DSL for `attr` only when they map cleanly to documented target component prop semantics.
- Do not call `get_node_dsl` for every raw component unless needed; sample enough variants to confirm layer names and state-dependent structure.
- If one `node_id` fails, try another `nodeIds` entry from the same family. If all fail, put that family in the manual completion list instead of fabricating rules.

## Output Contract

Return, in order:

1. A valid JSON code block containing only the generated component parser config.
2. A short "Manual Completion List".
3. A verification note stating whether `JSON.parse` passed and whether `codeOptions` is absent.

Do not write a config file unless the user explicitly provides a file path.

## Completion Checklist

Before the final response, verify:

- the target local or open source component library is resolved;
- required references were read;
- current-file component facts were fetched through Pixso MCP;
- component families needing complex fields had representative node DSL inspected, or were listed for manual completion;
- imports, tag names, props, style entries, and package entries come from source or documentation facts;
- output JSON parses;
- `codeOptions` was not added by default;
- counts were reported for raw components, component families, generated rules, and skipped/manual families.
