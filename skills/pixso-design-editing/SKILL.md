---
name: pixso-design-editing
description: Use when an agent needs to create, modify, inspect, or refine UI designs inside Pixso with Pixso MCP tools, including Pixso canvas editing, Pixso DSL or apply_design work, UI mockups, design review fixes, screenshot-based visual checks, node or frame updates, Pixso design drafts, interface design, visual mockups, canvas changes, or UI redesign requests.
metadata:
  version: "1.0.0"
---

# Design Workflow

## Tool Hierarchy

This skill exposes two tiers of UI design tools:

- **`ai_edit` (high-level)** — An upper-layer wrapper that delegates to the Pixso Agent to perform UI design. Use it when the user's request maps naturally to an AI-driven design operation and `ai_edit` is available in the tool list.
- **Low-level tools** (`apply_design`, `fetch_context`, `query_nodes`, `check_layout`, `take_screenshot`, etc.) — Primitive canvas-editing tools that give fine-grained control. Use them when `ai_edit` is not available, the task requires precise DSL control, or the user explicitly wants step-by-step editing.

### Rules for using `ai_edit`

1. **Pass the raw prompt unchanged.** Do NOT restructure, rephrase, expand, summarize, or otherwise modify the user's original message before passing it as the `prompt` argument. The exact wording the user typed is the input.
2. **Do not run the low-level workflow when using `ai_edit`.** The DSL preflight, `fetch_context`, `apply_design`, and related steps are for low-level tool flows. When `ai_edit` is used, skip those steps entirely.
3. `ai_edit` is asynchronous and resolves only when the Pixso Agent workflow completes or fails. No further canvas calls are needed while it is running.

## DSL Preflight (blocking)

**Only before running the low-level tool workflow** must the agent fully read the following two files. Until that is done, do not call low-level Pixso MCP tools such as `fetch_context`, `apply_design`, `query_nodes`, `check_layout`, or `take_screenshot`. This preflight does not apply when using `ai_edit`:

1. [references/dsl-rules.md](references/dsl-rules.md)
2. [references/dsl-schema.ts](references/dsl-schema.ts)

- Read both files in full with the Read tool. Do not read only `SKILL.md`, only the first few sections of `dsl-rules.md`, or skip `dsl-schema.ts`.
- These two files are runtime instructions, not background reference; a successful `apply_design` response does not mean the output has passed schema validation.
- Restore tasks (1:1 recreation / reconstruction) may skip the style guide, but if the task uses the low-level tool workflow it still **cannot** skip this preflight.

## Critical Region Completion Contract

For non-trivial screen generation, region completeness is a blocking requirement.

- Treat this skill and the required DSL reference rules as runtime instructions, not background reference.
- Do not leave multiple screens or major regions in progress. Finish one screen or region before starting the next.
- Favor copying existing completed regions and updating the copy over generating repeated UI from scratch.
- When the design has repeated UI, consider building or reusing a component/template structure first so repeated regions stay consistent.
- Verify each major region immediately after it is generated. Do not wait until the end of the whole screen set.
- Use a region-completeness checklist: layout is not collapsed or broken, content is not clipped, contrast is sufficient, objects are aligned and spaced, and the region's intended role matches the visible result.
- If a region is incomplete, fix the existing objects directly before continuing; do not delete and recreate the whole region unless replacement is explicitly required.

## Code-to-Design Reverse Boundary

If the user explicitly asks to convert a web page, URL, HTML, ZIP, static web artifact, or `code_to_design` input into Pixso, this skill must not automatically take over as reference-based reconstruction.

- Route to `pixso-code-to-design` first for exact capture and conversion.
- Capture blockers or `code_to_design` failures are conversion blockers only; do not interpret them as user consent to redesign.
- Use this skill only when the user explicitly accepts an approximation, screenshot/description reconstruction, or Pixso design rebuild; state in the final response that the result is not an exact conversion.

## Web Style Reference Workflow

