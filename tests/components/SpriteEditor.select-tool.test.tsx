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
    
    const { container } = render(<SpriteEditor {...propsWithMultipleLayers} />)
    
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
})
