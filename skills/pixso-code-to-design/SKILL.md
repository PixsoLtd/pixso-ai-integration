---
name: pixso-code-to-design
description: "Use this skill before calling Pixso MCP `code_to_design` when the user asks to import or convert a web page URL, HTML, ZIP, static web artifact, or browser-rendered page into Pixso. Triggers include webpage to Pixso, URL/HTML/ZIP to Pixso, code_to_design, and import webpage into Pixso. URL input must be rendered/captured locally and packaged as a real `htmlBuffer`; never pass URLs directly or switch to approximate reconstruction without user confirmation."
disable-model-invocation: false
references:
  - ./references/url-capture.md
---

# Pixso Code to Design - Import HTML, URLs, or Bundled UI into Pixso

Use this skill when the user wants to import, paste, capture, push, or convert HTML, a web page URL, ZIP bundle, static web artifact, or browser-rendered page into editable Pixso design nodes.

## First-Action Gate

Before calling any Pixso MCP tool, confirm the final input is ready: use `htmlStr` for raw or self-contained HTML, and use real ZIP bytes in `htmlBuffer` for URLs or pages with resources. For URL input, first read and follow [references/url-capture.md](references/url-capture.md).

If login, permissions, region limits, anti-abuse controls, security policy, iframes, hash routes, missing resources, or hidden target content block capture, report the blocker and ask for the next step. Do not downgrade failed capture to `pixso-design-editing`, `apply_design`, hand-written HTML, or approximate reconstruction without user confirmation.

## Activation Gate

Use this skill only when the user explicitly asks to convert HTML, a URL, a ZIP bundle, or a static web artifact into Pixso, or explicitly asks for `code_to_design`.

Fallback exceptions:

- If the user asks to create or edit a Pixso design without HTML conversion, use `pixso-design-editing` first.
- Only use this skill as a fallback when the current Pixso MCP tool list does not include `apply_design`.
- When using this fallback, explicitly say `apply_design` was unavailable and HTML-to-design conversion was used instead.

When `apply_design` is available, do not use this skill for general Pixso design creation, UI mockups, redesigns, homepage generation, app screen generation, or canvas editing.

## Boundaries

Handle raw HTML, self-contained HTML, capturable URLs, static exports, ZIP bundles, and targeted repairs after `code_to_design`. Do not pass URLs directly to `code_to_design`.

## Input Rules

- Provide exactly one of `htmlStr` or `htmlBuffer`; never both.
- Render or capture URL input locally first; do not assume Pixso can fetch URLs, authenticate, or download runtime resources.
- For URL-derived pages, default to [references/url-capture.md](references/url-capture.md), create a ZIP, and pass it as `htmlBuffer`.
- Use `htmlStr` for URL-derived pages only when the capture is self-contained, or when omitted external resources are intentional and explicitly reported.

## URL Rules

Before handling URL input, read [references/url-capture.md](references/url-capture.md). Prefer the browser's native complete webpage save output. Use DOM / CSS-aware visual resource collection only when browser save is unavailable or clearly incomplete.

## Non-Downgrade Gates

- "Web page / URL / HTML / ZIP to Pixso" or explicit `code_to_design` means exact capture and conversion, not reference-based reconstruction.
- Hard-to-capture URLs, login, permission, error, empty states, hash routes, iframes, anti-abuse controls, security policy blocks, or missing resources are blockers or incomplete input.
- If `code_to_design` fails, the wrong input was passed, or the result mismatches, report only the failure point and next options; do not switch tools or approximate-rebuild without confirmation.
- Do not pass placeholder HTML, temporary stubs, summaries, paths, empty bodies, `PLACEHOLDER`, or `TODO`.

## Required Workflow

1. **Identify the source artifact.** Determine whether the source is raw HTML, a URL, a static export, or a ZIP bundle.
2. **Prepare the correct input.** Use `htmlStr` for raw/self-contained HTML and `htmlBuffer` for ZIP bytes.
3. **Capture and package URL input first.** Follow [references/url-capture.md](references/url-capture.md), preferring browser complete-save output packaged as an `htmlBuffer` ZIP unless the capture is fully self-contained.
4. **Call `code_to_design`.** Convert the final artifact into Pixso nodes.
5. **Report the outcome.** State the source, how URL resources were captured or bundled, what was inspected, verification results, and any remaining differences.

## Visual Standard

A successful `code_to_design` call is enough to finish, but do not claim visual parity unless you actually verified screenshots or structure.

## Completion Checklist

Before the final response, verify:

- exactly one input type was used;
- the `code_to_design` argument was final `htmlStr` or real `htmlBuffer`, not a placeholder, variable name, path, or temporary stub;
- URL input, if any, followed [references/url-capture.md](references/url-capture.md);
- required URL resources were packaged, inlined, or explicitly reported unavailable;
- no unrequested redesign was introduced;
- if `code_to_design` failed or the result mismatched, `pixso-design-editing` / `apply_design` was not used before user confirmation;
- design-system alignment, if requested, was handled through `pixso-design-editing` or the current project design-system flow.
