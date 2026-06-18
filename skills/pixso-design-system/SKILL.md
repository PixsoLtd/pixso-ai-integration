---
name: pixso-design-system
description: "Use Pixso MCP to read, write, bind, audit, and normalize variables, styles, components, and tokens."
disable-model-invocation: false
---

# Pixso Design System

Use this skill when the task involves Pixso variables, styles, components, component instances, tokens, or design-system consistency.

## Required tools

- `read_variables`, `read_styles`, and `read_components` for modern design-system reads.
- `write_variables` and `write_styles` for local variable and style writes.
- `set_bound_variables` for variable bindings.
- `set_fill_style`, `set_stroke_style`, `set_text_style`, and `set_grid_style` for shared style binding.
- `query_all_unique_props` and `replace_props` for audits and normalization.
- `create_instance` for component instance creation.

## Do not

- Do not modify remote library resources.
- Do not delete variables or styles unless explicitly requested.
- Do not hardcode a value when a matching variable or shared style exists.
- Do not guess component keys, component-set axes, or variant names.
- Do not run broad `replace_props` changes without inspecting and verifying results.

## Required workflow

1. Read existing design-system resources before writing:
   - variables with `read_variables`;
   - styles with `read_styles`;
   - components with `read_components`.
2. Prefer binding existing variables or shared styles over creating duplicate values.
3. For component instances, resolve valid component keys and variants before creation.
4. For local token/style changes, use `write_variables` or `write_styles`.
5. For node bindings, use `set_bound_variables` or style binding tools.
6. After broad changes, run layout checks and visual verification.

## Audit and normalize

Use `query_all_unique_props` before `replace_props` when normalizing:

- fills and strokes;
- effects and shadows;
- border weights and radius;
- padding and gaps;
- font family, size, weight, and text styles.

After `replace_props`, inspect the affected node tree and verify with screenshots when visuals matter.

## Safe write rules

- Local resources may be created, updated, renamed, or deleted only according to the user's request.
- Remote resources are read-only.
- Deleting local variables or styles is a destructive action; require explicit user intent.
