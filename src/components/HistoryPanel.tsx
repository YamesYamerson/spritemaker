import React, { useState, useEffect } from 'react'
import { StrokeOperation } from '../types'

interface HistoryPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement> | null
}

interface HistoryOperation {
  id: string
  tool: string
  thumbnail: string // Base64 data URL of the thumbnail
  timestamp: number
  canUndo: boolean
  canRedo: boolean
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ canvasRef }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
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

  // Generate thumbnail from pixel data
  const generateThumbnail = (pixels: Array<{ x: number; y: number; newColor: string }>, canvasSize: number): string => {
    const thumbnailSize = 32 // 32x32 thumbnail
    const scale = thumbnailSize / canvasSize
    
    // Create a temporary canvas for the thumbnail
    const canvas = document.createElement('canvas')
    canvas.width = thumbnailSize
    canvas.height = thumbnailSize
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    // Clear with transparent background
    ctx.clearRect(0, 0, thumbnailSize, thumbnailSize)
    
    // Draw checkered background for transparency
    const checkerSize = Math.max(1, Math.floor(thumbnailSize / 8))
    for (let y = 0; y < thumbnailSize; y += checkerSize) {
      for (let x = 0; x < thumbnailSize; x += checkerSize) {
        const isEvenRow = Math.floor(y / checkerSize) % 2 === 0
        const isEvenCol = Math.floor(x / checkerSize) % 2 === 0
        const isLight = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
        
        ctx.fillStyle = isLight ? '#f0f0f0' : '#d0d0d0'
        ctx.fillRect(x, y, checkerSize, checkerSize)
      }
    }
    
    // Draw the pixels
    pixels.forEach(({ x, y, newColor }) => {
      if (newColor !== 'transparent') {
        const scaledX = Math.floor(x * scale)
        const scaledY = Math.floor(y * scale)
        const pixelSize = Math.max(1, Math.floor(scale))
        
        ctx.fillStyle = newColor
        ctx.fillRect(scaledX, scaledY, pixelSize, pixelSize)
      }
    })
    
    return canvas.toDataURL('image/png')
  }

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
      
      // Get canvas size for thumbnail generation
      const canvasSize = canvas.getCanvasSize ? canvas.getCanvasSize() : 32

      // Only show operations that are currently visible in the drawing area
      // These are the operations in the undo stack (applied to canvas)
      if (historyState.undoStack) {
        historyState.undoStack.slice().reverse().forEach((op: StrokeOperation) => {
          operations.push({
            id: op.id,
            tool: op.tool,
            thumbnail: generateThumbnail(op.pixels, canvasSize),
            timestamp: op.timestamp,
            canUndo: true,
            canRedo: false
          })
        })
      }

      // Don't show redo operations - they are not visible in the drawing area
      // They only appear when you can redo them, but they're not displayed in the history panel

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
      height: isCollapsed ? 'auto' : '200px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Combined History Card */}
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        height: isCollapsed ? 'auto' : '200px', // Compact height for 3-4 items
        maxHeight: isCollapsed ? 'auto' : '200px',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* History Header */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #555',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
            History
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#4a4a4a',
                border: '1px solid #555',
                borderRadius: '3px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
        </div>

        {/* History Operations List */}
        {!isCollapsed && (
          <div style={{
            height: '160px', // Fixed height for content area
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

                  {/* Thumbnail */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img 
                      src={operation.thumbnail} 
                      alt={`${operation.tool} operation`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>

                  {/* Operation Info */}
                  <div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                      {formatToolName(operation.tool)}
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
        )}
      </div>
    </div>
  )
}

export default HistoryPanel
