---
name: pixso-code-to-design
description: "Use Pixso MCP `code_to_design` to convert raw HTML, URL-captured pages, or ZIP-bundled UI code into editable Pixso design nodes. For URL input, the local agent must capture the rendered HTML and package required resources into `htmlBuffer` before conversion. Inspect generated structure, check layout, verify screenshots, and make only targeted corrections unless the user requests redesign or design-system alignment."
disable-model-invocation: false
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
- For URL-derived pages with external CSS, images, fonts, SVGs, icons, scripts needed for rendered state, or other assets, default to a ZIP bundle and pass it as `htmlBuffer`.
- Use `htmlStr` for URL-derived pages only when the captured HTML is self-contained, with critical CSS and required assets inlined or intentionally omitted with an explicit note.
- Keep linked assets local to the bundle when possible. Remote, cross-origin, hotlinked, or authenticated assets may not resolve reliably.
- If the source is a live app page, produce or request a static HTML/asset export before calling `code_to_design`.

## Pre-call input gate

Before calling `code_to_design`, confirm that the argument is the final artifact, not a placeholder, variable name, file path, or summary. `htmlStr` must contain the target HTML and key page content; `htmlBuffer` must be real ZIP bytes. Do not pass `PLACEHOLDER`, `TODO`, an empty body, or a temporary stub that is not the user's target artifact. If the artifact is too large, use `htmlBuffer` instead of placeholder `htmlStr`. A simple test page or demo page is valid when the user explicitly wants that page imported.

## URL input workflow

When the user provides a URL, the local agent must turn it into a static conversion artifact before `code_to_design`.

1. **Classify the URL.** Determine whether it is:
   - a local dev URL such as `localhost`, `127.0.0.1`, or a LAN host;
   - a public unauthenticated URL;
   - an authenticated, session-dependent, or highly dynamic URL.
2. **Render or fetch the page locally.** Prefer a browser/rendered DOM capture when client-side JavaScript affects the final UI. For dynamic pages, wait until the desired state is visible before capturing.
3. **Confirm rendered state.** If the page shows login, permission, error, empty state, or the target content is not visible, ask whether to import the current state or provide the target state; do not call `code_to_design` before confirmation.
4. **Capture the HTML entrypoint.** Use the rendered DOM when visual state matters, not just initial server HTML.
5. **Collect required resources.** Include CSS stylesheets, critical inline styles, images, fonts, SVGs/icons, and other static assets required for visual fidelity.
6. **Rebase references.** Rewrite HTML/CSS asset URLs to local relative paths inside the bundle.
7. **Create a ZIP bundle.** Include the HTML entrypoint and all collected resources.
8. **Call `code_to_design` with `htmlBuffer`.** Use `htmlStr` only for a fully self-contained capture.

## Resource collection rules

For URL-to-design capture, collect only resources that affect the current rendered visual output. Do not discover resources with a broad regex over the full HTML; extract by DOM / CSS source type. URLs outside the allowlist are not downloaded, inlined, or bundled by default.

Collect only:

- `img[src]`, `img[srcset]`, and `picture source[srcset]`;
- visible media posters and SVG/icon references required by rendered UI;
- CSS `url(...)` values from inline styles and stylesheets;
- `@font-face src`.

Do not collect non-visual resources such as `a[href]`, `form[action]`, script/API/analytics/redirect URLs, meta/link preview data, plain-text URLs, or license/download/external document links.

Every downloaded resource must record its usage source, such as `img.src`, `css.background-image`, or `font-face.src`. For any single resource larger than 2 MB, first confirm whether it is visible or required for visual fidelity; skip non-visual resources, and prefer bundling visually required resources as files instead of base64 inlining.

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
3. **For URL input, capture and package first.** Render or fetch the page locally, collect required resources, rebase references, and create an `htmlBuffer` ZIP unless the capture is fully self-contained.
4. **Call `code_to_design`.** Convert the artifact into Pixso nodes.
5. **Report outcome.** State the source converted, how URL resources were captured or bundled when applicable, what was inspected, verification results, and any remaining differences.

## Visual criteria

No generated-result validation is required; a successful `code_to_design` method call is sufficient to finish.

## Fallbacks

- For dynamic pages or pages dependent on runtime state, first create a static HTML snapshot or ZIP bundle from a local/rendered session.
- For login, permission, or inaccessible pages, first ask whether to import the current state or target state. If the user wants the target state, use an authenticated session, a local target state, or a user-provided HTML/resource bundle.
- For missing remote images, fonts, SVGs, or other assets, bundle the assets locally when possible; otherwise report the missing resources explicitly.
- For cross-origin, hotlinked, or blocked resources, prefer downloaded local copies in the ZIP; if unavailable, report the limitation rather than claiming fidelity.
- For highly dynamic pages, capture the rendered DOM after the target state is visible, not just initial server HTML.
- For design-system conversion, complete the basic editable import first, then use `pixso-design-system` to bind variables, styles, or component instances.

## Error recovery

- If `code_to_design` fails because the input is incomplete, create a smaller reproducible HTML snippet or a ZIP with all required files.
- If URL-derived conversion is missing styles or assets, rebuild the ZIP with the missing CSS, images, fonts, SVGs, or rebased paths.
- If conversion fails, the wrong input was passed, or the result clearly mismatches, tell the user the failure reason and next options. Do not switch to `pixso-design` / `apply_design` without user confirmation.

## Completion checklist

Before final response, verify:

- exactly one input type was used;
- the `code_to_design` argument was final `htmlStr` or real `htmlBuffer`, not a placeholder, variable name, path, or temporary stub;
- URL input, if any, was captured locally and converted into self-contained `htmlStr` or resource-bundled `htmlBuffer`;
- if URL rendering showed login, permission, error, or empty state, user confirmation was obtained first;
- resource collection was DOM / CSS source-aware, not broad-regex based; no non-visual URLs such as `a[href]` were downloaded;
- required URL resources were packaged, inlined, or explicitly reported as unavailable;
- no unrequested redesign was introduced;
- if `code_to_design` failed or the result mismatched, `pixso-design` / `apply_design` was not used before user confirmation;
- design-system alignment, if requested, was routed to `pixso-design-system`.
