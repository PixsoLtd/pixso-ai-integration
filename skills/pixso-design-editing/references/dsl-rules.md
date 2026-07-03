# DSL Editing Rules

> **CRITICAL: Always prefer component instances from the available component library over building from primitives. This ensures consistency with the user's design system and specifications.**

## Verification

- Region completeness is a blocking check. After each major region is generated, verify that it is complete before creating the next region or screen.
- No major region may be left as an empty frame, placeholder-only container, partial active-state sample, or "will fill later" shell.
- Standard repeated regions MUST be generated from a reusable template structure and kept consistent across screens. Prefer copying an existing completed region, component instances, or exact structural repetition over recreating it from memory.
- Standard regions must include all expected children for their role and product context, not just the active/current item or a styled shell.
- Use `check_layout` for intermediate checks (~2K chars). Use `take_screenshot` only after ALL screens are complete. When multiple nodes/screens must be compared, call `take_screenshot` once with `nodeIds` so all screenshots are returned together; do not make separate screenshot calls for items that must be compared. A single screenshot call can include up to 3 nodes; max 2 screenshot calls total.
- For restore intent, do not load style tags/guides/guidelines or create generic drafts before reconstruction. First `apply_design` must reconstruct the source; use resources only when close, and patch differences after comparison.
- Treat `take_screenshot` as terminal visual verification. After fixes, verify with `check_layout`, not another screenshot. A second screenshot call is allowed only if the first screenshot call failed, returned no usable image, or must batch-capture comparison nodes that were not available in the previous screenshot result. The 2-call screenshot budget is global for the whole task and does not reset after `apply_design`, `query_nodes`, or `check_layout`; do not enter a screenshot → fix → screenshot → fix loop.
- Fix all layout issues — never leave problems for the user. No overlap, no mispositioned or clipped elements.
- Follow `gap` and `padding` layout properties exactly on each component (button, table, card, etc.).
- After generating, validate against the schema and fix as needed.

## apply_design Efficiency

- Organize each call around a complete screen or self-contained region, not an operation count. Finish the current region before starting the next.
— never cut a region mid-build or leave a half-built region for later.
— From the perspective of a top designer, it is essential to think deeply, pay attention to the richness of each area, and avoid underestimating
- Include `G()` inline in the same call that creates the container — never defer to a separate pass.
- When working on multiple screens, pre-create all top-level frames first, then fill each one sequentially. Finish and self-check one frame before moving to the next.
- Must use **`instance`** + `descendants` for standard controls when the file has matching components (full rules under **Components and instances**).

## Node Sizing

Every node must have its size determined via one of:

1. `fit_content` — sized by children (preferred for autoLayout containers)
2. `fill_container` — fills parent (requires parent to have autoLayout)
3. Explicit pixel value — when intentionally fixed

CRITICAL: Top-level screen frame MUST use `autoLayout: {direction: "vertical"}`:

```js
screen = I("document", { type: "frame", width: 390, height: 844, autoLayout: { direction: "vertical" }, fillPaints: "#FFF" });
```

CRITICAL: Mobile screens with bottom navigation — the scrollable content area MUST use `height:"fill_container"`. Fixed pixel height pushes bottom nav off-screen.

Min/Max sizing constraints only take effect when autoLayout is enabled.
Always enable autoLayout first if not already set.

## AutoLayout (= CSS Flexbox)

AutoLayout follows CSS Flexbox semantics. Key differences:

