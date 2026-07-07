# Component Config Tutorial

This tutorial explains the core fields of Pixso Design-to-Code component parser config and how each field affects generated code. Examples use Element Plus and follow this order: reference layers -> reference config -> expected output.

## How to read

Each section contains:

- **Goal:** what the field solves.
- **Reference layers:** the design layer structure to prepare or inspect.
- **Reference config:** JSON snippets that can be copied.
- **Expected output:** what code the same config produces in different layer scenarios.

Notes:

- JSON blocks do not contain comments so they can be copied directly.
- Normal component rules mainly use `name`, `props`, `text`, `icon`, `attr`, `traverse`, `object`, and `tableData`.
- Style output such as `width` and `background` belongs in shared config like `@icons`, not as top-level fields in normal component rules.
- `__imports__`, `__mainImports__`, and `__package__` are global config and do not depend on selected layers.

## 01. Global config: dependencies and style entry

### Goal

Configure component imports, project-level imports, and package dependencies. These keys do not match design layers; they only make generated code runnable.

### Fields

`__imports__`, `__mainImports__`, `__package__`

### Reference layers

Global config does not require design layers.

### Reference config

```json
{
  "__imports__": {
    "el-button": {
      "named": "ElButton",
      "from": "element-plus"
    }
  },
  "__mainImports__": [
    { "from": "element-plus/dist/index.css" }
  ],
  "__package__": {
    "dependencies": {
      "element-plus": "^2.14.1"
    }
  }
}
```

### Expected output

Component import:

```js
import { ElButton } from "element-plus"
```

Style entry:

```js
import "element-plus/dist/index.css"
```

Dependency declaration:

```json
{
  "dependencies": {
    "element-plus": "^2.14.1"
  }
}
```

### Usage notes

- `__imports__` keys must match output tag names from `name` or generated icon component names.
- `__mainImports__` is for global CSS or side-effect imports.
- `__package__` is only needed when the output project must declare dependencies.

## 02. name: rename component tags

### Goal

Map a stable Pixso component family to the target framework component tag.

### Field

`name`

### Reference layers

```text
Button
Button / primary
Button / disabled
```

### Reference config

```json
{
  "Button": {
    "name": "el-button"
  }
}
```

### Expected output

```vue
<el-button></el-button>
```

```jsx
<ElButton />
```

### Usage notes

- Use the public component tag from the target code library.
- Add a matching `__imports__` entry when the framework requires imports.
- Do not map helper or private design components unless the target codebase has a public equivalent.

## 03. props: extract variant props

### Goal

Read variant props from component instances and output them as component props.

### Field

`props`

### Reference layers

```text
Button
  variant props: size=large, type=primary, disabled=false
```

### Reference config

```json
{
  "Button": {
    "name": "el-button",
    "props": {
      "filter": ["default", "md", "false"]
    }
  }
}
```

### Expected output

```vue
<el-button size="large" type="primary"></el-button>
```

`disabled=false` is filtered and does not appear.

### Usage notes

- `props.filter` filters prop values, not prop names.
- Use `showTrueValue: true` only when the target framework requires explicit boolean values.
- Use `customProps` for fixed props or object aggregation results.

## 03.1. props.mappings: map variant prop keys/values

### Goal

Map variant keys/values to code output values when design prop names or enum values differ from the UI library API.

### Field

`props.mappings`

### Reference layers

```text
button                     component-set instance, variant Type=Primary
```

### Reference config

```json
{
  "button": {
    "name": "el-button",
    "props": {
      "mappings": {
        "Type": {
          "name": "type",
          "values": {
            "Primary": "primary",
            "Success": "success"
          }
        }
      }
    }
  }
}
```

### Expected output

```vue
<el-button type="primary" />
```

### Usage notes

- The outer mapping key must equal `aliasName || name` and is case-sensitive; if the design prop is `Type`, write `"Type"`.
- `"Type": "type"` renames only the prop key and leaves the value unchanged.
- `"type": { "Primary": "primary" }` maps only values, similar to `attr.mappings`.
- `filter` runs before mappings; unmapped values are preserved.

## 04. filter: skip default values or decorative layers

### Goal

Avoid noisy generated props or decorative child layers.

### Fields

`props.filter`, `traverse.filter`

### Reference layers

