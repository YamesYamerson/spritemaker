import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'

// Mock canvas methods
const mockCanvasContext = {
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4 * 16 * 16), // 16x16 canvas
    width: 16,
    height: 16
  })),
  putImageData: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  get fillStyle() { return this._fillStyle },
  set fillStyle(value) { this._fillStyle = value },
  get strokeStyle() { return this._strokeStyle },
  set strokeStyle(value) { this._strokeStyle = value },
  get lineWidth() { return this._lineWidth },
  set lineWidth(value) { this._lineWidth = value },
  get globalAlpha() { return this._globalAlpha },
  set globalAlpha(value) { this._globalAlpha = value },
  _fillStyle: '#000000',
  _strokeStyle: '#000000',
  _lineWidth: 1,
  _globalAlpha: 1.0
}

const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 256, // 16 * 16
    height: 256
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

const mockCanvasRef = { current: mockCanvas }

const defaultProps = {
  selectedTool: 'pencil' as const,
  primaryColor: '#ff0000',
  secondaryColor: '#0000ff',
  brushSize: 1,
  canvasSize: 16,
  layers: [
    { id: 1, name: 'Layer 1', visible: true, active: true }
  ],
  onCanvasRef: jest.fn(),
  onPrimaryColorChange: jest.fn(),
  onPixelsChange: jest.fn(),
  gridSettings: {
    visible: false,
    color: '#333',
    opacity: 0.5,
    quarter: false,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false,
    sixtyfourths: false
  }
}

describe('SpriteEditor - Shape Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rectangle Tool', () => {
    it('should draw rectangle when mouse down, move, and up', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6)
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should have called onPixelsChange to update the canvas
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should show rectangle preview while dragging', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6) - this should trigger preview drawing
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // The preview should be drawn using the canvas context
      expect(mockCanvasContext.strokeRect).toHaveBeenCalled()
    })

    it('should handle rectangle with negative dimensions', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (6, 6)
      fireEvent.mouseDown(canvas!, { clientX: 96, clientY: 96 })
      
      // Mouse move to (2, 2) - this creates a rectangle with negative dimensions
      fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should still work and call onPixelsChange
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })
  })

  describe('Circle Tool', () => {
    it('should draw circle when mouse down, move, and up', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="circle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6)
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should have called onPixelsChange to update the canvas
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should show circle preview while dragging', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="circle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6) - this should trigger preview drawing
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // The preview should be drawn using the canvas context
      expect(mockCanvasContext.strokeRect).toHaveBeenCalled() // Bounding box
      expect(mockCanvasContext.arc).toHaveBeenCalled() // Circle
    })

    it('should handle circle with minimum radius', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="circle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to same position (2, 2) - this creates a circle with minimum radius
      fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should still work and call onPixelsChange
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })
  })

  describe('Line Tool', () => {
    it('should draw line when mouse down, move, and up', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="line" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6)
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should have called onPixelsChange to update the canvas
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should show line preview while dragging', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="line" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move to (6, 6) - this should trigger preview drawing
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // The preview should be drawn using the canvas context
      expect(mockCanvasContext.beginPath).toHaveBeenCalled()
      expect(mockCanvasContext.moveTo).toHaveBeenCalled()
      expect(mockCanvasContext.lineTo).toHaveBeenCalled()
      expect(mockCanvasContext.stroke).toHaveBeenCalled()
    })

    it('should handle horizontal line', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="line" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move horizontally to (6, 2)
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 32 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should work for horizontal lines
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should handle vertical line', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="line" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Mouse down at (2, 2)
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Mouse move vertically to (2, 6)
      fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 96 })
      
      // Mouse up
      fireEvent.mouseUp(canvas!)
      
      // Should work for vertical lines
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })
  })

  describe('Shape Tool Integration', () => {
    it('should not interfere with pencil tool', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="pencil" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Pencil tool should work normally
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      fireEvent.mouseUp(canvas!)
      
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should handle switching between shape tools', () => {
      const { container, rerender } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Switch to circle tool
      rerender(<SpriteEditor {...defaultProps} selectedTool="circle" />)
      
      // Circle tool should work
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      fireEvent.mouseUp(canvas!)
      
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should handle canvas boundaries correctly', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Try to draw outside canvas boundaries
      fireEvent.mouseDown(canvas!, { clientX: -32, clientY: -32 })
      fireEvent.mouseMove(canvas!, { clientX: 512, clientY: 512 })
      fireEvent.mouseUp(canvas!)
      
      // Should handle boundaries gracefully
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })
  })

  describe('Shape Tool Edge Cases', () => {
    it('should handle rapid mouse movements', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Rapid mouse movements
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
      fireEvent.mouseUp(canvas!)
      
      // Should handle rapid movements gracefully
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })

    it('should handle mouse events outside canvas', () => {
      const { container } = render(<SpriteEditor {...defaultProps} selectedTool="rectangle" />)
      
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Start drawing inside canvas
      fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
      
      // Move outside canvas
      fireEvent.mouseMove(canvas!, { clientX: -100, clientY: -100 })
      
      // Move back inside
      fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
      
      // Finish drawing
      fireEvent.mouseUp(canvas!)
      
      // Should handle outside events gracefully
      expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    })
  })
})
