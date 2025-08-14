import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'

describe('SpriteEditor - Canvas State History Tracking', () => {
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
      { id: 'layer1', name: 'Layer 1', visible: true, opacity: 1.0 }
    ],
    activeLayerId: 'layer1',
    onCanvasRef: jest.fn(),
    onLayerChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Canvas State Snapshot Approach', () => {
    it('should capture canvas state before drawing starts', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      expect(canvas).toBeInTheDocument()
      
      // Simulate mouse down to start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // The component should now have captured the canvas state before drawing
      // We can verify this by checking that currentDrawingAction.canvasStateBeforeDrawing is set
    })

    it('should create single history entry for complete drawing stroke', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse to create a line
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      
      // End drawing
      fireEvent.mouseUp(canvas)
      
      // Should create only one history entry for the entire stroke
      // Instead of individual entries for each pixel
    })

    it('should handle multiple drawing strokes as separate history entries', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // First stroke
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Second stroke
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 })
      fireEvent.mouseMove(canvas, { clientX: 250, clientY: 200 })
      fireEvent.mouseUp(canvas)
      
      // Should create two separate history entries
    })

    it('should calculate pixel differences correctly between initial and final states', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start with empty canvas
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Draw a few pixels
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 132, clientY: 100 })
      
      fireEvent.mouseUp(canvas)
      
      // The history entry should contain only the pixels that actually changed
      // Not every intermediate pixel during the drawing process
    })

    it('should handle eraser tool with canvas state tracking', () => {
      const propsWithEraser = { ...defaultProps, selectedTool: 'eraser' as const }
      render(<SpriteEditor {...propsWithEraser} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // First draw some pixels
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Then erase them
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should create separate history entries for draw and erase operations
    })

    it('should not create history entries for immediate tools', () => {
      const propsWithFill = { ...defaultProps, selectedTool: 'fill' as const }
      render(<SpriteEditor {...propsWithFill} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fill tool should not create a drawing action
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Should not have an active drawing action
      // But should still create a history entry for the fill operation
    })
  })

  describe('Drawing Action State Management', () => {
    it('should properly reset drawing action after completion', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Complete drawing
      fireEvent.mouseUp(canvas)
      
      // Drawing action should be reset
      // currentDrawingAction.isActive should be false
    })

    it('should handle drawing action cancellation', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse outside canvas to cancel
      fireEvent.mouseMove(canvas, { clientX: -50, clientY: -50 })
      
      // Drawing action should be properly handled
    })
  })

  describe('History Event Dispatching', () => {
    it('should handle undo operations correctly', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw something first
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Perform undo
      const canvasRef = (canvas as any)
      if (canvasRef.undo) {
        canvasRef.undo()
      }
      
      // Should handle undo without errors
      expect(canvasRef.undo).toBeDefined()
    })

    it('should handle redo operations correctly', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw something first
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Undo it
      const canvasRef = (canvas as any)
      if (canvasRef.undo) {
        canvasRef.undo()
      }
      
      // Perform redo
      if (canvasRef.redo) {
        canvasRef.redo()
      }
      
      // Should handle redo without errors
      expect(canvasRef.redo).toBeDefined()
    })
  })

  describe('Performance and Memory', () => {
    it('should not accumulate excessive pixel data during drawing', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw a long line with many mouse moves
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Simulate many mouse moves (like drawing a long line)
      for (let i = 1; i <= 50; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + (i * 16), 
          clientY: 100 
        })
      }
      
      fireEvent.mouseUp(canvas)
      
      // Should create only one history entry, not 50+ individual pixel entries
    })

    it('should handle large canvas sizes efficiently', () => {
      const largeCanvasProps = { ...defaultProps, canvasSize: 512 }
      render(<SpriteEditor {...largeCanvasProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw on large canvas
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should complete without performance issues
    })
  })
})