Use this skill when the user's intent is to reference a web page, borrow a web style, design in the visual style of a site, or generate a new interface from a reference URL, rather than exactly converting the page into editable Pixso nodes.

- Before starting `apply_design`, extract the reference page's design specification: layout/grid/spacing, colors, typography hierarchy, component shapes, radius, shadows, icon/image style, interaction states, and mobile adaptation.
- If the reference page is inaccessible or only shows login, permission, error, or empty states, report the limitation and ask whether to use the current state, a screenshot, a description, or another reference; do not invent the web style.
- Convert the specification into design constraints for the current task, then follow Workflow Steps; state in the final response that this is a new design using the reference style, not an exact web page conversion.

## Design Specification Requests

If the user asks for specs/design system/showcase board/component library, finish the requested draft first, then load and follow [references/design-specification.md](references/design-specification.md).

## Workflow Steps

1. `fetch_context()` → Identify current file, user selection, variables count, and component count. It does not return component ids. If the user refers to selected/current layer(s), call this first in the current turn.

2. **Decision point** — Does the task need creative direction?

   - **R) Restore tasks** ("restore"/"one-to-one"/"1:1"/"recreate"/"match this"/"make editable" or `reference_mode=restore`):
     → Do not call `list_style_tags()`, `get_style_guide(...)`, or `load_guidelines(...)` before reconstruction.
     → Reconstruct from the source directly; no generic draft first. Use resources only when close; source fidelity wins.
   - **A) Creative tasks** (screens, dashboards, apps, landing pages):
     → `list_style_tags()` → `get_style_guide([...])` for inspiration
     → `load_guidelines(...)` as appropriate
   - **B) Compositional tasks** ("add a button", "move this element"):
     → `load_guidelines("design-system")` → Use existing component styles

3. `read_variables()` + `read_styles()` + `read_components()` → Read design tokens, shared styles, and reusable component inventory. Use `$variableName` for variables, `$style/...` for shared styles, and component `id` values from `read_components()` for component lookup. `read_components()` always returns local document components and component sets; when a resource library is selected, it appends that library's remote components as `#n` ids.

4. **`query_nodes`** — Batch reusable component ids. Concrete components and variants are returned as `type: "frame", reusable: true`; component sets are returned as `type: "frame", isStateGroup: true`. For **component sets**, choose axes/values from `read_components().componentSets[].variantPropMap`, then query the concrete variant with `variantName` and use the returned component `guid` as `apply_design.ref`. A plain component-set query is for editing local variants and returns only first-level `childNode`.

5. `check_layout(parentId, maxDepth)` → Check existing layout

6. `apply_design()` → Generate each screen as a complete unit.
   - The DSL pre-read requirement is documented at the top of this file under "DSL Pre-Read (Blocking)"; compare operations against the rules and schema you already read.
   - When `apply_design` is executed by blocks, finish and self-check the current region before starting the next region. Do not leave half-built regions for later.
   - For creative tasks, do not skip matched components; use more instances instead of primitives.
   - If reusable component masters are created or discovered during generation, keep their bindings or confirmed ids.
   - If the user requested design specifications and the requested scope may involve Components, keep enough context about created, discovered, used, or repeated components/patterns so the Components section can be generated naturally.
   - Use existing component instances in the business page whenever appropriate.

7. Repeat step 6 per screen. Use `check_layout()` between screens only if confidence is low.

8. After ALL requested screens/pages are complete, check whether the user explicitly requested design specifications / design system / visual specs / component specs / spec panel / showcase board.

   - If NOT requested:
     → `take_screenshot({ nodeId })` for one node, or `take_screenshot({ nodeIds: [...] })` when multiple nodes/screens must be compared together → Final visual verification (max 3 calls total; prefer one batched call)

   - If requested:
     → Load and follow [references/design-specification.md](references/design-specification.md).
     → `check_layout()` draft and board, then one final batched `take_screenshot(...)` when useful.

