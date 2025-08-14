import React, { useState, useEffect } from 'react'
import { StrokeOperation } from '../types'

interface HistoryPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement> | null
}

interface HistoryOperation {
  id: string
  tool: string
  pixelCount: number
  timestamp: number
  canUndo: boolean
  canRedo: boolean
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ canvasRef }) => {
  const [history, setHistory] = useState<{
    undoCount: number
    redoCount: number
    canUndo: boolean
    canRedo: boolean
  }>({
    undoCount: 0,
    redoCount: 0,
    canUndo: false,
    canRedo: false
  })

  // Update history state when canvas ref changes or when undo/redo is performed
  useEffect(() => {
    const updateHistory = () => {
      if (canvasRef?.current) {
        const canvas = canvasRef.current as any
        if (canvas.canUndo && canvas.canRedo) {
          setHistory({
            undoCount: canvas.canUndo() ? 1 : 0, // We'll get actual count from HistoryManager
            redoCount: canvas.canRedo() ? 1 : 0, // We'll get actual count from HistoryManager
            canUndo: canvas.canUndo ? canvas.canUndo() : false,
            canRedo: canvas.canRedo ? canvas.canRedo() : false
          })
        }
      }
    }

    // Initial update
    updateHistory()

    // Listen for custom events when history changes
    const handleHistoryChange = () => {
      updateHistory()
    }

    // Add event listener for history changes
    document.addEventListener('historyChange', handleHistoryChange)

    return () => {
      document.removeEventListener('historyChange', handleHistoryChange)
    }
  }, [canvasRef])

  const handleUndo = () => {
    if (canvasRef?.current?.undo) {
      (canvasRef.current as any).undo()
      // Trigger a history update after undo
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('historyChange'))
      }, 10)
    }
  }

  const handleRedo = () => {
    if (canvasRef?.current?.redo) {
      (canvasRef.current as any).redo()
      // Trigger a history update after redo
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('historyChange'))
      }, 10)
    }
  }

  // Get real history operations from the canvas's HistoryManager
  const getRealHistoryOperations = (): HistoryOperation[] => {
    if (!canvasRef?.current) return []

    const canvas = canvasRef.current as any
    if (!canvas.getHistoryState) return []

    try {
      const historyState = canvas.getHistoryState()
      const operations: HistoryOperation[] = []

      // Add undo operations (most recent first)
      if (historyState.undoStack) {
        historyState.undoStack.slice().reverse().forEach((op: StrokeOperation) => {
          operations.push({
            id: op.id,
            tool: op.tool,
            pixelCount: op.pixels.length,
            timestamp: op.timestamp,
            canUndo: true,
            canRedo: false
          })
        })
      }

      // Add redo operations
      if (historyState.redoStack) {
        historyState.redoStack.forEach((op: StrokeOperation) => {
          operations.push({
            id: op.id,
            tool: op.tool,
            pixelCount: op.pixels.length,
            timestamp: op.timestamp,
            canUndo: false,
            canRedo: true
          })
        })
      }

      return operations
    } catch (error) {
      console.warn('Could not get history state:', error)
      return []
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now()
    const diff = Math.abs(now - timestamp)
    if (diff < 1000) return 'now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const formatToolName = (tool: string): string => {
    return tool.charAt(0).toUpperCase() + tool.slice(1)
  }

  const historyOperations = getRealHistoryOperations()

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* History Header */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
          History
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleUndo}
            disabled={!history.canUndo}
            style={{
              padding: '4px 8px',
              backgroundColor: history.canUndo ? '#4a4a4a' : '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '3px',
              color: history.canUndo ? '#fff' : '#666',
              cursor: history.canUndo ? 'pointer' : 'not-allowed',
              fontSize: '11px',
              minWidth: '40px'
            }}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!history.canRedo}
            style={{
              padding: '4px 8px',
              backgroundColor: history.canRedo ? '#4a4a4a' : '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '3px',
              color: history.canRedo ? '#fff' : '#666',
              cursor: history.canRedo ? 'pointer' : 'not-allowed',
              fontSize: '11px',
              minWidth: '40px'
            }}
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>
      </div>

      {/* History Operations List */}
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto'
      }}>
        {historyOperations.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}>
            No history yet
          </div>
        ) : (
          historyOperations.map((operation) => (
            <div
              key={operation.id}
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                if (operation.canUndo) {
                  handleUndo()
                } else if (operation.canRedo) {
                  handleRedo()
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Tool Icon */}
                <div style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: operation.tool === 'fill' ? '#4CAF50' :
                                   operation.tool === 'pencil' ? '#2196F3' : '#FF5722',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {operation.tool.charAt(0).toUpperCase()}
                </div>

                {/* Operation Info */}
                <div>
                  <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                    {formatToolName(operation.tool)} ({operation.pixelCount} pixels)
                  </div>
                  <div style={{ color: '#999', fontSize: '10px' }}>
                    {formatTimestamp(operation.timestamp)}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: operation.canUndo ? '#4CAF50' : '#FF9800'
              }} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default HistoryPanel
