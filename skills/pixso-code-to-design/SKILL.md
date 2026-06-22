---
name: pixso-code-to-design
description: "Use Pixso MCP `code_to_design` to convert raw HTML, URL-captured pages, or ZIP-bundled UI code into editable Pixso design nodes. For URL input, the local agent must capture the rendered HTML and package required resources into `htmlBuffer` before conversion. Inspect generated structure, check layout, verify screenshots, and make only targeted corrections unless the user requests redesign or design-system alignment."
disable-model-invocation: false
references:
  - ./references/url-capture.md
---

# Pixso Code to Design — Import HTML, URLs, or Bundled UI into Pixso

Use this skill when the user wants to import, paste, capture, push, or convert HTML, a web page URL, or bundled UI code into editable Pixso design nodes.

## Activation gate

This skill is opt-in by default. Use it only when the user explicitly requests HTML / URL / ZIP / static web artifacts to be converted into Pixso designs.

Use this skill when:

- the user asks to generate HTML and convert it into a Pixso design;
- the user explicitly asks to use `code_to_design`;
- the user asks to import HTML, URL capture output, ZIP bundles, or static web bundles;
- the user asks to convert an existing web page or static HTML artifact into editable Pixso nodes.

Fallback exception:

- If the user asks to create or edit a Pixso design without requesting HTML conversion, use `pixso-design-editing` first.
- Only when the current Pixso MCP tool list does not include `apply_design`, use this skill as the fallback path through `code_to_design`.
- When using this fallback, explicitly report that `apply_design` was unavailable and the design was generated through HTML-to-design conversion instead.

When `apply_design` is available, do not use this skill for general Pixso design creation, UI mockups, redesigns, homepage generation, app screen generation, or canvas editing.

## Skill boundaries

Use this skill for:

- raw HTML snippets passed directly to Pixso;
- public, local, or otherwise accessible URLs that the local agent can fetch or render and package;
- ZIP archives containing HTML, CSS, JavaScript, images, fonts, or other local assets;
- static exports of app pages or components;
- conversion after `code_to_design` creates editable Pixso nodes.

Do not pass URLs directly to `code_to_design`. Convert URL input into either a self-contained `htmlStr` or, by default when resources are involved, a ZIP bundle passed as `htmlBuffer`.

## Required tools

- `code_to_design` for HTML or ZIP conversion.
- Local agent/browser/runtime tools to fetch or render URL input and collect page resources before calling `code_to_design`.
- `pixso-design-system` only when the user requests design-system alignment or token/component normalization.

## Input rules

- Use `htmlStr` for raw HTML strings.
- Use `htmlBuffer` for ZIP archive bytes.
- Provide exactly one of `htmlStr` or `htmlBuffer`; never both.
- For URL input, first capture or render the page locally; never assume Pixso can fetch the URL or its private/runtime resources.
- For URL-derived pages, default to [references/url-capture.md](references/url-capture.md) and pass the resulting ZIP bundle as `htmlBuffer`.
- Use `htmlStr` for URL-derived pages only when the captured HTML is self-contained, with critical CSS and required assets inlined or intentionally omitted with an explicit note.
- Remote, cross-origin, hotlinked, or authenticated assets may not resolve reliably; report limitations or follow the URL capture fallback rules.
- If the source is a live app page, produce or request a static HTML/asset export before calling `code_to_design`.

## URL input rules

Before handling URL input, read and follow [references/url-capture.md](references/url-capture.md). That reference is authoritative for rendered-state confirmation, browser complete-save capture, resource fallback collection, pre-call input gates, and failure boundaries.

Default to the browser's native complete webpage save output, equivalent to Ctrl+S / Save Page As / Webpage Complete. Do not manually download every page resource by default. Only use DOM / CSS-aware visual resource collection when browser save is unavailable or clearly incomplete.

## Non-downgrade gates

Follow these even when the reference file has not been loaded:

