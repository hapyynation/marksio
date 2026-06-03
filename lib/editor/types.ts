export type LayerType =
  | 'background'
  | 'productImage'
  | 'headline'
  | 'subheadline'
  | 'price'
  | 'ctaButton'
  | 'badge'
  | 'shape'

export interface LayerStyle {
  fill?: string
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  borderRadius?: number
  opacity?: number
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  uppercase?: boolean
  italic?: boolean
  stroke?: string
  strokeWidth?: number
  paddingX?: number
  paddingY?: number
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: number
}

export interface Layer {
  id: string
  type: LayerType
  label: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  editable: boolean
  locked: boolean
  visible: boolean
  content?: string
  src?: string
  style: LayerStyle
}

export interface Template {
  id: string
  name: string
  category: string
  previewGradient: string
  canvasWidth: number
  canvasHeight: number
  layers: Layer[]
}

export interface AiCommandResult {
  actions: AiAction[]
  summary: string
}

export type AiAction =
  | { type: 'updateText'; layerId: string; content: string }
  | { type: 'updateStyle'; layerId: string; style: Partial<LayerStyle> }
  | { type: 'moveLayer'; layerId: string; x: number; y: number }
  | { type: 'addProductImage'; position?: 'left' | 'right' | 'center'; removeBackground?: boolean }
  | { type: 'generateBackground'; prompt: string }
  | { type: 'suggestPalette'; mood?: string }
