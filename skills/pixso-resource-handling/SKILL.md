---
name: pixso-resource-handling
description: "Save Pixso generated files, download assets and fonts, and replace temporary localhost URLs after design_to_code."
disable-model-invocation: false
---

# Pixso Resource Handling

Use this skill immediately after `design_to_code` returns generated files or temporary resource URLs.

## Required inputs

- `pageEntries` from `design_to_code`
- `codeEntries` from `design_to_code`
- Any generated code that references `http://localhost:PORT/assets/...`

## Do not

- Do not leave generated files as remote-only MCP entries.
- Do not leave temporary localhost asset URLs in committed project code.
- Do not skip font downloads when generated CSS references Pixso font assets.
- Do not invent paths when the manifest provides paths.

## Required workflow

1. Save every `pageEntries` file.
2. Save every `codeEntries` file.
3. Scan saved files for temporary localhost asset URLs.
4. Download all referenced images.
5. Download all referenced fonts.
6. Replace temporary localhost URLs with project-relative paths.
7. Preserve manifest paths when present.
8. If no path exists, derive a conventional path from `id`, `name`, or framework conventions.

## Known temporary endpoints

Pixso MCP may expose URLs like:

- `/code/:batchTs`
- `/code/:batchTs/:id`
- `/assets/:batchTs/:filename`

## Framework conventions

- React images: `src/assets/images/`; fonts: `src/assets/fonts/`
- Vue images: `src/assets/images/`; fonts: `src/assets/fonts/`
- Flutter images: `assets/images/`; fonts: `assets/fonts/`
- ArkUI images: `entry/src/main/resources/base/media/`