- No margin or relative positioning — wrap child in a padded frame instead.
- `fit_content` ↔ `fill_container` circular dependency is not allowed (parent can't be `fit_content` if all children are `fill_container`).
- For masonry/waterfall layouts where items have unequal heights, manually create separate row frames instead of using wrap.
- In autoLayout frames, `left` and `top` on children are ignored — the layout engine controls positioning.
- **Exception**: `layoutPositioning: true` makes a child escape the autoLayout flow and use absolute positioning. MUST pair with explicit `left` and `top`, otherwise defaults to (0,0).
- In frames WITHOUT autoLayout (absolute positioning), every child MUST have `left` and `top`.

## Text

- Text MUST have `fillPaints` with at least one solid fill to be visible (no default color).
- Do NOT put emoji or symbol characters in `nodeText` — use `icon_font` nodes instead.
- `textGrowth` controls text wrapping and bounding box sizing — see `dsl-schema.ts` TextNode definition.
- `textAlign` / `textAlignVertical` only take effect when `textGrowth` is `fixed-width` or `fixed-width-height`.
- `lineHeight` is a ratio relative to font size (1.0 = 100%). If unspecified, font default applies.
- `icon_font` nodes MUST have explicit `width` and `height`.
- Changing `filled` on an `icon_font` is **not** a style toggle — it selects a different icon. Always provide `iconFontFamily` + `iconFontName` together with `filled` so the correct variant is resolved.

## Visible UI Copy Language

- Every visible text value generated or modified in the design canvas MUST follow the Generated design content language policy.
- This includes `nodeText`, text props, text overrides in `descendants`, placeholders, labels, button text, table headers, menu items, card titles, chart labels, form labels, navigation items, and empty-state copy.
- User explicit target language for design text, selected layer text, UI copy, or translation has highest priority, even when the chat reply language is different.
- Exact copy provided by the user must be preserved exactly.
- Localize naturally. Do not translate numbers, numeric formats, units, currencies, percentages, dates, versions, brand names, product names, library names, component names, acronyms, technical identifiers, API names, file names, or common industry terms when keeping them is more natural.
- Do not use filler copy from examples when the required design copy language differs. DSL examples are schema examples only; they do not determine generated UI text language.

## Numeric values: user-supplied vs. agent-chosen

Unit convention is decided by **where the number comes from**, not by whether the task is generation or editing.

**User-supplied** — when the user writes a numeric value in their request, treat it as a literal absolute value and normalize it to the schema's unit. Never reinterpret it under CSS/design conventions.

- `lineHeight`: user-stated numbers are pixels — emit as a string with `"px"` suffix. User says "line height 8" → `lineHeight: "8px"`. NEVER `lineHeight: 8` (the schema would read that as 8× font size).
- `fontSize`, `width`, `height`, `gap`, `padding`, `cornerRadius`, `borderWeight`, `letterSpacing`: user-stated bare numbers are pixels — emit as bare numbers (schema already treats these as px).
- `opacity`: user-stated `0`–`1` kept as-is; user-stated percentage (e.g. "80%") → `0.8`.
- `rotation`: user-stated bare numbers are degrees — emit as bare numbers.

**Agent-chosen** — when you pick a numeric value during generation (the user did not specify a number for that property), follow standard design conventions.

- `lineHeight`: pick a ratio in `1.3`–`1.6` as a bare number (e.g. `lineHeight: 1.5`) — schema reads this as `1.5 ×` font size.
- All other numeric properties: use px in their natural DSL form.

Mixed requests follow both rules simultaneously. For "generate a card with title line height 20", the user-specified `20` becomes `"20px"` while every other number you choose follows agent conventions.

## Images

There is NO "image" node type. Images are fills on frame/rectangle nodes — insert a frame first, then `G()` to apply.

- `G()` creates the image `fillPaints` itself. Do NOT use `U()` to set `fillPaints` to image type — `G()` handles it.
- All user avatar nodes must use `G()` with portrait/people keywords — never represent avatars as solid-colored circles.

## Components and Instances (Higher Priority Than Style Guides and Guidelines)

- If `read_components()` or `query_nodes()` returned a matching component `id` for a standard UI region, inspect it with `query_nodes()` and implement that region in `apply_design()` with a component instance and its overrides.
- When `query_nodes` returns a reusable frame (`type: "frame", reusable: true`) with real `guid` and `descendants` for a control you are placing, **every** `apply_design` that implements that control must use `type: "instance"`, `ref` = the real component `guid`, and overrides via those `descendants` keys — not a parallel tree of `frame` / `text` / `icon_font` / `rectangle` for the same role.
- Request a component `id` with `query_nodes` only if you will instantiate it or edit its component body in this task; if `descendants` is already in context, follow through with `instance`, except when the user asked for a one-off custom layout.
- **Primitives only if** no suitable component exists in the file/kit, or the user asked for a custom pattern.
- **`query_nodes`:** Batch component ids in as few calls as practical (`fields` / `readDepth` conservative). Local component ids may be guids; remote component ids are `#n`. Do not hand-write raw cloud component keys.
- **`ref`:** Real component guid only. Use `read_components()` ids for `query_nodes`; then use the returned component `guid` in `apply_design.ref`.
- **Resource mutability:** component editability is returned by `query_nodes`, not by the lightweight `read_components` inventory. Omitted means editable. `editable:false` means the resource can be instantiated/applied but must not be updated, renamed, deleted, or extended with new variants. Create a new editable local resource first if the user wants to modify it. Style/variable rows follow the same omitted-means-editable rule.

- **Creating components:** use `reusable: true` for a component. To create a component set, create the parent with `isStateGroup: true`, then create reusable variant children whose `name` encodes the variant axes, e.g. `name: "type=primary"` and `name: "type=secondary"`.
- **Creating a component set from existing layers:** component-set `childNode` items are variant descriptors. Include `guid` on a variant child to convert that existing/selected layer into the variant; omit `guid` to create a new variant. Each variant child must use `type:"frame"`, `reusable:true`, and `name:"axis=value"` (for example `type=primary`).
- **Creation-time variant identity:** component-set variant identity comes from each variant child `name` only.
- **Variant selection:** use `read_components().componentSets[].variantPropMap` to understand available axes and values, then call `query_nodes({ nodeIds: [{ nodeId: "#1", variantName: "type=primary,size=small" }] })` and use the returned component `guid` as `apply_design.ref`. A plain component-set query returns `type: "frame", isStateGroup: true` with only first-level `childNode` for editing local variants; it does not return `variants` or `variantOptionsMap`.
- **Same-batch reuse:** a component created earlier in the same `apply_design` call is immediately available via its binding and returned guid id for later `I()`/`C()`/`U()` operations in that same call.
- **Sub-instance swap:** if a row is `type: "instance"` in `query_nodes`, set `ref` on that descendant entry to another real component guid from a prior `query_nodes` result.
- **`propDefMap` → `props`:** Use the exact keys from the `component` row (e.g. `text#…`, `visible#…`, `instance#…`). Value type matches `propDefMap[key].type`. For `instance_swap`, use a real component guid to swap nested component, or `false` when the design uses that prop to hide the nested instance.
- **`propRefs`:** Some `descendants` entries list `propRefs` — the layer is exposed as a component prop. You may set the same logical override either with **`props`** (preferred for exposed props) or with **`descendants`** using that entry’s path key (`nodeText`, `visible`, `ref`, etc.).
- **Slash paths:** Nested layers inside nested instances use `query_nodes` keys exactly as returned — a single id or a chain `a/b/c`. Use the full chain in `instance.descendants` to reach deep text or nested `instance` rows (e.g. dialog → button → label).

## Shared Styles

- Use `read_styles()` before applying shared styles. Use `$style/...` exactly as returned; never hand-write raw style guid/key values.
- Apply styles through the same property fields used for concrete values: `textStyle` for text styles, `fillPaints` / `strokePaints` for color styles, and `effects` for effect styles.
- For `fillPaints` / `strokePaints` / `effects`, a `$style/...` string means shared-style binding; an array/object value means direct node property value.
- To create, update, rename, or delete a shared style, use `write_styles()` first, then apply the returned `$style/...` key with `apply_design()`.
- In `write_styles()`, provide writable style fields directly on the style object. Use `fillPaints` for color styles, `effects` for effect styles, and the same typography fields as text nodes (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`) for text styles. Set a style entry to `null` to delete it. Set `name` to rename an existing `$style/...` key or to choose the created style name.
- If `type` is omitted for a new style, it can only be inferred from a `Color/...`, `Text/...`, or `Effect/...` style path.
- A style definition may reference variables such as `$Color/Brand/Primary`; `$style/...` is a reserved style resource namespace and must not be treated as a variable.

## Variable Binding

When variables exist, use `$variableName`; do not hardcode equivalent values:

```js
// variables: {"body_w": {type: "number", value: 390}}
width: "$body_w"; // ✅ not 390
fontSize: "$font_16"; // ✅ not 16
fillPaints: "$bg_white"; // ✅ not "#FFFFFF"
```

Use `write_variables()` to create, update, rename, or delete variable sets and variables. Pass `variableSets`, `variables`, or both. Include `variableSet` when creating variables, and use returned `changed` keys for follow-up values.

```js
write_variables({
  variableSets: {
    "Mode": { name: "Theme", modes: ["Light", "Dark"] },
    "Deprecated": null
  },
  variables: {
    "Brand": { type: "color", variableSet: "Theme", values: { "Light": "#1677FF", "Dark": "#0958D9" } },
    "OldBrand": { name: "BrandPrimary" },
    "UnusedToken": null
  }
})
```

IMPORTANT: If the user asks to unbind a variable from a property, first read that property's current effective value, then write that value back as a literal. Never use `0` or any guessed default value unless the user explicitly asks for it.

## Processing apply_design Feedback

After each `apply_design` call, read ALL feedback sections:

- **Auto-bound variables**: Use the `$variableName` shown in feedback for all subsequent operations.
- **Validation failures**: Fix immediately in the next `apply_design` call.
- **Potential issues**: Address proactively (unresolved variables, missing icons).

## General

- Undefined properties default to 0 — do NOT hallucinate random values.
- Exclude default property values unless overriding a non-default inside an instance.
- Frames can be nested and serve as shapes or containers.
- Variant choice: choose from `read_components().componentSets[].variantPropMap`, preserve exact capitalization of variant axes and values when building `variantName`, re-query that concrete variant, then use the returned component `guid`.
- Fill can be set on containers via `fillPaints` for background color, gradient, or image.
