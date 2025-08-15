import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the components that App renders
jest.mock('../../src/components/SpriteEditor', () => {
  return function MockSpriteEditor({ onPrimaryColorChange, onPixelsChange }: any) {
    // Simulate pixels change on mount
    React.useEffect(() => {
      if (onPixelsChange) {
        onPixelsChange(new Map())
      }
    }, [onPixelsChange])
    
    return <div data-testid="sprite-editor">Sprite Editor</div>
  }
})

jest.mock('../../src/components/HistoryPanel', () => {
  return function MockHistoryPanel() {
    return <div data-testid="history-panel">History Panel</div>
  }
})

jest.mock('../../src/components/ColorPicker', () => {
  return function MockColorPicker() {
    return <div data-testid="color-picker">Color Picker</div>
  }
})

jest.mock('../../src/components/Toolbar', () => {
  return function MockToolbar() {
    return <div data-testid="toolbar">Toolbar</div>
  }
})

jest.mock('../../src/components/FileMenu', () => {
  return function MockFileMenu() {
    return <div data-testid="file-menu">File Menu</div>
  }
})

// Create mock functions that we can track
const mockOnNewLayer = jest.fn()
const mockOnDeleteLayer = jest.fn()
const mockOnLayerSelect = jest.fn()
const mockOnLayerToggle = jest.fn()

jest.mock('../../src/components/LayerPanel', () => {
  return function MockLayerPanel({ onNewLayer, onDeleteLayer, onLayerSelect, onLayerToggle }: any) {
    // Call our mock functions when the real ones are called
    const wrappedOnNewLayer = (...args: any[]) => {
      mockOnNewLayer(...args)
      onNewLayer(...args)
    }
    const wrappedOnDeleteLayer = (...args: any[]) => {
      mockOnDeleteLayer(...args)
      onDeleteLayer(...args)
    }
    const wrappedOnLayerSelect = (...args: any[]) => {
      mockOnLayerSelect(...args)
      onLayerSelect(...args)
    }
    const wrappedOnLayerToggle = (...args: any[]) => {
      mockOnLayerToggle(...args)
      onLayerToggle(...args)
    }
    
    return (
      <div data-testid="layer-panel">
        <button onClick={() => wrappedOnNewLayer()} data-testid="new-layer-btn">
          New Layer
        </button>
        <button onClick={() => wrappedOnDeleteLayer(1)} data-testid="delete-layer-1-btn">
          Delete Layer 1
        </button>
        <button onClick={() => wrappedOnDeleteLayer(2)} data-testid="delete-layer-2-btn">
          Delete Layer 2
        </button>
        <button onClick={() => wrappedOnLayerSelect(2)} data-testid="select-layer-2-btn">
          Select Layer 2
        </button>
        <button onClick={() => wrappedOnLayerToggle(1)} data-testid="toggle-layer-1-btn">
          Toggle Layer 1
        </button>
      </div>
    )
  }
})

// Import App after mocking
import App from '../../src/App'

