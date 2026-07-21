# Compact DSL Structure and Interpretation

## Top-level structure

This document describes the compact DSL returned by `get_node_dsl({ guid, simplify: true })`, with these core fields:

`simplify` defaults to `true`. When the user explicitly requests the complete tree-shaped DSL for a node in one response, use `get_node_dsl({ guid, simplify: false })`. Complete tree-shaped DSL is not raw Kiwi or decoded JSON; do not apply this document's `roots/refsIndex` shape assumptions to a `simplify: false` response.

| Field | Purpose |
|---|---|
| `stats` | Output/source summary, byte count, or truncation signals; not a design-node property |
| `roots` | The real requested design-node tree and the starting point for structural analysis |
| `refsIndex` | Lightweight indexes for variables, styles, component sets, vectors, images, and other referenced definitions |

`refsIndex` provides IDs, names, and summaries for later queries, not complete definitions. Complete semantics come from `roots` plus the resolved reference closure.

## Node fields

Read nodes in this order:

1. `id/type/name`: establish real node identity.
2. `box/autoLayout/constraints`: understand dimensions, position, layout, and constraints.
3. `text/fills/strokes/effects/radius/layoutGrids/arc/shape`: understand visible content and appearance.
4. `componentRef/componentSetRef/componentNodeRef/override`: understand component origin and instance differences.
5. `children/childrenSummary/vectorRef`: understand child structure or folded assets.

Common fields:

| Field | Meaning |
|---|---|
| `box` | Width, height, and position when position is relevant |
| `autoLayout` | Auto-layout direction, sizing policies, gap, padding, and alignment |
| `constraints` | Constraint behavior outside auto layout |
| `text` | Text content and text properties not superseded by a text style |
| `fills/strokes/effects` | Layered paints, strokes, and effects |
| `radius` | Uniform radius or per-corner radius values |
| `layoutGrids` | Inline layout grids or grid-style references |
| `arc` | Ellipse start/end angles and inner radius |
| `shape` | Other geometry semantics |
| `visible/opacity` | Visibility and opacity; preserve when present |
| `frameMaskDisabled` | Whether frame clipping/masking is disabled |
| `componentRef` | Component or concrete variant used by an instance |
| `componentSetRef` | Containing component-set ID |
| `componentNodeRef` | Component-definition node corresponding to an instance child |
| `override` | Effective properties that differ from the direct definition layer |
| `vectorRef` | Exportable GUID for a folded vector subtree |
| `childrenSummary` | Summary of folded children |

`childrenSummary.reason: "vector-icon"` means the vector subtree was folded into one icon. Export `vectorRef` when SVG is needed; do not reconstruct every Vector child.

## Default omission and overrides

A missing compact-DSL field commonly means:

- the default value applies;
- an instance value matches its direct component/variant definition;
- the field does not apply to this node type; or
- vector children were folded into `vectorRef`.

Do not call a missing field data loss without checking node type, component definition, `componentNodeRef`, and `override`.

Compare an instance against its direct definition layer. Align instance children through `componentNodeRef`. Only differing properties appear in `override`; matching properties are inherited. For nested instances, compare first against the corresponding nested node in the outer component/variant, not directly against a deeper component definition across hierarchy levels.

## Reference location defines semantics

The property containing a variable or style reference defines what it controls:

```text
fills/strokes                  -> color or image
box.w/box.h                    -> width or height
autoLayout.gap/padding         -> layout spacing
radius/strokeWeight            -> corner radius or stroke width
text.content/fontSize/...      -> text properties
effects/layoutGrids            -> effect or layout grid
override.<property>            -> effective instance override
```

Traverse arbitrary objects and arrays so references inside normal properties and `override` are found. Do not rely on a fixed list of top-level fields.

## Variable references

Display forms:

```text
variable:<variableId>
variable:<variableId>$<modeId>
```

Rules:

1. Prefer `refsIndex.variables[].id`; pass only variable IDs in `variableIds`.
2. Batch calls with `get_variables({ variableIds })`.
3. With `$modeId`, select the matching entry in `modeValues`.
4. Without a mode ID, use the first returned mode as the desktop-client default convention and state that convention.
5. If a variable value aliases another variable, add that alias ID to the pending set until no new alias appears.

Variable IDs may be local `session:local` IDs or compound IDs with a file prefix. Do not infer local/remote origin from string shape alone; use actual tool resolution and returned data.

## Style references

Display form:

```text
style:<styleId>
```

Rules:

1. Prefer `refsIndex.styles[].id`; pass only style IDs in `styleIds`.
2. When origin is uncertain, query the same IDs with both `get_local_styles` and `get_remote_styles`.
3. Inspect real IDs and `isLocal`, then merge by referenced ID rather than concatenating results.
4. Text styles bind multiple properties: use style-defined properties from the style and preserve node text properties the style does not define.

## Component references

- `componentRef`: primary key for retrieving concrete component/variant structure.
- `componentSetRef`: containing component set for variant axes and candidate variants.
- `refsIndex.componentSets[].variants`: lightweight variant ID/name/property summary.
- `get_variants({ guid: componentSetId })`: complete lightweight variant inventory.
- `get_node_dsl({ guid: componentSetId })`: component-set and variant node structure; potentially large.

When a component, variant, or component set is the requested root, `roots` must describe that real node. Lightweight relations belong in reference fields and `refsIndex`; they must not replace the requested root.

## Vectors and images

### Vectors

`vectorRef` is an exportable node GUID:

```text
get_export_image({
  guid: vectorRef,
  exportSettings: {
    constraint: { type: 1, value: 1 },
    imageType: 3
  }
})
```

### Images

`refsIndex.assets` stores image hashes, not node GUIDs. To export an image:

1. Find `fills[].type === "asset"` in `roots`.
2. Match the fill asset ID/hash.
3. Read the containing node's `id`.
4. Pass that node ID and the `exportSettings` shape above to `get_export_image`.

Add vectors/assets discovered through component closure to the same pending sets. Export files only when needed; keep references for structural analysis.