```text
Select
|-- placeholder: "Please choose"
|-- _arrow
`-- Option
    `-- _text: "Option 1"
```

### Reference config

```json
{
  "Select": {
    "name": "el-select",
    "props": { "filter": ["default", "md"] },
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" },
    "traverse": { "filter": "_arrow" }
  },
  "Option": {
    "name": "el-option",
    "text": { "nodeName": "_text" }
  }
}
```

### Expected output

```vue
<el-select placeholder="Please choose">
  <el-option>Option 1</el-option>
</el-select>
```

### Usage notes

- `props.filter` handles variant values.
- `traverse.filter` handles child layer names.
- Filtering is not a substitute for verifying whether a child layer is decorative.

## 05. text: extract text content or text props

### Goal

Extract text from child TEXT layers as children or as props.

### Fields

`text`, `text.nodeName`, `text.textAttr`

### Reference layers

```text
Button
`-- _text: "Submit"

Input
`-- placeholder: "Enter username"
```

### Reference config

```json
{
  "Button": {
    "name": "el-button",
    "text": { "nodeName": "_text" }
  },
  "Input": {
    "name": "el-input",
    "text": { "nodeName": "placeholder", "textAttr": "placeholder" }
  }
}
```

### Expected output

```vue
<el-button>Submit</el-button>
<el-input placeholder="Enter username" />
```

### Usage notes

- Use exact child layer names from `get_node_dsl`.
- Use `textAttr` only when the text should become a prop.
- For multiple text fields, use an array of text configs.

## 06. icon: parse child icon layers

### Goal

Read icon child layers and output them as string props, component references, slots, or child components.

### Fields

`icon`, `icon.nodeName`, `icon.attrName`, `icon.deepFind`, `icon.getComponentName`, `icon.childComponent`

### Reference layers

```text
Button
|-- icon-wrapper
|   `-- SearchIcon
`-- _text: "Search"

Input
|-- prefix-icon
`-- suffix-icon
```

### Reference config

```json
{
  "Button": {
    "name": "el-button",
    "text": { "nodeName": "_text" },
    "icon": {
      "nodeName": { "name": "SearchIcon", "deepFind": true },
      "attrName": "icon",
      "getComponentName": true
    }
  },
  "Input": {
    "name": "el-input",
    "icon": [
      { "nodeName": "prefix-icon", "attrName": "prefix-icon" },
      { "nodeName": "suffix-icon", "attrName": "suffix-icon" }
    ]
  }
}
```

### Expected output

```vue
<el-button :icon="SearchIcon">Search</el-button>
<el-input prefix-icon="search" suffix-icon="clear" />
```

### Usage notes

- Use `deepFind` only on `icon.nodeName` when the icon can be nested in wrapper frames.
- Use `getComponentName: true` when the target API expects a component reference.
- Use `childComponent` when the icon must render as a child node or slot.

## 07. attr: map visual styles to props

### Goal

Convert visual style values such as background color, border color, or radius into target component API props.

### Fields

`attr`, `attr.valueFrom`, `attr.attrName`, `attr.mappings`

### Reference layers

```text
Button
  background=#409EFF
  radius=20

Input
  borderColor=#F56C6C
```

### Reference config

```json
{
  "Button": {
    "name": "el-button",
    "attr": [
      {
        "valueFrom": "background",
        "attrName": "type",
        "mappings": { "#409EFF": "primary" }
      },
      {
        "valueFrom": "radius",
        "attrName": "round",
        "mappings": { "20": "true" }
      }
    ]
  },
  "Input": {
    "name": "el-input",
    "attr": {
      "valueFrom": "borderColor",
      "attrName": "status",
      "mappings": { "#F56C6C": "error" }
    }
  }
}
```

### Expected output

```vue
<el-button type="primary" round="true"></el-button>
<el-input status="error" />
```

### Usage notes

- Only write mappings for verified visual values.
- Use uppercase hex color keys, for example `#409EFF`.
- Do not put `background`, `width`, or similar visual fields as top-level normal component rule fields.

## 08. @icons: output icon-layer styles

### Goal

Configure shared style output for icon instances whose names start with `@`. Normal component rules do not support top-level `width` or `background`; those belong in `@icons`.

### Fields

`@icons.width`, `@icons.height`, `@icons.background`, `stylePrefix`, `filter`

