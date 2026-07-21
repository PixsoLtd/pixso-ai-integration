---
name: pixso-read-dsl
description: Use Pixso desktop MCP get_node_dsl to inspect compact DSL, recursively resolve variable, style, component, and asset references, retrieve complete node semantics or explicitly scoped full data, and fall back to DSL plus screenshots when design_to_code fails or returns unusable output.
disable-model-invocation: false
references:
  - ./references/compact-dsl.md
  - ./references/full-data-workflows.md
---

# Pixso Read DSL

Use this skill to retrieve or explain node DSL, inspect variables/styles/components/assets used by a node, trace instances to their definitions, retrieve a clearly scoped full dataset, export assets from DSL references, or fall back from failed code generation.

This skill targets the Pixso desktop MCP registered in the current runtime. The desktop client operates on the currently open file. Its MCP address and incremented port are injected at runtime. Use camelCase parameters; do not use service-MCP parameters such as `file_key`, `variable_ids`, or `style_ids`.

## Required references

- Read [references/compact-dsl.md](references/compact-dsl.md) whenever interpreting `get_node_dsl` output.
- Also read [references/full-data-workflows.md](references/full-data-workflows.md) for complete semantics, full-data requests, recursive component resolution, or asset export.

## Trigger boundary

Use this skill when the user:

- explicitly asks for `get_node_dsl`, node DSL, or compact DSL;
- asks which variables, styles, components, variants, component sets, vectors, or images a node uses;
- wants to trace an instance to its component, variant, or component set, or understand instance overrides;
- asks for complete data, full data, or a complete component structure;
- asks to export SVG or images based on DSL;
- asks about differences between compact and legacy DSL; or
- needs a code-generation fallback because `design_to_code` failed or returned output that cannot be used.

Normal design-to-code work must try `design_to_code` first through `pixso-design-to-code`. Enter this skill directly only for explicit DSL/reference requests, or after `design_to_code` genuinely fails or returns unusable output. A code-generation fallback must combine node DSL with `get_screenshot` visual context for generation and verification. Compact DSL is not raw Kiwi, decoded JSON, or a full-file snapshot.

## Related tools

- `get_node_dsl`: use `simplify: true` by default for compact DSL; use `simplify: false` only when the user explicitly wants the complete tree-shaped DSL for the requested node in one response.
- `get_variables`: query variables by `variableIds`, `variableSetId`, or without a filter.
- `get_variable_sets`: query variable sets; inspect the actual response shape instead of trusting the tool name alone.
- `get_local_styles` / `get_remote_styles`: query styles by `styleIds` or without a filter.
- `get_variants`: retrieve a lightweight variant list for a component set.
- `get_all_components`: retrieve the current-file component inventory only when explicitly needed.
- `get_export_image`: export vectors or images by node GUID.
- `get_top_level_frames`: retrieve pages and top-level frames for a user-approved batched full-file query.

## Required workflow

1. **Resolve the node and scope.** Get the GUID from a Pixso URL `item-id`, a user-provided GUID, or current selection. If the user only says "full", clarify the scope using the full-data reference.
2. **Choose the DSL mode.** By default, call `get_node_dsl({ guid, simplify: true })`, inspect `roots` and `refsIndex`, and continue through the reference closure. When the user explicitly requests all tree-shaped data for the node in one response, call `get_node_dsl({ guid, simplify: false })`; never describe that result as raw Kiwi or decoded JSON.
3. **Scan recursively.** Traverse the complete object graph under `roots`, including `children` and `override`; never inspect only top-level node fields.
4. **Collect used references.** Gather components, variables, styles, vectors, and images from property values and `refsIndex`, preserving the property location that gives each reference its meaning.
5. **Resolve the component closure.** Call `get_node_dsl` for every unvisited `componentRef`, collect newly discovered references, and repeat with a visited set until no new component references appear.
6. **Resolve variables and styles in batches.** After the component closure stabilizes, batch variable/style calls. Add variable aliases to the pending set until no new aliases appear.
7. **Export only when requested.** Keep references for structural analysis. Export real files only when the user needs them.
8. **Check completion.** Complete the requested scope only when all reference sets stop growing and every unresolved item is reported.

For code-generation fallback, use the same DSL workflow to recover structure and effective properties, call `get_screenshot(guid)` for visual context, generate code from both sources, and continue through the normal resource, cleanup, and verification workflow.

## Component closure

```text
pendingComponents = componentRef values actually used by roots
visitedComponents = empty set

while pendingComponents contains an unvisited ID:
  call get_node_dsl({ guid: componentRef })
  mark the ID visited
  recursively scan returned roots and override values
  add new componentRef, variable, style, vector, and asset references
```

