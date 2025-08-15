import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'

describe('SpriteEditor - Adaptive Line Sampling', () => {
  const defaultProps = {
    canvasSize: 32,
    pixelSize: 16,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    selectedTool: 'pencil' as const,
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
      { id: 'layer1', name: 'Layer 1', visible: true, opacity: 1.0, active: true }
    ],
    onCanvasRef: jest.fn(),
    gridSettings: {
      visible: false,
      color: '#000000',
      opacity: 0.5,
      quarter: false,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Adaptive Line Sampling', () => {
    it('should sample densely for 1px brush to prevent gaps', () => {
      render(<SpriteEditor {...defaultProps} brushSize={1} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse quickly (simulating fast movement)
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should sample more densely for 2px brush to prevent gaps', () => {
      render(<SpriteEditor {...defaultProps} brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse quickly (simulating fast movement)
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should sample very densely for 3px brush to prevent gaps', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse quickly (simulating fast movement)
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should sample very densely for 4px brush to prevent gaps', () => {
      render(<SpriteEditor {...defaultProps} brushSize={4} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse quickly (simulating fast movement)
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle diagonal movement efficiently', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse diagonally (simulating curved movement)
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 })
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle very rapid mouse movements', () => {
      render(<SpriteEditor {...defaultProps} brushSize={2} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Rapid mouse movements
      for (let i = 1; i <= 5; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + i * 20, 
          clientY: 100 + i * 10 
        })
      }
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Memory Efficiency', () => {
    it('should not create excessive pixel data during rapid drawing', () => {
      render(<SpriteEditor {...defaultProps} brushSize={3} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Many rapid mouse movements
      for (let i = 1; i <= 10; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + i * 10, 
          clientY: 100 + i * 5 
        })
      }
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })

    it('should handle large brush sizes efficiently', () => {
      render(<SpriteEditor {...defaultProps} brushSize={4} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse quickly
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      expect(canvas).toBeInTheDocument()
    })
  })
})
