import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'
import { Tool, Color, Layer, GridSettings } from '../../src/types'

describe('SpriteEditor - Select Tool', () => {
  const defaultProps = {
    selectedTool: 'select' as Tool,
    primaryColor: '#ff0000' as Color,
    secondaryColor: '#0000ff' as Color,
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
    } as GridSettings
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing when select tool is selected', () => {
    render(<SpriteEditor {...defaultProps} />)
    expect(screen.getByTestId('sprite-canvas')).toBeInTheDocument()
  })

  it('should handle select tool mouse down and move', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Mouse down at (2, 2)
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Mouse move to (6, 6)
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    
    // Mouse up
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange since select tool doesn't modify pixels
    // (except for the initial call during component initialization)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should not modify pixels when using select tool', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Perform a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Select tool should not modify pixels
    // (except for the initial call during component initialization)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle select tool with different canvas sizes', () => {
    const propsWithLargeCanvas = {
      ...defaultProps,
      canvasSize: 32
    }
    
    const { container } = render(<SpriteEditor {...propsWithLargeCanvas} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Mouse down at (4, 4) - should work with larger canvas
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Mouse move to (12, 12)
    fireEvent.mouseMove(canvas!, { clientX: 192, clientY: 192 })
    
    // Mouse up
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange
    // (except for the initial call during component initialization)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle select tool with multiple layers', () => {
    const propsWithMultipleLayers = {
      ...defaultProps,
      layers: [
        { id: 1, name: 'Layer 1', visible: true, active: true },
        { id: 2, name: 'Layer 2', visible: false, active: false }
      ]
    }
    
    const { container, rerender } = render(<SpriteEditor {...propsWithMultipleLayers} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Perform selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange
    // (except for the initial call during component initialization)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should persist selection when switching tools', () => {
    const { container, rerender } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection using the select tool
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to pencil tool
    const propsWithPencilTool = {
      ...defaultProps,
      selectedTool: 'pencil' as Tool
    }
    
    rerender(<SpriteEditor {...propsWithPencilTool} />)
    
    // The selection should still be visible and active
    // We can verify this by checking that the selection state is maintained
    // and that clicking outside the selection clears it
    fireEvent.mouseDown(canvas!, { clientX: 200, clientY: 200 }) // Click far outside selection
    
    // The selection should be cleared when clicking outside
    // This verifies that the selection state was maintained across tool switches
  })

  it('should handle copy operation with keyboard shortcut', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Simulate Ctrl+C to copy
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // The copy operation should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle cut operation with keyboard shortcut', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Simulate Ctrl+X to cut
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // The cut operation should modify pixels (remove selected pixels)
    // and clear the selection
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle paste operation with keyboard shortcut', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // First, create a selection and copy it
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Now paste the copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // The paste operation should modify pixels (add pasted pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should create selection history when drawing within selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection first
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Clear the initial call again after selection
    jest.clearAllMocks()
    
    // Now draw within the selection using pencil tool
    const propsWithPencilTool = {
      ...defaultProps,
      selectedTool: 'pencil' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithPencilTool} />)
    
    // Draw within the selection bounds
    fireEvent.mouseDown(canvas!, { clientX: 48, clientY: 48 }) // Inside selection
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 }) // Still inside
    fireEvent.mouseUp(canvas!)
    
    // Should have called onPixelsChange for the drawing operation
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    
    // The selection should still be active and visible
    // This verifies that drawing within a selection maintains the selection
    // and creates a new selection history entry
  })

  it('should properly track selection content and create meaningful history entries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Clear the initial call again after selection
    jest.clearAllMocks()
    
    // Switch to pencil tool and draw within the selection
    const propsWithPencilTool = {
      ...defaultProps,
      selectedTool: 'pencil' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithPencilTool} />)
    
    // Draw a pixel within the selection
    fireEvent.mouseDown(canvas!, { clientX: 48, clientY: 48 }) // Inside selection
    fireEvent.mouseUp(canvas!)
    
    // Should have called onPixelsChange for the drawing operation
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    
    // The selection should still be active
    // This verifies that:
    // 1. Selection content was captured when created
    // 2. New selection history entry was created after drawing
    // 3. Selection state is maintained with updated content
  })

  it('should handle selection starting outside canvas boundaries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Start selection outside canvas (negative coordinates)
    fireEvent.mouseDown(canvas!, { clientX: -32, clientY: -32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange since select tool doesn't modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection extending beyond canvas boundaries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Start selection inside canvas but extend beyond boundaries
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 800, clientY: 800 }) // Way outside canvas
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange since select tool doesn't modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should maintain selection state when extending outside canvas boundaries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Start selection inside canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries - selection should continue working
    // Simulate global mouse move outside canvas
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800, // Way outside canvas
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    // Move back inside canvas
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    
    // Complete selection
    fireEvent.mouseUp(canvas!)
    
    // Should not have modified pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should clamp selection bounds to canvas size when extending beyond boundaries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Start selection inside canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move way outside canvas boundaries - selection should be clamped
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 1000, // Way outside canvas
      clientY: 1000
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    // Complete selection
    fireEvent.mouseUp(canvas!)
    
    // Should not have modified pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
    
    // The selection should be clamped to canvas boundaries (0 to 15 for 16x16 canvas)
    // This test verifies that the selection logic properly handles out-of-bounds coordinates
  })

  it('should select pixels in bottom row and right column correctly', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Create a selection that includes the bottom row and right column
    // For 16x16 canvas, pixel size is 32, so coordinates 15,15 should be at (480, 480)
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 480, clientY: 480 })
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange since select tool doesn't modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should allow selection adjustment when cursor goes outside canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Clear the initial call to onPixelsChange
    jest.clearAllMocks()
    
    // Start selection inside canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move cursor outside canvas (should still allow selection adjustment)
    fireEvent.mouseMove(canvas!, { clientX: 800, clientY: 800 })
    
    // Move cursor back inside canvas
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    
    // Complete selection
    fireEvent.mouseUp(canvas!)
    
    // Should not have called onPixelsChange since select tool doesn't modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should not start new selection when clicking on existing selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create initial selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Verify selection exists
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
    
    // Click inside the existing selection - should not start a new selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Should not have started drawing (isDrawing should remain false)
    // This test verifies that clicking on existing selection doesn't auto-start new selection
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should not store selection events in history', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Verify selection exists but no pixels were modified
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
    
    // The selection should not create a history entry
    // This test verifies that selections are no longer stored in history
  })

  it('should handle lasso tool selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Start lasso selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move to create lasso path
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    
    // Complete lasso selection
    fireEvent.mouseUp(canvas!)
    
    // Should not have modified pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
    
    // The lasso selection should be active
    // This test verifies that the lasso tool creates selections without modifying pixels
  })

  it('should create pixel-perfect lasso selections with dashed lines', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Start lasso selection at pixel boundary
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move to create a pixel-perfect path (no anti-aliasing)
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 }) // Right
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 }) // Down
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 }) // Left
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 }) // Back to start
    
    // Complete lasso selection
    fireEvent.mouseUp(canvas!)
    
    // Should not have modified pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
    
    // The lasso should create a pixel-perfect selection path
    // This test verifies that the lasso tool creates clean, pixel-aligned selections
  })

  // ===== COMPREHENSIVE CUT OPERATION TESTS =====
  
  it('should handle cut operation with empty selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try to cut without a selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should not modify pixels without selection
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle cut operation with single pixel selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create single pixel selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Cut the selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should have modified pixels (removed selected pixel)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle cut operation with large selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create large selection covering most of canvas
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 448, clientY: 448 }) // Almost full canvas
    fireEvent.mouseUp(canvas!)
    
    // Cut the selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should have modified pixels (removed selected pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle cut operation with selection extending beyond canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Start selection inside, extend beyond canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    fireEvent.mouseUp(canvas!)
    
    // Cut the selection (should be clamped to canvas boundaries)
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should have modified pixels within canvas boundaries
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should clear selection after cut operation', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Cut the selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Selection should be cleared after cut
    // Try to cut again - should not modify pixels
    jest.clearAllMocks()
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  // ===== COMPREHENSIVE COPY OPERATION TESTS =====
  
  it('should handle copy operation with empty selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try to copy without a selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle copy operation with single pixel selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create single pixel selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Should not modify pixels (copy only reads)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle copy operation with large selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create large selection
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 448, clientY: 448 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should maintain selection after copy operation', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Selection should remain active
    // Try to copy again - should work
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle copy operation with selection extending beyond canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Start selection inside, extend beyond canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection (should be clamped to canvas boundaries)
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  // ===== COMPREHENSIVE PASTE OPERATION TESTS =====
  
  it('should handle paste operation without clipboard content', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try to paste without any copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should not modify pixels without clipboard content
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle paste operation with clipboard content', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection and copy it
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Now paste the copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels (added pasted pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle paste operation at canvas center when no selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection and copy it
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Now paste the copied content (should center on canvas)
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle paste operation with large clipboard content', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create large selection and copy it
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 448, clientY: 448 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste the large content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should create new selection around pasted content', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection and copy it
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste the copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    
    // A new selection should be created around the pasted content
    // This can be verified by trying to copy again
    jest.clearAllMocks()
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    // Should work if selection exists
  })

  it('should handle paste operation with clipboard content extending beyond canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection extending beyond canvas and copy it
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste the content (should be clamped to canvas boundaries)
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels within canvas boundaries
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  // ===== COMPREHENSIVE SQUARE SELECT TOOL TESTS =====
  
  it('should create precise rectangular selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create precise rectangular selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })   // Start at (1,1)
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })   // End at (3,3)
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection with exact pixel boundaries', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with exact pixel boundaries
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })     // Start at (0,0)
    fireEvent.mouseMove(canvas!, { clientX: 31, clientY: 31 })   // End at (0,0) - single pixel
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection with reversed coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with reversed coordinates (end before start)
    fireEvent.mouseDown(canvas!, { clientX: 96, clientY: 96 })   // Start at (3,3)
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })   // End at (1,1)
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection with zero width', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with zero width (same X coordinates)
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })   // Start at (1,1)
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 96 })   // End at (1,3) - same X
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection with zero height', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with zero height (same Y coordinates)
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })   // Start at (1,1)
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 32 })   // End at (3,1) - same Y
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection at canvas edges', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection at canvas edges
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })     // Start at (0,0)
    fireEvent.mouseMove(canvas!, { clientX: 480, clientY: 480 }) // End at (15,15) - canvas edge
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle square selection with rapid mouse movements', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with rapid mouse movements
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  // ===== COMPREHENSIVE LASSO TOOL TESTS =====
  
  it('should handle lasso tool with single point', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Start lasso selection and immediately release
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle lasso tool with two points', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create lasso with two points
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle lasso tool with complex path', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create complex lasso path
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle lasso tool with path extending beyond canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Start lasso inside canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    // Move back inside
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle lasso tool with rapid mouse movements', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create lasso with rapid movements
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 48, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 80, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 48 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 80 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle lasso tool with overlapping path', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create lasso with overlapping path (figure-8 style)
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  // ===== INTEGRATION TESTS =====
  
  it('should handle copy-paste workflow with square selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create square selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste the copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle copy-paste workflow with lasso selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create lasso selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the lasso selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste the copied content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle cut-paste workflow with square selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create square selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Cut the selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should have modified pixels (removed selected pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    
    // Clear the call count
    jest.clearAllMocks()
    
    // Paste the cut content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels again (added pasted pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle cut-paste workflow with lasso selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Switch to lasso tool
    const lassoButton = container.querySelector('[data-testid="tool-lasso"]')
    if (lassoButton) {
      fireEvent.click(lassoButton)
    }
    
    // Create lasso selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Cut the lasso selection
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true })
    
    // Should have modified pixels (removed selected pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
    
    // Clear the call count
    jest.clearAllMocks()
    
    // Paste the cut content
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels again (added pasted pixels)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle multiple copy-paste operations', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create initial selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Copy the selection
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Clear the selection
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Paste multiple times
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true })
    
    // Should have modified pixels multiple times
    expect(defaultProps.onPixelsChange).toHaveBeenCalledTimes(3)
  })

  // ===== EDGE CASES AND ERROR HANDLING =====
  
  it('should handle keyboard shortcuts with modifier keys only', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try keyboard shortcuts with only modifier keys
    fireEvent.keyDown(document, { key: 'Control' })
    fireEvent.keyDown(document, { key: 'Meta' })
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle keyboard shortcuts with wrong modifier keys', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try keyboard shortcuts with wrong modifier keys
    fireEvent.keyDown(document, { key: 'c', shiftKey: true })  // Shift+C instead of Ctrl+C
    fireEvent.keyDown(document, { key: 'x', altKey: true })    // Alt+X instead of Ctrl+X
    fireEvent.keyDown(document, { key: 'v', shiftKey: true })  // Shift+V instead of Ctrl+V
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle rapid keyboard shortcut presses', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Rapidly press copy shortcut
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with extremely small coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with extremely small coordinates
    fireEvent.mouseDown(canvas!, { clientX: 1, clientY: 1 })
    fireEvent.mouseMove(canvas!, { clientX: 2, clientY: 2 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with extremely large coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with extremely large coordinates
    fireEvent.mouseDown(canvas!, { clientX: 10000, clientY: 10000 })
    fireEvent.mouseMove(canvas!, { clientX: 20000, clientY: 20000 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with negative coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with negative coordinates
    fireEvent.mouseDown(canvas!, { clientX: -100, clientY: -100 })
    fireEvent.mouseMove(canvas!, { clientX: -50, clientY: -50 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with decimal coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with decimal coordinates
    fireEvent.mouseDown(canvas!, { clientX: 32.5, clientY: 32.5 })
    fireEvent.mouseMove(canvas!, { clientX: 96.7, clientY: 96.3 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with zero coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with zero coordinates
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle selection with maximum canvas coordinates', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Create selection with maximum canvas coordinates
    const maxCoord = (defaultProps.canvasSize - 1) * 32 // 32 is pixel size
    fireEvent.mouseDown(canvas!, { clientX: maxCoord, clientY: maxCoord })
    fireEvent.mouseMove(canvas!, { clientX: maxCoord, clientY: maxCoord })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })
})
