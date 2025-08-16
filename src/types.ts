export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle-border' | 'rectangle-filled' | 'circle-border' | 'circle-filled' | 'line' | 'select' | 'lasso' | 'copy' | 'cut' | 'paste' | 'move-selection' | 'brush-size' | 'template'

export type Color = string

export interface Layer {
  id: number
  name: string
  visible: boolean
  active: boolean
}

export interface PixelData {
  x: number
  y: number
  color: Color
  layerId: number
}

// Template system types
export interface Template {
  id: string
  name: string
  description: string
  sizes: TemplateSize[]
  createdAt: number
  updatedAt: number
  author?: string
  tags?: string[]
}

export interface TemplateSize {
  width: number
  height: number
  pixels: PixelData[]
  previewPath?: string // Optional: can generate from pixels
}

export interface SavedTemplate {
  id: string
  name: string
  description: string
  width: number
  height: number
  pixels: PixelData[]
  createdAt: number
  updatedAt: number
  author?: string
  tags?: string[]
}

// New types for undo/redo system
export interface StrokeOperation {
  id: string
  tool: Tool
  layerId: number
  pixels: Array<{
    x: number
    y: number
    previousColor: Color
    newColor: Color
  }>
  timestamp: number
  canvasSnapshot?: Map<string, PixelData> // Store the complete canvas state after this operation
  metadata?: {
    selectionBounds?: {
      startX: number
      startY: number
      endX: number
      endY: number
    }
    selectionContent?: Map<string, {
      x: number
      y: number
      color: Color
      layerId: number
    }>
    pasteBounds?: {
      startX: number
      startY: number
      endX: number
      endY: number
    }
    originalClipboardBounds?: {
      startX: number
      startY: number
      endX: number
      endY: number
    }
    clipboardContent?: Map<string, {
      x: number
      y: number
      color: Color
      layerId: number
    }>
  }
}

export interface HistoryState {
  undoStack: StrokeOperation[]
  redoStack: StrokeOperation[]
  maxHistorySize: number
}

export interface CanvasState {
  width: number
  height: number
  pixels: Map<string, PixelData>
  layers: Layer[]
}

export interface GridSettings {
  visible: boolean
  color: string
  opacity: number
  quarter: boolean // Enable quarter grid divisions
  eighths: boolean // Enable eighths grid divisions
  sixteenths: boolean // Enable sixteenths grid divisions
  thirtyseconds: boolean // Enable thirty-seconds grid divisions
  sixtyfourths: boolean // Enable sixty-fourths grid divisions
}

// Extend HTMLCanvasElement to include our custom methods
declare global {
  interface HTMLCanvasElement {
    undo?: () => void
    redo?: () => void
    canUndo?: () => boolean
    canRedo?: () => boolean
    getHistoryState?: () => HistoryState
    addToHistory?: (operation: StrokeOperation) => void
    applyTemplate?: (templatePixels: Map<string, PixelData>) => void
    getCurrentPixels?: () => Map<string, PixelData>
    getCanvasSize?: () => number
  }
}
