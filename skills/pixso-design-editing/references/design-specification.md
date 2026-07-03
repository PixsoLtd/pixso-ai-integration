# Design Specification Extraction

Use this reference only after the requested draft/design work is complete and the user explicitly asks for specs, design system, showcase board, component library, component specs, token extraction, style documentation, or visual spec panels.

## Scope Mapping

- color → Color
- typography/font → Typography
- spacing → Spacing
- radius/corner → Radius
- shadow/effect → Effects
- icon → Icons
- component/library/component extraction → Components only
- design system/full/generic specs → Color, Typography, Spacing, Radius, used Effects/Icons, useful Components

## Source-Bound Extraction And Write-Back

Non-component spec items are valid only when bound to pre-spec draft nodes, never only to the spec board. Raw draft values must be resourceized, written back with `U()`, then documented with the same key:

- Color: variable on draft `fillPaints` / `strokePaints`.
- Typography: `$style/...` on draft text `textStyle`.
- Effects: `$style/...` on draft node `effects`.
- Spacing: number variable on draft autoLayout `gap` / `padding`.
- Radius: number variable on draft `cornerRadius`.

Existing resources may be documented only when already bound to the correct draft property. Never create board-only tokens/styles.

## Showcase Board Modules

Always include Header (`Design Specification`) and only requested sections.

- Color: swatch, token name, value/hex, usage; swatch uses the verified color variable.
- Typography: role/name, family, weight, size, line height, sample; only verified `textStyle` rows.
- Spacing: token, value, usage, visual demo; gap demos use autoLayout with 2+ child blocks, padding demos use a padded autoLayout container. Do not use standalone widths/heights as spacing proof.
- Radius: token, value, usage, rounded sample; only verified `cornerRadius` variables.
- Effects: style name, value summary, usage, sample block; only verified `effects` styles.
- Icons: actual used icon name/family/size/color/usage; do not invent unused icons.
- Components: document real registered components, instances, repeated modules, or clear draft patterns. Repeated cards/nav/tabs/list rows/buttons/search rows count. Use representative examples, masters, instances, variants, or concise notes when useful; do not invent unrelated components.