### Applies when

The `@` icon instance is a child layer inside the selected container being parsed.

### Reference layers

```text
Button
`-- @search   child instance, width=18, background=#2563EB

Tag
`-- @close    child instance, width=16, background=#64748B
```

### Reference config

```json
{
  "@icons": {
    "width": { "stylePrefix": "fontSize", "filter": ["16px"] },
    "background": { "stylePrefix": "color" }
  }
}
```

### Expected output

`@search` outputs both width and color:

```vue
<Search fontSize="18px" color="#2563EB" />
```

`@close` filters `width=16px` and outputs only color:

```vue
<Close color="#64748B" />
```

### Usage notes

- `@icons.width.stylePrefix` can output width as `fontSize`.
- `@icons.background.stylePrefix` can output fill color as `color`.
- `filter` filters style values, such as `16px`.
- Do not select `@search` alone for this case; select the outer container so `@search` is parsed as a child layer.

## 09. traverse: control child parsing

### Goal

Control whether child layers keep generating code and filter decorative nodes that should not appear in code.

### Fields

`traverse`, `traverse.filter`

### Reference layers

```text
Menu
|-- MenuItem
|   `-- _text: Home
`-- MenuItem
    `-- _text: Settings

Select
|-- _text: Please choose
|-- _arrow
`-- Option
    `-- _text: Option 1
```

### Reference config

```json
{
  "Menu": {
    "name": "el-menu",
    "traverse": {}
  },
  "MenuItem": {
    "name": "el-menu-item",
    "text": { "nodeName": "_text" }
  },
  "Select": {
    "name": "el-select",
    "text": { "nodeName": "_text", "textAttr": "placeholder" },
    "traverse": { "filter": "_arrow" }
  },
  "Option": {
    "name": "el-option",
    "text": { "nodeName": "_text" }
  }
}
```

### Expected output

`menu` continues parsing `menu-item`:

```vue
<el-menu>
  <el-menu-item>Home</el-menu-item>
  <el-menu-item>Settings</el-menu-item>
</el-menu>
```

`select` reads placeholder, filters `_arrow`, and keeps `option`:

```vue
<el-select placeholder="Please choose">
  <el-option>Option 1</el-option>
</el-select>
```

### Usage notes

- Container-like components need `traverse: {}`; otherwise child components do not continue parsing.
- `traverse.filter` is useful for `_arrow`, decorative icons, background layers, and other nodes that should not output code.
- Child components also need their own rules, such as `menu-item` and `option`.

## 10. object: aggregate child components into array data

### Goal

Convert multiple child instances into array data, then let the parent component consume the array through `props.customProps`.

### Fields

`object`, `object.name`, `object.mappings`, `props.customProps`

### Applies when

The parent component must configure `traverse`; otherwise child components do not continue parsing and `object` data is not aggregated.

### Reference layers

```text
Tabs
|-- TabItem
|   `-- _label: Home
`-- TabItem
    `-- _label: Settings

TabsMissingTraverse     negative example: parent has no traverse
`-- TabItem
    `-- _label: Home
```

### Reference config

```json
{
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

### Expected output

Child `tab-item` instances aggregate into `items`:

```js
const items = [
  { key: "1", label: "Home" },
  { key: "2", label: "Settings" }
]
```

Negative example, parent lacks `traverse`:

```html
<!-- Missing traverse: {} -->
<!-- tab-item does not continue parsing, and tabs array is not generated -->
```

### Usage notes

- `object.name` is the aggregated array name.
- `props.customProps` uses `"{tabs}"` to reference the aggregation result.
- `key: ""` in `mappings` means read the same-name field or auto-generate the sequence value, depending on parser behavior.
- `label.text.nodeName` reads `label` from the `_label` text layer.

## 11. attr.valueFrom: read values from visual sources

### Goal

Normal components use `attr` to read visual values. `background`, `radius`, and `borderColor` are `valueFrom` sources, not top-level fields in normal component rules.

### Fields

`attr.valueFrom`, `attr.attrName`, `attr.mappings`

### Reference layers

```text
Tag
`-- _text: Label
  background=#F56C6C
  radius=20

Input
`-- _text: Error state
  borderColor=#F56C6C
