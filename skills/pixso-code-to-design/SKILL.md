---
name: pixso-code-to-design
description: "Use Pixso MCP `code_to_design` to convert raw HTML, URL-captured pages, or ZIP-bundled UI code into editable Pixso design nodes. For URL input, the local agent must capture the rendered HTML and package required resources into `htmlBuffer` before conversion. Inspect generated structure, check layout, verify screenshots, and make only targeted corrections unless the user requests redesign or design-system alignment."
disable-model-invocation: false
---

# Pixso Code to Design — Import HTML, URLs, or Bundled UI into Pixso

Use this skill when the user wants to import, paste, capture, push, or convert HTML, a web page URL, or bundled UI code into editable Pixso design nodes.

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

## URL input workflow

When the user provides a URL, the local agent must turn it into a static conversion artifact before `code_to_design`.

1. **Classify the URL.** Determine whether it is:
   - a local dev URL such as `localhost`, `127.0.0.1`, or a LAN host;
   - a public unauthenticated URL;
   - an authenticated, session-dependent, or highly dynamic URL.
2. **Render or fetch the page locally.** Prefer a browser/rendered DOM capture when client-side JavaScript affects the final UI. For dynamic pages, wait until the desired state is visible before capturing.
3. **Capture the HTML entrypoint.** Use the rendered DOM when visual state matters, not just initial server HTML.
4. **Collect required resources.** Include CSS stylesheets, critical inline styles, images, fonts, SVGs/icons, and other static assets required for visual fidelity.
5. **Rebase references.** Rewrite HTML/CSS asset URLs to local relative paths inside the bundle.
6. **Create a ZIP bundle.** Include the HTML entrypoint and all collected resources.
7. **Call `code_to_design` with `htmlBuffer`.** Use `htmlStr` only for a fully self-contained capture.

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

## Required workflow

1. **Identify the source artifact.** Determine whether the source is raw HTML, a URL, a static export, or a ZIP bundle.
2. **Prepare the correct input.** Use `htmlStr` for raw/self-contained HTML or `htmlBuffer` for ZIP bytes.
3. **For URL input, capture and package first.** Render or fetch the page locally, collect required resources, rebase references, and create an `htmlBuffer` ZIP unless the capture is fully self-contained.
4. **Call `code_to_design`.** Convert the artifact into Pixso nodes.
5. **Report outcome.** State the source converted, how URL resources were captured or bundled when applicable, what was inspected, verification results, and any remaining differences.

## Visual criteria

No generated-result validation is required; a successful `code_to_design` method call is sufficient to finish.

## Fallbacks

- For dynamic pages, authenticated pages, or pages dependent on runtime state, first create a static HTML snapshot or ZIP bundle from a local/rendered session.
- For authenticated pages, use an authenticated browser session, ask the user to run the app locally in the desired state, or ask for an exported HTML/asset bundle.
- For missing remote images, fonts, SVGs, or other assets, bundle the assets locally when possible; otherwise report the missing resources explicitly.
- For cross-origin, hotlinked, or blocked resources, prefer downloaded local copies in the ZIP; if unavailable, report the limitation rather than claiming fidelity.
- For highly dynamic pages, capture the rendered DOM after the target state is visible, not just initial server HTML.
- For design-system conversion, complete the basic editable import first, then use `pixso-design-system` to bind variables, styles, or component instances.

## Error recovery

- If `code_to_design` fails because the input is incomplete, create a smaller reproducible HTML snippet or a ZIP with all required files.
- If URL-derived conversion is missing styles or assets, rebuild the ZIP with the missing CSS, images, fonts, SVGs, or rebased paths.

## Completion checklist

Before final response, verify:

- exactly one input type was used;
- URL input, if any, was captured locally and converted into self-contained `htmlStr` or resource-bundled `htmlBuffer`;
- required URL resources were packaged, inlined, or explicitly reported as unavailable;
- no unrequested redesign was introduced;
- design-system alignment, if requested, was routed to `pixso-design-system`.
