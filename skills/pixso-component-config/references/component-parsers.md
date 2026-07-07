# Component Parser Configuration Guide

Component parsers (`componentParsers`) are the core Design-to-Code configuration used to map component instances in a Pixso design to component tags and props in a target framework. A parser JSON controls output tag names, imports, props, text extraction, icons, child traversal, object aggregation, and table data.

## Table of contents

- [Quick Start](#quick-start)
- [Configuration Shape](#configuration-shape)
- [Import Declarations](#import-declarations)
- [Component Rules](#component-rules)
- [name](#name)
- [props](#props)
- [text](#text)
- [icon](#icon)
- [attr](#attr)
- [traverse](#traverse)
- [object](#object)
- [tableData](#tabledata)
- [Shared Icon Config](#shared-icon-config)
- [Shared Text Config](#shared-text-config)
- [Complete Example](#complete-example)
- [Field Reference](#field-reference)

## Quick Start

### Minimum config

Render a design component named `Button` as `<el-button>`:

```json
{
  "__imports__": {
    "el-button": { "from": "element-plus", "named": "ElButton" }
  },
  "Button": {
    "name": "el-button"
  }
}
```

Vue output:

```vue
<template>
  <el-button></el-button>
</template>
<script setup>
import { ElButton } from "element-plus";
</script>
```

React output:

```jsx
import { ElButton } from "element-plus";

export default function Page() {
  return <ElButton></ElButton>;
}
```

### Component matching

Parser keys such as `"Button"` are matched against design component names after normalization:

- convert to lowercase
- remove all spaces

The following names all match the `"Button"` rule: `Button`, `button`, `BUTTON`, and `But ton`.

Prefer matching by design component `aliasName`. If no alias exists, use `componentNormName`.

## Configuration Shape

```text
componentParsers: {
  "__imports__": { ... },
  "__mainImports__": [ ... ],
  "__package__": { ... },
  "@icons": { ... },
  "@text": { ... },
  "ComponentA": { ... },
  "ComponentB": { ... }
}
```

Reserved keys:

| Key | Type | Meaning |
| --- | --- | --- |
| `__imports__` | `Record<string, ImportDeclaration>` | Global import declarations, indexed by output tag name. |
| `__mainImports__` | `ImportDeclaration[]` | Project-level or global style imports. |
| `__package__` | object | Dependency declarations for the generated project. |
| `@icons` | `PublicIconsConfig` | Render rules for icon-prefix layers. |
| `@text` | `PublicTextConfig` | Render rules for raw TEXT nodes. |

Every other key is treated as a component parser rule.

### Optional global behavior

`slot_prefix`

When a child layer name starts with the slot prefix, it renders as a slot. Default is usually `#`.

```text
Dialog
├── _title
├── _body
└── #footer
    ├── Button 1
    └── Button 2
```

Vue output:

```vue
<el-dialog>
  <template #footer>
    <el-button>Cancel</el-button>
    <el-button>Confirm</el-button>
  </template>
</el-dialog>
```

React output:

```jsx
<ElDialog footer={<><ElButton>Cancel</ElButton><ElButton>Confirm</ElButton></>}>
</ElDialog>
```

`icon_prefix`

When a child layer name starts with `icon_prefix`, the layer renders as an icon component. The prefix is removed and the remaining name is converted to PascalCase.

```text
Design layer: @arrow-down
Output component: <ArrowDown />
```

This requires matching `@icons` and `__imports__` rules.

`ignore_prefixes`

Layers whose names start with one of these prefixes are skipped and do not appear in output code. Use this for decorative layers or helper annotations.

```json
{ "ignore_prefixes": ["_", "."] }
```

Examples: `_background` and `.helper-line` are skipped.

`ignore_component`

Components in this list do not generate independent `.vue` / `.tsx` files, and their instances do not render in page output.

```json
{ "ignore_component": ["Decorator", "Placeholder"] }
```

## Import Declarations

Register imports for every component tag used in output. The key is the output tag name, matching the `name` field or an icon component name.

```json
{
  "__imports__": {
    "el-button": { "from": "element-plus", "named": "ElButton" },
    "el-input": { "from": "element-plus", "named": "ElInput" },
    "SearchIcon": { "from": "@element-plus/icons-vue", "named": "SearchIcon" }
  }
}
```

Import declaration fields:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `from` | `string` | yes | Package path, such as `"element-plus"`. |
| `named` | `string` | no | Named import, such as `"ElButton"`. |
| `default` | `boolean` | no | Whether to use default import. |

Generated examples:

| Config | Output |
| --- | --- |
| `{ "from": "element-plus", "named": "ElButton" }` | `import { ElButton } from "element-plus"` |
| `{ "from": "antd", "default": true }` | `import antd from "antd"` |
| `{ "from": "style.css" }` | `import "style.css"` |

## Component Rules

Supported fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Output tag name. |
| `props` | `PropsConfig` | Variant prop extraction. |
| `text` | `TextConfig | TextConfig[]` | Text extraction. |
| `icon` | `IconConfig | IconConfig[]` | Icon extraction. |
| `attr` | `AttrConfig | AttrConfig[]` | Visual style to prop mapping. |
| `traverse` | `TraverseConfig` | Child traversal control. |
| `object` | `ObjectConfig` | Aggregate child instances into arrays. |
| `tableData` | `TableDataConfig` | Aggregate table layers into row data. |

## name

Replace the design component name with the target framework component tag.

```json
{
  "Button": {
    "name": "el-button"
  }
}
```

A `Button` instance in the design outputs `<el-button>` instead of the default `<Button>`.

The `name` value should have a matching declaration in `__imports__` when imports are needed.

## props

Read values from design component variant props and output them as component props.

```typescript
interface PropsConfig {
  filter?: string[];
  showTrueValue?: boolean;
  customProps?: Record<string, string>;
  mappings?: Record<string, PropMappingConfig>;
}
```

### Basic usage

```json
{
  "Button": {
    "name": "el-button",
    "props": {}
  }
}
```

If the design Button has variant props `size=large, type=primary`, Vue output is:

```vue
<el-button size="large" type="primary">
```

### `filter`

`props.filter` filters **variant values**, not prop keys. It runs **before mappings** and applies globally to **all variant props**.

Common defaults are `"md"`, `"default"`, and `"false"`.

```json
{
  "Button": {
    "name": "el-button",
    "props": {
      "filter": ["md", "default", "false"]
    }
  }
}
```

Variant `size=md` is filtered out and not emitted.

Use it for cross-prop generic raw defaults. Do not use it for prop-specific values; suppress those through mappings with an empty output value.

#### Empty-value suppression in mappings

After mappings are applied, if the output key or output value is `""`, that prop is not emitted.

| Form | Meaning |
|------|---------|
| `"DocTag": ""` | Suppress the whole variant axis |
| `{ "name": "" }` | Suppress the whole variant axis |
| `values: { "secondary": "" }` | Suppress only that value |

### `showTrueValue`

Boolean `true` is shorthand by default. Set `showTrueValue` to `true` to output explicit values.

| `showTrueValue` | Vue output | React output |
| --- | --- | --- |
| `false` default | `<el-checkbox disabled>` | `<ElCheckbox disabled>` |
| `true` | `<el-checkbox :disabled="true">` | `<ElCheckbox disabled={true}>` |

### `customProps`

Use `customProps` for fixed props or values from `object` aggregation. A value in `"{name}"` form references the child object array named `name`.

```json
{
  "Tabs": {
    "name": "el-tabs",
    "props": {
      "customProps": {
        "items": "{tabs}",
        "type": "card"
      }
    }
  }
}
```

- `items` references the child object array named `tabs`.
- `type` is not in `"{...}"` form, so it outputs directly as `type="card"`.

### `mappings`

Map design variant prop names or enum values to the key/value shape accepted by the target UI library. The outer key is the source prop name (`aliasName || name`) and is **case-sensitive**, unlike component-name matching.

```json
{
  "Button": {
    "name": "el-button",
    "props": {
      "mappings": {
        "modelValue": "value",
        "Type": {
          "name": "type",
          "values": {
            "Primary": "primary",
            "Success": "success"
          }
        },
        "size": {
          "Large": "lg",
          "Small": "sm"
        }
      }
    }
  }
}
```

| Form | Meaning |
|---|---|
| `"modelValue": "value"` | Rename prop key only |
| `"size": { "Large": "lg" }` | Map values only, like `attr.mappings` |
| `"Type": { "name": "type", "values": {...} }` | Rename key and map values |
| `"DocTag": ""` or `{ "name": "" }` | Suppress the whole variant axis |
| `values: { "secondary": "" }` | Suppress only that value |

Processing order: `filter` (before mapping, global value filter) -> `mappings` -> suppress when output key/value is `""`. Values without a mapping are preserved, and props without a configured mapping are emitted as-is.

## text

Extract text from child TEXT nodes.

```typescript
interface TextConfig {
  nodeName?: string;
  textAttr?: string;
}
```

### Text as children

```json
{
  "Button": {
    "name": "el-button",
    "text": { "nodeName": "_text" }
  }
}
```

Design layer:

```text
Button
└── _text: "Submit"
```

Output:

```vue
<el-button>Submit</el-button>
```

### Text as prop

```json
{
  "Input": {
    "name": "el-input",
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" }
  }
}
```

Design layer:

```text
Input
└── placeholder: "Enter username"
```

Output:

```vue
<el-input placeholder="Enter username" />
```

### Multiple text extractions

```json
{
  "Dialog": {
    "name": "el-dialog",
    "text": [
      { "nodeName": "_title" },
      { "nodeName": "_body" }
    ]
  }
}
```

Design layer:

```text
Dialog
├── _title: "Confirm delete"
└── _body: "This action cannot be undone"
```

Output:

```vue
<el-dialog>Confirm deleteThis action cannot be undone</el-dialog>
```

## icon

Extract icons from child layers.

```typescript
interface IconConfig {
  nodeName: string | { name: string; deepFind?: boolean };
  attrName: string;
  getComponentName?: boolean | "string";
  childComponent?: boolean | {
    parentType?: "slot" | "frame";
    parentTag?: string;
  };
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `nodeName` | `string | { name, deepFind }` | Target layer name or search rule. |
| `attrName` | `string` | Output prop name, such as `"icon"`. |
| `getComponentName` | `boolean | "string"` | Output as component reference instead of plain string. |
| `childComponent` | `boolean | object` | Output as a child component. |

### Icon as string prop

```json
{
  "Button": {
    "name": "el-button",
    "icon": {
      "nodeName": "icon",
      "attrName": "icon"
    }
  }
}
```

If the Button has a child layer `icon` named `el-icon-search`, output is:

```vue
<el-button icon="el-icon-search">
```

### Deep search

Use `deepFind` when the icon is wrapped by multiple frames.

```json
{
  "icon": {
    "nodeName": { "name": "icon", "deepFind": true },
    "attrName": "icon"
  }
}
```

```text
Button
└── icon-wrapper
    └── search-icon
```

### Component reference

`getComponentName: true` outputs a binding / component reference:

```json
{
  "icon": {
    "nodeName": "SearchIcon",
    "attrName": "icon",
    "getComponentName": true
  }
}
```

| Framework | Output |
| --- | --- |
| Vue | `<el-button :icon="SearchIcon">` |
| React | `<ElButton icon={<SearchIcon />}>` |

`getComponentName: "string"` outputs a string value, useful for cases such as Tag closable props:

```json
{
  "icon": {
    "nodeName": "close",
    "attrName": "closable",
    "getComponentName": "string"
  }
}
```

Output:

```vue
<el-tag closable="close">
```

### Child component

Direct child:

```json
{
  "icon": {
    "nodeName": "Star",
    "attrName": "icon",
    "childComponent": true
  }
}
```

```vue
<el-button>
  <Star />
</el-button>
```

Slot wrapper for Vue:

```json
{
  "icon": {
    "nodeName": "Close",
    "attrName": "icon",
    "childComponent": { "parentType": "slot", "parentTag": "template" }
  }
}
```

```vue
<el-button>
  <template #icon>
    <Close />
  </template>
</el-button>
```

Frame wrapper:

```json
{
  "icon": {
    "nodeName": "Search",
    "attrName": "icon",
    "childComponent": { "parentType": "frame", "parentTag": "div" }
  }
}
```

```vue
<el-button>
  <div>
    <Search />
  </div>
</el-button>
```

### Multiple icons

Use an array to extract multiple icon positions:

```json
{
  "Input": {
    "name": "el-input",
    "icon": [
      { "nodeName": "prefix-icon", "attrName": "prefix-icon" },
      { "nodeName": "suffix-icon", "attrName": "suffix-icon" }
    ]
  }
}
```

Output:

```vue
<el-input prefix-icon="search" suffix-icon="clear" />
```

## attr

Extract visual style values and map them to component props.

```typescript
interface AttrConfig {
  valueFrom: "background" | "borderColor" | "color" | "radius"
           | "borderStyle" | "opacity" | "gap" | "padding" | "boxShadow";
  attrName: string;
  mappings: Record<string, string>;
}
```

Supported value sources:

| `valueFrom` | Source | Common use |
| --- | --- | --- |
| `"background"` | First fill paint hex value | Button type or state color. |
| `"borderColor"` | First stroke paint hex value | Input status or border style. |
| `"color"` | Text color or fill color | Text color mapping. |
| `"radius"` | Corner radius value | Round buttons or card shapes. |
| `"borderStyle"` | `"solid"` or `"dashed"` | Tab type or border mode. |
| `"opacity"` | Opacity from `0` to `1` | Disabled state. |
| `"gap"` | Auto-layout gap | Compact / spacious layout. |
| `"padding"` | Padding | Size variant. |
| `"boxShadow"` | `"shadow"`, `"inner"`, `""`, or `"both"` | Elevation or inset effects. |

### Background to button type

```json
{
  "Button": {
    "name": "el-button",
    "attr": {
      "valueFrom": "background",
      "attrName": "type",
      "mappings": {
        "#409EFF": "primary",
        "#67C23A": "success",
        "#E6A23C": "warning",
        "#F56C6C": "danger",
        "#909399": "info"
      }
    }
  }
}
```

If the Button background is `#409EFF`, output is:

```vue
<el-button type="primary">
```

### Radius to round button

```json
{
  "attr": {
    "valueFrom": "radius",
    "attrName": "round",
    "mappings": {
      "20": "true",
      "50": "true"
    }
  }
}
```

Radius `20` or `50` outputs `round="true"`.

### Border color to input status

```json
{
  "attr": {
    "valueFrom": "borderColor",
    "attrName": "status",
    "mappings": {
      "#F56C6C": "error",
      "#67C23A": "success"
    }
  }
}
```

Use arrays to extract multiple style dimensions. Color mapping keys should use uppercase hex; extracted colors are normalized before matching.

## traverse

Control whether component children participate in code generation.

```typescript
interface TraverseConfig {
  filter?: string;
}
```

Behavior:

| Config | Behavior |
| --- | --- |
| no `traverse` | Do not traverse child nodes; `text`, `icon`, and `attr` control output. |
| `traverse: {}` | Traverse all child nodes; child instances render recursively. |
| `traverse: { "filter": "_arrow" }` | Traverse children and skip child nodes named `_arrow`. |

Default no traversal:

```json
{
  "Button": {
    "name": "el-button",
    "text": { "nodeName": "_text" }
  }
}
```

Traverse children:

```json
{
  "Badge": {
    "name": "el-badge",
    "text": { "nodeName": "_value" },
    "traverse": {}
  }
}
```

```vue
<el-badge>
  <el-button>New message</el-button>
</el-badge>
```

Traverse and filter:

```json
{
  "Select": {
    "name": "el-select",
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" },
    "traverse": { "filter": "_arrow" }
  }
}
```

```vue
<el-select placeholder="Please choose">
  <el-option>Option 1</el-option>
  <el-option>Option 2</el-option>
</el-select>
```

Traversal works with `slot_prefix`, `ignore_prefixes`, and `object` aggregation. Common priority:

1. `slot_prefix` renders slots.
2. `object` aggregation collects data.
3. `ignore_prefixes` skips helper layers.
4. Normal child nodes render recursively.

## object

Aggregate child component instances into array data and bind the array to a parent component prop. Use this for list-like components such as Tabs, Menu, and Steps.

```typescript
interface ObjectConfig {
  name: string;
  mappings: Record<string, string | ObjectFieldMapping>;
}

interface ObjectFieldMapping {
  text?: TextConfig;
  icon?: IconConfig;
  attr?: AttrConfig;
}
```

Workflow:

1. Configure `object` on the child component rule to define how fields are extracted from each child instance.
2. Configure `props.customProps` on the parent rule with `{ "propName": "{objectName}" }`.
3. At runtime, child instances matching the `object` rule do not render tags; they aggregate into an array bound to the parent prop.

Mapping values:

| Value type | Meaning |
| --- | --- |
| `""` | Auto-increment sequence: `"1"`, `"2"`, `"3"`... |
| fixed string | Same fixed value for each item. |
| `{ "text": TextConfig }` | Extract content from a child text node. |
| `{ "icon": IconConfig }` | Extract an icon value from the child instance. |
| `{ "attr": AttrConfig }` | Extract a mapped visual value from the child instance. |

Tabs example:

```json
{
  "__imports__": {
    "el-tabs": { "from": "element-plus", "named": "ElTabs" }
  },
  "Tabs": {
    "name": "el-tabs",
    "props": {
      "customProps": {
        "items": "{tabs}"
      }
    },
    "traverse": {}
  },
  "TabItem": {
    "object": {
      "name": "tabs",
      "mappings": {
        "key": "",
        "label": {
          "text": { "nodeName": "_label" }
        }
      }
    }
  }
}
```

Design layers:

```text
Tabs
├── TabItem 1
│   └── _label: "Home"
├── TabItem 2
│   └── _label: "Settings"
└── TabItem 3
    └── _label: "About"
```

Vue output:

```vue
<el-tabs :items="[{ key: '1', label: 'Home' }, { key: '2', label: 'Settings' }, { key: '3', label: 'About' }]">
</el-tabs>
```

The `<TabItem>` tag does not appear in output; child instances aggregate into the `items` array.

## tableData

Use `tableData` when a table component needs row objects built from column and cell layers.

Common fields:

| Field | Meaning |
| --- | --- |
| `name` | Aggregated array name used by parent `props.customProps`. |
| `column` | Component name for column instances. |
| `propAttr` | Variant prop on the column component that provides the data key. |
| `rowPattern` | Regex used to recognize row layer names, such as `^row-(\\d+)$`. |
| `cellText` | Child text layer name inside a cell. |

Typical shape:

```json
{
  "Table": {
    "name": "el-table",
    "props": {
      "customProps": { "data": "{tableData}" }
    },
    "traverse": {},
    "tableData": {
      "name": "tableData",
      "column": "Column",
      "propAttr": "prop",
      "rowPattern": "^row-(\\d+)$",
      "cellText": "_cell"
    }
  }
}
```

Use `get_node_dsl` before writing `tableData`; `get_all_components` metadata does not include enough child-layer structure to verify rows and cells.

## Shared Icon Config

Configure how layers named with `icon_prefix` (usually `@`) render as icon components.

```json
{
  "@icons": {
    "width": { "stylePrefix": "fontSize" },
    "background": { "stylePrefix": "color" }
  }
}
```

| Config key | Source | Common output |
| --- | --- | --- |
| `"width"` | Layer width in px | `fontSize` |
| `"height"` | Layer height in px | `height` |
| `"fontSize"` | Text font size in px | `fontSize` |
| `"background"` | Fill color hex | `color` |
| `"color"` | Fill color hex | `color` |
| `"opacity"` | Opacity | `opacity` |

`PublicIconRenderOption` fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `stylePrefix` | `string` | Output prop name, such as `fontSize="24px"`. |
| `filter` | `string | string[]` | Values to filter out. |
| `classPrefix` | `string` | Output class prefix. |
| `getCssVar` | `boolean` | Output as CSS variable. |

Workflow:

1. Layer name `@arrow-down` matches `icon_prefix`.
2. Remove prefix and convert to PascalCase: `ArrowDown`.
3. Find and register import from `__imports__`.
4. Extract style props based on `@icons`.

Design:

```text
@arrow-down (width: 24, fill: #333333)
```

Output:

```vue
<ArrowDown fontSize="24px" color="#333333" />
```

## Shared Text Config

Configure all TEXT nodes to render as a specific text component and extract typography styles as props.

```json
{
  "@text": {
    "name": "Typography",
    "fontSize": {},
    "fontWeight": { "filter": ["400"] },
    "color": {}
  }
}
```

| Field | Meaning |
| --- | --- |
| `name` | Text component name; register it in `__imports__`. |
| `fontSize` | Extract font size, such as `fontSize="14px"`. |
| `fontWeight` | Extract font weight, such as `fontWeight="700"`. |
| `color` | Extract text color, such as `color="#333333"`. |
| `textAlign` | Extract alignment, such as `textAlign="center"`. |
| `lineHeight` | Extract line height, such as `lineHeight="20px"`. |
| `letterSpacing` | Extract letter spacing, such as `letterSpacing="0.5px"`. |

Use each property's `filter` to skip default values, such as `fontWeight: 400`.

## Complete Example

```json
{
  "__imports__": {
    "el-button": { "from": "element-plus", "named": "ElButton" },
    "el-input": { "from": "element-plus", "named": "ElInput" },
    "el-select": { "from": "element-plus", "named": "ElSelect" },
    "el-option": { "from": "element-plus", "named": "ElOption" },
    "el-checkbox": { "from": "element-plus", "named": "ElCheckbox" },
    "el-tag": { "from": "element-plus", "named": "ElTag" },
    "el-dialog": { "from": "element-plus", "named": "ElDialog" },
    "el-tabs": { "from": "element-plus", "named": "ElTabs" },
    "SearchIcon": { "from": "@element-plus/icons-vue", "named": "SearchIcon" },
    "Typography": { "from": "@custom/ui", "named": "Typography" }
  },
  "@icons": {
    "width": { "stylePrefix": "fontSize" },
    "background": { "stylePrefix": "color" }
  },
  "@text": {
    "name": "Typography",
    "fontSize": {},
    "fontWeight": { "filter": ["400"] },
    "color": {}
  },
  "Button": {
    "name": "el-button",
    "props": {
      "showTrueValue": true,
      "mappings": {
        "Type": {
          "name": "type",
          "values": {
            "primary": "primary",
            "secondary": ""
          }
        },
        "Size": {
          "name": "size",
          "values": {
            "large": "large",
            "small": "small",
            "medium": ""
          }
        },
        "State": {
          "name": "disabled",
          "values": {
            "disabled": "true",
            "normal": "",
            "hover or press": ""
          }
        }
      }
    },
    "text": [
      { "nodeName": "_text" },
      { "nodeName": "text" }
    ],
    "icon": {
      "nodeName": { "name": "icon", "deepFind": true },
      "attrName": "icon"
    },
    "attr": [
      {
        "valueFrom": "background",
        "attrName": "type",
        "mappings": {
          "#409EFF": "primary",
          "#67C23A": "success",
          "#E6A23C": "warning",
          "#F56C6C": "danger"
        }
      },
      {
        "valueFrom": "radius",
        "attrName": "round",
        "mappings": { "20": "true", "50": "true" }
      }
    ]
  },
  "Input": {
    "name": "el-input",
    "props": {},
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" },
    "icon": [
      { "nodeName": { "name": "prefix-icon", "deepFind": true }, "attrName": "prefix-icon" },
      { "nodeName": { "name": "suffix-icon", "deepFind": true }, "attrName": "suffix-icon" }
    ],
    "attr": {
      "valueFrom": "borderColor",
      "attrName": "status",
      "mappings": {
        "#F56C6C": "error",
        "#67C23A": "success"
      }
    }
  },
  "Select": {
    "name": "el-select",
    "props": { "filter": ["md", "default"] },
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" },
    "traverse": { "filter": "_arrow" }
  },
  "Option": {
    "name": "el-option",
    "props": {},
    "text": { "nodeName": "_text" }
  },
  "Tag": {
    "name": "el-tag",
    "props": { "filter": ["md", "default"] },
    "text": { "nodeName": "_text" },
    "icon": {
      "nodeName": "close",
      "attrName": "closable",
      "getComponentName": "string"
    }
  },
  "Tabs": {
    "name": "el-tabs",
    "props": {
      "customProps": { "items": "{tabs}" }
    },
    "traverse": {}
  },
  "TabItem": {
    "object": {
      "name": "tabs",
      "mappings": {
        "key": "",
        "label": { "text": { "nodeName": "_label" } }
      }
    }
  }
}
```

## Field Reference

| Field | Type | Meaning | Example |
| --- | --- | --- | --- |
| `name` | `string` | Output tag name. | `"el-button"` |
| `props` | `PropsConfig` | Variant prop extraction. | `{ "filter": ["md"] }` |
| `props.filter` | `string[]` | Filtered prop values. | `["md", "default"]` |
| `props.showTrueValue` | `boolean` | Explicit boolean `true` output. | `true` |
| `props.customProps` | `Record<string, string>` | Custom prop bindings. | `{ "items": "{tabs}" }` |
| `props.mappings` | `Record<string, PropMappingConfig>` | Variant key/value mappings. | `{ "Type": { "name": "type", "values": {...} } }` |
| `text` | `TextConfig | TextConfig[]` | Text extraction. | `{ "nodeName": "_text" }` |
| `text.nodeName` | `string` | Target text layer name. | `"_text"` |
| `text.textAttr` | `string` | Output prop name. | `"placeholder"` |
| `icon` | `IconConfig | IconConfig[]` | Icon extraction. | `{ "nodeName": "icon", "attrName": "icon" }` |
| `icon.nodeName` | `string | { name, deepFind }` | Icon layer search rule. | `{ "name": "icon", "deepFind": true }` |
| `icon.attrName` | `string` | Output prop name. | `"icon"` |
| `icon.getComponentName` | `boolean | "string"` | Component-name output mode. | `true` |
| `icon.childComponent` | `boolean | { parentType, parentTag }` | Child component output mode. | `{ "parentType": "slot", "parentTag": "template" }` |
| `attr` | `AttrConfig | AttrConfig[]` | Visual style mapping. | `{ "valueFrom": "background" }` |
| `attr.valueFrom` | `string` | Visual source. | `"background"` |
| `attr.attrName` | `string` | Output prop name. | `"type"` |
| `attr.mappings` | `Record<string, string>` | Value mapping table. | `{ "#409EFF": "primary" }` |
| `traverse` | `TraverseConfig` | Child traversal control. | `{ "filter": "_arrow" }` |
| `traverse.filter` | `string` | Child node name to filter. | `"_mask"` |
| `object` | `ObjectConfig` | Array aggregation. | `{ "name": "tabs", "mappings": {} }` |
| `object.name` | `string` | Array reference name. | `"tabs"` |
| `object.mappings` | `Record<string, string | ObjectFieldMapping>` | Field mappings. | `{ "key": "", "label": { "text": {} } }` |
| `tableData` | `TableDataConfig` | Table row aggregation. | `{ "name": "tableData" }` |
