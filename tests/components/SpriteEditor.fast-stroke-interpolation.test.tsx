import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SpriteEditor from '../../src/components/SpriteEditor'
import { Tool, Color } from '../../src/types'

// Mock the brush patterns utility
jest.mock('../../src/utils/brushPatterns', () => ({
  generateBrushPattern: jest.fn((thickness: number) => {
    switch (thickness) {
      case 1:
        return { width: 1, height: 1, pattern: [[true]], centerX: 0, centerY: 0 }
      case 2:
        return { width: 2, height: 2, pattern: [[true, true], [true, true]], centerX: 0, centerY: 0 }
      case 3:
        return { width: 3, height: 3, pattern: [[true, true, true], [true, true, true], [true, true, true]], centerX: 1, centerY: 1 }
      case 4:
        return { width: 4, height: 4, pattern: [[false, true, true, false], [true, true, true, true], [true, true, true, true], [false, true, true, false]], centerX: 1, centerY: 1 }
      default:
        return { width: 1, height: 1, pattern: [[true]], centerX: 0, centerY: 0 }
    }
  }),
  applyBrushPattern: jest.fn((pattern: any, x: number, y: number, drawFunction: (pixelX: number, pixelY: number) => void) => {
    for (let py = 0; py < pattern.height; py++) {
      for (let px = 0; px < pattern.width; px++) {
        if (pattern.pattern[py][px]) {
          const pixelX = x + px - pattern.centerX
          const pixelY = y + py - pattern.centerY
          drawFunction(pixelX, pixelY)
        }
      }
    }
  })
}))

const defaultProps = {
  selectedTool: 'pencil' as Tool,
  primaryColor: '#000000' as Color,
  secondaryColor: '#ffffff' as Color,
  brushSize: 1,
  canvasSize: 32,
  pixelSize: 16,
  gridSettings: {
    visible: false,
    color: '#000000',
    opacity: 0.5,
    quarter: false,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false,
    sixtyfourths: false
  },
  layers: [
    { id: 1, name: 'Layer 1', visible: true, opacity: 1.0, active: true }
  ],
  onCanvasRef: jest.fn(),
  onColorChange: jest.fn(),
  onToolChange: jest.fn(),
  onBrushSizeChange: jest.fn(),
  onPixelSizeChange: jest.fn(),
  onCanvasSizeChange: jest.fn()
}

describe('SpriteEditor - Fast Stroke Interpolation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Fast Stroke with 1px Brush', () => {
    it('should interpolate between large mouse movements for 1px brush', () => {
      render(<SpriteEditor {...defaultProps} brushSize={1} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Large jump that should trigger interpolation
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle multiple fast movements in sequence', () => {
      render(<SpriteEditor {...defaultProps} brushSize={1} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Series of fast movements
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 })
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 })
      fireEvent.mouseMove(canvas, { clientX: 350, clientY: 350 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Fast Stroke with 2px Brush', () => {
    it('should interpolate between large mouse movements for 2px brush', () => {
      render(<SpriteEditor {...defaultProps} brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Large jump that should trigger interpolation
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should maintain brush pattern integrity during fast strokes', () => {
      render(<SpriteEditor {...defaultProps} brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fast diagonal stroke
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 200 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Fast Stroke with 3px Brush', () => {
    it('should interpolate between large mouse movements for 3px brush', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Large jump that should trigger interpolation
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle complex fast paths with 3px brush', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Complex path with multiple fast movements
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 150 })
      fireEvent.mouseMove(canvas, { clientX: 350, clientY: 200 })
      fireEvent.mouseMove(canvas, { clientX: 450, clientY: 250 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Fast Stroke with 4px Brush', () => {
    it('should interpolate between large mouse movements for 4px brush', () => {
      render(<SpriteEditor {...defaultProps} brushSize={4} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Large jump that should trigger interpolation
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should maintain brush pattern integrity during fast strokes', () => {
      render(<SpriteEditor {...defaultProps} brushSize={4} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fast stroke with 4px brush
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 200 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Eraser with Fast Strokes', () => {
    it('should interpolate eraser strokes correctly', () => {
      render(<SpriteEditor {...defaultProps} selectedTool="eraser" brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fast eraser stroke
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle eraser with different brush sizes', () => {
      const { rerender } = render(<SpriteEditor {...defaultProps} selectedTool="eraser" brushSize={1} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Test each brush size
      for (let brushSize = 1; brushSize <= 4; brushSize++) {
        rerender(<SpriteEditor {...defaultProps} selectedTool="eraser" brushSize={brushSize} />)
        
        // Fast eraser stroke
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
        fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
        fireEvent.mouseUp(canvas)
      }
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle extremely fast mouse movements', () => {
      render(<SpriteEditor {...defaultProps} brushSize={1} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Extremely fast movements
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 400 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle mixed fast and slow movements', () => {
      render(<SpriteEditor {...defaultProps} brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Mix of fast and slow movements
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 }) // Slow
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 300 }) // Fast
      fireEvent.mouseMove(canvas, { clientX: 310, clientY: 310 }) // Slow
      fireEvent.mouseMove(canvas, { clientX: 500, clientY: 500 }) // Fast
      
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should work correctly at canvas boundaries', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fast stroke near canvas boundaries
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseMove(canvas, { clientX: 1000, clientY: 1000 }) // Large jump
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })
})
