---
name: pixso-design
description: Use when an agent needs to create, modify, inspect, or refine UI designs inside Pixso with Pixso MCP tools, including Pixso canvas editing, Pixso DSL or apply_design work, UI mockups, design review fixes, screenshot-based visual checks, node or frame updates, Pixso design drafts, interface design, visual mockups, canvas changes, or UI redesign requests.
---

# Pixso Design

## Overview

Use Pixso MCP as the design execution surface, not as a code generator. The goal is to produce or refine editable Pixso UI designs that match the user's product intent, visual requirements, and target device or frame.

Pixso MCP tools can change over time. Always discover and follow the tool-provided resource guides or help output before assuming tool names, parameters, or supported operations.

## Tool Map

Use the available Pixso MCP tools in this order of intent:

| Need | Tool pattern |
| --- | --- |
| Understand current file, selection, fonts, and resource counts | `fetch_context()` |
| Find empty canvas space before adding top-level frames | `find_empty_space_on_canvas()` |
| Inspect variables, styles, or reusable components | `read_variables()`, `read_styles()`, `read_components()` |
| Inspect concrete nodes, component descendants, and component props | `query_nodes()` |
| Create or update variables and styles | `write_variables()`, `write_styles()` |
| Create, copy, move, update, or delete design nodes | `apply_design()` with DSL operations such as `I()`, `C()`, `M()`, `U()`, `D()`, `G()` |
| Check structural layout problems cheaply | `check_layout()` |
| Do final visual review | `take_screenshot()` |

Prefer component instances from the file or selected library over rebuilding standard controls with primitives. Query the component first, then instantiate with the returned real `guid`, `props`, and `descendants`.

## Basic UI Design Workflow

1. Start with `fetch_context()` when the task depends on the current file, selection, existing canvas, or resource availability.
2. Classify the request:
   - Restore or 1:1 recreation: reconstruct from the reference first. Do not load generic style inspiration before the first reconstruction.
   - Creative UI generation: gather suitable style guidance, then use the design system resources already present in the file.
   - Small edit or composition: operate on the selected or named target, reusing existing tokens, styles, and components.
3. Read reusable resources with `read_variables()`, `read_styles()`, and `read_components()`. Use returned `$variableName`, `$style/...`, and component ids exactly as returned.
4. For any matching component or component set, batch `query_nodes()` calls. For component sets, choose a valid `variantName`, query that concrete variant, and use the returned `guid` as the instance `ref`.
5. Call `find_empty_space_on_canvas()` before creating top-level screens or boards.
6. Use `apply_design()` to complete one screen or coherent section at a time. Create top-level frames with vertical auto layout; use `fit_content`, `fill_container`, or explicit pixel sizes for every node.
7. Read every `apply_design()` feedback section. Fix validation failures, unresolved resources, missing icons, and layout warnings before continuing.
8. Use `check_layout()` between substantial edits or when confidence is low. Reserve `take_screenshot()` for final visual verification; batch up to three node ids when comparing multiple screens.
9. If the user requested specs or a design-system board, generate the draft first, then extract only the requested spec sections from actual draft usage. Bind colors, type, effects, spacing, and radius back to draft nodes before documenting them.
10. End with a concise status: what was created or changed, what was verified, and any remaining limitation.

## DSL Rules

- Validate all `apply_design()` payloads against the DSL schema in [references/dsl-schema.ts](references/dsl-schema.ts). That file is the complete schema and must be treated as authoritative.
- Every visible text value must follow the user's requested UI language. Preserve exact user-provided copy, brand names, acronyms, versions, file names, and technical identifiers when translation would be unnatural.
- Text nodes must have visible `fillPaints`. Set `textGrowth` before relying on text width or height.
- There is no image node type. Create a frame or rectangle, then use `G()` to apply the image fill.
- Auto layout uses flexbox-like behavior. Children inside auto layout ignore `left` and `top` unless `layoutPositioning: true`, which must include explicit `left` and `top`.
- User-supplied bare numeric values are literal pixels except opacity percentages and rotation degrees. Agent-chosen `lineHeight` should usually be a ratio such as `1.4`; user-supplied line height should be emitted as `"Npx"`.
- Node ids are dynamic. Use ids returned by current tool results; do not guess them. In the same `apply_design()` call, refer to newly created nodes by the local variables returned from `I()` or `C()`.

## DSL Schema

The full DSL schema is stored in [references/dsl-schema.ts](references/dsl-schema.ts), copied unchanged from `.\references\dsl-schema.ts`. Load it whenever authoring or validating non-trivial `apply_design()` DSL.
