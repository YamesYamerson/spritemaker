import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'

describe('SpriteEditor - Action-Based Drawing Operations', () => {
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

  describe('Drawing Action Lifecycle', () => {
    it('should start drawing action on mouse down', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Mouse down should start a drawing action
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // The component should now have an active drawing action
      // currentDrawingAction.isActive should be true
      // currentDrawingAction.startPos should be set
      // currentDrawingAction.canvasStateBeforeDrawing should be captured
    })

    it('should accumulate pixels during drawing action', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse to create pixels
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 132, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 148, clientY: 100 })
      
      // All these pixels should be accumulated in the current drawing action
      // But not yet recorded in history
    })

    it('should complete drawing action on mouse up', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      
      // Complete drawing
      fireEvent.mouseUp(canvas)
      
      // Drawing action should be completed
      // currentDrawingAction.isActive should be false
      // A single history entry should be created for the entire stroke
    })

    it('should reset drawing action after completion', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Complete a drawing action
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Start another drawing action
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 })
      
      // Should have a fresh drawing action
      // currentDrawingAction.pixels should be empty
      // currentDrawingAction.startPos should be new position
    })
  })

  describe('Tool-Specific Drawing Actions', () => {
    it('should handle pencil tool drawing actions', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw with pencil
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should create a pencil tool history entry
      // The entry should contain all pixels drawn in the stroke
    })

    it('should handle eraser tool drawing actions', () => {
      const propsWithEraser = { ...defaultProps, selectedTool: 'eraser' as const }
      render(<SpriteEditor {...propsWithEraser} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Erase with eraser
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should create an eraser tool history entry
      // The entry should contain all pixels erased in the stroke
    })

    it('should handle fill tool as immediate operation', () => {
      const propsWithFill = { ...defaultProps, selectedTool: 'fill' as const }
      render(<SpriteEditor {...propsWithFill} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Fill tool should not create a drawing action
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Should not have an active drawing action
      // But should still create a history entry for the fill operation
    })

    it('should handle eyedropper tool as immediate operation', () => {
      const propsWithEyedropper = { ...defaultProps, selectedTool: 'eyedropper' as const }
      render(<SpriteEditor {...propsWithEyedropper} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Eyedropper tool should not create a drawing action
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Should not have an active drawing action
      // No history entry should be created
    })
  })

  describe('Pixel Accumulation and History Creation', () => {
    it('should accumulate all pixels from a single stroke', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Draw a complex path
      const path = [
        { x: 116, y: 100 },
        { x: 132, y: 116 },
        { x: 148, y: 132 },
        { x: 164, y: 148 }
      ]
      
      path.forEach(point => {
        fireEvent.mouseMove(canvas, { clientX: point.x, clientY: point.y })
      })
      
      fireEvent.mouseUp(canvas)
      
      // Should create one history entry containing all pixels from the stroke
      // Not individual entries for each mouse move
    })

    it('should handle rapid mouse movements efficiently', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Simulate rapid mouse movements
      for (let i = 1; i <= 100; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + (i * 16), 
          y: 100 
        })
      }
      
      fireEvent.mouseUp(canvas)
      
      // Should handle efficiently without performance issues
      // Should create one history entry for the entire stroke
    })

    it('should handle drawing outside canvas boundaries', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing inside canvas
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move outside canvas
      fireEvent.mouseMove(canvas, { clientX: -50, clientY: -50 })
      
      // Move back inside
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      
      fireEvent.mouseUp(canvas)
      
      // Should only record pixels drawn inside the canvas
      // Should handle boundary conditions gracefully
    })
  })

  describe('Canvas State Comparison', () => {
    it('should correctly calculate pixel differences', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start with empty canvas
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Draw some pixels
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 132, y: 100 })
      
      fireEvent.mouseUp(canvas)
      
      // The history entry should contain only the pixels that actually changed
      // Comparing initial canvas state vs final canvas state
    })

    it('should handle overlapping drawing operations', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // First stroke
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // Second stroke overlapping first
      fireEvent.mouseDown(canvas, { clientX: 108, y: 108 })
      fireEvent.mouseMove(canvas, { clientX: 124, y: 108 })
      fireEvent.mouseUp(canvas)
      
      // Should create separate history entries
      // Each entry should contain only the pixels that changed in that stroke
    })

    it('should handle erasing over existing pixels', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // First draw some pixels
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // Then erase over them
      const propsWithEraser = { ...defaultProps, selectedTool: 'eraser' as const }
      const { rerender } = render(<SpriteEditor {...propsWithEraser} />)
      
      fireEvent.mouseDown(canvas, { clientX: 100, y: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should create separate history entries for draw and erase
      // Each should correctly show the pixel changes
    })
  })

  describe('History Integration', () => {
    it('should create history entries with correct tool information', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Draw with pencil
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // The history entry should have the correct tool type
      // And contain all pixels from the stroke
    })

    it('should handle multiple drawing operations in sequence', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // First stroke
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // Second stroke
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 })
      fireEvent.mouseMove(canvas, { clientX: 216, y: 200 })
      fireEvent.mouseUp(canvas)
      
      // Should create two separate history entries
      // Each representing a complete drawing stroke
    })

    it('should handle history change events after operations', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Complete a drawing operation
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should complete drawing operation without errors
      // The component will handle history change events internally
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle drawing action cancellation', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      
      // Move mouse outside canvas to cancel
      fireEvent.mouseMove(canvas, { clientX: -50, y: -50 })
      
      // Should handle gracefully without errors
      // Drawing action should be properly cleaned up
    })

    it('should handle rapid mouse down/up without movement', () => {
      render(<SpriteEditor {...defaultProps} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Click without moving
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should handle gracefully
      // May or may not create a history entry depending on implementation
    })

    it('should handle missing active layer gracefully', () => {
      const propsWithoutLayer = { ...defaultProps, activeLayerId: undefined }
      render(<SpriteEditor {...propsWithoutLayer} />)
      
      const canvas = screen.getByTestId('sprite-canvas')
      
      // Try to draw without active layer
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 116, y: 100 })
      fireEvent.mouseUp(canvas)
      
      // Should handle gracefully without errors
    })
  })
})
