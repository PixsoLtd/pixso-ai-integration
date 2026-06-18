---
name: pixso-visual-verify
description: "Verify Pixso generated code and edited designs with screenshots, layout checks, exports, and strict visual review."
disable-model-invocation: false
---

# Pixso Visual Verification

Use this skill whenever visual fidelity, design correctness, layout quality, or export correctness matters.

## Required tools

- `get_screenshot` for a single node or current selection screenshot.
- `take_screenshot` for final verification of one to three nodes together.
- `check_layout` after design edits or code-to-design conversion.
- `get_export_image` when the user asks for a PNG, JPEG, SVG, PDF, or other exported asset.

## Do not

- Do not treat successful tool execution as visual success.
- Do not claim visual fidelity without inspecting screenshots.
- Do not ignore clipping, overlap, font fallback, missing images, broken icons, color mismatch, or abnormal whitespace.
- Do not use screenshots as exported assets when the user explicitly asks for export files; use `get_export_image`.

## Required workflow

1. Capture the relevant Pixso screenshot or export.
2. Run `check_layout` when nodes were edited or imported.
3. Inspect every screenshot for required visual criteria.
4. Fix visible problems when tools are available.
5. Re-check after corrections.
6. Report any remaining divergence explicitly.

## Visual criteria

Check for:

- content completeness;
- layout accuracy;
- correct hierarchy and alignment;
- intended font family, weight, size, and style;
- sane whitespace and padding;
- consistent sizing among similar elements;
- correct colors, radius, strokes, effects, shadows, icons, and images;
- no clipping or overlap.

## Design-to-code verification

When verifying generated code against Pixso:

1. Capture the Pixso node screenshot.
2. Run or inspect the generated UI if possible.
3. Compare layout, spacing, typography, colors, radius, shadows, images, and responsive behavior.
4. Treat the Pixso screenshot as the visual source of truth unless the user requested changes.
