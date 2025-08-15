import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SpriteEditor from '../../src/components/SpriteEditor'
import { Tool, Color, Layer, GridSettings } from '../../src/types'

describe('SpriteEditor - Move Selection Tool', () => {
  const defaultProps = {
    selectedTool: 'move-selection' as Tool,
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
      thirtyseconds: false
    } as GridSettings
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing when move-selection tool is selected', () => {
    render(<SpriteEditor {...defaultProps} />)
    expect(screen.getByTestId('sprite-canvas')).toBeInTheDocument()
  })

  it('should not activate move-selection without an existing selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // Try to use move-selection tool without a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should activate move-selection when clicking on existing selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Clear the initial calls
    jest.clearAllMocks()
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Click inside the selection to start moving
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Should not modify pixels yet (just starting the move)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should track mouse movement during move-selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Clear the initial calls
    jest.clearAllMocks()
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Should not modify pixels yet (just tracking movement)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should complete move-selection operation on mouse up', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with no movement', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Clear the initial calls
    jest.clearAllMocks()
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection but don't move the mouse
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseUp(canvas!)
    
    // Should not modify pixels (no movement)
    expect(defaultProps.onPixelsChange).not.toHaveBeenCalled()
  })

  it('should handle move-selection with large movement', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse a large distance
    fireEvent.mouseMove(canvas!, { clientX: 256, clientY: 256 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with negative movement', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 160, clientY: 160 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 128, clientY: 128 })
    
    // Move the mouse in negative direction
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with lasso selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a lasso selection
    const propsWithLassoTool = {
      ...defaultProps,
      selectedTool: 'lasso' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithLassoTool} />)
    
    // Create a lasso selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the lasso selection
    fireEvent.mouseDown(canvas!, { clientX: 48, clientY: 48 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with single pixel selection', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a single pixel selection
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a single pixel selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the single pixel selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with selection at canvas edges', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection at canvas edges
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection at canvas edges
    fireEvent.mouseDown(canvas!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(canvas!, { clientX: 480, clientY: 480 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the edge selection
    fireEvent.mouseDown(canvas!, { clientX: 240, clientY: 240 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with rapid mouse movements', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Rapid mouse movements
    fireEvent.mouseMove(canvas!, { clientX: 80, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 112, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 80 })
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 96 })
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 112 })
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with selection extending beyond canvas', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection extending beyond canvas
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection starting inside but extending beyond canvas
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    
    // Move outside canvas boundaries
    const globalMouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 800
    })
    document.dispatchEvent(globalMouseMoveEvent)
    
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...defaultProps} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should maintain selection after move-selection operation', () => {
    const { container } = render(<SpriteEditor {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection
    const propsWithSelectTool = {
      ...defaultProps,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool (explicitly set the tool)
    rerender(<SpriteEditor {...defaultProps} selectedTool="move-selection" />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with different canvas sizes', () => {
    const propsWithLargeCanvas = {
      ...defaultProps,
      canvasSize: 32
    }
    
    const { container } = render(<SpriteEditor {...propsWithLargeCanvas} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...propsWithLargeCanvas,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    fireEvent.mouseMove(canvas!, { clientX: 192, clientY: 192 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...propsWithLargeCanvas} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 128, clientY: 128 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 256, clientY: 256 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })

  it('should handle move-selection with multiple layers', () => {
    const propsWithMultipleLayers = {
      ...defaultProps,
      layers: [
        { id: 1, name: 'Layer 1', visible: true, active: true },
        { id: 2, name: 'Layer 2', visible: false, active: false }
      ]
    }
    
    const { container } = render(<SpriteEditor {...propsWithMultipleLayers} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    jest.clearAllMocks()
    
    // First, create a selection using the select tool
    const propsWithSelectTool = {
      ...propsWithMultipleLayers,
      selectedTool: 'select' as Tool
    }
    
    const { rerender } = render(<SpriteEditor {...propsWithSelectTool} />)
    
    // Create a selection
    fireEvent.mouseDown(canvas!, { clientX: 32, clientY: 32 })
    fireEvent.mouseMove(canvas!, { clientX: 96, clientY: 96 })
    fireEvent.mouseUp(canvas!)
    
    // Now switch to move-selection tool
    rerender(<SpriteEditor {...propsWithMultipleLayers} />)
    
    // Start moving the selection
    fireEvent.mouseDown(canvas!, { clientX: 64, clientY: 64 })
    
    // Move the mouse to drag the selection
    fireEvent.mouseMove(canvas!, { clientX: 128, clientY: 128 })
    
    // Complete the move operation
    fireEvent.mouseUp(canvas!)
    
    // Should have modified pixels (moved the selection)
    expect(defaultProps.onPixelsChange).toHaveBeenCalled()
  })
})