9. If fixes needed: `apply_design()` with `U()` or `M()` → `check_layout()` to confirm. Do not repeat `take_screenshot` just to recover an earlier screenshot, and do not reset the 3-call screenshot budget after fixes or structure checks. Stop screenshot → fix → screenshot → fix loops; use `query_nodes`/`check_layout` for further diagnosis.

10. Final response: briefly state completed work. For specs, list generated sections and source-bound write-back keys; summarize Components separately.

## Node ID Rules

- Node IDs are assigned dynamically and CANNOT be predicted.
- Selected node IDs from previous turns may be stale; for selection-based edits, use the latest `fetch_context()` result.
- Selection edits default to selected node(s). If there is only one editable target, update it directly; ask only when multiple editable targets exist.
- Within the SAME `apply_design` call, use variable references from `I()`/`C()` for newly created nodes.
- String IDs (e.g. `"165:39"`) may ONLY be used for nodes confirmed in a PREVIOUS `apply_design` response.
- When copying nodes, use the `descendants` property in `C()` for overrides. Do NOT use separate `U()` on descendants of copied nodes — copying assigns new IDs.

## Example text language

Example text values in this guide are schema examples only. When generating an actual design, localize all visible UI copy according to the Generated design content language policy and preserve numbers, units, brands, acronyms, technical identifiers, and exact user-provided copy when that is more natural.

## Example: fetch_context Response

```
## Document State:
- No nodes are selected.
### Variables:
12 variables available. Use read_variables() to get semantic variable keys.
### Components:
5 components, 2 component sets available. Use read_components() to get component ids.
### Available fonts: Inter, Roboto
```

## Example: Table Structure

Tables use flexbox. Strict hierarchy: **Table (frame) → Row (frame) → Cell (frame) → Content**

Each cell MUST be a frame containing its content:

```javascript
tableRow = I("3:1", { type: "frame", autoLayout: { direction: "horizontal" } });
cell1 = I(tableRow, { type: "frame", width: "fill_container" });
I(cell1, { type: "text", nodeText: "John Doe", fillPaints: "#000", fontFamily: "$body_font", fontWeight: 400 });
cell2 = I(tableRow, { type: "frame", width: "fill_container" });
I(cell2, { type: "text", nodeText: "joe.doe@example.com", fillPaints: "#000", fontFamily: "$body_font", fontWeight: 400 });
```

## Example: using Components

**Create:** Component creation uses `reusable: true`. Component-set creation uses an `isStateGroup: true` parent without `reusable`, and variant children are identified by `name: "axis=value"`.

```javascript
buttonSet = I("document", { type: "frame", name: "Button", isStateGroup: true });
primary = I(buttonSet, { type: "frame", name: "type=primary", reusable: true });
secondary = I(buttonSet, { type: "frame", name: "type=secondary", reusable: true });
```

To convert selected/existing layer(s) into a component or component set, use the latest selected layer ids as `childNode[].guid` and choose the wrapper by intent:

- **Component:** `reusable: true`; all selected layers become children of the same new component.

```javascript
// Turn selected layers "12:1" and "12:2" into one component.
// Do not pass top, left, width, height, or autoLayout for this wrapper.
card = I("document", {
  type: "frame",
  name: "Card",
  reusable: true,
  childNode: [{ guid: "12:1" }, { guid: "12:2" }],
});
```

- **Component set:** `isStateGroup: true`; each selected layer becomes a separate variant descriptor named `axis=value`.

```javascript
// Turn selected layers "12:1" and "12:2" into one component set.
buttonSet = I("document", {
  type: "frame",
  name: "Button",
  isStateGroup: true,
  childNode: [
    { guid: "12:1", type: "frame", reusable: true, name: "type=primary" },
    { guid: "12:2", type: "frame", reusable: true, name: "type=secondary" },
  ],
});
```

**Flow:** `read_components()` lists component sets with `variantPropMap`. Use that map to build an exact `variantName`, then query the concrete variant component and use its returned real `guid` as the instance `ref`. `editable:false` resources may be used but not modified.

