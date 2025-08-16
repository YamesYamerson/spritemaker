import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'
import { HistoryManager } from '../../src/utils/historyManager'
import { Tool, Color, Layer, GridSettings } from '../../src/types'

// Mock HistoryManager
jest.mock('../../src/utils/historyManager')

const MockedHistoryManager = HistoryManager as jest.MockedClass<typeof HistoryManager>

describe('SpriteEditor Template Integration', () => {
  const mockHistoryManager = {
    pushOperation: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn(),
    canRedo: jest.fn(),
    getState: jest.fn(),
    clear: jest.fn(),
    createStrokeOperation: jest.fn(),
    getUndoCount: jest.fn(),
    getRedoCount: jest.fn()
  } as any

  const defaultProps = {
    selectedTool: 'pencil' as Tool,
    primaryColor: '#FF0000' as Color,
    secondaryColor: '#00FF00' as Color,
    brushSize: 1,
    canvasSize: 32,
    layers: [
      { id: 1, name: 'Layer 1', visible: true, active: true }
    ] as Layer[],
    onCanvasRef: jest.fn(),
    onPrimaryColorChange: jest.fn(),
    onPixelsChange: jest.fn(),
    onSelectionChange: jest.fn(),
    gridSettings: {
      visible: false,
      color: '#333',
      opacity: 0.5,
      quarter: false,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    } as GridSettings
  }

  beforeEach(() => {
    jest.clearAllMocks()
    MockedHistoryManager.mockImplementation(() => mockHistoryManager as any)
  })

  describe('Canvas Method Exposure', () => {
    it('should expose template methods via canvas ref', async () => {
      const onCanvasRef = jest.fn()
      const { container } = render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)
      
      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeTruthy()
      })

      expect(onCanvasRef).toHaveBeenCalled()
      
      const canvasRef = onCanvasRef.mock.calls[0][0]
      expect(canvasRef.current).toBeTruthy()
      
      // Check that template-related methods are exposed
      expect(typeof canvasRef.current.applyTemplate).toBe('function')
      expect(typeof canvasRef.current.getCurrentPixels).toBe('function')
      expect(typeof canvasRef.current.getCanvasSize).toBe('function')
    })

    it('should expose history methods via canvas ref', async () => {
      const onCanvasRef = jest.fn()
      const { container } = render(<SpriteEditor {...defaultProps} onCanvasRef={onCanvasRef} />)
      
      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeTruthy()
      })

      expect(onCanvasRef).toHaveBeenCalled()
      
      const canvasRef = onCanvasRef.mock.calls[0][0]
      expect(canvasRef.current).toBeTruthy()
      
      // Check that history methods are exposed
      expect(typeof canvasRef.current.undo).toBe('function')
      expect(typeof canvasRef.current.redo).toBe('function')
      expect(typeof canvasRef.current.canUndo).toBe('function')
      expect(typeof canvasRef.current.canRedo).toBe('function')
      expect(typeof canvasRef.current.getHistoryState).toBe('function')
    })
  })

  describe('Component Rendering', () => {
    it('should render canvas with correct dimensions', async () => {
      const { container } = render(<SpriteEditor {...defaultProps} />)
      
      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeTruthy()
      })

      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      expect(canvas).toBeTruthy()
      expect(canvas.getAttribute('data-testid')).toBe('sprite-canvas')
    })

    it('should handle different canvas sizes', async () => {
      const { container, rerender } = render(<SpriteEditor {...defaultProps} canvasSize={64} />)
      
      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeTruthy()
      })

      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      // Canvas is scaled by Math.floor(512 / canvasSize) for display
      // For 64x64: pixelSize = Math.floor(512 / 64) = 8, so canvas size = 64 * 8 = 512
      expect(canvas.width).toBe(64 * 8)
      expect(canvas.height).toBe(64 * 8)

      // Test with different size
      rerender(<SpriteEditor {...defaultProps} canvasSize={128} />)
      
      await waitFor(() => {
        const newCanvas = container.querySelector('canvas') as HTMLCanvasElement
        // For 128x128: pixelSize = Math.floor(512 / 128) = 4, so canvas size = 128 * 4 = 512
        expect(newCanvas.width).toBe(128 * 4)
        expect(newCanvas.height).toBe(128 * 4)
      })
    })
  })

  describe('Template Integration', () => {
    it('should not interfere with other tool functionality', async () => {
      const { container } = render(<SpriteEditor {...defaultProps} />)
      
      await waitFor(() => {
        expect(container.querySelector('canvas')).toBeTruthy()
      })

      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      
      // Template functionality should not break other features
      expect(canvas).toBeTruthy()
      // Canvas is scaled by Math.floor(512 / canvasSize) for display
      // For 32x32: pixelSize = Math.floor(512 / 32) = 16, so canvas size = 32 * 16 = 512
      expect(canvas.width).toBe(32 * 16)
      expect(canvas.height).toBe(32 * 16)
    })
  })
})
