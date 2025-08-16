import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'
import { Tool, Color, Layer } from '../../src/types'

// Mock the HistoryManager
const mockHistoryManager = {
  pushOperation: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: jest.fn(),
  canRedo: jest.fn(),
  getHistoryState: jest.fn(),
  createStrokeOperation: jest.fn(),
  clear: jest.fn(),
  getUndoCount: jest.fn(),
  getRedoCount: jest.fn(),
  getState: jest.fn()
}

// Mock the HistoryManager constructor
jest.mock('../../src/utils/historyManager', () => ({
  HistoryManager: jest.fn().mockImplementation(() => mockHistoryManager)
}))

describe('SpriteEditor Template Functionality', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock canvas and context
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 32
    mockCanvas.height = 32
    
    mockContext = {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(),
      createLinearGradient: jest.fn(),
      createRadialGradient: jest.fn(),
      createPattern: jest.fn(),
      drawImage: jest.fn(),
      getContextAttributes: jest.fn(),
      isPointInPath: jest.fn(),
      isPointInStroke: jest.fn(),
      clip: jest.fn(),
      resetTransform: jest.fn(),
      rotate: jest.fn(),
      transform: jest.fn(),
      getTransform: jest.fn(),
      direction: 'ltr',
      filter: '',
      font: '',
      fontKerning: 'auto',
      fontStretch: 'normal',
      fontVariantCaps: 'normal',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
      letterSpacing: '0px',
      lineCap: 'butt',
      lineDashOffset: 0,
      lineJoin: 'miter',
      lineWidth: 1,
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textAlign: 'start',
      textBaseline: 'alphabetic',
      textRenderingOptimization: 'auto'
    } as any

    // Mock getContext
    mockCanvas.getContext = jest.fn().mockReturnValue(mockContext)
    
    // Mock getBoundingClientRect
    mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 320,
      height: 320,
      right: 320,
      bottom: 320
    })

    // Mock addEventListener and removeEventListener
    mockCanvas.addEventListener = jest.fn()
    mockCanvas.removeEventListener = jest.fn()

    // Mock dispatchEvent
    mockCanvas.dispatchEvent = jest.fn()

    // Mock the canvas methods that are exposed via onCanvasRef
    Object.defineProperty(mockCanvas, 'undo', {
      value: jest.fn(),
      writable: true
    })
    Object.defineProperty(mockCanvas, 'redo', {
      value: jest.fn(),
      writable: true
    })
    Object.defineProperty(mockCanvas, 'canUndo', {
      value: jest.fn(),
      writable: true
    })
    Object.defineProperty(mockCanvas, 'canRedo', {
      value: jest.fn(),
      writable: true
    })
    Object.defineProperty(mockCanvas, 'getHistoryState', {
      value: jest.fn(),
      writable: true
    })
    Object.defineProperty(mockCanvas, 'applyTemplate', {
      value: jest.fn(),
      writable: true
    })
  })

  const defaultProps = {
    canvasSize: 32,
    onPixelsChange: jest.fn(),
    onCanvasRef: jest.fn(),
    activeLayer: { id: 1, name: 'Layer 1', visible: true } as Layer,
    layers: [{ id: 1, name: 'Layer 1', visible: true }] as Layer[],
    onLayerChange: jest.fn(),
    onActiveLayerChange: jest.fn(),
    currentTool: 'pencil' as Tool,
    currentColor: '#000000' as Color,
    brushSize: 1,
    currentBrushPattern: 'solid',
    gridSettings: {
      visible: true,
      color: '#333333',
      opacity: 0.3,
      quarter: true,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    }
  }

  describe('Template Application', () => {
    it('should apply template pixels correctly', async () => {
      const onCanvasRef = jest.fn()
      render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)

      // Wait for the canvas ref to be set
      await waitFor(() => {
        expect(onCanvasRef).toHaveBeenCalled()
      })

      const canvasRef = onCanvasRef.mock.calls[0][0]
      expect(canvasRef).toBeTruthy()

      // Mock template pixels
      const templatePixels = new Map([
        ['16,16', { x: 16, y: 16, color: '#FF0000', layerId: 1 }],
        ['17,16', { x: 17, y: 16, color: '#FF0000', layerId: 1 }],
        ['16,17', { x: 16, y: 17, color: '#FF0000', layerId: 1 }],
        ['17,17', { x: 17, y: 17, color: '#FF0000', layerId: 1 }]
      ])

      // Call applyTemplate
      canvasRef.current.applyTemplate(templatePixels)

      // Verify that pixels were updated
      expect(defaultProps.onPixelsChange).toHaveBeenCalledWith(templatePixels)
    })

    it('should record template operation in history', async () => {
      const onCanvasRef = jest.fn()
      render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)

      await waitFor(() => {
        expect(onCanvasRef).toHaveBeenCalled()
      })

      const canvasRef = onCanvasRef.mock.calls[0][0]
      
      // Mock template pixels
      const templatePixels = new Map([
        ['16,16', { x: 16, y: 16, color: '#FF0000', layerId: 1 }]
      ])

      // Call applyTemplate
      canvasRef.current.applyTemplate(templatePixels)

      // Verify that history operation was pushed
      expect(mockHistoryManager.pushOperation).toHaveBeenCalled()
      
      const operation = mockHistoryManager.pushOperation.mock.calls[0][0]
      expect(operation.tool).toBe('template')
      expect(operation.layerId).toBe(1)
      expect(operation.pixels).toHaveLength(1)
      expect(operation.pixels[0]).toEqual({
        x: 16,
        y: 16,
        previousColor: 'transparent',
        newColor: '#FF0000'
      })
    })

    it('should handle template with existing pixels', async () => {
      const onCanvasRef = jest.fn()
      render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)

      await waitFor(() => {
        expect(onCanvasRef).toHaveBeenCalled()
      })

      const canvasRef = onCanvasRef.mock.calls[0][0]
      
      // Mock template pixels that overlap with existing content
      const templatePixels = new Map([
        ['16,16', { x: 16, y: 16, color: '#FF0000', layerId: 1 }],
        ['17,16', { x: 17, y: 16, color: '#FF0000', layerId: 1 }]
      ])

      // Call applyTemplate
      canvasRef.current.applyTemplate(templatePixels)

      // Verify that history operation includes both previous and new states
      expect(mockHistoryManager.pushOperation).toHaveBeenCalled()
      
      const operation = mockHistoryManager.pushOperation.mock.calls[0][0]
      expect(operation.tool).toBe('template')
      expect(operation.pixels).toHaveLength(2)
    })
  })

  describe('Template Operation Structure', () => {
    it('should create template operations with correct metadata', async () => {
      const onCanvasRef = jest.fn()
      render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)

      await waitFor(() => {
        expect(onCanvasRef).toHaveBeenCalled()
      })

      const canvasRef = onCanvasRef.mock.calls[0][0]
      
      // Mock template pixels
      const templatePixels = new Map([
        ['16,16', { x: 16, y: 16, color: '#FF0000', layerId: 1 }]
      ])

      // Call applyTemplate
      canvasRef.current.applyTemplate(templatePixels)

      // Verify operation structure
      expect(mockHistoryManager.pushOperation).toHaveBeenCalled()
      
      const operation = mockHistoryManager.pushOperation.mock.calls[0][0]
      expect(operation).toMatchObject({
        tool: 'template',
        layerId: 1,
        timestamp: expect.any(Number),
        metadata: {}
      })
      expect(operation.id).toMatch(/^template-\d+$/)
      expect(Array.isArray(operation.pixels)).toBe(true)
    })
  })
})
