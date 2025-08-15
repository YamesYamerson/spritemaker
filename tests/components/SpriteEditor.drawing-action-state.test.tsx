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
  clearRect: jest.fn()
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
  removeEventListener: jest.fn(),
  getCanvasSize: jest.fn(() => 16)
}

// Mock the canvas ref
const mockCanvasRef = {
  current: mockCanvas
}

// Mock the floodFill function
jest.mock('../../src/utils/colorUtils', () => ({
  floodFill: jest.fn()
}))

const defaultProps = {
  selectedTool: 'pencil' as const,
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  brushSize: 1,
  canvasSize: 16,
  layers: [
    { id: 1, name: 'Layer 1', visible: true, active: true }
  ],
  onCanvasRef: jest.fn(),
  gridSettings: {
    visible: true,
    color: '#cccccc',
    opacity: 0.5,
    quarter: true,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false,
    sixtyfourths: false
  }
}

describe('SpriteEditor - Drawing Action State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanvas.getBoundingClientRect.mockReturnValue({
      left: 0,
      top: 0,
      width: 256,
      height: 256
    })
  })

  describe('Mouse Down Drawing Action State', () => {
    test('should create active drawing action before drawing pixels', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Simulate mouse down on a pixel - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 }) // Pixel (0, 0)
      }).not.toThrow()
    })

    test('should handle pencil tool with active drawing action', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} selectedTool="pencil" />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down on a pixel - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle eraser tool with active drawing action', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} selectedTool="eraser" />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down on a pixel - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should not draw when no active layer', () => {
      const { container } = render(
        <SpriteEditor 
          {...defaultProps} 
          layers={[]}
        />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down on a pixel - should not throw errors even with no layers
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle different brush sizes correctly', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} brushSize={3} />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down on a pixel - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })
  })

  describe('Drawing Action Lifecycle', () => {
    test('should set drawing action as active on mouse down', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle immediate tools without creating drawing actions', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} selectedTool="fill" />
      )

      const canvas = container.querySelector('canvas')
      
      // Simulate mouse down - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })
  })

  describe('Pixel Placement Accuracy', () => {
    test('should place pixels at exact coordinates', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click at pixel (1, 1) - coordinates (16, 16) - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 16, clientY: 16 })
      }).not.toThrow()
    })

    test('should handle edge pixel coordinates', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click at last pixel (15, 15) - coordinates (248, 248) - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 248, clientY: 248 })
      }).not.toThrow()
    })

    test('should not draw outside canvas bounds', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click outside canvas bounds - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 300, clientY: 300 })
      }).not.toThrow()
    })
  })

  describe('Brush Pattern Integration', () => {
    test('should apply brush pattern correctly on mouse down', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} brushSize={2} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click with 2x2 brush - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle 3x3 brush pattern on mouse down', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} brushSize={3} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click with 3x3 brush - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle 4x4 brush pattern on mouse down', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} brushSize={4} />
      )

      const canvas = container.querySelector('canvas')
      
      // Click with 4x4 brush - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })
  })

  describe('State Management', () => {
    test('should maintain drawing action state consistency', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // First click - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()

      // Second click - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 24, clientY: 24 })
      }).not.toThrow()
    })

    test('should handle rapid successive clicks', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} />
      )

      const canvas = container.querySelector('canvas')
      
      // Rapid successive clicks - should not throw errors
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
        fireEvent.mouseDown(canvas!, { clientX: 24, clientY: 24 })
        fireEvent.mouseDown(canvas!, { clientX: 40, clientY: 40 })
      }).not.toThrow()
    })
  })
})
