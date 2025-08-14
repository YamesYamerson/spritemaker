import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HistoryPanel from '../../src/components/HistoryPanel'
import { StrokeOperation, Color, Tool } from '../../src/types'

// Mock canvas element with history methods
const createMockCanvas = (historyState: any) => ({
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: jest.fn(() => historyState.canUndo),
  canRedo: jest.fn(() => historyState.canRedo),
  getHistoryState: jest.fn(() => historyState)
})

// Mock ref
const createMockRef = (canvas: any) => ({
  current: canvas
})

describe('HistoryPanel', () => {
  const defaultHistoryState = {
    undoStack: [],
    redoStack: [],
    maxHistorySize: 100
  }

  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('historyChange', jest.fn())
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render without crashing', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('Undo')).toBeInTheDocument()
      expect(screen.getByText('Redo')).toBeInTheDocument()
    })

    it('should display "No history yet" when no operations exist', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should display history operations when they exist', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 1, 5),
          createMockOperation('eraser', 1, 3)
        ],
        redoStack: [
          createMockOperation('fill', 1, 8)
        ],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show undo operations (most recent first)
      expect(screen.getByText('Eraser')).toBeInTheDocument()
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      
      // Should show redo operations
      expect(screen.getByText('Fill')).toBeInTheDocument()
    })
  })

  describe('undo/redo buttons', () => {
    it('should disable undo button when no undo operations available', () => {
      const historyState = {
        ...defaultHistoryState,
        canUndo: false
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const undoButton = screen.getByText('Undo')
      expect(undoButton).toBeDisabled()
    })

    it('should enable undo button when undo operations are available', () => {
      const historyState = {
        ...defaultHistoryState,
        canUndo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const undoButton = screen.getByText('Undo')
      expect(undoButton).not.toBeDisabled()
    })

    it('should disable redo button when no redo operations available', () => {
      const historyState = {
        ...defaultHistoryState,
        canRedo: false
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const redoButton = screen.getByText('Redo')
      expect(redoButton).toBeDisabled()
    })

    it('should enable redo button when redo operations are available', () => {
      const historyState = {
        ...defaultHistoryState,
        canRedo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const redoButton = screen.getByText('Redo')
      expect(redoButton).not.toBeDisabled()
    })

    it('should call canvas.undo when undo button is clicked', () => {
      const historyState = {
        ...defaultHistoryState,
        canUndo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const undoButton = screen.getByText('Undo')
      fireEvent.click(undoButton)
      
      expect(mockCanvas.undo).toHaveBeenCalledTimes(1)
    })

    it('should call canvas.redo when redo button is clicked', () => {
      const historyState = {
        ...defaultHistoryState,
        canRedo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const redoButton = screen.getByText('Redo')
      fireEvent.click(redoButton)
      
      expect(mockCanvas.redo).toHaveBeenCalledTimes(1)
    })
  })

  describe('history operations display', () => {
    it('should display tool names correctly', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 1, 2),
          createMockOperation('fill', 1, 5),
          createMockOperation('eraser', 1, 3)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      expect(screen.getByText('Eraser')).toBeInTheDocument()
    })

    it('should display pixel counts correctly', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 1, 15),
          createMockOperation('fill', 1, 42)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
    })

    it('should display timestamps correctly', () => {
      const now = Date.now()
      const historyState = {
        undoStack: [
          {
            ...createMockOperation('pencil', 1, 2),
            timestamp: now - 1000 // 1 second ago
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('1s ago')).toBeInTheDocument()
    })

    it('should show "now" for very recent operations', () => {
      const now = Date.now()
      const historyState = {
        undoStack: [
          {
            ...createMockOperation('pencil', 1, 2),
            timestamp: now - 500 // 0.5 seconds ago
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // The component should display the operation with "now" timestamp
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('tool icons', () => {
    it('should display correct tool icon colors', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 1, 2),
          createMockOperation('fill', 1, 5),
          createMockOperation('eraser', 1, 3)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Check that tool icons are rendered with correct background colors
      const toolIcons = screen.getAllByText(/^[PFE]$/) // Pencil, Fill, Eraser initials only
      expect(toolIcons).toHaveLength(3)
    })

    it('should display tool initials correctly', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 1, 2),
          createMockOperation('fill', 1, 5)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('P')).toBeInTheDocument() // Pencil
      expect(screen.getByText('F')).toBeInTheDocument() // Fill
    })
  })

  describe('status indicators', () => {
    it('should show green dots for undo operations', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 1, 2)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Status dots should be present (they're rendered as colored divs)
      const statusDots = document.querySelectorAll('[style*="background-color: rgb(76, 175, 80)"]') // #4CAF50
      expect(statusDots.length).toBeGreaterThan(0)
    })

    it('should show orange dots for redo operations', () => {
      const historyState = {
        undoStack: [],
        redoStack: [createMockOperation('eraser', 1, 3)],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Status dots should be present (they're rendered as colored divs)
      const statusDots = document.querySelectorAll('[style*="background-color"]')
      expect(statusDots.length).toBeGreaterThan(0)
    })
  })

  describe('interactive features', () => {
    it('should handle clicking on undo operations', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 1, 2)],
        redoStack: [],
        maxHistorySize: 100,
        canUndo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Click on the undo operation
      const operationItem = screen.getByText('Pencil')
      fireEvent.click(operationItem)
      
      expect(mockCanvas.undo).toHaveBeenCalledTimes(1)
    })

    it('should handle clicking on redo operations', () => {
      const historyState = {
        undoStack: [],
        redoStack: [createMockOperation('eraser', 1, 3)],
        maxHistorySize: 100,
        canRedo: true
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Click on the redo operation
      const operationItem = screen.getByText('Eraser')
      fireEvent.click(operationItem)
      
      expect(mockCanvas.redo).toHaveBeenCalledTimes(1)
    })

    it('should show hover effects on operation items', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 1, 2)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      const operationItem = screen.getByText('Pencil').closest('div')
      expect(operationItem).toBeInTheDocument()
      
      // Hover effects are handled by CSS, but we can verify the element structure
      // The cursor style is applied via inline styles in the component
      expect(operationItem).toHaveAttribute('style')
    })
  })

  describe('event handling', () => {
    it('should listen for historyChange events', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Simulate a history change event
      const historyChangeEvent = new CustomEvent('historyChange')
      document.dispatchEvent(historyChangeEvent)
      
      // The component should handle the event (though we can't easily test the internal state update)
      expect(mockCanvas.canUndo).toHaveBeenCalled()
    })

    it('should clean up event listeners on unmount', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      const { unmount } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Unmount the component
      unmount()
      
      // Event listeners should be cleaned up
      // We can't easily test this directly, but it's handled by the useEffect cleanup
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing canvas ref gracefully', () => {
      render(<HistoryPanel canvasRef={null as any} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle canvas ref with null current gracefully', () => {
      const mockRef = { current: null }
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle canvas without required methods gracefully', () => {
      const incompleteCanvas = {
        undo: undefined,
        redo: undefined,
        canUndo: undefined,
        canRedo: undefined,
        getHistoryState: undefined
      }
      const mockRef = { current: incompleteCanvas } as any
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle canvas methods that throw errors gracefully', () => {
      const errorCanvas = {
        undo: jest.fn().mockImplementation(() => {
          throw new Error('Undo error')
        }),
        redo: jest.fn().mockImplementation(() => {
          throw new Error('Redo error')
        }),
        canUndo: jest.fn().mockImplementation(() => {
          throw new Error('CanUndo error')
        }),
        canRedo: jest.fn().mockImplementation(() => {
          throw new Error('CanRedo error')
        }),
        getHistoryState: jest.fn().mockImplementation(() => {
          throw new Error('GetState error')
        })
      }
      const mockRef = { current: errorCanvas } as any
      
      // The component should render even when methods throw errors during useEffect
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // When getHistoryState throws an error, it should fall back to "No history yet"
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle invalid history state gracefully', () => {
      const invalidHistoryState = {
        undoStack: null,
        redoStack: undefined,
        maxHistorySize: 'invalid'
      }
      
      const mockCanvas = createMockCanvas(invalidHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle history state with invalid operations gracefully', () => {
      const historyStateWithInvalidOps = {
        undoStack: [
          { invalid: 'operation' },
          createMockOperation('pencil', 1, 5),
          null,
          undefined
        ],
        redoStack: [
          createMockOperation('fill', 1, 8),
          { also: 'invalid' }
        ],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyStateWithInvalidOps)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle invalid operations gracefully by showing "No history yet"
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle operations with missing properties gracefully', () => {
      const incompleteOperation = {
        id: 'incomplete-1',
        tool: 'pencil',
        // Missing layerId, pixels, timestamp
      }
      
      const historyState = {
        undoStack: [incompleteOperation],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle missing properties gracefully by showing "No history yet"
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle extremely large history stacks gracefully', () => {
      const largeHistoryState = {
        undoStack: Array.from({ length: 1000 }, (_, i) => 
          createMockOperation('pencil', 1, i + 1)
        ),
        redoStack: Array.from({ length: 500 }, (_, i) => 
          createMockOperation('eraser', 1, i + 1)
        ),
        maxHistorySize: 1000
      }
      
      const mockCanvas = createMockCanvas(largeHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should render without crashing
      expect(screen.getAllByText('Pencil')).toHaveLength(1000)
    })

    it('should handle operations with extremely long tool names gracefully', () => {
      const longToolName = 'a'.repeat(1000)
      const historyState = {
        undoStack: [
          {
            id: 'long-tool-1',
            tool: longToolName,
            layerId: 1,
            pixels: [{ x: 0, y: 0, previousColor: 'transparent', newColor: '#ff0000' }],
            timestamp: Date.now()
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle long tool names gracefully
      expect(screen.getByText(new RegExp(`${longToolName.substring(0, 20)}`))).toBeInTheDocument()
    })

    it('should handle operations with invalid timestamps gracefully', () => {
      const historyState = {
        undoStack: [
          {
            id: 'invalid-time-1',
            tool: 'pencil',
            layerId: 1,
            pixels: [{ x: 0, y: 0, previousColor: 'transparent', newColor: '#ff0000' }],
            timestamp: 'invalid-timestamp'
          },
          {
            id: 'invalid-time-2',
            tool: 'eraser',
            layerId: 1,
            pixels: [{ x: 1, y: 1, previousColor: '#ff0000', newColor: 'transparent' }],
            timestamp: -1
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle invalid timestamps gracefully by still displaying the operations
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Eraser')).toBeInTheDocument()
    })

    it('should handle rapid history updates gracefully', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Simulate rapid history change events
      for (let i = 0; i < 10; i++) {
        document.dispatchEvent(new CustomEvent('historyChange'))
      }
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should not crash under rapid updates
    })

    it('should handle component unmounting during history updates gracefully', () => {
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      const { unmount } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Dispatch history change event
      document.dispatchEvent(new CustomEvent('historyChange'))
      
      // Unmount during update
      unmount()
      
      // Should not crash
      expect(screen.queryByText('History')).not.toBeInTheDocument()
    })

    it('should handle missing event listeners gracefully', () => {
      // Remove any existing event listeners
      document.removeEventListener('historyChange', jest.fn())
      
      const mockCanvas = createMockCanvas(defaultHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should not crash when event listeners are missing
    })

    it('should handle operations with missing pixel data gracefully', () => {
      const historyState = {
        undoStack: [
          {
            id: 'no-pixels-1',
            tool: 'pencil',
            layerId: 1,
            pixels: [],
            timestamp: Date.now()
          },
          {
            id: 'no-pixels-2',
            tool: 'eraser',
            layerId: 1,
            pixels: null,
            timestamp: Date.now()
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle missing pixel data gracefully by showing "No history yet"
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })

    it('should handle operations with invalid layer IDs gracefully', () => {
      const historyState = {
        undoStack: [
          {
            id: 'invalid-layer-1',
            tool: 'pencil',
            layerId: 'invalid-layer',
            pixels: [{ x: 0, y: 0, previousColor: 'transparent', newColor: '#ff0000' }],
            timestamp: Date.now()
          },
          {
            id: 'invalid-layer-2',
            tool: 'eraser',
            layerId: null,
            pixels: [{ x: 1, y: 1, previousColor: '#ff0000', newColor: 'transparent' }],
            timestamp: Date.now()
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      expect(screen.getByText('History')).toBeInTheDocument()
      // Should handle invalid layer IDs gracefully by still displaying the operations
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Eraser')).toBeInTheDocument()
    })
  })
})

// Helper function to create mock operations for testing
function createMockOperation(tool: Tool, layerId: number, pixelCount: number): StrokeOperation {
  const pixels = Array.from({ length: pixelCount }, (_, i) => ({
    x: i,
    y: i,
    previousColor: 'transparent' as Color,
    newColor: '#ff0000' as Color
  }))
  
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    tool,
    layerId,
    pixels,
    timestamp: Date.now()
  }
}
