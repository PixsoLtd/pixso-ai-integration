/**
 * Pixso AI Smart Editing DSL
 *
 * When read_components() lists reusable component ids, prefer `type: "instance"`
 * (+ `descendants` from `query_nodes`) for standard UI instead of duplicating the same structure.
 */

/** To bind a variable to a property, set the property to the dollar-prefixed name of the variable. `$style/*` is a reserved style resource key, not a variable. */
export type Variable = string;

/** Shared style semantic key returned by read_styles(), e.g. `$style/Color/Brand`. */
export type SharedStyle = string;

/** Colors can be 8-digit RGBA hex strings (e.g. #AABBCCDD), 6-digit RGB hex strings (e.g. #AABBCC) or 3-digit RGB hex strings (e.g. #ABC which means #AABBCC). */
export type Color = string;

export type NumberOrVariable = number | Variable;

export type StringOrVariable = string | Variable;

export type BooleanOrVariable = boolean | Variable;

export type ColorOrVariable = Color | Variable;

/** Component-set variant child. If guid is set, convert that existing layer into this variant; otherwise create a new variant child. */
export interface ComponentSetVariantNode {
  guid?: string;
  type: "frame";
  reusable: true;
  name: string;
}

/** Each key must be an existing theme axis, and each value must be one of the possible values for that axis. E.g. { 'device': 'phone' } */
export interface Theme {
  [key: string]: string;
}

export type BlendMode =
  | "pass_through"
  | "normal"
  | "darken"
  | "multiply"
  | "linear_burn" // darken
  | "color_burn"
  | "lighten"
  | "screen"
  | "linear_dodge" // lighten
  | "color_dodge"
  | "overlay"
  | "soft_light"
  | "hard_light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

/** position is normalized 0-1 */
export interface GradientStop {
  color: ColorOrVariable;
  position?: number;
}

export interface Offset {
  x: number;
  y: number;
}

export interface SolidFillPaint {
  blendMode?: BlendMode;
  type: "solid";
  color: ColorOrVariable;
  opacity?: number;
  visible?: boolean;
}

export interface GradientPoint {
  x: number;
  y: number;
}

export interface GradientTransform {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
}

export interface GradientSize {
  width?: number;
  height?: number;
}

export interface GradientFillPaint {
  blendMode?: BlendMode;
  type:
    | "gradient_linear"
    | "gradient_radial"
    | "gradient_angular"
    | "gradient_diamond";
  stops: GradientStop[];
  opacity?: number;
  visible?: boolean;
  /** Normalized to bounding box (default: 0.5,0.5). */
  center?: GradientPoint;
  /** Half-range in normalized bounding-box space (default: 0.5,0.5). Linear: width sets half of the gradient length, height is ignored. Radial/Angular: width and height set half-ranges on each axis. */
  size?: GradientSize;
  /** Rotation in degrees, counterclockwise (0° up, 90° left, 180° down). */
  rotation?: number;
}

export interface ImageFillPaint {
  blendMode?: BlendMode;
  type: "image";
  color?: ColorOrVariable;
  opacity?: number;
  visible?: boolean;
  /** Crop mode only. When `imageScaleMode` is `stretch`, prefer `transform` and do not set `rotation`. */
  transform?: GradientTransform;
  /** Non-crop modes only. When set, rotation should use quarter turns (0 / 90 / 180 / 270). Do not combine with `transform`. */
  rotation?: NumberOrVariable;
  /** `stretch` is crop mode; `fit` / `fill` / `tile` are non-crop modes. */
  imageScaleMode?: "fill" | "fit" | "stretch" | "tile";
  /** Tile mode only. Only valid when `imageScaleMode` is `tile`. */
  scale?: NumberOrVariable;
  /** Only use keys declared below. Do not invent fields. */
  paintFilter?: {
    contrast?: number;
    exposure?: number;
    highlights?: number;
    hue?: number;
    shadows?: number;
    temperature?: number;
    tint?: number;
    vibrance?: number; // saturation
  };
}

export type FillPaint =
  | ColorOrVariable
  | SolidFillPaint
  | GradientFillPaint
  | ImageFillPaint;

export type StrokePaint = FillPaint;

export interface ShadowEffect {
  color: ColorOrVariable;
  radius?: NumberOrVariable;
  spread?: NumberOrVariable;
  blendMode?: BlendMode;
  visible?: boolean;
  offset?: Offset;
}

export interface DropShadowEffect extends ShadowEffect {
  type: "drop_shadow";
}

export interface InnerShadowEffect extends ShadowEffect {
  type: "inner_shadow";
}

export interface BlurEffect {
  /** In progressive mode, radius is the end radius */
  radius?: NumberOrVariable;
  visible?: boolean;
  blurOpType: "uniform" | "progressive";
  startRadius?: number;
}

export interface ForegroundBlurEffect extends BlurEffect {
  type: "foreground_blur";
}

export interface BackgroundBlurEffect extends BlurEffect {
  type: "background_blur";
  saturation: number; // range: [0, 1]
}

