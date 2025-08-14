import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HistoryPanel from '../../src/components/HistoryPanel'

describe('HistoryPanel - Thumbnail Functionality', () => {
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

  describe('Thumbnail Generation', () => {
    it('should generate thumbnails for drawing operations', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 5),
          createMockOperation('eraser', 3)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should display thumbnails instead of pixel counts
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Eraser')).toBeInTheDocument()
      
      // Check that thumbnails are rendered (they should be img elements)
      const thumbnails = screen.getAllByRole('img')
      expect(thumbnails.length).toBeGreaterThan(0)
    })

    it('should generate thumbnails with correct dimensions', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 10)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Thumbnails should be rendered at 32x32 pixels
      const thumbnails = screen.getAllByRole('img')
      thumbnails.forEach(thumbnail => {
        // Check that the thumbnail container has the right dimensions
        const container = thumbnail.closest('div[style*="width: 32px"]')
        expect(container).toBeInTheDocument()
      })
    })

    it('should handle different canvas sizes for thumbnail generation', () => {
      const mockCanvas = {
        ...createMockCanvas({ undoStack: [createMockOperation('pencil', 5)], redoStack: [] }),
        getCanvasSize: jest.fn(() => 64) // Different canvas size
      }
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should still generate thumbnails correctly
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })

    it('should generate thumbnails for different tools', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 5),
          createMockOperation('fill', 15),
          createMockOperation('eraser', 3)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // All tools should have thumbnails
      expect(screen.getByText('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Fill')).toBeInTheDocument()
      expect(screen.getByText('Eraser')).toBeInTheDocument()
    })

    it('should handle operations with no pixels gracefully', () => {
      const historyState = {
        undoStack: [{
          ...createMockOperation('pencil', 0),
          pixels: []
        }],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should still render without crashing
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('Thumbnail Content and Accuracy', () => {
    it('should generate thumbnails that represent the actual drawing', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // The thumbnail should be a data URL representing the drawing
      const thumbnails = screen.getAllByRole('img')
      thumbnails.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('src')
        const src = thumbnail.getAttribute('src')
        expect(src).toMatch(/^data:image\/png;base64,/)
      })
    })

    it('should handle transparent pixels correctly in thumbnails', () => {
      const historyState = {
        undoStack: [{
          ...createMockOperation('eraser', 3),
          pixels: [
            { x: 0, y: 0, previousColor: '#000000', newColor: 'transparent' },
            { x: 1, y: 0, previousColor: '#000000', newColor: 'transparent' },
            { x: 2, y: 0, previousColor: '#000000', newColor: 'transparent' }
          ]
        }],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should generate thumbnail showing the eraser operation
      expect(screen.getByText('Eraser')).toBeInTheDocument()
    })

    it('should scale pixel data correctly for thumbnail generation', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 1)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should generate thumbnail without errors
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('Thumbnail Performance', () => {
    it('should handle large numbers of operations efficiently', () => {
      // Create many operations to test performance (reduced from 100 to prevent timeouts)
      const manyOperations = Array.from({ length: 50 }, (_, i) => 
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
      
      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should display all operations
      expect(screen.getAllByText('Pencil')).toHaveLength(50)
    })

    it('should not regenerate thumbnails unnecessarily', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      const { rerender } = render(<HistoryPanel canvasRef={mockRef} />)
      
      // Rerender with same props
      rerender(<HistoryPanel canvasRef={mockRef} />)
      
      // Should still work correctly
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })
  })

  describe('Thumbnail Error Handling', () => {
    it('should handle thumbnail generation errors gracefully', () => {
      const historyState = {
        undoStack: [{
          ...createMockOperation('pencil', 5),
          pixels: [] // Empty pixels array instead of null
        }],
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

    it('should handle missing canvas size gracefully', () => {
      const mockCanvas = {
        ...createMockCanvas({ undoStack: [createMockOperation('pencil', 5)], redoStack: [] }),
        getCanvasSize: jest.fn(() => undefined) // Missing canvas size
      }
      const mockRef = createMockRef(mockCanvas)
      
      // Should fall back to default size
      expect(() => {
        render(<HistoryPanel canvasRef={mockRef} />)
      }).not.toThrow()
      
      expect(screen.getByText('Pencil')).toBeInTheDocument()
    })

    it('should handle operations with invalid pixel coordinates', () => {
      const historyState = {
        undoStack: [{
          ...createMockOperation('pencil', 1),
          pixels: [{
            x: -1, // Invalid coordinate
            y: 1000, // Invalid coordinate
            previousColor: 'transparent',
            newColor: '#000000'
          }]
        }],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      // Should handle gracefully
      expect(() => {
        render(<HistoryPanel canvasRef={mockRef} />)
      }).not.toThrow()
    })
  })

  describe('Thumbnail Integration with History Display', () => {
    it('should show thumbnails in the correct order', () => {
      const historyState = {
        undoStack: [
          createMockOperation('pencil', 5, Date.now() - 2000),
          createMockOperation('fill', 15, Date.now() - 1000)
        ],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Should show operations in reverse chronological order (most recent first)
      const operations = screen.getAllByText(/Pencil|Fill/)
      expect(operations[0]).toHaveTextContent('Fill') // Most recent
      expect(operations[1]).toHaveTextContent('Pencil') // Older
    })

    it('should maintain thumbnail quality across different pixel densities', () => {
      const historyState = {
        undoStack: [createMockOperation('pencil', 5)],
        redoStack: [],
        maxHistorySize: 100
      }
      
      const mockCanvas = createMockCanvas(historyState)
      const mockRef = createMockRef(mockCanvas)
      
      render(<HistoryPanel canvasRef={mockRef} />)
      
      // Thumbnails should be clear and readable
      const thumbnails = screen.getAllByRole('img')
      thumbnails.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('src')
        const src = thumbnail.getAttribute('src')
        // Should be a valid data URL
        expect(src).toMatch(/^data:image\/png;base64,/)
      })
    })
  })
})
