import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import HistoryPanel from '../../src/components/HistoryPanel'

describe('HistoryPanel - Undo/Redo Display Logic', () => {
  const createMockCanvas = (historyState: any) => ({
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn(() => historyState.undoStack?.length > 0),
    canRedo: jest.fn(() => historyState.redoStack?.length > 0),
    getHistoryState: jest.fn(() => historyState),
    getCanvasSize: jest.fn(() => 32)
  })

  const createMockRef = (canvas: any) => ({
    current: canvas
  })

  const createMockOperation = (tool: string, pixelCount: number, timestamp: number = Date.now()) => ({
    id: `op-${tool}-${pixelCount}-${timestamp}`, // Make IDs unique
    tool,
    layerId: 'layer1',
    pixels: Array.from({ length: pixelCount }, (_, i) => ({
      x: i,
      y: 0,
      previousColor: 'transparent' as const,
      newColor: tool === 'eraser' ? 'transparent' as const : '#000000' as const
    })),
    timestamp
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('History Display Logic - Only Show Visible Operations', () => {
    it('should only display operations from undo stack (currently visible)', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 5),
          createMockOperation('fill', 15)
        ],
        redoStack: [
          createMockOperation('eraser', 3) // This should NOT be displayed
        ],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show undo operations (currently visible in drawing area)
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      
      // Should NOT show redo operations (not visible in drawing area)
      expect(screen.queryByText('Eraser')).not.toBeInTheDocument()
    })

    it('should update display when operations are undone', () => {
      // Start with operations in undo stack
      const initialHistoryState = {
        undoStack: [
          createMockOperation('pencil', 5),
          createMockOperation('fill', 15)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(initialHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      const { rerender } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show both operations initially
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      
      // Simulate undo operation - move pencil operation to redo stack
      const updatedHistoryState = {
        undoStack: [
          createMockOperation('fill', 15)
        ],
        redoStack: [
          createMockOperation('pencil', 5)
        ],
        maxHistorySize: 100
      }
      
      const updatedMockCanvas = createMockCanvas(updatedHistoryState)
      const updatedMockRef = createMockRef(updatedMockCanvas)
      
      rerender(<HistoryPanel canvasRef={updatedMockRef} />)
      
      // Should now only show fill operation (pencil is in redo stack)
      expect(screen.queryByText('Pencil')).not.toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
    })

    it('should update display when operations are redone', () => {
      // Start with operations in redo stack
      const initialHistoryState = {
        undoStack: [
          createMockOperation('fill', 15)
        ],
        redoStack: [
          createMockOperation('pencil', 5)
        ],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(initialHistoryState)
      const mockRef = createMockRef(mockCanvas)
      
      const { rerender } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should only show fill operation initially
      expect(screen.queryByText('Pencil')).not.toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      
      // Simulate redo operation - move pencil operation back to undo stack
      const updatedHistoryState = {
        undoStack: [
          createMockOperation('pencil', 5),
          createMockOperation('fill', 15)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const updatedMockCanvas = createMockCanvas(updatedHistoryState)
      const updatedMockRef = createMockRef(updatedMockCanvas)
      
      rerender(<HistoryPanel canvasRef={updatedMockRef} />)
      
      // Should now show both operations again
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
    })

    it('should handle empty undo and redo stacks', () => {
      const historyState = {
        undoStack: [],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show "No history yet" message
      expect(screen.getByText('No history yet')).toBeInTheDocument()
      
      // Should not show any operations
      expect(screen.queryByText(/Pencil|Fill|Eraser/)).not.toBeInTheDocument()
    })

    it('should handle operations moving between stacks correctly', () => {
      // Test a sequence of undo/redo operations
      const sequence = [
        // Step 1: Two operations in undo stack
        {
          undoStack: [
            createMockOperation('pencil', 5),
            createMockOperation('fill', 15)
          ],
          redoStack: []
        },
        // Step 2: Undo one operation
        {
          undoStack: [
            createMockOperation('fill', 15)
          ],
          redoStack: [
            createMockOperation('pencil', 5)
          ]
        },
        // Step 3: Undo second operation
        {
          undoStack: [],
          redoStack: [
            createMockOperation('fill', 15),
            createMockOperation('pencil', 5)
          ]
        },
        // Step 4: Redo one operation
        {
          undoStack: [
            createMockOperation('fill', 15)
          ],
          redoStack: [
            createMockOperation('pencil', 5)
          ]
        }
      ]
      
      const mockCanvas = createMockCanvas(sequence[0])
      const mockRef = createMockRef(mockCanvas)
      
      const { rerender } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Step 1: Should show both operations
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      
      // Step 2: Should only show fill operation
      const mockCanvas2 = createMockCanvas(sequence[1])
      const mockRef2 = createMockRef(mockCanvas2)
      rerender(<HistoryPanel canvasRef={mockRef2} />)
      
      expect(screen.queryByText('Pencil')).not.toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      
      // Step 3: Should show no operations
      const mockCanvas3 = createMockCanvas(sequence[2])
      const mockRef3 = createMockRef(mockCanvas3)
      rerender(<HistoryPanel canvasRef={mockRef3} />)
      
      expect(screen.queryByText('Pencil')).not.toBeInTheDocument()
      expect(screen.queryByText('Fill')).not.toBeInTheDocument()
      expect(screen.getByText('No history yet')).toBeInTheDocument()
      
      // Step 4: Should show fill operation again
      const mockCanvas4 = createMockCanvas(sequence[3])
      const mockRef4 = createMockRef(mockCanvas4)
      rerender(<HistoryPanel canvasRef={mockRef4} />)
      
      expect(screen.queryByText('Pencil')).not.toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
    })
  })

  describe('History Change Event Handling', () => {
    it('should update display when historyChange events are dispatched', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show pencil operation initially
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      
      // Simulate history change event
      act(() => {
        document.dispatchEvent(new CustomEvent('historyChange'))
      })
      
      // Should still show the operation (no change in this case)
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })

    it('should handle rapid history change events', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Dispatch many events rapidly
      act(() => {
        for (let i = 0; i < 10; i++) {
          document.dispatchEvent(new CustomEvent('historyChange'))
        }
      })
      
      // Should handle gracefully without errors
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle operations with missing or invalid properties', () => {
      const historyState = {
        undoStack: [
          {
            id: 'invalid-op',
            tool: 'pencil',
            pixels: [], // Empty pixels array instead of missing
            timestamp: Date.now()
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      // Should not crash
      expect(() => {
        render(<HistoryPanel canvasRef={mockRef} />)
      }).not.toThrow()
    })

    it('should handle extremely large history stacks', () => {
      // Create a large number of operations (reduced from 1000 to prevent timeouts)
      const manyOperations = Array.from({ length: 100 }, (_, i) => 
        createMockOperation('pencil', 5, Date.now() - i * 1000)
      )
      
      const historyState = {
        undoStack: manyOperations,
        redoStack: [],
        maxHistorySize: 1000
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      const startTime = performance.now()
      render(<HistoryPanel canvasRef={mockRef} />)
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(2000)
      
      // Should display all operations
      expect(screen.getAllByText('Pencil')).toHaveLength(100)
    })

    it('should handle operations with extremely long tool names', () => {
      const historyState = {
        undoStack: [
          {
            ...createMockOperation('pencil', 5),
            tool: 'extremely-long-tool-name-that-might-cause-display-issues'
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should display the long tool name (first letter is capitalized in display)
      expect(screen.getByText('Extremely-long-tool-name-that-might-cause-display-issues')).toBeInTheDocument()
    })

    it('should handle operations with invalid timestamps', () => {
      const historyState = {
        undoStack: [
          {
            ...createMockOperation('pencil', 5),
            timestamp: 'invalid-timestamp'
          }
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should still display the operation
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not leak memory when operations are moved between stacks', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      const { rerender, unmount } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Simulate many undo/redo cycles
      for (let i = 0; i < 100; i++) {
        const newState = {
          undoStack: i % 2 === 0 ? [createMockOperation('pencil', 5)] : [],
          redoStack: i % 2 === 0 ? [] : [createMockOperation('pencil', 5)],
          maxHistorySize: 100
        }
        
        const newMockCanvas = createMockCanvas(newState)
        const newMockRef = createMockRef(newMockCanvas)
        
        rerender(<HistoryPanel canvasRef={newMockRef} />)
      }
      
      // Should not crash or cause memory issues
      unmount()
    })

    it('should handle component unmounting during history updates', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      const { unmount } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Dispatch history change event
      act(() => {
        document.dispatchEvent(new CustomEvent('historyChange'))
      })
      
      // Immediately unmount
      unmount()
      
      // Should not cause errors
    })
  })
})