export type Effect = ColorOrVariable | DropShadowEffect | InnerShadowEffect | ForegroundBlurEffect | BackgroundBlurEffect | BlurEffect;

export interface AutoLayout {
  direction?: "vertical" | "horizontal" | "grid";
  wrap?: boolean;
  /** Control the justify alignment of the children along the main axis. Defaults to 'start'. */
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "space_between"
    | "space_around";
  /** Control the alignment of children along the cross axis. Defaults to 'start'. */
  alignItems?: "start" | "center" | "end";
  /** The Inside padding along the edge of the container */
  padding?:
    | /** The inside padding to all sides */ NumberOrVariable
    | /** The inside horizontal and vertical padding */ [
        NumberOrVariable,
        NumberOrVariable
      ]
    | /** Top, Right, Bottom, Left padding */ [
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable
      ];
  /** The gap between children in the main axis and cross axis direction. Defaults to 0. */
  gap?: NumberOrVariable | [NumberOrVariable, NumberOrVariable];
  /** Grid auto layout row and column count. Only used when direction is 'grid'. Maps to Pixso gridRowNum/gridColumnNum. */
  gridCount?: [number, number];
  minWidth?: NumberOrVariable | null;
  maxWidth?: NumberOrVariable | null;
  minHeight?: NumberOrVariable | null;
  maxHeight?: NumberOrVariable | null;
}

/** SizingBehavior controls the dynamic layout size.
- fit_content: Use the combined size of all children for the container size. Fallback is used when there are no children.
- fill_container: Use the parent size for the container size. Fallback is used when the parent has no layout.
*/
export type SizingBehavior = "fit_content" | "fill_container";

/** Node layout, relative to parent bounds */
export interface NodeLayout {
  top: number;
  left: number;
  width: NumberOrVariable | SizingBehavior;
  height: NumberOrVariable | SizingBehavior;
}

export interface BaseNode extends NodeLayout {
  name: string;
  visible?: BooleanOrVariable;
  opacity?: NumberOrVariable;
  cornerRadius?:
  | NumberOrVariable
  | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable] | "auto";
  /** Rotation angle in degrees */
  rotation?: number;
  /** Escape the parent's autoLayout flow and use absolute positioning instead.
   * When true, this child is no longer part of the autoLayout — it floats freely on top.
   * IMPORTANT: `left` and `top` MUST be set explicitly when layoutPositioning is true,
   * otherwise the node defaults to (0,0) and overlaps other content.
   * If several siblings would all use this, wrap them in one child frame: single `layoutPositioning`
   * Only effective for direct children of an autoLayout parent. */
  layoutPositioning?: boolean;
  /** Fill value or color shared style key. `$style/...` binds a color style; concrete values write node fills directly. */
  fillPaints?: ColorOrVariable | SharedStyle | FillPaint[];
  stroke?: Stroke | null;
  /** Effect value or effect shared style key. `$style/...` binds an effect style; concrete values write node effects directly. */
  effects?: ColorOrVariable | SharedStyle | Effect[];
  autoLayout?: AutoLayout;
  flipX?: boolean;
  flipY?: boolean;
  propRefs?: string[];
  theme?: Theme;
  blendMode?: BlendMode;
  /** Create this node as a reusable component. The tool returns and registers its guid id immediately for later operations in the same apply_design call. */
  reusable?: boolean;
  /** Create this reusable node as a component set. Variant children are named with axis=value, e.g. `type=primary`. */
  isStateGroup?: boolean;
}

export interface Stroke {
  align?: "INSIDE" | "CENTER" | "OUTSIDE";
  borderWeight?: NumberOrVariable | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
  join?: "MITER" | "BEVEL" | "ROUND";
  cap?: StrokeCap | [StrokeCap] | [StrokeCap, StrokeCap];
  miterAngle?: number;
  dashPattern?: number[]; // Custom stroke dash: at least 4 numbers, length must be even (dash/gap pairs).
  /** Stroke value or color shared style key. `$style/...` binds a color style; concrete values write node strokes directly. */
  strokePaints?: ColorOrVariable | SharedStyle | StrokePaint[];
}

export type StrokeCap = "NONE" | "ROUND" | "SQUARE" | "ARROW_LINES" | "ARROW_EQUILATERAL" | "TRIANGLE_FILLED" | "DIAMOND_FILLED" | "HOLLOW_ROUND" | "SOLID_ROUND" | "VERTICAL_LINE";

export interface HasChildNode extends BaseNode {
  /** Child nodes. For an isStateGroup component set, children may be variant descriptors; a variant child with guid converts that existing layer into a variant. */
  childNode?: (DslNode | ComponentSetVariantNode)[];
}

/** e.g: 12 | "$number-12" | "12px" | "120%" */
type ValueUnit = NumberOrVariable | string;