```json
{
  "componentSets": [
    {
      "id": "#1",
      "name": "Button",
      "variantPropMap": { "Type": ["primary", "secondary"], "Size": ["small", "medium"] }
    }
  ]
}
```

```javascript
query_nodes({
  nodeIds: [{ nodeId: "#1", variantName: "Type=primary,Size=medium" }],
  readDepth: 3,
  fields: ["descendants", "propDefMap", "editable"],
});
```

**Apply:** `ref` is always the real component `guid` from `query_nodes()`, never a remote `#n` id. Override nested layers via **`instance.descendants`** using response keys; drive exposed props via **`instance.props`** (`propDefMap` keys). Sub-instance rows use `{ ref: "real-guid" }`; text layers use `nodeText`. `propRefs` = layer is also controllable via matching **`props`**—either path is valid.

```json
{
  "id": "#1/primary-medium",
  "guid": "42:3",
  "type": "frame",
  "reusable": true,
  "propDefMap": {
    "instance#2:1": { "type": "instance_swap" },
    "text#2:3": { "type": "text" },
    "visible#2:2": { "type": "boolean" }
  },
  "descendants": {
    "2:8255": { "type": "text", "nodeText": "…", "propRefs": ["text#2:3"] },
    "2:8256": { "type": "instance", "ref": "45:1" },
    "2:8259": { "type": "instance", "ref": "45:1", "propRefs": ["instance#2:1", "visible#2:2"] },
    "2:8280": { "type": "instance", "ref": "45:2" },
    "2:8280/2:8278": { "type": "instance", "ref": "45:3" },
    "2:8280/2:8278/2:8277": { "type": "text", "nodeText": "Button" }
  }
}
```

```javascript
ex = I("document", { type: "instance", ref: "42:3" });
U(ex, { props: { "text#2:3": "Label" } });
U(ex, { descendants: { "2:8255": { nodeText: "Label" } } });
U(ex, { props: { "instance#2:1": false } });
U(ex, { descendants: { "2:8256": { visible: false } } });
U(ex, { props: { "instance#2:1": "45:1" } });
U(ex, { descendants: { "2:8259": { ref: "45:1" } } });
U(ex, { descendants: { "2:8280/2:8278/2:8277": { nodeText: "OK" } } });
```

## Example: Presenting Components in the Spec Panel

Choose the clearest representation for the user's component-spec request. You may move reusable masters with `M()`, place instance previews with real component refs, or create concise component cards/summaries when that better communicates the component system.

```javascript
// Move an existing reusable master into a component slot.
M(cardComponent, slot, 0);

// Or show an instance preview when previewing usage is clearer.
I(slot, { type: "instance", ref: cardComponent });
```

## Example: using Shared Styles

```javascript
write_styles({
  styles: {
    "Text/Title": { type: "text", fontSize: 20, fontFamily: "$body_font", fontWeight: 600 },
    "Color/CardSurface": { type: "color", fillPaints: "$Color/Surface" },
    "$style/Color/OldSurface": { name: "Color/CardSurfaceLegacy" },
    "$style/Color/Unused": null,
  },
});

// Use the exact $style/... keys returned by write_styles().
title = I(card, { type: "text", name: "Title", nodeText: "Overview", textStyle: "$style/Text/Title", fillPaints: "$style/Color/TextPrimary" });
U(card, { fillPaints: "$style/Color/CardSurface" });
```

## Example: Adding Images

There is NO "image" node type. Insert a frame, then `G()`:

```javascript
hero = I(container, { type: "frame", name: "HeroSection", width: 600, height: 400 });
G(hero, "stock", "team, collaboration, office, modern");
```

- **Stock** (`"stock"`): Unsplash photos. Prompt: short English keywords, comma-separated.
- **AI** (`"ai"`): Only when user explicitly asks for generated images.

## Required References

Non-trivial `apply_design()` DSL must first complete the "DSL Pre-Read (Blocking)" section at the top of this file.
