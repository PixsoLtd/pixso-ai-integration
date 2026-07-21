# Complete Semantics and Full-Data Workflows

## Clarify what "full" means

Never interpret "complete" or "full" as permission to traverse the whole file by default.

| Scope | Calls |
|---|---|
| Compact semantics and queryable references for the current node | `get_node_dsl({ guid, simplify: true })` plus component/variable/style/asset closure |
| Complete tree-shaped DSL for one node in one response | `get_node_dsl({ guid, simplify: false })` |
| All variables in the current file | `get_variables({})`, interpreted by variable-set grouping |
| All variables in one set | `get_variables({ variableSetId })` |
| All current-file styles | `get_local_styles({})` and `get_remote_styles({})`, deduplicated by ID |
| Current-file component inventory | `get_all_components({})` |
| Complete structure of one component | `get_node_dsl({ guid: componentId })` |
| All variants in one component set | `get_variants({ guid: componentSetId })` |
| Complete component-set structure | `get_node_dsl({ guid: componentSetId })` |
| Pages and top-level frames | `get_top_level_frames({})` |
| Full-file node DSL | User confirmation, then batched page/top-level-frame queries |
| Raw Kiwi / decoded JSON | Not provided by desktop MCP |

Unfiltered calls may return large outputs. Call unfiltered component/variable/style tools or traverse the file only after explicit scope confirmation.

## Complete semantics for one node

### Choose a mode

- Use `get_node_dsl({ guid, simplify: true })` by default. It provides dense `roots/refsIndex` data and resolves components, variables, styles, and assets on demand through the reference closure.
- When the user explicitly requests all node-tree data in one response, complete tree-shaped DSL, or no follow-up reference queries, use `get_node_dsl({ guid, simplify: false })`.
- A `simplify: false` response is the complete tree-shaped DSL for the requested node, not raw Kiwi, decoded JSON, or a snapshot of the whole design file.
- `simplify: false` only changes retrieval for the requested node tree. Full-file variables, styles, component inventory, and all-file node traversal still use their scoped tools and workflows below.

### 1. Initial node

```text
get_node_dsl({ guid, simplify: true })
```

Recursively scan all objects and arrays in `roots`, including `children`, `override`, component children, and folded summaries. Collect:

- `componentRef`
- `componentSetRef`
- variable references
- style references
- `vectorRef`
- asset fills and `refsIndex.assets`

### 2. Component fixed point

Maintain `pendingComponents` and `visitedComponents`:

1. Add every `componentRef` actually used by the initial node to pending.
2. Call `get_node_dsl` for one unvisited ID.
3. Scan the new DSL and add new component, variable, style, vector, and asset references.
4. Mark the component visited.
5. Repeat until no new `componentRef` exists.

Do not automatically expand a `componentSetRef` into the whole component set. Query the set only when variant axes/candidates or complete set structure are required.

### 3. Variable fixed point

After the component closure stabilizes:

```text
get_variables({ variableIds })
```

Add variable aliases from returned values to pending, query unvisited aliases in batches, and use `visitedVariables` to prevent cycles.

Mode handling:

- With `$modeId`, select that exact mode.
- Without a mode ID, use the first returned mode as the desktop-client default convention.
- The same variable may use different modes at different nodes, so resolve final values per reference location rather than caching one global resolved value.

### 4. Style merge

```text
get_local_styles({ styleIds })
get_remote_styles({ styleIds })
```

Build a map by referenced style ID. Keep one entry per ID and use `isLocal`. Put unmatched IDs in an unresolved set instead of inferring origin from the ID format.

### 5. Asset sets

Component DSL may introduce assets absent from the initial node. On every component scan, update:

- `pendingVectors`
- `pendingAssets`
- mappings from asset IDs to containing node IDs

For structural analysis, stop with references. Export and immediately download temporary URLs only when the user requests real files.

## Component lookup choices

| Goal | Preferred tool | Notes |
|---|---|---|
| Actual definition used by an instance | `get_node_dsl(componentRef)` | May be a component or concrete variant |
| Containing component set | Current DSL `componentSetRef` | Read the reference first; do not expand by default |
| Variant summary | `refsIndex.componentSets[].variants` | Efficient for variant axes |
| Complete variant inventory | `get_variants(componentSetId)` | Lightweight metadata, not a full node tree |
| Component-set structure | `get_node_dsl(componentSetId)` | Potentially large |
| Full-file component inventory | `get_all_components({})` | Only for inventory/candidate filtering |

