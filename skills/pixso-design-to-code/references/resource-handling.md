# Pixso Resource Handling

Use this reference immediately after `design_to_code` returns generated files or temporary asset URLs: save generated files, download images / fonts, and replace temporary localhost URLs with project-relative paths. Prefer `resource-fetch.mjs` for fetching code, downloading assets, and replacing URLs to avoid manual trial-and-error and slow serial fetching.

## Required inputs

- `pageEntries` returned by `design_to_code`
- `codeEntries` returned by `design_to_code`
- Generated code that references `http://localhost:PORT/assets/...`

## Required workflow

1. Save every `pageEntries` file.
2. Save every `codeEntries` file.
3. Scan saved files for temporary localhost asset URLs.
4. Download all images.
5. Download all fonts.
6. Replace temporary localhost URLs with project-relative paths.
7. Prefer manifest paths when present.
8. If no path is present, infer the path from `id`, `name`, or framework conventions.

> Prefer `resource-fetch.mjs` for steps 1-6: fetching code, downloading images / fonts, and replacing URLs. If the script fails, fall back to manual handling using the strategy below. Steps 7-8 and framework-specific conversion still belong to the main workflow.

## Recommended script: `resource-fetch.mjs`

The script only fetches code, downloads assets, and replaces URLs. It does not perform framework-specific conversion, such as HTML to WXML or component abstraction. It applies to any target framework: react / vue / html / flutter / arkui, including HTML bridge flows.

### Cross-platform principle

- Windows PowerShell and macOS / Linux bash/zsh differ in quoting, command aliases (`curl` is an `Invoke-WebRequest` alias in PowerShell), and path separators, which are common sources of manual fetching failures.
- The script uses Node built-in APIs and `path.join` throughout, with no shell dependency, so one implementation behaves consistently on Windows / macOS / Linux.
- Do not rewrite the script as PowerShell / bash; run the Node script consistently.

### Usage

```bash
node references/resource-fetch.mjs \
  --host http://localhost:3667 \
  --batch 1782715248952 \
  --nodes 144:2200 \
  --out-dir ./miniprogram \
  --img-dir ./miniprogram/assets/images \
  --font-dir ./miniprogram/assets/fonts \
  --img-prefix assets/images/ \
  --font-prefix assets/fonts/
```

- Extract `--host` and `--batch` from URLs returned by `design_to_code`. They change for every task, so pass returned values and do not hardcode them.
- Use comma-separated node GUIDs for `--nodes`.
- Adjust asset directories and relative prefixes according to the framework conventions below.
- For multi-file frameworks such as react / vue, use manifest `path` values when the manifest provides explicit paths.

### Fallback strategy

The script degrades from light to heavy fallbacks while preserving completed progress as much as possible:

1. **Transport layer:** prefer Node built-in `fetch` (Node 18+); automatically fall back to `node:http` / `node:https` when unavailable.
2. **Single request:** retry each failed request with exponential backoff, defaulting to 3 attempts.
3. **Failure isolation:** one asset download failure does not block other assets; record it in the failure list and continue.
4. **Whole-run fallback:** if failures remain at the end, write `resource-manifest.json`, print manual download commands for Windows (`Invoke-WebRequest`) and macOS / Linux (`curl`), and exit with a non-zero code.
5. **Outer fallback:** if the Node environment itself is unavailable, the script cannot self-heal; manually download from the generated manifest or the URLs returned by `design_to_code`, and report missing assets in the final response.

## Known temporary endpoints

- `/code/:batchTs`
- `/code/:batchTs/:id`
- `/assets/:batchTs/:filename`

## Framework conventions

- React images: `src/assets/images/`; fonts: `src/assets/fonts/`
- Vue images: `src/assets/images/`; fonts: `src/assets/fonts/`
- Flutter images: `assets/images/`; fonts: `assets/fonts/`
- ArkUI images: `entry/src/main/resources/base/media/`

## Forbidden

- Do not leave generated files only in remote MCP entries.
- Do not keep temporary localhost asset URLs in project code.
- Do not skip font downloads when generated CSS references Pixso font assets.
- Do not invent paths when the manifest provides paths.
- Do not put logic other than fetching / downloading / replacement into the script, including framework conversion, component abstraction, design systems, or cleanup refactoring.
- Do not hardcode `host` / `batch`; pass them from `design_to_code` return values.
- Do not deliver immediately after script failure; fall back using the strategy and report missing assets.

## Completion check

- All code files are saved, and temporary URLs are replaced with project-relative paths.
- All images / fonts are localized; failed items are recorded in `resource-manifest.json` and reported.
- Code files contain no remaining temporary `localhost` URLs, or unlocalized items and reasons are clearly reported.
