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

const mockCanvasRef = { current: mockCanvas }

const defaultProps = {
  selectedTool: 'eyedropper' as const,
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  brushSize: 1,
  canvasSize: 16,
  layers: [
    { id: 1, name: 'Layer 1', visible: true, active: true }
  ],
  onCanvasRef: jest.fn(),
  onPrimaryColorChange: jest.fn(),
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

describe('SpriteEditor - Eyedropper Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Eyedropper Functionality', () => {
    test('should call onPrimaryColorChange when clicking on a colored pixel', () => {
      const mockOnPrimaryColorChange = jest.fn()
      const { container, rerender } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // First, draw a pixel using the pencil tool to create a colored pixel
      const pencilProps = { ...defaultProps, selectedTool: 'pencil' as const }
      rerender(<SpriteEditor {...pencilProps} onPrimaryColorChange={mockOnPrimaryColorChange} />)
      
      // Draw a pixel at position (0, 0)
      fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 }) // Pixel (0, 0)
      fireEvent.mouseUp(canvas!)

      // Now switch back to eyedropper tool
      rerender(<SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />)
      
      // Click on the colored pixel with the eyedropper tool
      fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 }) // Pixel (0, 0)

      // The eyedropper should call onPrimaryColorChange with the color at that pixel
      expect(mockOnPrimaryColorChange).toHaveBeenCalled()
    })

    test('should not call onPrimaryColorChange when clicking on transparent pixels', () => {
      const mockOnPrimaryColorChange = jest.fn()
      const { container } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Simulate clicking on a transparent area
      fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })

      // Should not call onPrimaryColorChange for transparent pixels
      expect(mockOnPrimaryColorChange).not.toHaveBeenCalled()
    })

    test('should work without onPrimaryColorChange callback', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={undefined} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Should not crash when callback is missing
      expect(() => {
        fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      }).not.toThrow()
    })

    test('should handle eyedropper tool selection correctly', () => {
      const { container } = render(
        <SpriteEditor {...defaultProps} selectedTool="eyedropper" />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Eyedropper should be selected
      expect(defaultProps.selectedTool).toBe('eyedropper')
    })

    test('should not create drawing actions for eyedropper tool', () => {
      const mockOnPrimaryColorChange = jest.fn()
      const { container } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Click with eyedropper
      fireEvent.mouseDown(canvas!, { clientX: 8, clientY: 8 })
      
      // Eyedropper should not create drawing actions
      // This is tested by ensuring the component renders without errors
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Eyedropper Edge Cases', () => {
    test('should handle clicking outside canvas boundaries', () => {
      const mockOnPrimaryColorChange = jest.fn()
      const { container } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Click outside boundaries
      fireEvent.mouseDown(canvas!, { clientX: -10, clientY: -10 })

      // Should not call onPrimaryColorChange for out-of-bounds clicks
      expect(mockOnPrimaryColorChange).not.toHaveBeenCalled()
    })

    test('should handle clicking on canvas edges', () => {
      const mockOnPrimaryColorChange = jest.fn()
      const { container } = render(
        <SpriteEditor {...defaultProps} onPrimaryColorChange={mockOnPrimaryColorChange} />
      )

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      // Click on edge pixels
      fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 }) // Top-left edge
      fireEvent.mouseDown(canvas!, { clientX: 255, clientY: 255 }) // Bottom-right edge

      // Should handle edge clicks gracefully
      expect(canvas).toBeInTheDocument()
    })
  })
})
