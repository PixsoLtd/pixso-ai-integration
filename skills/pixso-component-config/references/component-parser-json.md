# Component Parser JSON Reference

Read this reference when generating Pixso Design-to-Code component parser config.

## Output shape

Output a plain component parser object by default:

```json
{
  "__imports__": {},
  "@icons": {},
  "Button": {
    "name": "px-button",
    "props": {},
    "text": { "nodeName": "_text" }
  }
}
```

Do not wrap the result in `codeOptions` unless the user explicitly asks for that wrapper.

## Global keys

- `__imports__`: map output tag names to import declarations.
- `__mainImports__`: optional project-level / global style imports.
- `__package__`: optional project dependency declarations.
- `@icons`: shared render rules for icon-prefix layers.
- `@text`: shared render rules for raw TEXT nodes.

Import declaration:

```json
{ "from": "@pixso/component/es", "named": "PxButton" }
```

## Component rule fields

- `name`: output tag name.
- `props`: read variant props from Pixso component instances.
- `props.filter`: filter only **cross-prop generic** variant values (default `md` / `default` / `false`); it cannot filter by key, and prop-specific values should not be placed in filter.
- `props.showTrueValue`: preserve explicit boolean `true` output.
- `props.customProps`: add fixed props or props backed by object aggregation results.
- `props.mappings`: variant key/value mapping. If the mapped output key or value is `""`, suppress it (entire axis: `"PropName": ""` / `{ "name": "" }`; single value: `""` in `values`). `filter` runs before mappings.
- `text`: extract copy from child text nodes.
- `icon`: extract icons from child icon layers.
- `attr`: map visual values to props.
- `traverse`: allow child nodes to keep rendering.
- `object`: aggregate child components into array data.
- `tableData`: aggregate table rows / cells into data.

## Safe defaults

Default prop filter (only cross-prop generic values):

```json
["md", "default", "false"]
```

Prop-specific default suppression example:

```json
{
  "Type": {
    "name": "type",
    "values": {
      "primary": "primary",
      "secondary": ""
    }
  },
  "DocumentationTag": ""
}
```

Common text probes:

```json
[
  { "nodeName": "_text" },
  { "nodeName": "_label" },
  { "nodeName": "label" },
  { "nodeName": "text" }
]
```

Common placeholder probes:

```json
[
  { "nodeName": "_text", "textAttr": "placeholder" },
  { "nodeName": "placeholder", "textAttr": "placeholder" }
]
```

Common icon config:

```json
{
  "nodeName": { "name": "icon", "deepFind": true },
  "attrName": "icon",
  "getComponentName": true
}
```

Common `@icons` config:

```json
{
  "width": { "stylePrefix": "fontSize", "filter": ["16px"] },
  "height": { "stylePrefix": "height", "filter": ["16px"] },
  "background": { "stylePrefix": "color" }
}
```

## Do not guess

- Do not invent `attr.mappings` without confirmed visual values and target prop semantics.
- Do not invent `props.mappings` without confirmed variant names/values and target prop correspondence.
- Do not invent `text.nodeName` for every component from component metadata alone.
- Do not map private / helper / legacy components unless the target codebase has a matching public component.
- Do not import icon components separately unless the generated rules actually reference them.
