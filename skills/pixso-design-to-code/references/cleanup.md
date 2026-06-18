# Pixso Design-to-Code Cleanup Reference

Use after `design_to_code` and asset localization. Only clean generated class / id / style noise. Do not reimplement the design or change the visual result.

## Goal

- Complete Phase A mechanical cleanup before Phase B semantic cleanup.
- Delete unreferenced Pixso node-style `id` values, such as `id="17_332"`.
- Replace Pixso node-style classes such as `frame-*`, `vector-*`, `group-*`, `rectangle-*`, `text-*`, and `paragraph-*` with short semantic class names.
- Replace class names in DOM / templates / JSX and CSS / style selectors together.
- Preserve layout, size, color, font, spacing, hierarchy, images, icons, radius, shadows, state styles, and responsive behavior.

## Phase A — mechanical cleanup, do not skip

1. Scan temporary asset URLs: `localhost`, short-lived Pixso export URLs, or other known temporary asset paths; replace what can be localized and explain what cannot.
2. Scan Pixso node-style `id` values such as `id="17_332"` and `id="6_24"`.
3. Treat Pixso node-style `id` values as generated noise by default; delete them when they are not referenced by CSS, JavaScript, tests, anchors, ARIA, `label for`, or external logic.
4. Scan Pixso node-style class leftovers such as `frame-*`, `vector-*`, `group-*`, `rectangle-*`, `text-*`, and `paragraph-*`.
5. Phase A must produce audit results: found count, removed / replaced count, retained count, and retained-item reasons.

## Phase B — semantic cleanup

1. Scan all DOM / templates / JSX for `class`, `className`, dynamic classes, and CSS Modules references.
2. Scan CSS / style / scoped style / CSS Modules selectors, including media queries, pseudo-classes, pseudo-elements, and compound selectors.
3. Build a map from old Pixso-generated class names to new semantic class names.
4. Replace DOM / template / JSX class references and CSS / style selectors in pairs.
5. Delete old class / CSS rules only after confirming they are no longer referenced.
6. Keep uncertain dynamic classes, external references, and state classes; report why they were kept.

## Semantic rename scope

Semantic cleanup is a rename operation, not class architecture design.

- Preserve class token count for every element.
- One old class token maps to exactly one new class token.
- Do not add, remove, split, or combine class tokens during semantic renaming.
- Do not create base + modifier combinations such as `bottom-tab messages-tab`.
- Do not create inferred state names containing `active`, `selected`, `current`, `disabled`, `open`, or `is-`.
- Do not create new state selectors unless the generated code already contains that state or the user explicitly requests it.
- If a state class already exists, rename it only with matching DOM / CSS paired replacement.

## Multi-file note

When one task generates multiple files, run Phase A and Phase B separately for each file. Cleanup completion for one file does not satisfy cleanup for another file. Report audit counts per file.

## Naming rules

Use short, stable names that match the visual purpose and project style.

Examples:

- `frame-6_23` -> `hero-card`, `profile-panel`, `nav-item`
- `vector-6_24` -> `search-icon`, `arrow-icon`, `decorative-shape`
- `text-4_15` -> `section-title`, `button-label`
- `rectangle-9_2` -> `card-background`, `divider-line`

Avoid overly long names such as `home-page-main-content-hero-section-left-card-wrapper-container`.

## Forbidden

- Do not replace DOM classes without replacing matching CSS / style selectors.
- Do not replace CSS / style selectors without replacing matching DOM classes.
- Do not delete classes, CSS rules, or DOM `id` values before scanning references.
- Do not retain unreferenced Pixso node-style `id` values without explaining why.
- Do not delete names still referenced by CSS, JavaScript, tests, animations, responsive rules, ARIA, anchors, `label for`, or dynamic class composition.
- Do not change CSS declarations, selector priority, state styles, responsive behavior, or visual appearance for class semanticization.
- Do not rewrite the whole `design_to_code` output in the name of cleanup.
- Do not introduce unrequested dependencies, CSS frameworks, component libraries, design systems, or naming systems.

## Compact example

Input:

```html
<div id="17_332" class="frame-6_23">
  <div id="17_333" class="vector-6_24"></div>
  <div class="text-6_25">Search</div>
</div>
```

```css
.frame-6_23 { display: flex; gap: 8px; }
.vector-6_24 { width: 16px; height: 16px; }
.text-6_25 { font-size: 14px; }
```

Correct:

```html
<div class="search-button">
  <div class="search-icon"></div>
  <div class="search-label">Search</div>
</div>
```

```css
.search-button { display: flex; gap: 8px; }
.search-icon { width: 16px; height: 16px; }
.search-label { font-size: 14px; }
```

Wrong:

- DOM uses `search-button` but CSS still uses `.frame-6_23`.
- CSS uses `.search-button` but DOM still uses `frame-6_23`.
- Unreferenced `id="17_332"` and `id="17_333"` are retained without explanation.
- Cleanup changes `display: flex; gap: 8px` to `display: grid; gap: 12px`.

## Framework notes

- JSX: replace `className`.
- Vue scoped styles: replace template classes and scoped style selectors together.
- CSS Modules: replace both `styles.foo` references and CSS module class keys.
- Dynamic classes: replace only confirmed static class parts.

## Completion check

- Phase A reported found / removed or replaced / retained counts for temporary URLs, Pixso node-style `id` values, and Pixso node-style classes.
- Unreferenced Pixso node-style `id` values were deleted; retained items have explicit reference reasons.
- Phase B built class mappings and completed DOM / CSS paired replacement; retained items have reasons.
- Class token counts are unchanged before and after semantic renaming.
- No new inferred state / modifier classes were introduced during semantic cleanup.
- Every renamed class token has a matching CSS selector, and no accidental selectors such as `.foo bar` were introduced.
- CSS declarations, selector priority, state styles, responsive behavior, and visual output were preserved.
- No unrequested dependency, framework, component library, design system, or naming system was introduced.