Interpret instance properties as direct definition plus `override`: omitted values are inherited, while values in `override` replace definition values. Use `componentNodeRef` to align instance children with definition nodes.

## Full-file batching

When the user explicitly requests full-file node DSL:

1. Call `get_top_level_frames({})`.
2. Confirm which pages, hidden pages, and component pages are in scope.
3. Query by page or top-level frame.
4. Maintain roots/component/variable/style/asset sets for each batch.
5. Merge global references by ID while retaining first-use and usage locations.
6. Report unqueried pages, failed batches, and possible truncation.

Do not use `get_all_components` as a substitute for the full node tree, and do not label variable/style inventories as full design-node data.

## Host truncation and file-based analysis

Never infer truncation from response byte size. Enter the fallback flow only when either condition applies:

- The IDE/MCP Host explicitly reports that tool output was truncated, clipped, incomplete, or exceeded context limits.
- The user explicitly reports that returned data is incomplete.

Ask the user to choose a fallback; never decide automatically:

1. **Compact query.** Call `get_node_dsl({ guid, simplify: true })`, then resolve needed data through `roots/refsIndex` and the reference closure.
2. **Save complete DSL.** Use the MCP endpoint registered in the current runtime. Through curl or an equivalent raw HTTP client, perform `initialize`, `notifications/initialized`, and `tools/call`, invoke `get_node_dsl({ guid, simplify: false })`, and save the raw response directly to a file.

When saving complete DSL:

- Never hardcode the MCP port.
- For an SSE response, extract the JSON-RPC payload from `data:`.
- Never inject the complete saved file back into the conversation context.
- Analyze it with file search, structured JSON queries, and bounded reads.
- Return the absolute path of the saved file.

Suggested prompt:

> The IDE/MCP Host truncated the DSL, or you reported incomplete data. Choose either compact DSL with reference lookups or curl-based complete DSL saved for file-based analysis.

## Standard analysis result

When the user asks for DSL analysis, organize the result as follows:

1. **Query context:** GUID, `simplify` mode, MCP tool or saved-file source, and whether the host reported truncation.
2. **Node overview:** `id/type/name`, hierarchy, and major children.
3. **Layout and sizing:** `box/autoLayout/constraints`, positioning, arrangement, spacing, and sizing behavior.
4. **Content and visual properties:** text, typography, fills, strokes, effects, radius, opacity, visibility, images, and vectors.
5. **Component relationships:** `componentRef/componentSetRef/componentNodeRef`, inheritance, variants, and `override`.
6. **Reference resolution:** variables and modes, styles, components, vectors/assets, and queried or unqueried references.
7. **Conclusions and exceptions:** default omissions, inherited fields, unresolved IDs, failures, truncation notes, and suggested follow-up tools.

When the user asks only for raw DSL, return or save it without forcing an analysis report. For a question about one node or property, include only relevant sections. Never claim truncation without an explicit IDE/MCP Host signal or user report.

## Current desktop-client compatibility

Observed tool-boundary anomalies may include:

- `get_variable_sets({})` and `get_variables({})` returning the same variables grouped by variable-set ID.
- A local style ID passed to `get_remote_styles` returning the local style again.

Compatibility rules:

- Inspect actual response structure rather than assuming it from the tool name.
- Query in batches and map results by referenced ID.
- Deduplicate local/remote results by ID and use `isLocal`.
- Report uncertain data instead of rewriting or fabricating App responses.

These are desktop-client follow-up issues. This skill does not change App tools; fix them only in a separate `pixso-client-app` task and plan.

## Completion conditions

Complete current-node semantics only when:

- initial roots, all `children`, and all `override` values were scanned;
- `pendingComponents` is empty and component closure reached a fixed point;
- `pendingVariables` is empty and alias closure reached a fixed point;
- local/remote styles were merged and deduplicated;
- every vector/asset introduced by component DSL entered the asset sets;
- requested files were exported or failures were recorded; and
- every unresolved ID was reported without guessed values.
