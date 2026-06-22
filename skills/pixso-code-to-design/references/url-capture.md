# URL Capture Reference

Use this reference when `pixso-code-to-design` handles URL input: turn a rendered page into a static artifact that `code_to_design` can consume, while avoiding default manual downloads of every page resource.

## State Gate

After rendering the URL, first confirm whether the target content is visible. If the page shows login, permission, error, empty state, or target content hidden by authentication, session, region, anti-abuse controls, security policy, iframes, or similar limits, ask whether to import the current state, provide the target state, or allow approximate reconstruction. Do not call `code_to_design` before confirmation.

If the browser, runtime, or security policy blocks access to the target URL, treat it as a capture blocker. Do not bypass the policy or use approximate HTML as if it were a capture result; report the blocker and available next steps.

## Preferred Capture Method

Prefer the browser's native complete webpage save output, equivalent to Ctrl+S / Save Page As / Webpage Complete. Use the confirmed browser-rendered state as the source of truth, saving the HTML entrypoint and generated resource directory. Do not manually crawl every URL on the page by default.

## Packaging Rules

Package the browser-saved HTML entrypoint and resource directory into a ZIP, then pass it to `code_to_design` as `htmlBuffer`. Use `htmlStr` only when the capture is self-contained, or when external resources are intentionally omitted and explicitly reported. If the browser can only produce MHTML, use it directly only when the downstream converter supports MHTML; otherwise convert it to HTML plus a local resource directory, or report the limitation.

## Resource Collection Fallback

Only collect resources manually when browser complete-save is unavailable or the saved artifact is clearly missing visual content. Collection must be based on DOM / CSS source types; do not scan the full HTML with a broad URL regex.

Collect only resources that affect the current rendered visual output:

- `img[src]`, `img[srcset]`, and `picture source[srcset]`;
- visible media posters and SVG/icon references required by rendered UI;
- CSS `url(...)` values from inline styles and stylesheets;
- `@font-face src`.

Do not collect non-visual resources such as `a[href]`, `form[action]`, script/API/analytics/redirect URLs, meta/link preview data, plain-text URLs, license links, download links, or external document links.

Record the usage source for each downloaded resource, such as `img.src`, `css.background-image`, or `font-face.src`. For any single resource larger than 2 MB, first confirm whether it is visible or visually required.

## Pre-Call Input Gate

Before calling `code_to_design`, confirm that the argument is the final artifact, not a placeholder, variable name, file path, or summary. `htmlStr` must contain the target HTML and key page content; `htmlBuffer` must be real ZIP bytes. Do not pass `PLACEHOLDER`, `TODO`, an empty body, or a temporary stub that is not the target artifact.

## Failure Boundary

If `code_to_design` fails, the wrong input was passed, or the result clearly mismatches the target, first tell the user the failure reason and available next steps. Do not switch to `pixso-design`, `apply_design`, or hand-written approximate HTML without user confirmation.

Typical next options:

- ask the user for an accessible static export or complete webpage save;
- ask the user to log in and provide the locally saved rendered page;
- retry capture of the current visible state;
- generate an approximate Pixso design only after explicit user approval.
