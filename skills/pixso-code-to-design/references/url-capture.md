# URL Capture Reference

Use this reference when `pixso-code-to-design` handles URL input. The goal is to turn the rendered page into a static artifact that `code_to_design` can consume while avoiding agent-side manual downloading of every page resource.

## State Gate

After rendering the URL, first confirm whether the target content is visible. If the page shows a login, permission, error, empty state, or the target content is hidden by authentication, session, region, anti-abuse controls, or similar access limits, ask whether to import the current state or provide the target state. Do not call `code_to_design` before confirmation.

## Preferred Capture Method

Prefer the browser's native complete webpage save output, equivalent to Ctrl+S / Save Page As / Webpage Complete. Use the browser-rendered state confirmed by the user as the source of truth, saving the HTML entrypoint and the browser-generated resource directory.

Do not manually crawl or download every URL in the page by default.

## Packaging Rules

Package the browser-saved HTML entrypoint and resource directory into a ZIP, then pass it to `code_to_design` as `htmlBuffer`. Use `htmlStr` only when the capture is fully self-contained, or when external resources are intentionally omitted and that limitation is explicitly reported.

If the browser can only produce MHTML, use it directly only when the downstream converter supports MHTML. Otherwise convert it to HTML plus a local resource directory, or report the limitation.

## Resource Collection Fallback

Only collect resources manually when browser complete-save is unavailable or the saved artifact is clearly missing visual content. Fallback collection must be based on DOM / CSS source types; do not scan the full HTML with a broad URL regex.

Collect only resources that affect the current rendered visual output:

- `img[src]`, `img[srcset]`, and `picture source[srcset]`;
- visible media posters and SVG/icon references required by rendered UI;
- CSS `url(...)` values from inline styles and stylesheets;
- `@font-face src`.

Do not collect non-visual resources such as `a[href]`, `form[action]`, script/API/analytics/redirect URLs, meta/link preview data, plain-text URLs, or license/download/external document links.

Every downloaded resource must record its usage source, such as `img.src`, `css.background-image`, or `font-face.src`. For any single resource larger than 2 MB, first confirm whether it is visible or required for visual fidelity. Skip non-visual resources, and prefer bundling visually required resources as files instead of base64 inlining.

## Pre-Call Input Gate

Before calling `code_to_design`, confirm that the argument is the final artifact, not a placeholder, variable name, file path, or summary. `htmlStr` must contain the target HTML and key page content; `htmlBuffer` must be real ZIP bytes.

Do not pass `PLACEHOLDER`, `TODO`, an empty body, or a temporary stub that is not the user's target artifact. If the artifact is too large, use `htmlBuffer` instead of placeholder `htmlStr`. A simple test page or demo page is valid when the user explicitly wants that page imported.

## Failure Boundary

If `code_to_design` fails, the wrong input was passed, or the result clearly mismatches the target, first tell the user the failure reason and available next steps. Do not switch to `pixso-design` / `apply_design` without user confirmation.