- "Web page / URL / HTML / ZIP to Pixso" or explicit `code_to_design` means exact capture and conversion, not reference-based reconstruction.
- Hard-to-capture URLs, login/permission/error/empty states, hash routes, iframes, anti-abuse controls, or missing assets are blockers or incomplete input; ask whether to import the current state or provide the target state.
- If `code_to_design` fails, the wrong input was passed, or the result mismatches, only report the failure point and next options; do not switch to `pixso-design` / `apply_design` / approximate reconstruction without confirmation.
- Do not pass placeholder HTML, temporary stubs, summaries, paths, or `PLACEHOLDER`; report the blocker when the final artifact cannot be prepared.

## Critical rules

1. **Conversion is not verification.** A successful `code_to_design` call only means Pixso created nodes; it does not prove visual accuracy.
2. **URL capture is the local agent's responsibility.** `code_to_design` consumes HTML or ZIP bytes; it should not be expected to crawl URLs, authenticate, execute app state, or download missing private resources.
3. **Do not silently redesign.** Repair conversion defects, but do not change the design language unless the user asks.
4. **Escalate design-system alignment.** If the user wants components, tokens, variables, or styles applied, follow `pixso-design-system` after the basic conversion is verified.

## Hard gates — forbidden shortcuts

- **Forbidden:** passing both `htmlStr` and `htmlBuffer`.
- **Forbidden:** passing a URL directly to `code_to_design`.
- **Forbidden:** assuming `code_to_design` captures arbitrary runtime app state by itself.
- **Forbidden:** using initial server HTML for a JavaScript-rendered page when the rendered DOM is required for fidelity.
- **Forbidden:** using `htmlStr` for a URL-derived page while leaving external CSS, image, font, SVG, or icon URLs unresolved, unless the limitation is intentional and explicitly reported.
- **Forbidden:** claiming URL capture fidelity without packaging or inlining required resources.
- **Forbidden:** broad visual redesign of the imported result unless requested.
- **Forbidden:** automatically switching to `pixso-design` / `apply_design` to rebuild when `code_to_design` fails, the input is wrong, or the result clearly mismatches. First report the failure and ask whether to check the link/input or use Pixso design to generate an approximation.

## Required workflow

1. **Identify the source artifact.** Determine whether the source is raw HTML, a URL, a static export, or a ZIP bundle.
2. **Prepare the correct input.** Use `htmlStr` for raw/self-contained HTML or `htmlBuffer` for ZIP bytes.
3. **For URL input, capture and package first.** Read and follow [references/url-capture.md](references/url-capture.md), preferring a browser complete-save artifact packaged as an `htmlBuffer` ZIP unless the capture is fully self-contained.
4. **Call `code_to_design`.** Convert the artifact into Pixso nodes.
5. **Report outcome.** State the source converted, how URL resources were captured or bundled when applicable, what was inspected, verification results, and any remaining differences.

## Visual criteria

No generated-result validation is required; a successful `code_to_design` method call is sufficient to finish.

## Fallbacks

- For URL capture, login/permission/error states, browser save, resource fallback, and failure boundaries, follow [references/url-capture.md](references/url-capture.md).
- For design-system conversion, complete the basic editable import first, then use `pixso-design-system` to bind variables, styles, or component instances.

## Error recovery

- If `code_to_design` fails because the input is incomplete, create a smaller reproducible HTML snippet or a ZIP with all required files.
- If URL-derived conversion is missing styles or assets, recapture or run resource fallback according to [references/url-capture.md](references/url-capture.md).
- If conversion fails, the wrong input was passed, or the result clearly mismatches, follow the failure boundary in [references/url-capture.md](references/url-capture.md).

## Completion checklist

Before final response, verify:

- exactly one input type was used;
- the `code_to_design` argument was final `htmlStr` or real `htmlBuffer`, not a placeholder, variable name, path, or temporary stub;
- URL input, if any, followed [references/url-capture.md](references/url-capture.md);
- required URL resources were packaged, inlined, or explicitly reported as unavailable;
- no unrequested redesign was introduced;
- if `code_to_design` failed or the result mismatched, `pixso-design` / `apply_design` was not used before user confirmation;
- design-system alignment, if requested, was routed to `pixso-design-system`.
