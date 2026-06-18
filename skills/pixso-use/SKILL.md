---
name: pixso-use
description: "**MANDATORY routing skill** - invoke this before any Pixso MCP workflow. Use when the user mentions Pixso, provides a Pixso URL, asks to inspect, edit, generate, convert, export, verify, or manage Pixso designs, or needs Pixso variables, styles, components, tokens, assets, or visual fidelity."
disable-model-invocation: false
---

# Pixso Use — Pixso MCP Routing Skill

Use this skill as the entry point for Pixso work. It routes requests to the correct Pixso workflow and enforces the default quality bar: inspect before acting, preserve visual fidelity, and verify visually when design output matters.

## Skill boundaries

Use this skill when the user:

- mentions Pixso or provides a Pixso URL;
- asks to inspect, edit, create, replace, move, delete, export, or verify Pixso design nodes;
- asks for design-to-code, code-to-design, or generated UI implementation from Pixso;
- asks about Pixso variables, styles, components, variants, tokens, or design-system consistency;
- asks to compare visuals, check layout, download generated assets, or preserve fidelity.

This skill routes the work. For the actual operation, also follow the more specific Pixso skill listed below.

## Route the task

- Design to code: use `pixso-design-to-code`.
- Code, HTML, or bundled UI to Pixso design: use `pixso-code-to-design`.
- Create, update, replace, move, delete, or otherwise mutate Pixso canvas nodes: use `pixso-design-editing`.
- Variables, styles, components, variants, tokens, style binding, or normalization: use `pixso-design-system`.
- Visual comparison, screenshot review, layout check, export verification, or fidelity sign-off: use `pixso-visual-verify`.
- Generated files, assets, fonts, temporary localhost URLs, or downloaded resources after D2C: use `pixso-resource-handling`.

## Critical rules

1. **Prefer Pixso MCP tools over guessing.** Use the tool that matches the workflow rather than reconstructing design state from memory.
2. **Inspect before mutating existing nodes.** Use `fetch_context`, `query_nodes`, or the relevant read tool before `apply_design`, bindings, replacements, exports, or broad normalization.
3. **Preserve visual fidelity by default.** Do not change UI visuals, structure, copy, colors, spacing, typography, icons, or imagery unless the user requests that change or the fix is necessary to correct a broken conversion.
4. **Verify visual output when visuals matter.** Successful tool execution is not visual success. Use screenshots and layout checks before claiming fidelity.
5. **Use the smallest reliable scope.** Query only the target node or current selection when possible. Avoid whole-document searches unless the user asks for whole-document coverage.
6. **Read every Pixso tool feedback section.** Validation failures, potential issues, layout problems, font fallback warnings, unresolved variables, and icon issues are actionable.
7. **Report remaining divergence explicitly.** If fonts, assets, layout, or component mappings cannot be matched, say what differs and why.

## Hard gates — forbidden shortcuts

- **Forbidden:** calling `apply_design` on an existing design before inspecting the target node or selection.
- **Forbidden:** claiming visual fidelity without `get_screenshot`, `take_screenshot`, or an equivalent visual artifact when visual output matters.
- **Forbidden:** using `get_node_dsl` for design-to-code when `design_to_code` supports the requested framework.
- **Forbidden:** broad `replace_props` or destructive token/style changes before reading existing variables, styles, components, and affected node properties.
- **Forbidden:** editing generated adapter output under `dist/`; update `source/` and rebuild.

## Required workflow

1. **Classify the request.** Decide whether it is design-to-code, code-to-design, design editing, design-system work, visual verification, or resource handling.
2. **Load the specific workflow.** Apply the relevant Pixso skill before calling workflow-specific MCP tools.
3. **Identify target scope.** Extract Pixso `item-id` values from URLs, use the current selection only when appropriate, or inspect the document map when the target is ambiguous.
4. **Read before write.** Inspect current context, target nodes, variables, styles, components, or generated output according to the workflow.
5. **Act in focused steps.** Prefer small, reversible, verifiable operations over large one-shot changes.
6. **Validate tool feedback.** Fix validation failures and obvious layout/visual issues before proceeding.
7. **Verify visually.** Use screenshots or exports appropriate to the task.
8. **Report outcome.** Include what was done, how it was verified, and any remaining limitations.

## Error recovery

- If a Pixso tool returns validation failures, potential issues, or layout problems, stop and address those findings before reporting completion.
- If a tool fails because the target node, component key, variant, field, or style is missing, inspect again instead of guessing IDs or names.
- If generated code references temporary localhost assets, use `pixso-resource-handling` before claiming implementation is complete.
- If visual verification reveals clipping, overlap, missing text, broken icons, missing images, font fallback, or abnormal whitespace, fix and re-check.

## Completion checklist

Before final response, confirm the applicable items:

- the correct Pixso workflow skill was followed;
- target nodes or current selection were identified;
- existing design state was inspected before mutation;
- generated files and assets were saved when design-to-code was used;
- layout checks and screenshots were used when visual output matters;
- validation warnings and layout problems were handled or explicitly reported;
- no unintended visual redesign was introduced.