- `componentRef` identifies the component or concrete variant used by the instance and is the primary structural lookup key.
- `componentSetRef` identifies the containing component set; it does not replace `componentRef`.
- `componentNodeRef` aligns an instance child with its component-definition node for inherited values and overrides.
- `refsIndex.componentSets[].variants` is a lightweight summary. Use `get_variants` for a complete variant list and `get_node_dsl(componentSetId)` for component-set structure.
- Use `get_all_components` only for an explicitly requested inventory or candidate filtering, never as the default next call.

## Variables and styles

- Prefer `refsIndex.variables[].id` and `refsIndex.styles[].id`; do not re-parse IDs from display strings when indexed IDs exist.
- For `variable:<id>$<modeId>`, pass only `<id>` in `variableIds`. Select the matching `modeValues` entry when a mode ID exists. Without a mode ID, use the first returned mode as the desktop-client default convention and state that convention.
- When a variable value is an alias, query the alias ID and repeat until no new aliases appear.
- For `style:<id>`, pass only `<id>` in `styleIds`.
- If style origin is uncertain, query the same IDs through both local and remote style tools, deduplicate by referenced ID, and use returned `isLocal` metadata.
- A text style controls the properties defined by the style; text properties not covered by the style still come from the node.

## Asset export

- `vectorRef` is an exportable node GUID. Export SVG with:

```text
get_export_image({
  guid: vectorRef,
  exportSettings: {
    constraint: { type: 1, value: 1 },
    imageType: 3
  }
})
```
- `refsIndex.assets` contains image hashes, not node GUIDs. Never pass an asset hash directly to `get_export_image`.
- To export an image, find the node in `roots` whose `fills[]` contains `type === "asset"` with the matching asset ID, then export that node's `id`.
- Download temporary URLs immediately with a raw HTTP client; do not use a webpage reader that summarizes response content.

## Analysis output format

When the user asks for DSL analysis, report query context, node overview, layout and sizing, content and visual properties, component relationships, resolved references, and conclusions or exceptions in that order. Query context must state the GUID, `simplify` mode, data source, and whether the IDE/MCP Host reported truncation. Conclusions must list default omissions or inheritance, unresolved IDs, failures, and tools still needed.

When the user asks only for raw DSL, return or save it without forcing an analysis report. When the user asks about one property, return only the relevant parts.

## Hard gates

- Do not describe compact DSL as a raw file or complete Kiwi data.
- Do not default to `simplify: false` for compact DSL, reference analysis, or code-generation fallback. Use complete tree-shaped DSL only when the user explicitly requests all node data in one response.
- Do not traverse a full file or call unfiltered component, variable, and style tools without explicit scope confirmation.
- Do not omit `children`, `override`, or references discovered in component DSL.
- Do not pass `variable:` / `style:` prefixes or `$modeId` suffixes to lookup tools.
- Do not pass asset hashes as export GUIDs.
- Do not call a missing field data loss before checking default omission, definition inheritance, node applicability, and override rules.
- Do not infer response origin from a tool name; inspect IDs, response structure, and `isLocal`.
- Do not bypass an available `design_to_code` call for ordinary code generation. Use this skill as fallback only after a genuine failure or unusable result, unless the user explicitly requested DSL/reference inspection.

## Failure handling

- If MCP is unavailable, ask the user to open the target file in Pixso desktop, enable desktop MCP, and retry.
- If no usable `item-id`, GUID, or selection exists, request a node-level URL/GUID or confirmation to use current selection.
- If a component/reference lookup fails, preserve its ID, continue independent lookups, and report it as unresolved instead of inventing a definition.
- Do not infer truncation from byte size. Only when the IDE/MCP Host explicitly reports truncation, or the user explicitly reports incomplete data, ask the user to choose between querying again with `simplify: true` or calling `simplify: false` through curl/an equivalent raw HTTP client and saving the complete response for file-based analysis. Never choose for the user.
- If the user requests raw Kiwi or decoded JSON, state that desktop MCP does not provide it; do not disguise compact DSL as a substitute.
- If screenshot capture fails during code-generation fallback, continue only with checks that are safe from structure alone and clearly report that visual verification was unavailable.

## Completion checklist

- Initial `roots`, all `children`, and all `override` values were traversed.
- Every used `componentRef` was queried and the component set stopped growing.
- Variables, styles, vectors, and assets discovered in component DSL were collected.
- Every variable ID and alias was queried and the alias set stopped growing.
- Local/remote style results were merged and deduplicated by ID.
- Requested real assets were exported and saved, or failures were reported.
- Every unresolved reference was listed without guessed values.
- For a code-generation fallback, the `design_to_code` failure/unusable result was recorded, DSL and screenshot context were used, and the fallback output continued through normal cleanup and verification.

