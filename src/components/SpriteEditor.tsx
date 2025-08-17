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
  onPrimaryColorChange?: (color: Color) => void
  onPixelsChange?: (pixels: Map<string, PixelData>) => void
  onSelectionChange?: (hasSelection: boolean) => void
  gridSettings: GridSettings
}

const SpriteEditor: React.FC<SpriteEditorProps> = ({
  selectedTool,
  primaryColor,
  secondaryColor: _secondaryColor,
  brushSize,
  canvasSize,
  layers,
  onCanvasRef,
  onPrimaryColorChange,
  onPixelsChange,
  onSelectionChange,
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

  // State for shape drawing (rectangle, circle)
  const [shapePreview, setShapePreview] = useState<{
    tool: Tool
    startPos: { x: number; y: number }
    currentPos: { x: number; y: number }
  } | null>(null)

  // State for selection tool
  const [selection, setSelection] = useState<{
    startPos: { x: number; y: number }
    currentPos: { x: number; y: number }
    rawCurrentPos?: { x: number; y: number } // Store raw coordinates for bounds calculation
    isActive: boolean
    content: Map<string, PixelData> // Store the actual pixel content within selection
  } | null>(null)
  
  // Track if we're actively selecting (mouse down to mouse up)
  const [isSelecting, setIsSelecting] = useState(false)
  
  // State for lasso tool
  const [lassoPath, setLassoPath] = useState<Array<{ x: number; y: number }>>([])
  const [isLassoing, setIsLassoing] = useState(false)
  const [animationTime, setAnimationTime] = useState(0) // For animated selection outlines

  // State for clipboard operations
  const [clipboard, setClipboard] = useState<{
    pixels: Map<string, PixelData>
    bounds: { startX: number; startY: number; endX: number; endY: number }
    operation: 'copy' | 'cut'
  } | null>(null)

  // State for move-selection tool
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [moveStartPos, setMoveStartPos] = useState<{ x: number; y: number } | null>(null)
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const activeLayer = layers.find(l => l.visible && l.active)
  const pixelSize = Math.max(1, Math.floor(512 / canvasSize))

  // Memoize brush pattern to avoid regeneration
  const currentBrushPattern = useMemo(() => generateBrushPattern(brushSize), [brushSize])



  // Notify parent of pixel changes
  useEffect(() => {
    if (onPixelsChange) {
      onPixelsChange(pixels)
    }
  }, [pixels, onPixelsChange])

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selection !== null)
    }
  }, [selection, onSelectionChange])

  // Copy selected pixels to clipboard
  const handleCopy = useCallback(() => {
    if (!selection || !activeLayer) return
    
    const rawBounds = {
      startX: Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
      startY: Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y),
      endX: Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
      endY: Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
    }
    
    // Clamp bounds to canvas size - selection cannot extend beyond canvas boundaries
    const bounds = {
      startX: Math.max(0, rawBounds.startX),
      startY: Math.max(0, rawBounds.startY),
      endX: Math.min(canvasSize - 1, rawBounds.endX),
      endY: Math.min(canvasSize - 1, rawBounds.endY)
    }
    
    // Use the stored selection content
    const selectedPixels = selection.content || new Map()
    
    setClipboard({
      pixels: selectedPixels,
      bounds,
      operation: 'copy'
    })
    
    // Create history entry for copy operation
    const operation = historyManagerRef.current.createStrokeOperation(
      'copy',
      activeLayer.id,
      [] // No pixel changes for copy
    )
    operation.metadata = {
      selectionBounds: bounds,
      selectionContent: selectedPixels
    }
    historyManagerRef.current.pushOperation(operation)
    dispatchHistoryChange()
  }, [selection, activeLayer, canvasSize])

  // Cut selected pixels to clipboard
  const handleCut = useCallback(() => {
    if (!selection || !activeLayer) return
    
    const rawBounds = {
      startX: Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
      startY: Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y),
      endX: Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
      endY: Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
    }
    
    // Clamp bounds to canvas size - selection cannot extend beyond canvas boundaries
    const bounds = {
      startX: Math.max(0, rawBounds.startX),
      startY: Math.max(0, rawBounds.startY),
      endX: Math.min(canvasSize - 1, rawBounds.endX),
      endY: Math.min(canvasSize - 1, rawBounds.endY)
    }
    
    // Use the stored selection content
    const selectedPixels = selection.content || new Map()
    const pixelsToRemove: Array<{ x: number; y: number; color: Color }> = []
    
    // Convert relative coordinates back to absolute for removal
    selectedPixels.forEach((pixel, _key) => {
      const absoluteX = pixel.x + bounds.startX
      const absoluteY = pixel.y + bounds.startY
      pixelsToRemove.push({
        x: absoluteX,
        y: absoluteY,
        color: pixel.color
      })
    })
    
    // Remove the pixels from the canvas
    const newPixels = new Map(pixels)
    pixelsToRemove.forEach(({ x, y }) => {
      newPixels.delete(`${x},${y}`)
    })
    setPixels(newPixels)
    
    // Store in clipboard
    setClipboard({
      pixels: selectedPixels,
      bounds,
      operation: 'cut'
    })
    
    // Create history entry for cut operation
    const operation = historyManagerRef.current.createStrokeOperation(
      'cut',
      activeLayer.id,
      pixelsToRemove.map(p => ({
        x: p.x,
        y: p.y,
        previousColor: p.color,
        newColor: 'transparent'
      }))
    )
    operation.metadata = {
      selectionBounds: bounds,
      selectionContent: selectedPixels
    }
    historyManagerRef.current.pushOperation(operation)
    dispatchHistoryChange()
    
    // Clear the selection after cutting
    setSelection(null)
  }, [selection, pixels, activeLayer, canvasSize])

  // Paste pixels from clipboard
  const handlePaste = useCallback(() => {
    if (!clipboard || !activeLayer) return
    
    // Calculate paste position - center the pasted content on the canvas
    const pasteBounds = clipboard.bounds
    const pasteWidth = pasteBounds.endX - pasteBounds.startX + 1
    const pasteHeight = pasteBounds.endY - pasteBounds.startY + 1
    
    // Center the paste on the canvas
    const centerX = Math.floor(canvasSize / 2)
    const centerY = Math.floor(canvasSize / 2)
    const pasteStartX = centerX - Math.floor(pasteWidth / 2)
    const pasteStartY = centerY - Math.floor(pasteHeight / 2)
    
    // Create new pixels map with pasted content
    const newPixels = new Map(pixels)
    const pixelsToAdd: Array<{ x: number; y: number; color: Color }> = []
    
    // Convert relative coordinates to absolute paste position
    clipboard.pixels.forEach((pixel, _key) => {
      const absoluteX = pasteStartX + pixel.x
      const absoluteY = pasteStartY + pixel.y
      
      // Only add pixels that are within canvas bounds
      if (absoluteX >= 0 && absoluteX < canvasSize && absoluteY >= 0 && absoluteY < canvasSize) {
        pixelsToAdd.push({
          x: absoluteX,
          y: absoluteY,
          color: pixel.color
        })
      }
    })
    
    // Add the pasted pixels to the canvas
    pixelsToAdd.forEach(({ x, y, color }) => {
      if (color !== 'transparent') {
        newPixels.set(`${x},${y}`, {
          x,
          y,
          color,
          layerId: activeLayer.id
        })
      }
    })
    
    setPixels(newPixels)
    
    // Create history entry for paste operation
    const operation = historyManagerRef.current.createStrokeOperation(
      'paste',
      activeLayer.id,
      pixelsToAdd.map(p => ({
        x: p.x,
        y: p.y,
        previousColor: pixels.get(`${p.x},${p.y}`)?.color || 'transparent',
        newColor: p.color
      }))
    )
    operation.metadata = {
      pasteBounds: {
        startX: pasteStartX,
        startY: pasteStartY,
        endX: pasteStartX + pasteWidth - 1,
        endY: pasteStartY + pasteHeight - 1
      },
      originalClipboardBounds: clipboard.bounds,
      clipboardContent: clipboard.pixels
    }
    historyManagerRef.current.pushOperation(operation)
    dispatchHistoryChange()
    
    // Create a new selection around the pasted content
    setSelection({
      startPos: { x: pasteStartX, y: pasteStartY },
      currentPos: { x: pasteStartX + pasteWidth - 1, y: pasteStartY + pasteHeight - 1 },
      isActive: true,

      content: clipboard.pixels
    })
  }, [clipboard, activeLayer, pixels, canvasSize])

  // Handle keyboard events for selection management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selection) {
        setSelection(null)
      }
      
      // Copy, cut, and paste operations
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && selection) {
          e.preventDefault()
          handleCopy()
        } else if (e.key === 'x' && selection) {
          e.preventDefault()
          handleCut()
        } else if (e.key === 'v' && clipboard) {
          e.preventDefault()
          handlePaste()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selection, handleCopy, handleCut, handlePaste])

  // Global mouse move handler for select, lasso, and move-selection tools when cursor is outside canvas
  useEffect(() => {
    if (!selection || (selectedTool !== 'select' && selectedTool !== 'lasso' && selectedTool !== 'move-selection') || (!isSelecting && !isLassoing && !isMovingSelection)) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !activeLayer) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / pixelSize)
      const y = Math.floor((e.clientY - rect.top) / pixelSize)
      
      // For move-selection tool, don't allow selection resizing - just track movement
      if (selectedTool === 'move-selection' && isMovingSelection) {
        // Don't modify the selection bounds, just track the movement
        return
      }
      
      // For select and lasso tools, we want to allow the selection to grow even when cursor is outside canvas
      // We'll clamp the visual display but allow the raw coordinates for selection bounds
      const clampedX = Math.max(0, Math.min(x, canvasSize - 1))
      const clampedY = Math.max(0, Math.min(y, canvasSize - 1))
      
      // Update selection with the raw coordinates (for bounds calculation) but clamped for display
      setSelection(prev => prev ? { 
        ...prev, 
        currentPos: { x: clampedX, y: clampedY },
        // Store the raw coordinates for proper bounds calculation
        rawCurrentPos: { x, y }
      } : null)
      
      // For lasso tool, also update the path
      if (selectedTool === 'lasso' && isLassoing) {
        // Only add new point if it's different from the last point to avoid duplicate coordinates
        setLassoPath(prev => {
          const lastPoint = prev[prev.length - 1]
          if (!lastPoint || lastPoint.x !== clampedX || lastPoint.y !== clampedY) {
            // For pixel art, ensure we're creating a proper boundary path
            // Add intermediate points if there's a gap larger than 1 pixel
            if (lastPoint) {
              const dx = Math.abs(clampedX - lastPoint.x)
              const dy = Math.abs(clampedY - lastPoint.y)
              
              // If there's a gap larger than 1 pixel, add intermediate points
              if (dx > 1 || dy > 1) {
                const intermediatePoints = []
                const steps = Math.max(dx, dy)
                
                for (let i = 1; i < steps; i++) {
                  const t = i / steps
                  const interX = Math.round(lastPoint.x + (clampedX - lastPoint.x) * t)
                  const interY = Math.round(lastPoint.y + (clampedY - lastPoint.y) * t)
                  intermediatePoints.push({ x: interX, y: interY })
                }
                
                return [...prev, ...intermediatePoints, { x: clampedX, y: clampedY }]
              }
            }
            
            return [...prev, { x: clampedX, y: clampedY }]
          }
          return prev
        })
      }
    }

    const handleGlobalMouseUp = (_e: MouseEvent) => {
      if (!selection || (selectedTool !== 'select' && selectedTool !== 'lasso' && selectedTool !== 'move-selection') || (!isSelecting && !isLassoing && !isMovingSelection)) return
      
      // Complete the selection when mouse is released anywhere
      setIsDrawing(false)
      setLastPos(null)
      setIsSelecting(false) // Stop selecting
      setIsLassoing(false) // Stop lassoing
      setIsMovingSelection(false) // Stop moving selection
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [selection, selectedTool, isSelecting, isLassoing, isMovingSelection, activeLayer, pixelSize, canvasSize])

  // Initialize canvas when size changes
  useEffect(() => {
    setPixels(new Map())
    setLastPos(null)
    setSelection(null)
    historyManagerRef.current.clear()
    setCurrentDrawingAction({
      tool: 'pencil',
      startPos: null,
      canvasStateBeforeDrawing: null,
      isActive: false
    })
  }, [canvasSize])

  // Clear selection when switching away from select tool
  // REMOVED: Selection now persists across tool changes
  // useEffect(() => {
  //   if (selectedTool !== 'select' && selection) {
  //     setSelection(null)
  //   }
  // }, [selectedTool])

  // Animation loop for selection outlines
  useEffect(() => {
    if (!selection) return

    let animationId: number
    const animate = () => {
      setAnimationTime(prev => (prev + 1) % 60) // Cycle through 60 frames
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [selection])

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

  // Draw rectangle between two points
  const drawRectangle = useCallback((startX: number, startY: number, endX: number, endY: number, color: Color, isFilled: boolean = true) => {
    if (!activeLayer) return new Map(pixels)
    
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)
    
    const newPixels = new Map(pixels)
    
    if (!isFilled) {
      // For border only, we need to draw just the outline
      // Draw top edge
      for (let x = minX; x < maxX; x++) {
        if (x >= 0 && x < canvasSize && minY >= 0 && minY < canvasSize) {
          const key = `${x},${minY}`
          newPixels.set(key, {
            x,
            y: minY,
            color,
            layerId: activeLayer.id
          })
        }
      }
      // Draw bottom edge
      for (let x = minX; x < maxX; x++) {
        if (x >= 0 && x < canvasSize && maxY - 1 >= 0 && maxY - 1 < canvasSize) {
          const key = `${x},${maxY - 1}`
          newPixels.set(key, {
            x,
            y: maxY - 1,
            color,
            layerId: activeLayer.id
          })
        }
      }
      // Draw left edge
      for (let y = minY; y < maxY; y++) {
        if (minX >= 0 && minX < canvasSize && y >= 0 && y < canvasSize) {
          const key = `${minX},${y}`
          newPixels.set(key, {
            x: minX,
            y,
            color,
            layerId: activeLayer.id
          })
        }
      }
      // Draw right edge
      for (let y = minY; y < maxY; y++) {
        if (maxX - 1 >= 0 && maxX - 1 < canvasSize && y >= 0 && y < canvasSize) {
          const key = `${maxX - 1},${y}`
          newPixels.set(key, {
            x: maxX - 1,
            y,
            color,
            layerId: activeLayer.id
          })
        }
      }
    } else {
      // For filled rectangle, fill the entire area
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) continue
          
          const key = `${x},${y}`
          newPixels.set(key, {
            x,
            y,
            color,
            layerId: activeLayer.id
          })
        }
      }
    }
    
    setPixels(newPixels)
    return newPixels
  }, [pixels, activeLayer, canvasSize])

  // Draw circle based on bounding box with improved binary pixel system symmetry
  const drawCircle = useCallback((startX: number, startY: number, endX: number, endY: number, color: Color, isFilled: boolean = true) => {
    if (!activeLayer) return new Map(pixels)
    
    // Calculate center as the middle of the bounding box
    const centerX = Math.floor((startX + endX) / 2)
    const centerY = Math.floor((startY + endY) / 2)
    
    // Calculate radius as the distance from center to any corner of the bounding box
    const radius = Math.max(1, Math.floor(Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2)))
    
    const newPixels = new Map(pixels)
    
    if (isFilled) {
      // Fill the entire circle area
      const minX = Math.max(0, centerX - radius)
      const maxX = Math.min(canvasSize - 1, centerX + radius)
      const minY = Math.max(0, centerY - radius)
      const maxY = Math.min(canvasSize - 1, centerY + radius)
      
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          // Check if this pixel is inside the circle
          const distanceSquared = (x - centerX) ** 2 + (y - centerY) ** 2
          if (distanceSquared <= radius ** 2) {
            const key = `${x},${y}`
            newPixels.set(key, {
              x,
              y,
              color,
              layerId: activeLayer.id
            })
          }
        }
      }
    } else {
      // For border only, use a completely different approach for small circles
      // to ensure proper symmetry in binary pixel systems
      
      // Use the standard midpoint algorithm for all circles
      let x = radius
      let y = 0
      let err = 0
      
      const drawnPixels = new Set<string>()
      
      while (x >= y) {
        // Draw 8 octants
        const points = [
          [centerX + x, centerY + y], [centerX + y, centerY + x],
          [centerX - y, centerY + x], [centerX - x, centerY + y],
          [centerX - x, centerY - y], [centerX - y, centerY - x],
          [centerX + y, centerY - x], [centerX + x, centerY - y]
        ]
        
        for (const [px, py] of points) {
          if (px < 0 || px >= canvasSize || py < 0 || py >= canvasSize) continue
          
          const key = `${px},${py}`
          if (!drawnPixels.has(key)) {
            drawnPixels.add(key)
            newPixels.set(key, {
              x: px,
              y: py,
              color,
              layerId: activeLayer.id
            })
          }
        }
        
        if (err <= 0) {
          y += 1
          err += 2 * y + 1
        }
        if (err > 0) {
          x -= 1
          err -= 2 * x + 1
        }
      }
      
      // For small circles (radius <= 4), ensure cardinal directions have thickness
      if (radius <= 4) {
        const cardinalDirections = [
          [centerX, centerY - radius], // top
          [centerX + radius, centerY], // right
          [centerX, centerY + radius], // bottom
          [centerX - radius, centerY]  // left
        ]
        
        for (const [px, py] of cardinalDirections) {
          if (px < 0 || px >= canvasSize || py < 0 || py >= canvasSize) continue
          
          const key = `${px},${py}`
          if (drawnPixels.has(key)) {
            // Add adjacent pixels to create thickness at cardinal directions
            const adjacentPoints = []
            
            // For top/bottom, add left/right pixels
            if (py === centerY - radius || py === centerY + radius) {
              adjacentPoints.push([px - 1, py], [px + 1, py])
            }
            // For left/right, add top/bottom pixels
            if (px === centerX - radius || px === centerX + radius) {
              adjacentPoints.push([px, py - 1], [px, py + 1])
            }
            
            // Add adjacent pixels if they're within bounds
            for (const [adjX, adjY] of adjacentPoints) {
              if (adjX < 0 || adjX >= canvasSize || adjY < 0 || adjY >= canvasSize) continue
              
              const adjKey = `${adjX},${adjY}`
              if (!drawnPixels.has(adjKey)) {
                drawnPixels.add(adjKey)
                newPixels.set(adjKey, {
                  x: adjX,
                  y: adjY,
                  color,
                  layerId: activeLayer.id
                })
              }
            }
          }
        }
      } else {
        // For larger circles, use the standard midpoint algorithm
        let x = radius
        let y = 0
        let err = 0
        
        const drawnPixels = new Set<string>()
        
        while (x >= y) {
          // Draw 8 octants
          const points = [
            [centerX + x, centerY + y], [centerX + y, centerY + x],
            [centerX - y, centerY + x], [centerX - x, centerY + y],
            [centerX - x, centerY - y], [centerX - y, centerY - x],
            [centerX + y, centerY - x], [centerX + x, centerY - y]
          ]
          
          for (const [px, py] of points) {
            if (px < 0 || px >= canvasSize || py < 0 || py >= canvasSize) continue
            
            const key = `${px},${py}`
            if (!drawnPixels.has(key)) {
              drawnPixels.add(key)
              newPixels.set(key, {
                x: px,
                y: py,
                color,
                layerId: activeLayer.id
              })
            }
          }
          
          if (err <= 0) {
            y += 1
            err += 2 * y + 1
          }
          if (err > 0) {
            x -= 1
            err -= 2 * x + 1
          }
        }
      }
    }
    
    setPixels(newPixels)
    return newPixels
  }, [pixels, activeLayer, canvasSize])

  // Draw line between two points using Bresenham's algorithm
  const drawLine = useCallback((startX: number, startY: number, endX: number, endY: number, color: Color) => {
    if (!activeLayer) return new Map(pixels)
    
    const newPixels = new Map(pixels)
    
    // Use Bresenham's line algorithm
    let x0 = startX
    let y0 = startY
    let x1 = endX
    let y1 = endY
    
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    
    while (true) {
      if (x0 >= 0 && x0 < canvasSize && y0 >= 0 && y0 < canvasSize) {
        const key = `${x0},${y0}`
        const existingPixel = pixels.get(key)
        
        if (color === 'transparent') {
          if (existingPixel) {
            newPixels.delete(key)
          }
        } else {
          newPixels.set(key, {
            x: x0,
            y: y0,
            color,
            layerId: activeLayer.id
          })
        }
      }
      
      if (x0 === x1 && y0 === y1) break
      
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
    }
    
    setPixels(newPixels)
    return newPixels
  }, [pixels, activeLayer, canvasSize])

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
    // Handle selection operations
    if (operation.tool === 'select' && operation.metadata?.selectionBounds) {
      if (reverse) {
        // Undo: clear the selection
        setSelection(null)
      } else {
        // Redo: restore the selection with content
        const bounds = operation.metadata.selectionBounds
        const content = operation.metadata.selectionContent || new Map()
        setSelection({
          startPos: { x: bounds.startX, y: bounds.startY },
          currentPos: { x: bounds.endX, y: bounds.endY },
          isActive: true,
          content: content
        })
      }
      return
    }
    
    // Handle copy operations
    if (operation.tool === 'copy' && operation.metadata?.selectionBounds) {
      if (reverse) {
        // Undo: clear clipboard
        setClipboard(null)
      } else {
        // Redo: restore clipboard (copy operations don't modify pixels)
        // The clipboard state will be restored from the operation metadata
      }
      return
    }
    
    // Handle cut operations
    if (operation.tool === 'cut' && operation.metadata?.selectionBounds) {
      if (reverse) {
        // Undo: restore the cut pixels
        const newPixels = new Map(pixels)
        operation.pixels.forEach(({ x, y, previousColor }) => {
          if (previousColor !== 'transparent') {
            newPixels.set(`${x},${y}`, {
              x,
              y,
              color: previousColor,
              layerId: operation.layerId
            })
          }
        })
        setPixels(newPixels)
        
        // Restore selection
        const bounds = operation.metadata.selectionBounds
        setSelection({
          startPos: { x: bounds.startX, y: bounds.startY },
          currentPos: { x: bounds.endX, y: bounds.endY },
          isActive: true,
          content: new Map() // Initialize content for new selection
        })
      } else {
        // Redo: re-apply the cut (pixels are already removed)
        // Just restore the selection
        const bounds = operation.metadata.selectionBounds
        setSelection({
          startPos: { x: bounds.startX, y: bounds.startY },
          currentPos: { x: bounds.endX, y: bounds.endY },
          isActive: true,
          content: new Map() // Initialize content for new selection
        })
      }
      return
    }

    // Handle paste operations
    if (operation.tool === 'paste' && operation.metadata?.pasteBounds) {
      if (reverse) {
        // Undo: remove the pasted pixels
        const newPixels = new Map(pixels)
        operation.pixels.forEach(({ x, y, previousColor }) => {
          if (previousColor === 'transparent') {
            newPixels.delete(`${x},${y}`)
          } else {
            newPixels.set(`${x},${y}`, {
              x,
              y,
              color: previousColor,
              layerId: operation.layerId
            })
          }
        })
        setPixels(newPixels)
        
        // Clear selection
        setSelection(null)
      } else {
        // Redo: re-apply the paste
        const newPixels = new Map(pixels)
        operation.pixels.forEach(({ x, y, newColor }) => {
          if (newColor === 'transparent') {
            newPixels.delete(`${x},${y}`)
          } else {
            newPixels.set(`${x},${y}`, {
              x,
              y,
              color: newColor,
              layerId: operation.layerId
            })
          }
        })
        setPixels(newPixels)
        
        // Restore selection around pasted content
        const bounds = operation.metadata.pasteBounds
        setSelection({
          startPos: { x: bounds.startX, y: bounds.startY },
          currentPos: { x: bounds.endX, y: bounds.endY },
          isActive: true,
          content: operation.metadata.clipboardContent || new Map()
        })
      }
      return
    }
    
    // Handle template operations
    if (operation.tool === 'template') {
      if (reverse) {
        // Undo: restore previous pixels
        const newPixels = new Map(pixels)
        operation.pixels.forEach(({ x, y, previousColor }) => {
          if (previousColor === 'transparent') {
            newPixels.delete(`${x},${y}`)
          } else {
            newPixels.set(`${x},${y}`, {
              x,
              y,
              color: previousColor,
              layerId: operation.layerId
            })
          }
        })
        setPixels(newPixels)
      } else {
        // Redo: apply template pixels
        const newPixels = new Map(pixels)
        operation.pixels.forEach(({ x, y, newColor }) => {
          if (newColor === 'transparent') {
            newPixels.delete(`${x},${y}`)
          } else {
            newPixels.set(`${x},${y}`, {
              x,
              y,
              color: newColor,
              layerId: operation.layerId
            })
          }
        })
        setPixels(newPixels)
      }
      return
    }
    
    // Handle pixel-based operations
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

  // Template application method
  const applyTemplate = useCallback((templatePixels: Map<string, PixelData>) => {
    // Store the current state for history
    const previousPixels = new Map(pixels)
    
    // Create a proper history entry for the template application
    // We need to record both what was there before AND what the template puts there
    const templateOperation = {
      id: `template-${Date.now()}`,
      tool: 'template' as Tool,
      layerId: activeLayer?.id || 1,
      pixels: [] as Array<{ x: number; y: number; previousColor: Color; newColor: Color }>,
      timestamp: Date.now(),
      metadata: {}
    }
    
    // Record all pixel changes: what was there before vs what the template puts there
    const allPixelChanges = new Set<string>()
    
    // Add all previous pixel positions
    previousPixels.forEach((pixel) => {
      allPixelChanges.add(`${pixel.x},${pixel.y}`)
    })
    
    // Add all template pixel positions
    templatePixels.forEach((pixel) => {
      allPixelChanges.add(`${pixel.x},${pixel.y}`)
    })
    
    // Create the pixel change records
    allPixelChanges.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      const previousPixel = previousPixels.get(key)
      const templatePixel = templatePixels.get(key)
      
      const previousColor = previousPixel ? previousPixel.color : 'transparent'
      const newColor = templatePixel ? templatePixel.color : 'transparent'
      
      if (previousColor !== newColor) {
        templateOperation.pixels.push({
          x,
          y,
          previousColor,
          newColor
        })
      }
    })
    
    // Update internal pixels
    setPixels(templatePixels)
    
    // Add to history
    historyManagerRef.current.pushOperation(templateOperation)
    
    // Notify parent of the change
    if (onPixelsChange) {
      onPixelsChange(templatePixels)
    }
    
    // Dispatch history change event
    dispatchHistoryChange()
  }, [pixels, activeLayer, onPixelsChange, dispatchHistoryChange])

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
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    
    // For select tool, allow starting outside canvas boundaries
    // For other tools, require coordinates to be within bounds
    if (selectedTool !== 'select' && (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize)) return
    
          // For select and lasso tools, always clear existing selection when starting a new one
    if ((selectedTool === 'select' || selectedTool === 'lasso' || selectedTool === 'magic-wand') && selection) {
      setSelection(null)
      setIsSelecting(false) // Stop any active selecting
      setIsLassoing(false) // Stop any active lassoing
      setLassoPath([]) // Clear lasso path
    }
    // For move-selection tool, don't clear selection - just start moving
    else if (selectedTool === 'move-selection' && selection) {
      // Don't clear selection, just start moving
      // This prevents the selection from being resized or cleared
    }
    // For other tools, clear selection if clicking outside the current selection area
    else if (selection) {
      const minX = Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x)
      const maxX = Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x)
      const minY = Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
      const maxY = Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
      
      if (x < minX || x > maxX || y < minY || y > maxY) {
        setSelection(null)
        setIsSelecting(false) // Stop any active selecting
        setIsLassoing(false) // Stop any active lassoing
        setLassoPath([]) // Clear lasso path
      }
    }
    
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
      if (color !== 'transparent' && onPrimaryColorChange) {
        onPrimaryColorChange(color)
      }
      // Eyedropper doesn't create a drawing action, so reset
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else if (selectedTool === 'rectangle-border' || selectedTool === 'rectangle-filled' || selectedTool === 'circle-border' || selectedTool === 'circle-filled' || selectedTool === 'line') {
      // For shape tools, start tracking the shape preview
      setShapePreview({
        tool: selectedTool,
        startPos: { x, y },
        currentPos: { x, y }
      })
      // Don't create a drawing action yet - wait for mouse up
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else if (selectedTool === 'select') {
      // For select tool, start tracking the selection rectangle
      // Clamp coordinates to canvas boundaries for selection tool
      const clampedX = Math.max(0, Math.min(x, canvasSize - 1))
      const clampedY = Math.max(0, Math.min(y, canvasSize - 1))
      setSelection({
        startPos: { x: clampedX, y: clampedY },
        currentPos: { x: clampedX, y: clampedY },
        rawCurrentPos: { x: clampedX, y: clampedY }, // Initialize raw coordinates
        isActive: true,
        content: new Map() // Initialize content for new selection
      })
      setIsSelecting(true) // Start actively selecting
      // Don't create a drawing action - selection is just visual
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else if (selectedTool === 'lasso') {
      // For lasso tool, start tracking the free-form selection path
      const clampedX = Math.max(0, Math.min(x, canvasSize - 1))
      const clampedY = Math.max(0, Math.min(y, canvasSize - 1))
      setSelection({
        startPos: { x: clampedX, y: clampedY },
        currentPos: { x: clampedX, y: clampedY },
        rawCurrentPos: { x: clampedX, y: clampedY }, // Initialize raw coordinates
        isActive: true,
        content: new Map() // Initialize content for new selection
      })
      setIsLassoing(true) // Start actively lassoing
      // Start the lasso path with pixel-perfect coordinates
      setLassoPath([{ x: clampedX, y: clampedY }])
      // Don't create a drawing action - lasso is just visual
      setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
    } else if (selectedTool === 'magic-wand') {
      // For magic wand tool, select adjacent pixels of the same color
      const clampedX = Math.max(0, Math.min(x, canvasSize - 1))
      const clampedY = Math.max(0, Math.min(y, canvasSize - 1))
      const targetColor = getColorAt(clampedX, clampedY)
      
      // Use flood fill algorithm to find all adjacent pixels of the same color
      const selectedPixels = magicWandSelect(clampedX, clampedY, targetColor)
      
      if (selectedPixels.size > 0) {
        // For magic wand, we need to create a selection that represents the actual pixels
        // rather than just a bounding rectangle. We'll use the first pixel as start and
        // create a special selection type that the rendering system can handle.
        
        // Find the bounds of the selected pixels
        let minX = clampedX, maxX = clampedX, minY = clampedY, maxY = clampedY
        selectedPixels.forEach((pixel: PixelData) => {
          minX = Math.min(minX, pixel.x)
          maxX = Math.max(maxX, pixel.x)
          minY = Math.min(minY, pixel.y)
          maxY = Math.max(maxY, pixel.y)
        })
        
        // Create a selection that covers the actual selected pixels
        setSelection({
          startPos: { x: minX, y: minY },
          currentPos: { x: maxX, y: maxY },
          rawCurrentPos: { x: maxX, y: maxY },
          isActive: true,
          content: selectedPixels
        })
        setIsSelecting(false) // Magic wand doesn't need active selecting
        setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
      }
    } else if (selectedTool === 'move-selection') {
      // For move-selection tool, check if we have an active selection
      if (selection) {
        // Start moving the selection
        setIsMovingSelection(true)
        setMoveStartPos({ x, y })
        setMoveOffset({ x: 0, y: 0 })
        // Don't create a drawing action - moving is handled separately
        setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
        // Don't set isDrawing to true for move-selection to prevent conflicts
        setIsDrawing(false)
      } else {
        // No selection to move, don't do anything
        setCurrentDrawingAction(prev => ({ ...prev, isActive: false }))
      }
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
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    
    // Handle move-selection tool first (it doesn't require isDrawing or lastPos)
    if (isMovingSelection && moveStartPos && selection) {
      const offsetX = x - moveStartPos.x
      const offsetY = y - moveStartPos.y
      setMoveOffset({ x: offsetX, y: offsetY })
      return
    }
    
    // For other tools, require isDrawing and lastPos
    if (!isDrawing || !lastPos || !activeLayer) return
    
    // For non-select tools, require coordinates to be within bounds
    if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) return
    
    // Handle shape preview updates
    if (shapePreview && (selectedTool === 'rectangle-border' || selectedTool === 'rectangle-filled' || selectedTool === 'circle-border' || selectedTool === 'circle-filled' || selectedTool === 'line')) {
      setShapePreview(prev => prev ? { ...prev, currentPos: { x, y } } : null)
      return
    }
    

    
    // Handle drawing tools (pencil, eraser)
    if (currentDrawingAction.isActive && (selectedTool === 'pencil' || selectedTool === 'eraser')) {
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
    
    // Handle shape completion
    if (shapePreview) {
      const { tool, startPos, currentPos } = shapePreview
      
      // Capture canvas state BEFORE drawing the shape
      const canvasStateBeforeDrawing = new Map(pixels)
      
      // Create a drawing action for the shape
      const drawingAction = {
        tool,
        startPos: startPos,
        canvasStateBeforeDrawing,
        isActive: true
      }
      
      // Draw the shape and capture the new pixels
      let newPixels: Map<string, PixelData>
      
      if (tool === 'rectangle-border' || tool === 'rectangle-filled') {
        newPixels = drawRectangle(startPos.x, startPos.y, currentPos.x, currentPos.y, primaryColor, tool === 'rectangle-filled')
      } else if (tool === 'circle-border' || tool === 'circle-filled') {
        newPixels = drawCircle(startPos.x, startPos.y, currentPos.x, currentPos.y, primaryColor, tool === 'circle-filled')
      } else if (tool === 'line') {
        newPixels = drawLine(startPos.x, startPos.y, currentPos.x, currentPos.y, primaryColor)
      } else {
        newPixels = new Map(pixels)
      }
      
      // Complete the drawing action and create history entry
      if (drawingAction.canvasStateBeforeDrawing && newPixels) {
        const initialPixels = drawingAction.canvasStateBeforeDrawing
        const finalPixels = newPixels
        
        // Calculate the differences between initial and final states
        const pixelChanges: Array<{
          x: number
          y: number
          previousColor: Color
          newColor: Color
        }> = []
        
        // Check all pixels in the final state
        finalPixels.forEach((pixel, _key) => {
          const initialPixel = initialPixels.get(_key)
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
        initialPixels.forEach((pixel, _key) => {
          if (!finalPixels.has(_key)) {
            pixelChanges.push({
              x: pixel.x,
              y: pixel.y,
              previousColor: pixel.color,
              newColor: 'transparent'
            })
          }
        })
        
        if (pixelChanges.length > 0) {
          // Capture the current canvas state after the operation
          const canvasSnapshot = new Map(pixels)
          
          const operation = historyManagerRef.current.createStrokeOperation(
            currentDrawingAction.tool,
            activeLayer!.id,
            pixelChanges,
            canvasSnapshot
          )
          historyManagerRef.current.pushOperation(operation)
          dispatchHistoryChange() // Dispatch history change event
          
          // If there's an active selection and we drew within it, update selection history
          if (selection && activeLayer) {
            const bounds = {
              startX: Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
              startY: Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y),
              endX: Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
              endY: Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
            }
            
            // Check if any pixels were drawn within the selection bounds
            const hasDrawnInSelection = pixelChanges.some(({ x, y }) => 
              x >= bounds.startX && x < bounds.endX + 1 &&
              y >= bounds.startY && y < bounds.endY + 1
            )
            
            if (hasDrawnInSelection) {
              // Capture the new content within the selection after drawing
              const newSelectionContent = new Map<string, PixelData>()
              pixels.forEach((pixel, _key) => {
                if (pixel.x >= bounds.startX && pixel.x < bounds.endX + 1 &&
                    pixel.y >= bounds.startY && pixel.y < bounds.endY + 1 &&
                    pixel.layerId === activeLayer.id) {
                  // Store relative coordinates for the selection content
                  const relativeX = pixel.x - bounds.startX
                  const relativeY = pixel.y - bounds.startY
                  const relativeKey = `${relativeX},${relativeY}`
                  newSelectionContent.set(relativeKey, {
                    ...pixel,
                    x: relativeX,
                    y: relativeY
                  })
                }
              })
              
              // Create a new selection history entry to reflect the updated content
              const selectionOperation = historyManagerRef.current.createStrokeOperation(
                'select',
                activeLayer.id,
                [] // No pixel changes for selections
              )
              selectionOperation.metadata = {
                selectionBounds: bounds,
                selectionContent: newSelectionContent
              }
              historyManagerRef.current.pushOperation(selectionOperation)
              dispatchHistoryChange()
              
              // Update the selection with new content
              setSelection(prev => prev ? {
                ...prev,
                content: newSelectionContent
              } : null)
            }
          }
        }
      }
      
      // Clear shape preview
      setShapePreview(null)
    }
    
    // Handle selection completion
    if (selection && selectedTool === 'select') {
      // Calculate current selection bounds using raw coordinates - maintain original size
      const selectionBounds = {
        startX: Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
        startY: Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y),
        endX: Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
        endY: Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
      }
      
      // For pixel content, we need to clamp to canvas boundaries since we can only select existing pixels
      // But the selection bounds themselves should maintain their size
      const pixelContentBounds = {
        startX: Math.max(0, selectionBounds.startX),
        startY: Math.max(0, selectionBounds.startY),
        endX: Math.min(canvasSize - 1, selectionBounds.endX),
        endY: Math.min(canvasSize - 1, selectionBounds.endY)
      }
      
      // Capture the actual pixel content within the selection (clamped to canvas)
      const selectionContent = new Map<string, PixelData>()
      pixels.forEach((pixel, _key) => {
        if (pixel.x >= pixelContentBounds.startX && pixel.x < pixelContentBounds.endX + 1 &&
            pixel.y >= pixelContentBounds.startY && pixel.y < pixelContentBounds.endY + 1 &&
            pixel.layerId === activeLayer!.id) {
          // Store relative coordinates for the selection content
          const relativeX = pixel.x - pixelContentBounds.startX
          const relativeY = pixel.y - pixelContentBounds.startY
          const relativeKey = `${relativeX},${relativeY}`
          selectionContent.set(relativeKey, {
            ...pixel,
            x: relativeX,
            y: relativeY
          })
        }
      })
      
      // Update the selection with the original bounds (maintaining size) and pixel content
      setSelection(prev => prev ? {
        ...prev,
        currentPos: { x: selection.rawCurrentPos?.x ?? selection.currentPos.x, y: selection.rawCurrentPos?.y ?? selection.currentPos.y },
        content: selectionContent
      } : null)
      
      // Keep the selection persistent - don't clear it
      // The selection will remain visible until explicitly cleared
      // In the future, this could trigger copy/cut operations or other selection-based actions
    }
    
    // Complete the drawing action and create history entry for other tools
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
      finalPixels.forEach((pixel, _key) => {
        const initialPixel = initialPixels.get(_key)
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
      initialPixels.forEach((pixel, _key) => {
        if (!finalPixels.has(_key)) {
          pixelChanges.push({
            x: pixel.x,
            y: pixel.y,
            previousColor: pixel.color,
            newColor: 'transparent'
          })
        }
      })
      
      if (pixelChanges.length > 0) {
        // Capture the current canvas state after the operation
        const canvasSnapshot = new Map(pixels)
        
        const operation = historyManagerRef.current.createStrokeOperation(
          currentDrawingAction.tool,
          activeLayer!.id,
          pixelChanges,
          canvasSnapshot
        )
        historyManagerRef.current.pushOperation(operation)
        dispatchHistoryChange() // Dispatch history change event
        
        // If there's an active selection and we drew within it, update selection history
        if (selection && activeLayer) {
          const bounds = {
            startX: Math.min(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
            startY: Math.min(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y),
            endX: Math.max(selection.startPos.x, selection.rawCurrentPos?.x ?? selection.currentPos.x),
            endY: Math.max(selection.startPos.y, selection.rawCurrentPos?.y ?? selection.currentPos.y)
          }
          
          // Check if any pixels were drawn within the selection bounds
          const hasDrawnInSelection = pixelChanges.some(({ x, y }) => 
            x >= bounds.startX && x < bounds.endX + 1 &&
            y >= bounds.startY && y < bounds.endY + 1
          )
          
          if (hasDrawnInSelection) {
            // Capture the new content within the selection after drawing
            const newSelectionContent = new Map<string, PixelData>()
            pixels.forEach((pixel, _key) => {
              if (pixel.x >= bounds.startX && pixel.x < bounds.endX + 1 &&
                  pixel.y >= bounds.startY && pixel.y < bounds.endY + 1 &&
                  pixel.layerId === activeLayer.id) {
                // Store relative coordinates for the selection content
                const relativeX = pixel.x - bounds.startX
                const relativeY = pixel.y - bounds.startY
                const relativeKey = `${relativeX},${relativeY}`
                newSelectionContent.set(relativeKey, {
                  ...pixel,
                  x: relativeX,
                  y: relativeY
                })
              }
            })
            
            // Create a new selection history entry to reflect the updated content
            const selectionOperation = historyManagerRef.current.createStrokeOperation(
              'select',
              activeLayer.id,
              [] // No pixel changes for selections
            )
            selectionOperation.metadata = {
              selectionBounds: bounds,
              selectionContent: newSelectionContent
            }
            historyManagerRef.current.pushOperation(selectionOperation)
            dispatchHistoryChange()
            
            // Update the selection with new content
            setSelection(prev => prev ? {
              ...prev,
              content: newSelectionContent
            } : null)
          }
        }
      }
    }
    
    // Handle move-selection completion
    if (isMovingSelection && moveStartPos && selection && (moveOffset.x !== 0 || moveOffset.y !== 0)) {
      // Calculate the new position for the selection
      const newStartX = Math.max(0, Math.min(canvasSize - 1, selection.startPos.x + moveOffset.x))
      const newStartY = Math.max(0, Math.min(canvasSize - 1, selection.startPos.y + moveOffset.y))
      
      // Calculate the new end position
      const currentEndX = selection.rawCurrentPos?.x ?? selection.currentPos.x
      const currentEndY = selection.rawCurrentPos?.y ?? selection.currentPos.y
      const newEndX = Math.max(0, Math.min(canvasSize - 1, currentEndX + moveOffset.x))
      const newEndY = Math.max(0, Math.min(canvasSize - 1, currentEndY + moveOffset.y))
      
      // Create a new map for the moved pixels
      const newPixels = new Map(pixels)
      
      // Remove pixels from the original selection area
      const originalBounds = {
        startX: Math.min(selection.startPos.x, currentEndX),
        startY: Math.min(selection.startPos.y, currentEndY),
        endX: Math.max(selection.startPos.x, currentEndX),
        endY: Math.max(selection.startPos.y, currentEndY)
      }
      
      // Remove original pixels
      for (let x = originalBounds.startX; x <= originalBounds.endX; x++) {
        for (let y = originalBounds.startY; y <= originalBounds.endY; y++) {
          const key = `${x},${y}`
          newPixels.delete(key)
        }
      }
      
      // Add pixels to the new location
      selection.content.forEach((pixelData, relativeKey) => {
        const [relativeX, relativeY] = relativeKey.split(',').map(Number)
        const newX = newStartX + relativeX
        const newY = newStartY + relativeY
        
        // Only add if within canvas bounds
        if (newX >= 0 && newX < canvasSize && newY >= 0 && newY < canvasSize) {
          const key = `${newX},${newY}`
          newPixels.set(key, {
            ...pixelData,
            x: newX,
            y: newY
          })
        }
      })
      
      // Update pixels
      setPixels(newPixels)
      
      // Create history entry for the move operation
      const pixelChanges: Array<{
        x: number
        y: number
        previousColor: Color
        newColor: Color
      }> = []
      
      // Calculate changes (removed pixels)
      pixels.forEach((pixel, _key) => {
        if (pixel.x >= originalBounds.startX && pixel.x <= originalBounds.endX &&
            pixel.y >= originalBounds.startY && pixel.y <= originalBounds.endY) {
          pixelChanges.push({
            x: pixel.x,
            y: pixel.y,
            previousColor: pixel.color,
            newColor: 'transparent'
          })
        }
      })
      
      // Calculate changes (added pixels)
      selection.content.forEach((pixelData, relativeKey) => {
        const [relativeX, relativeY] = relativeKey.split(',').map(Number)
        const newX = newStartX + relativeX
        const newY = newStartY + relativeY
        
        if (newX >= 0 && newX < canvasSize && newY >= 0 && newY < canvasSize) {
          pixelChanges.push({
            x: newX,
            y: newY,
            previousColor: 'transparent',
            newColor: pixelData.color
          })
        }
      })
      
      if (pixelChanges.length > 0) {
        // Capture the current canvas state after the operation
        const canvasSnapshot = new Map(pixels)
        
        const operation = historyManagerRef.current.createStrokeOperation(
          'move-selection',
          activeLayer!.id,
          pixelChanges,
          canvasSnapshot
        )
        historyManagerRef.current.pushOperation(operation)
        dispatchHistoryChange()
      }
      
      // Update selection position
      setSelection(prev => prev ? {
        ...prev,
        startPos: { x: newStartX, y: newStartY },
        currentPos: { x: newEndX, y: newEndY },
        rawCurrentPos: { x: newEndX, y: newEndY }
      } : null)
    }
    
    // Reset move-selection state
    setIsMovingSelection(false)
    setMoveStartPos(null)
    setMoveOffset({ x: 0, y: 0 })
    
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
    
    // Draw shape preview
    if (shapePreview) {
      const { tool, startPos, currentPos } = shapePreview
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.7
      
      if (tool === 'rectangle-border' || tool === 'rectangle-filled') {
        const minX = Math.min(startPos.x, currentPos.x) * pixelSize
        const maxX = Math.max(startPos.x, currentPos.x) * pixelSize
        const minY = Math.min(startPos.y, currentPos.y) * pixelSize
        const maxY = Math.max(startPos.y, currentPos.y) * pixelSize
        
        if (tool === 'rectangle-filled') {
          ctx.fillStyle = primaryColor
          ctx.globalAlpha = 0.3
          ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
          ctx.globalAlpha = 0.7
        }
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      } else if (tool === 'circle-border' || tool === 'circle-filled') {
        // Draw bounding box preview
        const minX = Math.min(startPos.x, currentPos.x) * pixelSize
        const maxX = Math.max(startPos.x, currentPos.x) * pixelSize
        const minY = Math.min(startPos.y, currentPos.y) * pixelSize
        const maxY = Math.max(startPos.y, currentPos.y) * pixelSize
        
        // Draw rectangle outline
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
        
        // Draw circle preview inside the bounding box
        const centerX = Math.floor((startPos.x + currentPos.x) / 2) * pixelSize
        const centerY = Math.floor((startPos.y + currentPos.y) / 2) * pixelSize
        const radius = Math.max(1, Math.sqrt((currentPos.x - centerX / pixelSize) ** 2 + (currentPos.y - centerY / pixelSize) ** 2)) * pixelSize
        
        if (tool === 'circle-filled') {
          ctx.fillStyle = primaryColor
          ctx.globalAlpha = 0.3
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = 0.7
        }
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === 'line') {
        ctx.beginPath()
        ctx.moveTo(startPos.x * pixelSize, startPos.y * pixelSize)
        ctx.lineTo(currentPos.x * pixelSize, currentPos.y * pixelSize)
        ctx.stroke()
      }
      
      ctx.globalAlpha = 1.0
    }
    
    // Draw selection rectangle or lasso path
    if (selection) {
      const { startPos, currentPos, rawCurrentPos } = selection
      ctx.strokeStyle = '#1e3a8a' // Dark blue selection outline
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.8
      
      if (selectedTool === 'lasso' && lassoPath.length > 1) {
        // Draw lasso path with animated dashed lines
        ctx.beginPath()
        
        // Start at the first point, ensuring pixel-perfect positioning
        const startX = Math.round(lassoPath[0].x * pixelSize)
        const startY = Math.round(lassoPath[0].y * pixelSize)
        ctx.moveTo(startX, startY)
        
        // Draw lines to each subsequent point
        for (let i = 1; i < lassoPath.length; i++) {
          const x = Math.round(lassoPath[i].x * pixelSize)
          const y = Math.round(lassoPath[i].y * pixelSize)
          ctx.lineTo(x, y)
        }
        
        // Close the path if it's long enough to form a proper selection
        if (lassoPath.length > 2) {
          ctx.closePath()
        }
        
                  // Apply animated dashed line style
          if (ctx.setLineDash) {
            const dashOffset = (animationTime * 0.5) % 10 // Move dash pattern more slowly
            ctx.setLineDash([5, 5])
            ctx.lineDashOffset = dashOffset
            ctx.stroke()
            ctx.setLineDash([]) // Reset to solid line
            ctx.lineDashOffset = 0 // Reset dash offset
          } else {
            // Fallback to solid line if setLineDash is not supported
            ctx.stroke()
          }
      } else if (selectedTool === 'magic-wand' && selection.content && selection.content.size > 0) {
        // For magic wand, highlight the actual selected pixels with individual outlines
        // First draw a subtle highlight of the selected pixels
        ctx.globalAlpha = 0.3
        ctx.fillStyle = '#1e3a8a'
        
        selection.content.forEach((pixelData) => {
          const pixelX = pixelData.x * pixelSize
          const pixelY = pixelData.y * pixelSize
          ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize)
        })
        
        // Now draw an outline around each selected pixel with animated dashed lines
        ctx.globalAlpha = 0.8
        ctx.strokeStyle = '#1e3a8a'
        ctx.lineWidth = 1
        
        // Use animated dashed lines for the pixel outlines
        if (ctx.setLineDash) {
          const dashOffset = (animationTime * 0.5) % 10
          ctx.setLineDash([3, 3])
          ctx.lineDashOffset = dashOffset
        }
        
        // Draw outline around each selected pixel
        selection.content.forEach((pixelData) => {
          const pixelX = pixelData.x * pixelSize
          const pixelY = pixelData.y * pixelSize
          ctx.strokeRect(pixelX, pixelY, pixelSize, pixelSize)
        })
        
        if (ctx.setLineDash) {
          ctx.setLineDash([])
          ctx.lineDashOffset = 0
        }
      } else {
        // Draw selection rectangle with animated dashed lines
        // Calculate bounds using raw coordinates but clamp to canvas boundaries for display
        // For visual representation, we extend to canvasSize to fully cover the last pixel
        const actualCurrentPos = rawCurrentPos || currentPos
        const minX = Math.max(0, Math.min(startPos.x, actualCurrentPos.x)) * pixelSize
        const maxX = Math.min(canvasSize, Math.max(startPos.x, actualCurrentPos.x)) * pixelSize
        const minY = Math.max(0, Math.min(startPos.y, actualCurrentPos.y)) * pixelSize
        const maxY = Math.min(canvasSize, Math.max(startPos.y, actualCurrentPos.y)) * pixelSize
        
        // Draw selection rectangle with animated dashed lines
        if (ctx.setLineDash) {
          const dashOffset = (animationTime * 0.5) % 10 // Move dash pattern more slowly
          ctx.setLineDash([5, 5])
          ctx.lineDashOffset = dashOffset
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
          ctx.setLineDash([]) // Reset to solid line
          ctx.lineDashOffset = 0 // Reset dash offset
        } else {
          // Fallback to solid line if setLineDash is not supported
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
        }
      }
      
      ctx.globalAlpha = 1.0
    }
    
    // Draw move-selection preview
    if (isMovingSelection && selection && (moveOffset.x !== 0 || moveOffset.y !== 0)) {
      const { startPos, currentPos, rawCurrentPos, content } = selection
      const actualCurrentPos = rawCurrentPos || currentPos
      
      // Calculate the preview position
      const previewStartX = Math.max(0, Math.min(canvasSize - 1, startPos.x + moveOffset.x))
      const previewStartY = Math.max(0, Math.min(canvasSize - 1, startPos.y + moveOffset.y))
      const previewEndX = Math.max(0, Math.min(canvasSize - 1, actualCurrentPos.x + moveOffset.x))
      const previewEndY = Math.max(0, Math.min(canvasSize - 1, actualCurrentPos.y + moveOffset.y))
      
      // Draw preview selection rectangle
      ctx.strokeStyle = '#00ff00' // Green preview outline
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      
      const minX = Math.min(previewStartX, previewEndX) * pixelSize
      const maxX = Math.max(previewStartX, previewEndX) * pixelSize
      const minY = Math.min(previewStartY, previewEndY) * pixelSize
      const maxY = Math.max(previewStartY, previewEndY) * pixelSize
      
      // Draw preview rectangle with dashed lines
      if (ctx.setLineDash) {
        const dashOffset = (animationTime * 0.5) % 10
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = dashOffset
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
        ctx.setLineDash([])
        ctx.lineDashOffset = 0
      } else {
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      }
      
      // Draw preview of actual pixel content
      if (content && content.size > 0) {
        ctx.globalAlpha = 0.7 // Slightly more opaque for pixel preview
        
        // Draw each pixel in the preview location
        content.forEach((pixelData, relativeKey) => {
          const [relativeX, relativeY] = relativeKey.split(',').map(Number)
          const previewX = previewStartX + relativeX
          const previewY = previewStartY + relativeY
          
          // Only draw if within canvas bounds
          if (previewX >= 0 && previewX < canvasSize && previewY >= 0 && previewY < canvasSize) {
            const pixelX = previewX * pixelSize
            const pixelY = previewY * pixelSize
            
            // Draw the pixel with its color
            if (pixelData.color !== 'transparent') {
              ctx.fillStyle = pixelData.color
              ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize)
            }
          }
        })
        
        // Draw pixel grid for the preview
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.3
        
        for (let x = previewStartX; x <= previewEndX; x++) {
          for (let y = previewStartY; y <= previewEndY; y++) {
            const pixelX = x * pixelSize
            const pixelY = y * pixelSize
            ctx.strokeRect(pixelX, pixelY, pixelSize, pixelSize)
          }
        }
      }
      
      ctx.globalAlpha = 1.0
    }
  }, [pixels, layers, canvasSize, pixelSize, gridSettings.visible, gridSettings.color, gridSettings.opacity, gridSettings.quarter, gridSettings.eighths, gridSettings.sixteenths, gridSettings.thirtyseconds, gridSettings.sixtyfourths, shapePreview, primaryColor, selection, selectedTool, lassoPath, animationTime, isMovingSelection, moveOffset])

  // Get history state
  const getHistoryState = useCallback(() => {
    return historyManagerRef.current.getState()
  }, [])

  // Expose canvas methods to parent
  useEffect(() => {
    // Call onCanvasRef to pass the canvas reference to parent
    if (onCanvasRef && canvasRef.current) {
      onCanvasRef(canvasRef)
    }
    
    if (onCanvasRef && canvasRef.current) {
      // Expose undo/redo methods
      Object.defineProperty(canvasRef.current, 'undo', {
        value: undo,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'redo', {
        value: redo,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'canUndo', {
        value: canUndo,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'canRedo', {
        value: canRedo,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'getHistoryState', {
        value: getHistoryState,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'applyTemplate', {
        value: applyTemplate,
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'getCurrentPixels', {
        value: () => new Map(pixels),
        writable: true
      })
      Object.defineProperty(canvasRef.current, 'getCanvasSize', {
        value: () => canvasSize,
        writable: true
      })
    }
  }, [onCanvasRef, undo, redo, canUndo, canRedo, getHistoryState, applyTemplate, pixels, canvasSize])

  // Magic wand selection - find all adjacent pixels of the same color
  const magicWandSelect = useCallback((startX: number, startY: number, targetColor: Color): Map<string, PixelData> => {
    const selectedPixels = new Map<string, PixelData>()
    const visited = new Set<string>()
    const stack: [number, number][] = [[startX, startY]]
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key)) continue
      visited.add(key)
      
      // Check if current position matches target color
      const currentPixel = pixels.get(key)
      const currentColor = currentPixel ? currentPixel.color : 'transparent'
      
      if (currentColor !== targetColor) continue
      
      // Add this pixel to selection
      if (currentPixel) {
        selectedPixels.set(key, currentPixel)
      }
      
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
    
    return selectedPixels
  }, [pixels, canvasSize])

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
