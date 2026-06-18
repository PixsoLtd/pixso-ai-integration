---
name: pixso-design-editing
description: "**MANDATORY before Pixso canvas mutations** - use this skill before creating, updating, replacing, moving, deleting, grouping, or otherwise mutating Pixso nodes. Inspect the target, apply focused operations with Pixso MCP, read validation feedback, check layout, and verify with screenshots."
disable-model-invocation: false
---

# Pixso Design Editing — Safe Canvas Mutation Skill

Use this skill before any Pixso operation that creates, updates, replaces, moves, deletes, groups, inserts, copies, or otherwise mutates canvas nodes.

## Skill boundaries

Use this skill for:

- creating frames, groups, shapes, text, images, icons, notes, or composed UI layouts;
- editing existing node properties, text, layout, fills, strokes, effects, radius, padding, gaps, or visibility;
- replacing, deleting, moving, grouping, or reparenting existing nodes;
- applying targeted repairs after `code_to_design` or other conversions;
- using `apply_design` directly.

If the task is primarily variables, styles, components, or token normalization, also use `pixso-design-system`. If the task requires final screenshot review or export verification, also use `pixso-visual-verify`.

## Required tools

- `fetch_context` when the task depends on the current selection, document map, variables, styles, or components.
- `query_nodes` before editing existing nodes or when targeted structural/property inspection is needed.
- `apply_design` for mutations.
- `check_layout` after structural edits, conversion repairs, or any change that can affect geometry.
- `take_screenshot` for final visual verification.
- `load_guidelines` for specialized design tasks when relevant.

## Critical rules

1. **Inspect before mutation.** Never delete, replace, move, or restyle existing nodes until you have inspected the specific target or current selection.
2. **Keep mutations small.** Use focused `apply_design` batches. A single call must contain at most 50 operations.
3. **Use operation statements only.** `apply_design.operations` supports operation statements such as `I(...)`, `C(...)`, `R(...)`, `U(...)`, `M(...)`, `D(...)`, and `G(...)`. Do not write non-operation aliases.
4. **Bindings are local to one `apply_design` call.** Operation result bindings do not persist across calls. Reference nodes created in previous calls by literal node ID.
5. **Read all feedback.** Validation failures and potential issues are not informational noise; fix them or explicitly report why they remain.
6. **Preserve visual intent.** Do not redesign the UI unless asked. Repairs should target concrete defects such as clipping, missing content, overlap, or misalignment.
7. **Verify after edits.** Layout checks and screenshots are required when visuals or layout matter.

## Hard gates — forbidden shortcuts

- **Forbidden:** `apply_design` on existing content before `fetch_context` or `query_nodes` inspection.
- **Forbidden:** deleting or replacing nodes based only on a name if the inspected structure contradicts the user's description.
- **Forbidden:** more than 50 operations in a single `apply_design` call.
- **Forbidden:** non-operation aliases such as `screen = "2:31"` inside `apply_design.operations`.
- **Forbidden:** ignoring validation failures, unresolved variables, unsupported emojis, icon issues, font fallbacks, clipping, or layout problems returned by Pixso tools.
- **Forbidden:** claiming completion before `check_layout` and screenshot verification when visual output matters.

## Required workflow

1. **Identify the target.** Use the current selection, user-provided node IDs, Pixso URL `item-id`, or document context.
2. **Inspect first.** Use `fetch_context` or targeted `query_nodes` before editing existing nodes.
3. **Load specialized guidance if needed.** Use `load_guidelines` for relevant topics:
   - `code`
   - `table`
   - `tailwind`
   - `landing-page`
   - `design-system`
   - `mobile-app`
   - `web-app`
   - `slides`
4. **Plan a focused mutation.** Prefer the smallest operation batch that achieves the next verifiable step.
5. **Call `apply_design`.** Use operation statements only, and keep the batch within the 50-operation limit.
6. **Read every response section.** Inspect operation results, validation failures, and potential issues.
7. **Fix reported issues.** Address font fallbacks, unresolved variables, unsupported emojis, icon issues, clipping, overlap, and layout problems.
8. **Check layout.** Run `check_layout` on the affected node tree when geometry may have changed.
9. **Verify visually.** Use `take_screenshot` for final visual review, preferably on the smallest affected node or up to three nodes when comparing.
10. **Report honestly.** State what changed, what was verified, and any known remaining divergence.

## Query rules

- Always pass `searchDepth` to `query_nodes`.
- Use `searchDepth` 1-3 by default.
- Use `searchDepth = 0` only when the user explicitly asks to search the whole document or every matching node.
- Use `fields` to request only relevant non-structural properties.
- Use `resolveVariables` when computed values are needed.
- Use `resolveInstances` only when component instance internals must be inspected.
- Treat absent requested fields as absent or not applicable; do not re-query only to confirm absence.

## `apply_design` patterns

### Correct: create and use bindings in the same call

```text
screen=I("document", {"type":"frame","name":"Screen","x":100,"y":100,"width":390,"height":844})
I(screen, {"type":"text","name":"Title","characters":"Dashboard","x":24,"y":24})
```

### Wrong: define a non-operation alias

```text
screen="2:31"
I(screen, {"type":"text","characters":"Title"})
```

### Correct: reference a previous node by literal ID

```text
I("2:31", {"type":"text","name":"Title","characters":"Dashboard","x":24,"y":24})
```

## Error recovery

- If validation fails, do not retry the same operation unchanged. Fix the cause and run a smaller corrected batch.
- If a node ID is missing, inspect the latest context instead of guessing.
- If a component, style, variable, or variant cannot be resolved, switch to `pixso-design-system` to read available resources.
- If layout check reports clipping or overlap, repair the affected subtree and re-run `check_layout`.
- If a screenshot shows visual defects, fix all visible issues before claiming success.

## Completion checklist

Before reporting completion, verify:

- target nodes were inspected before mutation;
- every `apply_design` batch used only valid operation statements and stayed within 50 operations;
- validation failures and potential issues were handled;
- required content is present and visible;
- no text is clipped;
- spacing and alignment are intentional;
- similar elements have consistent sizes;
- colors, radius, shadows, borders, icons, images, and typography match the requested design;
- `check_layout` and screenshot verification were completed when visuals matter.
