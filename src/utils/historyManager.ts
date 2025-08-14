import { StrokeOperation, HistoryState, Color, Tool } from '../types'

export class HistoryManager {
  private state: HistoryState

  constructor(maxHistorySize: number = 100) {
    this.state = {
      undoStack: [],
      redoStack: [],
      maxHistorySize
    }
  }

  // Add a new operation to the undo stack
  pushOperation(operation: StrokeOperation): void {
    // Clear redo stack when new operation is added
    this.state.redoStack = []
    
    // Add to undo stack
    this.state.undoStack.push(operation)
    
    // Maintain max history size
    if (this.state.undoStack.length > this.state.maxHistorySize) {
      this.state.undoStack.shift()
    }
  }

  // Undo the last operation
  undo(): StrokeOperation | null {
    const operation = this.state.undoStack.pop()
    if (operation) {
      this.state.redoStack.push(operation)
      return operation
    }
    return null
  }

  // Redo the last undone operation
  redo(): StrokeOperation | null {
    const operation = this.state.redoStack.pop()
    if (operation) {
      this.state.undoStack.push(operation)
      return operation
    }
    return null
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.state.undoStack.length > 0
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.state.redoStack.length > 0
  }

  // Clear all history
  clear(): void {
    this.state.undoStack = []
    this.state.redoStack = []
  }

  // Get current history state
  getState(): HistoryState {
    return {
      undoStack: [...this.state.undoStack],
      redoStack: [...this.state.redoStack],
      maxHistorySize: this.state.maxHistorySize
    }
  }

  // Get undo stack size
  getUndoCount(): number {
    return this.state.undoStack.length
  }

  // Get redo stack size
  getRedoCount(): number {
    return this.state.redoStack.length
  }

  // Create a stroke operation for a single pixel change
  createPixelOperation(
    tool: Tool,
    layerId: number,
    x: number,
    y: number,
    previousColor: Color,
    newColor: Color
  ): StrokeOperation {
    return {
      id: `${Date.now()}-${Math.random()}`,
      tool,
      layerId,
      pixels: [{
        x,
        y,
        previousColor,
        newColor
      }],
      timestamp: Date.now()
    }
  }

  // Create a stroke operation for multiple pixel changes
  createStrokeOperation(
    tool: Tool,
    layerId: number,
    pixels: Array<{
      x: number
      y: number
      previousColor: Color
      newColor: Color
    }>
  ): StrokeOperation {
    return {
      id: `${Date.now()}-${Math.random()}`,
      tool,
      layerId,
      pixels,
      timestamp: Date.now()
    }
  }

  // Batch multiple operations into a single operation (useful for continuous drawing)
  batchOperations(operations: StrokeOperation[]): StrokeOperation | null {
    if (operations.length === 0) return null
    
    const firstOp = operations[0]
    const allPixels: Array<{
      x: number
      y: number
      previousColor: Color
      newColor: Color
    }> = []
    
    // Collect all pixels from all operations
    operations.forEach(op => {
      allPixels.push(...op.pixels)
    })
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      tool: firstOp.tool,
      layerId: firstOp.layerId,
      pixels: allPixels,
      timestamp: Date.now()
    }
  }
}