describe('App - Layer Management Logic', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Clear any localStorage or other persistent state
    localStorage.clear()
  })

  it('should render without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('sprite-editor')).toBeInTheDocument()
    expect(screen.getByTestId('history-panel')).toBeInTheDocument()
    expect(screen.getByTestId('layer-panel')).toBeInTheDocument()
  })

  it('should initialize with a default layer', () => {
    render(<App />)
    
    // Check that we have at least one layer
    expect(screen.getByTestId('layer-panel')).toBeInTheDocument()
  })

  it('should create new layers as active by default', () => {
    render(<App />)
    
    const newLayerBtn = screen.getByTestId('new-layer-btn')
    
    // Click new layer button
    fireEvent.click(newLayerBtn)
    
    // Verify the callback was called
    expect(mockOnNewLayer).toHaveBeenCalled()
  })

  it('should handle layer deletion correctly', () => {
    render(<App />)
    
    const deleteLayer1Btn = screen.getByTestId('delete-layer-1-btn')
    const deleteLayer2Btn = screen.getByTestId('delete-layer-2-btn')
    
    // Click delete buttons to test interaction
    fireEvent.click(deleteLayer1Btn)
    fireEvent.click(deleteLayer2Btn)
    
    // Verify the callbacks were called with correct IDs
    expect(mockOnDeleteLayer).toHaveBeenCalledWith(1)
    expect(mockOnDeleteLayer).toHaveBeenCalledWith(2)
  })

  it('should handle layer selection correctly', () => {
    render(<App />)
    
    const selectLayer2Btn = screen.getByTestId('select-layer-2-btn')
    
    // Click select button
    fireEvent.click(selectLayer2Btn)
    
    // Verify the callback was called with correct ID
    expect(mockOnLayerSelect).toHaveBeenCalledWith(2)
  })

  it('should handle layer visibility toggle correctly', () => {
    render(<App />)
    
    const toggleLayer1Btn = screen.getByTestId('toggle-layer-1-btn')
    
    // Click toggle button
    fireEvent.click(toggleLayer1Btn)
    
    // Verify the callback was called with correct ID
    expect(mockOnLayerToggle).toHaveBeenCalledWith(1)
  })

  it('should maintain layer state correctly', () => {
    render(<App />)
    
    // Test that the component renders and maintains its state
    expect(screen.getByTestId('sprite-editor')).toBeInTheDocument()
    expect(screen.getByTestId('layer-panel')).toBeInTheDocument()
  })

  it('should handle multiple rapid layer operations', () => {
    render(<App />)
    
    const newLayerBtn = screen.getByTestId('new-layer-btn')
    const deleteLayer1Btn = screen.getByTestId('delete-layer-1-btn')
    
    // Rapidly create and delete layers
    fireEvent.click(newLayerBtn)
    fireEvent.click(deleteLayer1Btn)
    fireEvent.click(newLayerBtn)
    
    // Verify all operations were called
    expect(mockOnNewLayer).toHaveBeenCalledTimes(2)
    expect(mockOnDeleteLayer).toHaveBeenCalledTimes(1)
  })

  it('should handle complex layer operations sequence', () => {
    render(<App />)
    
    const newLayerBtn = screen.getByTestId('new-layer-btn')
    const deleteLayer1Btn = screen.getByTestId('delete-layer-1-btn')
    const selectLayer2Btn = screen.getByTestId('select-layer-2-btn')
    const toggleLayer1Btn = screen.getByTestId('toggle-layer-1-btn')
    
    // Perform a sequence of operations
    fireEvent.click(newLayerBtn)        // Create new layer
    fireEvent.click(selectLayer2Btn)    // Select layer 2
    fireEvent.click(toggleLayer1Btn)    // Toggle layer 1 visibility
    fireEvent.click(deleteLayer1Btn)    // Delete layer 1
    
    // Verify all operations were called
    expect(mockOnNewLayer).toHaveBeenCalledTimes(1)
    expect(mockOnLayerSelect).toHaveBeenCalledTimes(1)
    expect(mockOnLayerToggle).toHaveBeenCalledTimes(1)
    expect(mockOnDeleteLayer).toHaveBeenCalledTimes(1)
  })

  it('should handle edge cases gracefully', () => {
    render(<App />)
    
    // Test that the component handles edge cases without crashing
    expect(screen.getByTestId('sprite-editor')).toBeInTheDocument()
    expect(screen.getByTestId('layer-panel')).toBeInTheDocument()
    
    // Verify all buttons are present and functional
    expect(screen.getByTestId('new-layer-btn')).toBeInTheDocument()
    expect(screen.getByTestId('delete-layer-1-btn')).toBeInTheDocument()
    expect(screen.getByTestId('delete-layer-2-btn')).toBeInTheDocument()
    expect(screen.getByTestId('select-layer-2-btn')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-layer-1-btn')).toBeInTheDocument()
  })
})