```

### Reference config

```json
{
  "Tag": {
    "name": "el-tag",
    "text": { "nodeName": "_text" },
    "attr": [
      {
        "valueFrom": "background",
        "attrName": "type",
        "mappings": { "#F56C6C": "danger" }
      },
      {
        "valueFrom": "radius",
        "attrName": "round",
        "mappings": { "20": "true" }
      }
    ]
  },
  "Input": {
    "name": "el-input",
    "attr": {
      "valueFrom": "borderColor",
      "attrName": "status",
      "mappings": { "#F56C6C": "error" }
    }
  }
}
```

### Expected output

Background and radius map to props:

```vue
<el-tag type="danger" round="true">Label</el-tag>
```

Border color maps to status:

```vue
<el-input status="error" />
```

### Usage notes

- Read `background`, `radius`, and `borderColor` through `attr.valueFrom`.
- `mappings` converts visual values to component API values.
- Do not write `background` or `width` directly in normal component rules.

## 12. tableData: aggregate table layers into data

### Goal

Aggregate column, row, and cell layers into table data, then bind the data to the table component through `props.customProps`.

### Fields

`tableData`, `column`, `propAttr`, `rowPattern`, `cellText`

### Applies when

`column` is a component-set instance, `prop` comes from variant props, and `row-(n)` layers are placed inside each column.

### Reference layers

```text
Table
|-- Column              component-set instance, variant prop=name
|   |-- row-1
|   |   `-- _cell: Alice
|   `-- row-2
|       `-- _cell: Bob
`-- Column              component-set instance, variant prop=status
    |-- row-1
    |   `-- _cell: Active
    `-- row-2
        `-- _cell: Disabled

row-main                negative example: does not match rowPattern
```

### Reference config

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
  },
  "Column": {
    "name": "el-table-column",
    "props": {}
  }
}
```

### Expected output

Column variant `prop`, `row-(n)`, and `_cell` aggregate into `tableData`:

```js
const tableData = [
  { name: "Alice", status: "Active" },
  { name: "Bob", status: "Disabled" }
]
```

```vue
<el-table :data="tableData">
  <el-table-column prop="name" />
  <el-table-column prop="status" />
</el-table>
```

Negative example, row name does not match `rowPattern`:

```html
<!-- row-main does not match ^row-(\\d+)$ -->
<!-- this row is not included in tableData -->
```

### Usage notes

- `table.traverse` must exist; otherwise columns do not continue parsing.
- `tableData.column` names the column component.
- `propAttr` names the column variant prop that becomes the data key.
- `rowPattern` recognizes row names such as `row-1` and `row-2`.
- `cellText` names the text layer inside each cell.

## Field Decision Checklist

Use this order before writing config:

1. Need to change the output tag: use `name`.
2. Need to read component instance variants: use `props`.
3. Need to filter default variant values: use `props.filter`.
4. Need to map variant prop names or enum values to the target API: use `props.mappings`.
5. Need to filter decorative child layers: use `traverse.filter`.
6. Need to read text content: use `text.nodeName`.
7. Need to turn text into a prop: add `textAttr`.
8. Need to read an icon child: use `icon`.
9. Icon is nested inside multiple frames: use `deepFind` only on `icon.nodeName`.
10. Need to generate props from visual styles: use `attr.valueFrom`.
11. Need a container to continue parsing children: use `traverse`.
12. Need to aggregate child components into arrays: use `object`; parent also needs `traverse`.
13. Need table data: use `tableData`; columns use component-set variants to provide `prop`.
14. Need to output size or color for `@` icons: use `@icons`, not normal component rules.

## Common Anti-Patterns

- Naming a normal layer `el-button` and expecting it to match the `button` component config.
- Treating `props.filter` as a filter for prop names. It filters variant values.
- Writing `nodeName: { "name": "_text" }`. Normal text supports `nodeName: "_text"`.
- Omitting `traverse` on the parent container, which prevents child components, `object`, or `tableData` from continuing.
- Treating `background` or `width` as top-level fields in normal component rules.
- Selecting `@search` alone instead of selecting the outer container so `@search` participates as a child layer.
- Naming table row layers in a way that does not match `rowPattern`.

## References

- Pixso Developer: component parser configuration guide.
- Plugin board-generation snippet in this directory: `create-component-config-tutorial-pages-snippet.js`.
