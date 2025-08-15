import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LayerPanel from '../../src/components/LayerPanel'
import { Layer, PixelData } from '../../src/types'

// Mock canvas methods for thumbnail generation
const mockCanvas = document.createElement('canvas')
const mockContext = mockCanvas.getContext('2d')
if (mockContext) {
  mockContext.toDataURL = jest.fn(() => 'data:image/png;base64,mock-thumbnail')
}

// Mock createElement to return our mock canvas
const originalCreateElement = document.createElement
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas
  }
  return originalCreateElement.call(document, tagName)
})

describe('LayerPanel', () => {
  const mockLayers: Layer[] = [
    { id: 1, name: 'Layer 1', visible: true, active: true },
    { id: 2, name: 'Layer 2', visible: true, active: false },
    { id: 3, name: 'Layer 3', visible: false, active: false }
  ]

  const mockPixels = new Map<string, PixelData>([
    ['0,0', { x: 0, y: 0, color: '#ff0000', layerId: 1 }],
    ['1,0', { x: 1, y: 0, color: '#00ff00', layerId: 1 }],
    ['0,1', { x: 0, y: 1, color: '#0000ff', layerId: 2 }],
    ['1,1', { x: 1, y: 1, color: '#ffff00', layerId: 2 }]
  ])

  const defaultProps = {
    layers: mockLayers,
    pixels: mockPixels,
    canvasSize: 16,
    onNewLayer: jest.fn(),
    onLayerToggle: jest.fn(),
    onLayerSelect: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<LayerPanel {...defaultProps} />)
    expect(screen.getByText('Layers')).toBeInTheDocument()
  })

  it('should display all layers', () => {
    render(<LayerPanel {...defaultProps} />)
    expect(screen.getByText('Layer 1')).toBeInTheDocument()
    expect(screen.getByText('Layer 2')).toBeInTheDocument()
    expect(screen.getByText('Layer 3')).toBeInTheDocument()
  })

  it('should display layer thumbnails', () => {
    render(<LayerPanel {...defaultProps} />)
    
    // Check that thumbnails are rendered for each layer
    const thumbnails = document.querySelectorAll('img[alt*="thumbnail"]')
    expect(thumbnails).toHaveLength(3)
    
    // Check that each thumbnail has the correct alt text
    expect(screen.getByAltText('Layer 1 thumbnail')).toBeInTheDocument()
    expect(screen.getByAltText('Layer 2 thumbnail')).toBeInTheDocument()
    expect(screen.getByAltText('Layer 3 thumbnail')).toBeInTheDocument()
  })

  it('should handle layer selection', () => {
    render(<LayerPanel {...defaultProps} />)
    
    const layer2 = screen.getByText('Layer 2')
    fireEvent.click(layer2)
    
    expect(defaultProps.onLayerSelect).toHaveBeenCalledWith(2)
  })

  it('should handle layer visibility toggle', () => {
    render(<LayerPanel {...defaultProps} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    
    // Layer 1 should be visible and active
    expect(checkboxes[0]).toBeChecked()
    
    // Layer 2 should be visible but not active
    expect(checkboxes[1]).toBeChecked()
    
    // Layer 3 should not be visible
    expect(checkboxes[2]).not.toBeChecked()
    
    // Test toggling visibility
    fireEvent.click(checkboxes[1])
    expect(defaultProps.onLayerToggle).toHaveBeenCalledWith(2)
  })

  it('should handle new layer creation', () => {
    render(<LayerPanel {...defaultProps} />)
    
    const newLayerButton = screen.getByTitle('New Layer')
    fireEvent.click(newLayerButton)
    
    expect(defaultProps.onNewLayer).toHaveBeenCalled()
  })

  it('should handle undefined pixels gracefully', () => {
    const propsWithUndefinedPixels = {
      ...defaultProps,
      pixels: undefined
    }
    
    render(<LayerPanel {...propsWithUndefinedPixels} />)
    
    // Should still render without crashing
    expect(screen.getByText('Layers')).toBeInTheDocument()
    expect(screen.getByText('Layer 1')).toBeInTheDocument()
    
    // Thumbnails should still be rendered (with empty content)
    const thumbnails = document.querySelectorAll('img[alt*="thumbnail"]')
    expect(thumbnails).toHaveLength(3)
  })

  it('should handle empty pixels map', () => {
    const propsWithEmptyPixels = {
      ...defaultProps,
      pixels: new Map()
    }
    
    render(<LayerPanel {...propsWithEmptyPixels} />)
    
    // Should still render without crashing
    expect(screen.getByText('Layers')).toBeInTheDocument()
    
    // Thumbnails should still be rendered (with empty content)
    const thumbnails = document.querySelectorAll('img[alt*="thumbnail"]')
    expect(thumbnails).toHaveLength(3)
  })

  it('should apply active layer styling', () => {
    render(<LayerPanel {...defaultProps} />)
    
    // Layer 1 is active, should have active styling
    const layer1Container = screen.getByText('Layer 1').closest('.layer-item')
    expect(layer1Container).toHaveStyle({ backgroundColor: '#3a3a3a' })
    
    // Layer 2 is not active, should have transparent background
    const layer2Container = screen.getByText('Layer 2').closest('.layer-item')
    expect(layer2Container).toHaveStyle({ backgroundColor: 'transparent' })
  })
})
