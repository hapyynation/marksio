export type StudioStep = 'upload' | 'analyzing' | 'editing' | 'generating' | 'preview' | 'saved'

export interface ImageAnalysis {
  dominantColors: string[]
  detectedObjects: string[]
  detectedText: string | null
  suggestedFalPrompt: string
}

export interface CropConfig {
  width: number
  height: number
  label: 'email' | 'whatsapp' | 'square'
}

export interface StudioState {
  step: StudioStep
  file: File | null
  previewUrl: string | null
  processedImageUrl: string | null
  analysis: ImageAnalysis | null
  cropConfig: CropConfig | null
  customPrompt: string
  selectedStyle: 'minimal' | 'dramatic' | 'colorful' | 'corporate'
  config: {
    brandName: string
    productName: string
    accentColor: string
  }
  content: {
    headline: string
    ctaLabel: string
  }
  generatedHtml: string | null
  generatedImageUrl: string | null
  error: string | null
  isLoading: boolean
}

export type StudioAction =
  | { type: 'SET_FILE'; file: File; previewUrl: string }
  | { type: 'SET_STEP'; step: StudioStep }
  | { type: 'SET_ANALYSIS'; analysis: ImageAnalysis | null }
  | { type: 'SET_PROCESSED_IMAGE'; url: string }
  | { type: 'SET_CROP_CONFIG'; config: CropConfig }
  | { type: 'SET_CUSTOM_PROMPT'; prompt: string }
  | { type: 'SET_SELECTED_STYLE'; style: StudioState['selectedStyle'] }
  | { type: 'SET_CONFIG'; config: StudioState['config'] }
  | { type: 'SET_CONTENT'; content: StudioState['content'] }
  | { type: 'SET_GENERATED'; html: string; imageUrl: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET' }

export const INITIAL_STATE: StudioState = {
  step: 'upload',
  file: null,
  previewUrl: null,
  processedImageUrl: null,
  analysis: null,
  cropConfig: null,
  customPrompt: '',
  selectedStyle: 'minimal',
  config: { brandName: '', productName: '', accentColor: '#6c47ff' },
  content: { headline: '', ctaLabel: '' },
  generatedHtml: null,
  generatedImageUrl: null,
  error: null,
  isLoading: false,
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.file, previewUrl: action.previewUrl, step: 'analyzing', processedImageUrl: null, cropConfig: null, analysis: null }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.analysis, step: 'editing' }
    case 'SET_PROCESSED_IMAGE':
      return { ...state, processedImageUrl: action.url }
    case 'SET_CROP_CONFIG':
      return { ...state, cropConfig: action.config }
    case 'SET_CUSTOM_PROMPT':
      return { ...state, customPrompt: action.prompt }
    case 'SET_SELECTED_STYLE':
      return { ...state, selectedStyle: action.style }
    case 'SET_CONFIG':
      return { ...state, config: action.config }
    case 'SET_CONTENT':
      return { ...state, content: action.content }
    case 'SET_GENERATED':
      return { ...state, generatedHtml: action.html, generatedImageUrl: action.imageUrl, step: 'preview' }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}
