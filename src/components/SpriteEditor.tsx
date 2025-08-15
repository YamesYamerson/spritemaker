import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Tool, Color, Layer, PixelData, GridSettings, StrokeOperation } from '../types'
import { HistoryManager } from '../utils/historyManager'
import { generateBrushPattern, applyBrushPattern } from '../utils/brushPatterns'

interface SpriteEditorProps {
  selectedTool: Tool
  primaryColor: Color
  secondaryColor: Color
  brushSize: number
  canvasSize: number
  layers: Layer[]
  onCanvasRef?: (ref: React.RefObject<HTMLCanvasElement>) => void
  gridSettings: GridSettings
}

const SpriteEditor: React.FC<SpriteEditorProps> = ({
  selectedTool,
  primaryColor,
  secondaryColor,
  brushSize,
  canvasSize,
  layers,
  onCanvasRef,
  gridSettings
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [pixels, setPixels] = useState<Map<string, PixelData>>(new Map())
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)
  
  // History management
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager(100))
  const [currentDrawingAction, setCurrentDrawingAction] = useState<{
    tool: Tool
    startPos: { x: number; y: number } | null
    canvasStateBeforeDrawing: Map<string, PixelData> | null
    isActive: boolean
  }>({
    tool: 'pencil',
    startPos: null,
    canvasStateBeforeDrawing: null,
    isActive: false
  })

  const activeLayer = layers.find(l => l.visible && l.active)
  const pixelSize = Math.max(1, Math.floor(512 / canvasSize))

  // Memoize brush pattern to avoid regeneration
  const currentBrushPattern = useMemo(() => generateBrushPattern(brushSize), [brushSize])

  // Expose canvas ref to parent
  useEffect(() => {
    if (onCanvasRef) {
      onCanvasRef(canvasRef)
    }
  }, [onCanvasRef])

  // Initialize canvas when size changes
  useEffect(() => {
    setPixels(new Map())
    setLastPos(null)
    historyManagerRef.current.clear()
    setCurrentDrawingAction({
      tool: 'pencil',
      startPos: null,
      canvasStateBeforeDrawing: null,
      isActive: false
    })
  }, [canvasSize])

  // Draw function with history tracking
  const drawPixel = useCallback((x: number, y: number, color: Color, recordHistory: boolean = true) => {
    if (!activeLayer) return

    const key = `${x},${y}`
    const previousColor = pixels.get(key)?.color || 'transparent'
    const newPixels = new Map(pixels)
    
    if (color === 'transparent') {
      newPixels.delete(key)
    } else {
      newPixels.set(key, {
        x,
        y,
        color,
        layerId: activeLayer.id
      })
    }
    
    // Force a new Map instance to ensure React detects the change
    setPixels(new Map(newPixels))

    // No need to record individual pixels anymore - we'll capture the entire state difference
  }, [pixels, activeLayer])

  // New method for drawing during active strokes (no history recording)
  const drawPixelDuringStroke = useCallback((x: number, y: number, color: Color) => {
    if (!activeLayer || !currentDrawingAction.isActive) return

    const key = `${x},${y}`
    const previousColor = pixels.get(key)?.color || 'transparent'
    
    // Update visual state immediately
    const newPixels = new Map(pixels)
    if (color === 'transparent') {
      newPixels.delete(key)
    } else {
      newPixels.set(key, {
        x,
        y,
        color,
        layerId: activeLayer.id
      })
    }
    
    setPixels(newPixels)
  }, [pixels, activeLayer, currentDrawingAction.isActive])

  // New method for drawing with brush patterns
  const drawWithBrushPattern = useCallback((x: number, y: number, color: Color) => {
    if (!activeLayer || !currentDrawingAction.isActive) return
    
    applyBrushPattern(currentBrushPattern, x, y, (pixelX, pixelY) => {
      // Check bounds
      if (pixelX < 0 || pixelX >= canvasSize || pixelY < 0 || pixelY >= canvasSize) return
      
      const key = `${pixelX},${pixelY}`
      const existingPixel = pixels.get(key)
      
      // Only update if the pixel actually changes
      if (color === 'transparent') {
        if (existingPixel) {
          setPixels(prevPixels => {
            const newPixels = new Map(prevPixels)
            newPixels.delete(key)
            return newPixels
          })
        }
      } else {
        if (!existingPixel || existingPixel.color !== color) {
          setPixels(prevPixels => {
            const newPixels = new Map(prevPixels)
            newPixels.set(key, {
              x: pixelX,
              y: pixelY,
              color,
              layerId: activeLayer.id
            })
            return newPixels
          })
        }
      }
    })
  }, [pixels, activeLayer, currentDrawingAction.isActive, brushSize, canvasSize, currentBrushPattern])

  // New method for drawing with brush patterns that takes drawing action as parameter
  const drawWithBrushPatternWithAction = useCallback((x: number, y: number, color: Color, drawingAction: any) => {
    if (!activeLayer || !drawingAction.isActive) return
    
    applyBrushPattern(currentBrushPattern, x, y, (pixelX, pixelY) => {
      // Check bounds
      if (pixelX < 0 || pixelX >= canvasSize || pixelY < 0 || pixelY >= canvasSize) return
      
      const key = `${pixelX},${pixelY}`
      const existingPixel = pixels.get(key)
      
      // Only update if the pixel actually changes
      if (color === 'transparent') {
        if (existingPixel) {
          setPixels(prevPixels => {
            const newPixels = new Map(prevPixels)
            newPixels.delete(key)
            return newPixels
          })
        }
      } else {
        if (!existingPixel || existingPixel.color !== color) {
          setPixels(prevPixels => {
            const newPixels = new Map(prevPixels)
            newPixels.set(key, {
              x: pixelX,
              y: pixelY,
              color,
              layerId: activeLayer.id
            })
            return newPixels
          })
        }
      }
    })
  }, [pixels, activeLayer, brushSize, canvasSize, currentBrushPattern])

  // Apply a stroke operation (for undo/redo)
  const applyStrokeOperation = useCallback((operation: StrokeOperation, reverse: boolean = false) => {
    const newPixels = new Map(pixels)
    
    operation.pixels.forEach(({ x, y, previousColor, newColor }) => {
      const key = `${x},${y}`
      
      if (reverse) {
        // Undo: restore previous color
        if (previousColor === 'transparent') {
          newPixels.delete(key)
        } else {
          newPixels.set(key, {
            x,
            y,
            color: previousColor,
            layerId: operation.layerId
          })
        }
      } else {
        // Redo: apply new color
        if (newColor === 'transparent') {
          newPixels.delete(key)
        } else {
          newPixels.set(key, {
            x,
            y,
            color: newColor,
            layerId: operation.layerId
          })
        }
      }
    })
    
    setPixels(newPixels)
  }, [pixels])

  // Dispatch history change events when operations are added
  const dispatchHistoryChange = useCallback(() => {
    document.dispatchEvent(new CustomEvent('historyChange'))
  }, [])

  // Undo function
  const undo = useCallback(() => {
    const operation = historyManagerRef.current.undo()
    if (operation) {
      applyStrokeOperation(operation, true)
      dispatchHistoryChange() // Dispatch history change event after undo
    }
  }, [applyStrokeOperation, dispatchHistoryChange])

  // Redo function
  const redo = useCallback(() => {
    const operation = historyManagerRef.current.redo()
    if (operation) {
      applyStrokeOperation(operation, false)
      dispatchHistoryChange() // Dispatch history change event after redo
    }
    return operation
  }, [applyStrokeOperation, dispatchHistoryChange])

  // Check if undo/redo are available
  const canUndo = useCallback(() => historyManagerRef.current.canUndo(), [])
  const canRedo = useCallback(() => historyManagerRef.current.canRedo(), [])

  // Flood fill algorithm with history tracking
  const floodFill = useCallback((startX: number, startY: number, targetColor: Color, replacementColor: Color) => {
    // Only return early if we're trying to fill with the exact same color AND it's not transparent
    // This allows filling transparent areas with transparent colors (useful for erasing)
    if (targetColor === replacementColor && targetColor !== 'transparent') return
    
    // Create a local copy of pixels to avoid race conditions during the fill
    const localPixels = new Map(pixels)
    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()
    let filledCount = 0
    
    // Track changes for history
    const fillChanges: Array<{
      x: number
      y: number
      previousColor: Color
      newColor: Color
    }> = []
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key)) continue
      visited.add(key)
      
      // Check if current position matches target color
      // For transparent areas, we need to check if there's no pixel OR if the pixel is transparent
      const currentPixel = localPixels.get(key)
      const currentColor = currentPixel ? currentPixel.color : 'transparent'
      
      if (currentColor !== targetColor) continue
      
      // Record the change
      fillChanges.push({
        x,
        y,
        previousColor: currentColor,
        newColor: replacementColor
      })
      
      // Update the local pixels Map instead of calling drawPixel
      if (replacementColor === 'transparent') {
        localPixels.delete(key)
      } else {
        localPixels.set(key, {
          x,
          y,
          color: replacementColor,
          layerId: activeLayer!.id
        })
      }
      filledCount++
      
      // Add neighbors
      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ]
      
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < canvasSize && ny >= 0 && ny < canvasSize) {
          stack.push([nx, ny])
        }
      }
    }
    
    // After flood fill is complete, update the state with all changes at once
    setPixels(new Map(localPixels))

    // Record the fill operation in history
    if (fillChanges.length > 0 && activeLayer) {
      const operation = historyManagerRef.current.createStrokeOperation(
        'fill',
        activeLayer.id,
        fillChanges
      )
      historyManagerRef.current.pushOperation(operation)
      dispatchHistoryChange() // Dispatch history change event
    }
  }, [pixels, activeLayer, canvasSize])

  // Get color at position
  const getColorAt = useCallback((x: number, y: number): Color => {
    const key = `${x},${y}`
    const pixel = pixels.get(key)
    return pixel ? pixel.color : 'transparent'
  }, [pixels])

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeLayer) return
    
    const rect = canvasRef.current!.getBoundingClientRect()
    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top
    const x = Math.floor(rawX / pixelSize)
    const y = Math.floor(rawY / pixelSize)
    
    if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) return
    
    setIsDrawing(true)
    setLastPos({ x, y })
    
    // Create drawing action object locally
    const drawingAction = {
      tool: selectedTool,
      startPos: { x, y },
      canvasStateBeforeDrawing: new Map(pixels), // Capture state before drawing
      isActive: true
    }
    
    // Start new drawing action
    setCurrentDrawingAction(drawingAction)
    
    // Handle immediate tools (fill, eyedropper) - these don't create drawing actions
    if (selectedTool === 'fill') {
      const targetColor = getColorAt(x, y)
      floodFill(x, y, targetColor, primaryColor)
      // Fill tool doesn't create a drawing action, so reset
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else if (selectedTool === 'eyedropper') {
      const color = getColorAt(x, y)
      if (color !== 'transparent') {
        // Update primary color (you might want to add a callback for this)
      }
      // Eyedropper doesn't create a drawing action, so reset
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else {
      // For drawing tools (pencil, eraser), draw the initial pixel
      if (selectedTool === 'pencil') {
        // Pass the local drawing action instead of relying on state
        drawWithBrushPatternWithAction(x, y, primaryColor, drawingAction)
      } else if (selectedTool === 'eraser') {
        // Pass the local drawing action instead of relying on state
        drawWithBrushPatternWithAction(x, y, 'transparent', drawingAction)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos || !activeLayer || !currentDrawingAction.isActive) return
    
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    
    if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) return
    
    if (selectedTool === 'pencil' || selectedTool === 'eraser') {
      // Always interpolate to ensure no gaps, regardless of distance
      const dx = Math.abs(x - lastPos.x)
      const dy = Math.abs(y - lastPos.y)
      const distance = Math.max(dx, dy)
      
      if (distance === 0) {
        // No movement, just draw at current position
        if (selectedTool === 'pencil') {
          drawWithBrushPattern(x, y, primaryColor)
        } else if (selectedTool === 'eraser') {
          drawWithBrushPattern(x, y, 'transparent')
        }
      } else {
        // Always interpolate to fill any potential gaps
        
        // Collect all pixels for this line and update state once
        const pixelsToUpdate = new Map<string, { x: number; y: number; color: Color; layerId: number }>()
        
        // Use Bresenham's algorithm to draw a complete line
        const sx = lastPos.x < x ? 1 : -1
        const sy = lastPos.y < y ? 1 : -1
        let err = dx - dy
        
        let currentX = lastPos.x
        let currentY = lastPos.y
        
        while (true) {
          // Apply brush pattern to collect all pixels for this position
          applyBrushPattern(currentBrushPattern, currentX, currentY, (pixelX, pixelY) => {
            if (pixelX < 0 || pixelX >= canvasSize || pixelY < 0 || pixelY >= canvasSize) return
            
            const key = `${pixelX},${pixelY}`
            const existingPixel = pixels.get(key)
            const color = selectedTool === 'pencil' ? primaryColor : 'transparent'
            
            // Only add if the pixel actually changes
            if (color === 'transparent') {
              if (existingPixel) {
                // Mark for deletion (we'll handle this in the batch update)
                pixelsToUpdate.set(key, { x: pixelX, y: pixelY, color: 'transparent', layerId: activeLayer.id })
              }
            } else {
              if (!existingPixel || existingPixel.color !== color) {
                pixelsToUpdate.set(key, { x: pixelX, y: pixelY, color, layerId: activeLayer.id })
              }
            }
          })
          
          if (currentX === x && currentY === y) break
          
          const e2 = 2 * err
          if (e2 > -dy) {
            err -= dy
            currentX += sx
          }
          if (e2 < dx) {
            err += dx
            currentY += sy
          }
        }
        
        // Batch update all pixels at once
        if (pixelsToUpdate.size > 0) {
          setPixels(prevPixels => {
            const newPixels = new Map(prevPixels)
            
            pixelsToUpdate.forEach((pixelData, key) => {
              if (pixelData.color === 'transparent') {
                newPixels.delete(key)
              } else {
                newPixels.set(key, pixelData)
              }
            })
            
            return newPixels
          })
        }
      }
    }
    
    setLastPos({ x, y })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setLastPos(null)
    
    // Complete the drawing action and create history entry
    if (currentDrawingAction.isActive && currentDrawingAction.canvasStateBeforeDrawing) {
      const initialPixels = currentDrawingAction.canvasStateBeforeDrawing
      const finalPixels = new Map(pixels)
      
      // Calculate the differences between initial and final states
      const pixelChanges: Array<{
        x: number
        y: number
        previousColor: Color
        newColor: Color
      }> = []
      
      // Check all pixels in the final state
      finalPixels.forEach((pixel, key) => {
        const initialPixel = initialPixels.get(key)
        const initialColor = initialPixel ? initialPixel.color : 'transparent'
        
        if (initialColor !== pixel.color) {
          pixelChanges.push({
            x: pixel.x,
            y: pixel.y,
            previousColor: initialColor,
            newColor: pixel.color
          })
        }
      })
      
      // Check pixels that were in initial state but not in final state (deleted pixels)
      initialPixels.forEach((pixel, key) => {
        if (!finalPixels.has(key)) {
          pixelChanges.push({
            x: pixel.x,
            y: pixel.y,
            previousColor: pixel.color,
            newColor: 'transparent'
          })
        }
      })
      
      if (pixelChanges.length > 0) {
        const operation = historyManagerRef.current.createStrokeOperation(
          currentDrawingAction.tool,
          activeLayer!.id,
          pixelChanges
        )
        historyManagerRef.current.pushOperation(operation)
        dispatchHistoryChange() // Dispatch history change event
      }
    }
    
    // Reset drawing action
    setCurrentDrawingAction({
      tool: 'pencil',
      startPos: null,
      canvasStateBeforeDrawing: null,
      isActive: false
    })
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              // Ctrl+Shift+Z or Cmd+Shift+Z = Redo
              e.preventDefault()
              redo()
            } else {
              // Ctrl+Z or Cmd+Z = Undo
              e.preventDefault()
              undo()
            }
            break
          case 'y':
            // Ctrl+Y or Cmd+Y = Redo (alternative)
            e.preventDefault()
            redo()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Expose undo/redo functions to parent component
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current as any
      canvas.undo = undo
      canvas.redo = redo
      canvas.canUndo = canUndo
      canvas.canRedo = canRedo
      canvas.getHistoryState = () => historyManagerRef.current.getState()
      canvas.getCanvasSize = () => canvasSize
    }
  }, [undo, redo, canUndo, canRedo, canvasSize])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw checkered transparent background aligned with pixel grid
    const checkerSize = 16 * pixelSize // Each checker represents a 16x16 pixel area
    
    for (let y = 0; y < canvas.height; y += checkerSize) {
      for (let x = 0; x < canvas.width; x += checkerSize) {
        const isEvenRow = Math.floor(y / checkerSize) % 2 === 0
        const isEvenCol = Math.floor(x / checkerSize) % 2 === 0
        const isLight = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
        
        // Calculate actual checker size for this position (handles partial checkers at edges)
        const actualWidth = Math.min(checkerSize, canvas.width - x)
        const actualHeight = Math.min(checkerSize, canvas.height - y)
        
        ctx.fillStyle = isLight ? '#e0e0e0' : '#c0c0c0'
        ctx.fillRect(x, y, actualWidth, actualHeight)
      }
    }
    
    // Draw grid (only if enabled)
    if (gridSettings.visible) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      for (let i = 0; i <= canvasSize; i++) {
        const pos = i * pixelSize
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      }
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Draw quarter grid divisions (if enabled)
    if (gridSettings.quarter) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      // Draw center vertical line
      const centerX = (canvasSize / 2) * pixelSize
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, canvas.height)
      ctx.stroke()
      
      // Draw center horizontal line
      const centerY = (canvasSize / 2) * pixelSize
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvas.width, centerY)
      ctx.stroke()
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Draw eighths grid divisions (if enabled)
    if (gridSettings.eighths) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      // Draw vertical division lines at 1/4, 1/2, and 3/4 positions
      const quarterPositions = [1, 2, 3] // 1/4, 2/4, 3/4
      quarterPositions.forEach(quarter => {
        const pos = (canvasSize * quarter / 4) * pixelSize
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
      })
      
      // Draw horizontal division lines at 1/4, 1/2, and 3/4 positions
      quarterPositions.forEach(quarter => {
        const pos = (canvasSize * quarter / 4) * pixelSize
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      })
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Draw sixteenths grid divisions (if enabled)
    if (gridSettings.sixteenths) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      // Draw vertical division lines at 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8 positions
      const eighthPositions = [1, 2, 3, 4, 5, 6, 7] // 1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8
      eighthPositions.forEach(eighth => {
        const pos = (canvasSize * eighth / 8) * pixelSize
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
      })
      
      // Draw horizontal division lines at 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8 positions
      eighthPositions.forEach(eighth => {
        const pos = (canvasSize * eighth / 8) * pixelSize
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      })
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Draw thirty-seconds grid divisions (if enabled)
    if (gridSettings.thirtyseconds) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      // Draw vertical division lines at 1/16, 1/8, 3/16, 1/4, 5/16, 3/8, 7/16, 1/2, 9/16, 5/8, 11/16, 3/4, 13/16, 7/8, 15/16 positions
      const sixteenthPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // 1/16 through 15/16
      sixteenthPositions.forEach(sixteenth => {
        const pos = (canvasSize * sixteenth / 16) * pixelSize
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
      })
      
      // Draw horizontal division lines at 1/16, 1/8, 3/16, 1/4, 5/16, 3/8, 7/16, 1/2, 9/16, 5/8, 11/16, 3/4, 13/16, 7/8, 15/16 positions
      sixteenthPositions.forEach(sixteenth => {
        const pos = (canvasSize * sixteenth / 16) * pixelSize
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      })
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Draw sixty-fourths grid divisions (if enabled)
    if (gridSettings.sixtyfourths) {
      ctx.strokeStyle = gridSettings.color
      ctx.globalAlpha = gridSettings.opacity
      ctx.lineWidth = 1
      
      // Draw vertical division lines at 1/32, 1/16, 3/32, 1/8, 5/32, 3/16, 7/32, 1/4, 9/32, 5/16, 11/32, 3/8, 13/32, 7/16, 15/32, 1/2, 17/32, 9/16, 19/32, 5/8, 21/32, 11/16, 23/32, 3/4, 25/32, 13/16, 27/32, 7/8, 29/32, 15/16, 31/32 positions
      const thirtySecondPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] // 1/32 through 31/32
      thirtySecondPositions.forEach(thirtySecond => {
        const pos = (canvasSize * thirtySecond / 32) * pixelSize
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
      })
      
      // Draw horizontal division lines at 1/32, 1/16, 3/32, 1/8, 5/32, 3/16, 7/32, 1/4, 9/32, 5/16, 11/32, 3/8, 13/32, 7/16, 15/32, 1/2, 17/32, 9/16, 19/32, 5/8, 21/32, 11/16, 23/32, 3/4, 25/32, 13/16, 27/32, 7/8, 29/32, 15/16, 31/32 positions
      thirtySecondPositions.forEach(thirtySecond => {
        const pos = (canvasSize * thirtySecond / 32) * pixelSize
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      })
      
      // Reset global alpha
      ctx.globalAlpha = 1.0
    }
    
    // Draw pixels
    pixels.forEach((pixel) => {
      const layer = layers.find(l => l.id === pixel.layerId)
      
      if (layer && layer.visible) {
        ctx.fillStyle = pixel.color
        ctx.fillRect(
          pixel.x * pixelSize,
          pixel.y * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    })
  }, [pixels, layers, canvasSize, pixelSize, gridSettings.visible, gridSettings.color, gridSettings.opacity, gridSettings.quarter, gridSettings.eighths, gridSettings.sixteenths, gridSettings.thirtyseconds, gridSettings.sixtyfourths])

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasSize * pixelSize}
        height={canvasSize * pixelSize}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: 'crosshair',
          backgroundColor: 'transparent'
        }}
        data-testid="sprite-canvas"
      />
    </div>
  )
}

export default SpriteEditor
