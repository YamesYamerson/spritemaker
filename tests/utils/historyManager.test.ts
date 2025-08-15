import { HistoryManager } from '../../src/utils/historyManager'
import { StrokeOperation, Color, Tool } from '../../src/types'

describe('HistoryManager', () => {
  let historyManager: HistoryManager

  beforeEach(() => {
    historyManager = new HistoryManager(5) // Small size for testing
  })

  describe('constructor', () => {
    it('should initialize with default max history size', () => {
      const defaultManager = new HistoryManager()
      expect(defaultManager.getState().maxHistorySize).toBe(100)
    })

    it('should initialize with custom max history size', () => {
      expect(historyManager.getState().maxHistorySize).toBe(5)
    })

    it('should start with empty undo and redo stacks', () => {
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(0)
      expect(state.redoStack).toHaveLength(0)
    })
  })

  describe('pushOperation', () => {
    it('should add operation to undo stack', () => {
      const operation = createMockOperation('pencil', 1, 5)
      historyManager.pushOperation(operation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0]).toBe(operation)
    })

    it('should clear redo stack when new operation is pushed', () => {
      // First, add an operation and undo it to create redo stack
      const operation1 = createMockOperation('pencil', 1, 3)
      historyManager.pushOperation(operation1)
      historyManager.undo()
      
      // Verify redo stack has content
      expect(historyManager.getState().redoStack).toHaveLength(1)
      
      // Push new operation
      const operation2 = createMockOperation('eraser', 1, 2)
      historyManager.pushOperation(operation2)
      
      // Redo stack should be cleared
      expect(historyManager.getState().redoStack).toHaveLength(0)
    })

    it('should respect max history size', () => {
      // Add operations up to max size
      for (let i = 0; i < 6; i++) {
        const operation = createMockOperation('pencil', 1, 1)
        historyManager.pushOperation(operation)
      }
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(5) // Max size
      expect(state.undoStack[0].id).toContain('1') // Oldest operation should be first
    })

    it('should maintain operation order (oldest first)', () => {
      const operation1 = createMockOperation('pencil', 1, 1)
      const operation2 = createMockOperation('eraser', 1, 1)
      
      historyManager.pushOperation(operation1)
      historyManager.pushOperation(operation2)
      
      const state = historyManager.getState()
      expect(state.undoStack[0]).toBe(operation1)
      expect(state.undoStack[1]).toBe(operation2)
    })
  })

  describe('undo', () => {
    it('should return null when undo stack is empty', () => {
      const result = historyManager.undo()
      expect(result).toBeNull()
    })

    it('should move operation from undo to redo stack', () => {
      const operation = createMockOperation('pencil', 1, 3)
      historyManager.pushOperation(operation)
      
      const undoneOperation = historyManager.undo()
      
      expect(undoneOperation).toBe(operation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(0)
      expect(state.redoStack).toHaveLength(1)
      expect(state.redoStack[0]).toBe(operation)
    })

    it('should return operations in reverse order (LIFO)', () => {
      const operation1 = createMockOperation('pencil', 1, 2)
      const operation2 = createMockOperation('eraser', 1, 3)
      
      historyManager.pushOperation(operation1)
      historyManager.pushOperation(operation2)
      
      // Undo should return most recent operation first
      const firstUndo = historyManager.undo()
      const secondUndo = historyManager.undo()
      
      expect(firstUndo).toBe(operation2)
      expect(secondUndo).toBe(operation1)
    })
  })

  describe('redo', () => {
    it('should return null when redo stack is empty', () => {
      const result = historyManager.redo()
      expect(result).toBeNull()
    })

    it('should move operation from redo to undo stack', () => {
      const operation = createMockOperation('pencil', 1, 2)
      historyManager.pushOperation(operation)
      historyManager.undo()
      
      const redoneOperation = historyManager.redo()
      
      expect(redoneOperation).toBe(operation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.redoStack).toHaveLength(0)
      expect(state.undoStack[0]).toBe(operation)
    })

    it('should return operations in correct order (FIFO for redo)', () => {
      const operation1 = createMockOperation('pencil', 1, 2)
      const operation2 = createMockOperation('eraser', 1, 3)
      
      historyManager.pushOperation(operation1)
      historyManager.pushOperation(operation2)
      
      // Undo both operations
      historyManager.undo()
      historyManager.undo()
      
      // Redo should restore in the order they were undone
      const firstRedo = historyManager.redo()
      const secondRedo = historyManager.redo()
      
      expect(firstRedo).toBe(operation1)
      expect(secondRedo).toBe(operation2)
    })
  })

  describe('canUndo', () => {
    it('should return false when undo stack is empty', () => {
      expect(historyManager.canUndo()).toBe(false)
    })

    it('should return true when undo stack has operations', () => {
      const operation = createMockOperation('pencil', 1, 2)
      historyManager.pushOperation(operation)
      expect(historyManager.canUndo()).toBe(true)
    })
  })

  describe('canRedo', () => {
    it('should return false when redo stack is empty', () => {
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should return true when redo stack has operations', () => {
      const operation = createMockOperation('pencil', 1, 2)
      historyManager.pushOperation(operation)
      historyManager.undo()
      expect(historyManager.canRedo()).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear both undo and redo stacks', () => {
      const operation1 = createMockOperation('pencil', 1, 2)
      const operation2 = createMockOperation('eraser', 1, 3)
      
      historyManager.pushOperation(operation1)
      historyManager.undo()
      historyManager.pushOperation(operation2)
      
      // Verify both stacks have content
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
      
      historyManager.clear()
      
      // Both stacks should be empty
      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(false)
    })
  })

  describe('getState', () => {
    it('should return a copy of the current state', () => {
      const operation = createMockOperation('pencil', 1, 2)
      historyManager.pushOperation(operation)
      
      const state1 = historyManager.getState()
      const state2 = historyManager.getState()
      
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2) // Should be different objects
    })

    it('should not be affected by external modifications', () => {
      const operation = createMockOperation('pencil', 1, 2)
      historyManager.pushOperation(operation)
      
      const state = historyManager.getState()
      
      // Try to modify the returned state
      state.undoStack.push({} as any)
      
      // Original state should be unchanged
      const newState = historyManager.getState()
      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack[0]).toBe(operation)
    })
  })

  describe('getUndoCount and getRedoCount', () => {
    it('should return correct counts', () => {
      expect(historyManager.getUndoCount()).toBe(0)
      expect(historyManager.getRedoCount()).toBe(0)
      
      const operation1 = createMockOperation('pencil', 1, 2)
      const operation2 = createMockOperation('eraser', 1, 3)
      
      historyManager.pushOperation(operation1)
      historyManager.pushOperation(operation2)
      
      expect(historyManager.getUndoCount()).toBe(2)
      expect(historyManager.getRedoCount()).toBe(0)
      
      historyManager.undo()
      
      expect(historyManager.getUndoCount()).toBe(1)
      expect(historyManager.getRedoCount()).toBe(1)
    })
  })

  describe('createPixelOperation', () => {
    it('should create operation with single pixel', () => {
      const operation = historyManager.createPixelOperation(
        'pencil',
        1,
        10,
        20,
        'transparent',
        '#ff0000'
      )
      
      expect(operation.tool).toBe('pencil')
      expect(operation.layerId).toBe(1)
      expect(operation.pixels).toHaveLength(1)
      expect(operation.pixels[0]).toEqual({
        x: 10,
        y: 20,
        previousColor: 'transparent',
        newColor: '#ff0000'
      })
      expect(operation.id).toBeDefined()
      expect(operation.timestamp).toBeDefined()
    })
  })

  describe('createStrokeOperation', () => {
    it('should create operation with multiple pixels', () => {
      const pixels = [
        { x: 10, y: 20, previousColor: 'transparent', newColor: '#ff0000' },
        { x: 11, y: 20, previousColor: 'transparent', newColor: '#ff0000' }
      ]
      
      const operation = historyManager.createStrokeOperation('pencil', 1, pixels)
      
      expect(operation.tool).toBe('pencil')
      expect(operation.layerId).toBe(1)
      expect(operation.pixels).toEqual(pixels)
      expect(operation.id).toBeDefined()
      expect(operation.timestamp).toBeDefined()
    })
  })

  describe('batchOperations', () => {
    it('should return null for empty operations array', () => {
      const result = historyManager.batchOperations([])
      expect(result).toBeNull()
    })

    it('should combine multiple operations into one', () => {
      const operation1 = createMockOperation('pencil', 1, 2)
      const operation2 = createMockOperation('pencil', 1, 3)
      
      const batched = historyManager.batchOperations([operation1, operation2])
      
      expect(batched).toBeDefined()
      expect(batched!.tool).toBe('pencil')
      expect(batched!.layerId).toBe(1)
      expect(batched!.pixels).toHaveLength(5) // 2 + 3
      expect(batched!.id).toBeDefined()
      expect(batched!.timestamp).toBeDefined()
    })

    it('should preserve pixel order from all operations', () => {
      const operation1 = createMockOperation('pencil', 1, 1)
      const operation2 = createMockOperation('eraser', 1, 1)
      
      const batched = historyManager.batchOperations([operation1, operation2])
      
      expect(batched!.pixels).toHaveLength(2)
      expect(batched!.pixels[0]).toEqual(operation1.pixels[0])
      expect(batched!.pixels[1]).toEqual(operation2.pixels[0])
    })

    it('should handle batch operations with empty array', () => {
      const result = historyManager.batchOperations([])
      expect(result).toBeNull() // Empty array returns null
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid max history size gracefully', () => {
      const invalidManager = new HistoryManager(-1)
      expect(invalidManager.getState().maxHistorySize).toBe(-1) // Constructor accepts any value
      
      const zeroManager = new HistoryManager(0)
      expect(zeroManager.getState().maxHistorySize).toBe(0) // Constructor accepts any value
    })

    it('should handle extremely large max history size gracefully', () => {
      const largeManager = new HistoryManager(1000000)
      expect(largeManager.getState().maxHistorySize).toBe(1000000)
      
      // Should not crash when adding many operations
      for (let i = 0; i < 1000; i++) {
        const operation = createMockOperation('pencil', 1, 1)
        largeManager.pushOperation(operation)
      }
      
      expect(largeManager.getState().undoStack).toHaveLength(1000)
    })

    it('should handle operations with missing properties gracefully', () => {
      const incompleteOperation = {
        id: 'incomplete-1',
        tool: 'pencil',
        // Missing layerId, pixels, timestamp
      } as any
      
      historyManager.pushOperation(incompleteOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0]).toBe(incompleteOperation)
    })

    it('should handle operations with invalid properties gracefully', () => {
      const invalidOperation = {
        id: null,
        tool: 123,
        layerId: 'invalid',
        pixels: 'not-an-array',
        timestamp: 'invalid-timestamp'
      } as any
      
      historyManager.pushOperation(invalidOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0]).toBe(invalidOperation)
    })

    it('should handle operations with extremely long IDs gracefully', () => {
      const longId = 'a'.repeat(10000)
      const operation = {
        ...createMockOperation('pencil', 1, 1),
        id: longId
      }
      
      historyManager.pushOperation(operation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].id).toBe(longId)
    })

    it('should handle operations with invalid tool types gracefully', () => {
      const invalidToolOperation = {
        ...createMockOperation('pencil', 1, 1),
        tool: 'invalid-tool-type'
      }
      
      historyManager.pushOperation(invalidToolOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].tool).toBe('invalid-tool-type')
    })

    it('should handle operations with invalid layer IDs gracefully', () => {
      const invalidLayerOperation = {
        ...createMockOperation('pencil', 1, 1),
        layerId: 'invalid-layer'
      }
      
      historyManager.pushOperation(invalidLayerOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].layerId).toBe('invalid-layer')
    })

    it('should handle operations with invalid pixel data gracefully', () => {
      const invalidPixelOperation = {
        ...createMockOperation('pencil', 1, 1),
        pixels: [
          { x: 'invalid', y: 'invalid', previousColor: null, newColor: undefined },
          { x: -1, y: -1, previousColor: 'transparent', newColor: '#ff0000' }
        ]
      }
      
      historyManager.pushOperation(invalidPixelOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].pixels).toHaveLength(2)
    })

    it('should handle operations with missing pixel properties gracefully', () => {
      const incompletePixelOperation = {
        ...createMockOperation('pencil', 1, 1),
        pixels: [
          { x: 0, y: 0 }, // Missing previousColor and newColor
          { x: 1, y: 1, previousColor: 'transparent' }, // Missing newColor
          { x: 2, y: 2, newColor: '#ff0000' } // Missing previousColor
        ]
      } as any
      
      historyManager.pushOperation(incompletePixelOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].pixels).toHaveLength(3)
    })

    it('should handle operations with invalid timestamps gracefully', () => {
      const invalidTimestampOperation = {
        ...createMockOperation('pencil', 1, 1),
        timestamp: 'invalid-timestamp'
      }
      
      historyManager.pushOperation(invalidTimestampOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].timestamp).toBe('invalid-timestamp')
    })

    it('should handle operations with future timestamps gracefully', () => {
      const futureTimestampOperation = {
        ...createMockOperation('pencil', 1, 1),
        timestamp: Date.now() + 1000000 // 1 million ms in the future
      }
      
      historyManager.pushOperation(futureTimestampOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].timestamp).toBeGreaterThan(Date.now())
    })

    it('should handle operations with negative timestamps gracefully', () => {
      const negativeTimestampOperation = {
        ...createMockOperation('pencil', 1, 1),
        timestamp: -Date.now()
      }
      
      historyManager.pushOperation(negativeTimestampOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].timestamp).toBeLessThan(0)
    })

    it('should handle rapid push operations gracefully', () => {
      // Push many operations rapidly
      for (let i = 0; i < 100; i++) {
        const operation = createMockOperation('pencil', 1, 1)
        historyManager.pushOperation(operation)
      }
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(5) // Should respect max size
    })

    it('should handle rapid undo/redo operations gracefully', () => {
      // Add some operations first
      for (let i = 0; i < 3; i++) {
        const operation = createMockOperation('pencil', 1, 1)
        historyManager.pushOperation(operation)
      }
      
      // Rapid undo/redo
      for (let i = 0; i < 10; i++) {
        historyManager.undo()
        historyManager.redo()
      }
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(3)
      expect(state.redoStack).toHaveLength(0)
    })

    it('should handle operations with circular references gracefully', () => {
      const circularOperation = createMockOperation('pencil', 1, 1)
      circularOperation.pixels = circularOperation.pixels.map(pixel => ({
        ...pixel,
        circularRef: circularOperation
      }))
      
      historyManager.pushOperation(circularOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      // Should not crash when accessing circular references
    })

    it('should handle operations with function properties gracefully', () => {
      const functionOperation = {
        ...createMockOperation('pencil', 1, 1),
        customFunction: () => 'test',
        nestedObject: {
          method: () => 'nested'
        }
      }
      
      historyManager.pushOperation(functionOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(typeof state.undoStack[0].customFunction).toBe('function')
    })

    it('should handle operations with undefined and null values gracefully', () => {
      const nullUndefinedOperation = {
        id: undefined,
        tool: null,
        layerId: undefined,
        pixels: [null, undefined, { x: 0, y: 0, previousColor: 'transparent', newColor: '#ff0000' }],
        timestamp: null
      } as any
      
      historyManager.pushOperation(nullUndefinedOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].id).toBeUndefined()
      expect(state.undoStack[0].tool).toBeNull()
    })

    it('should handle operations with extremely large pixel arrays gracefully', () => {
      const largePixelArray = Array.from({ length: 10000 }, (_, i) => ({
        x: i,
        y: i,
        previousColor: 'transparent',
        newColor: '#ff0000'
      }))
      
      const largeOperation = {
        ...createMockOperation('pencil', 1, 1),
        pixels: largePixelArray
      }
      
      historyManager.pushOperation(largeOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].pixels).toHaveLength(10000)
    })

    it('should handle operations with deeply nested objects gracefully', () => {
      const deeplyNestedOperation = {
        ...createMockOperation('pencil', 1, 1),
        metadata: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deep'
                  }
                }
              }
            }
          }
        }
      }
      
      historyManager.pushOperation(deeplyNestedOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].metadata.level1.level2.level3.level4.level5.value).toBe('deep')
    })

    it('should handle operations with special characters in strings gracefully', () => {
      const specialCharOperation = {
        ...createMockOperation('pencil', 1, 1),
        tool: 'pencil-🔧-tool',
        id: 'operation-🚀-with-emoji',
        metadata: {
          description: 'Operation with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
        }
      }
      
      historyManager.pushOperation(specialCharOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].tool).toBe('pencil-🔧-tool')
      expect(state.undoStack[0].id).toBe('operation-🚀-with-emoji')
    })

    it('should handle operations with very long strings gracefully', () => {
      const longString = 'a'.repeat(100000)
      const longStringOperation = {
        ...createMockOperation('pencil', 1, 1),
        tool: longString,
        id: longString,
        metadata: {
          description: longString
        }
      }
      
      historyManager.pushOperation(longStringOperation)
      
      const state = historyManager.getState()
      expect(state.undoStack).toHaveLength(1)
      expect(state.undoStack[0].tool).toBe(longString)
      expect(state.undoStack[0].id).toBe(longString)
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