export interface FrameNode extends HasChildNode {
  type: "frame";
  /** Visually clip content that overflows the frame bounds. Default is false. true is overflow hidden */
  clip?: boolean;
  /** Query-only component id. Reusable frames represent components; isStateGroup represents component sets. Use guid as apply_design instance ref. */
  id?: string;
  guid?: string;
  /** Omitted means editable. `editable:false` means it can be used but not renamed, deleted, updated, or extended. */
  editable?: false;
  /** Component instance override paths when this reusable frame is a concrete component or resolved variant. */
  descendants?: { [key: string]: Partial<BaseNode> };
  propDefMap?: PropDefMap;
}

export interface TextNodeBase extends BaseNode {
  type: "text";
  nodeText: string;
  hyperlinkUrl?: string;
  textTruncation?: "disabled" | "ending";
  /** Max lines, shows ellipsis when exceeded */
  maxLines?: number;
  textDecoration?: "none" | "underline" | "lineThrough";
  /** textGrowth controls how the text box dimensions behave. It must be set before width or height can be used — without textGrowth, the width and height properties are ignored.
  'auto': The text box automatically grows to fit the text content. Text does not wrap. Width and height adjust dynamically.
  'fixed-width': The width is fixed and text wraps within it. The height grows automatically to fit the wrapped content.
  'fixed-width-height': Both width and height are fixed. Text wraps and may be overflow if it exceeds the bounds.
  IMPORTANT: Never set width or height without also setting textGrowth. If you want to control the size of a text box, you must set textGrowth first. */
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
}

export interface TextTypography {
  /** A multiplier that gets applied to the font size to determine spacing between lines. If not specified, uses the font's built-in line height. */
  lineHeight?: ValueUnit;
  letterSpacing?: NumberOrVariable;
  fontSize?: NumberOrVariable;
  fontFamily: StringOrVariable;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "top" | "middle" | "bottom";
  fontWeight: number;
}

export interface RegularTextNode extends TextNodeBase, TextTypography {
  /** Regular text must use concrete text properties instead of a shared text style. */
  textStyle?: never;
}

export type StyledTextNode = TextNodeBase & {
  /** Text shared style semantic key. Use `$style/...` exactly as returned by `read_styles()` or `query_nodes()`. Do not combine with regular text properties. */
  textStyle: SharedStyle;
} & {
  [K in keyof TextTypography]?: never;
};

export type TextNode = RegularTextNode | StyledTextNode;

export interface RectangleNode extends HasChildNode {
  type: "rectangle";
}

export interface InstanceNode extends BaseNode {
  type: "instance";
  /** Real component guid. For remote resources, call `query_nodes` with the read_components id first, then use the returned guid. */
  ref: string;
  /** Keys = `propDefMap` on the same `component` row. `text`/`boolean` → string/boolean. `instance_swap` → target nested component guid. Omit when unchanged. */
  props?: { [key: string]: string | boolean };
  /** Keys = exact strings from that component’s `query_nodes` `descendants` map (single id or `a/b/c` chain). Omit when unchanged. */
  descendants?: { [key: string]: Partial<BaseNode> & { ref?: string } };
}

/** Icon from a font */
export interface IconFont extends BaseNode {
  type: "icon_font";
  /** Name of the icon in the icon font */
  iconFontName: string;
  /** Icon font to use. Valid fonts are 'lucide', 'iconpark' */
  iconFontFamily?: string;
  iconFontSize?: number;
  /** Filled variant. Changing `filled` means switching to a different icon — you MUST also provide `iconFontFamily` and `iconFontName` so the correct filled/outline icon is resolved. */ 
  filled?: boolean;
}

export interface VectorNode extends BaseNode {
  type: "vector";
  svg: string;
}

/** Component prop definitions */
export interface PropDefMap {
  [key: string]: {
    /** Prop kind; when type is instance_swap, the instance value is another component guid */
    type: "boolean" | "text" | "instance_swap";
  };
}
export type DslNode =
  | FrameNode
  | TextNode
  | RectangleNode
  | InstanceNode
  | VectorNode
  | IconFont;

export interface DSL {
  themes?: { [key: string /** RegEx: [^:]+ */]: string[] };
  variables?: {
    [key: string /** RegEx: [^:]+ */]:
      | {
          type: "boolean";
          /** Omitted means editable. `editable:false` means it can be used but not renamed, deleted, or updated. */
          editable?: false;
          value:
            | BooleanOrVariable
            | { value: BooleanOrVariable; theme?: Theme }[];
        }
      | {
          type: "color";
          /** Omitted means editable. `editable:false` means it can be used but not renamed, deleted, or updated. */
          editable?: false;
          value: ColorOrVariable | { value: ColorOrVariable; theme?: Theme }[];
        }
      | {
          type: "number";
          /** Omitted means editable. `editable:false` means it can be used but not renamed, deleted, or updated. */
          editable?: false;
          value:
            | NumberOrVariable
            | { value: NumberOrVariable; theme?: Theme }[];
        }
      | {
          type: "string";
          /** Omitted means editable. `editable:false` means it can be used but not renamed, deleted, or updated. */
          editable?: false;
          value:
            | StringOrVariable
            | { value: StringOrVariable; theme?: Theme }[];
        };
  };
  nodes: DslNode[];
}
