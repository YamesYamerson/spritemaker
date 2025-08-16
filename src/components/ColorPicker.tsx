import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Color } from '../types'
import { 
  hsvToRgb, 
  rgbToHsv, 
  createSafeGradient, 
  safeFillRect, 
  isValidHexColor 
} from '../utils/colorUtils'

// Function to determine if text should be black or white based on background color
const getContrastTextColor = (backgroundColor: string): string => {
  // Handle transparent colors
  if (backgroundColor === 'transparent') {
    return '#000'
  }
  
  // Handle rgba colors
  if (backgroundColor.startsWith('rgba')) {
    const rgbaMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1])
      const g = parseInt(rgbaMatch[2])
      const b = parseInt(rgbaMatch[3])
      // Calculate perceived brightness using luminance formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5 ? '#000' : '#fff'
    }
  }
  
  // Handle hex colors
  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    // Calculate perceived brightness using luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000' : '#fff'
  }
  
  // Default to black for unknown color formats
  return '#000'
}

interface ColorPickerProps {
  primaryColor: Color
  onPrimaryColorChange: (color: Color) => void
  secondaryColor: Color
  onSecondaryColorChange: (color: Color) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange
}) => {
  // Use simple state instead of refs to avoid complexity
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [value, setValue] = useState(100)
  const [alpha, setAlpha] = useState(1)
  const [currentColor, setCurrentColor] = useState(primaryColor)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'gradient' | 'hue' | 'alpha' | null>(null)

  const gradientRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)
  const alphaRef = useRef<HTMLCanvasElement>(null)

  // Default color palette (similar to Aseprite) - memoized to prevent recreation
  const defaultColors: Color[] = useMemo(() => [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
    '#00ff80', '#ff0080', '#808000', '#800080', '#008080',
    '#808080', '#404040', '#c0c0c0', '#e0e0e0', '#a0a0a0',
    '#8b4513', '#006400', '#4b0082', '#ff1493', '#00ced1',
    '#ffd700', '#32cd32', '#ff6347', '#9370db', '#20b2aa'
  ], [])

  // Initialize HSV from primary color only when it changes externally
  useEffect(() => {
    try {
      const hsv = rgbToHsv(primaryColor)
      setHue(hsv.h)
      setSaturation(hsv.s)
      setValue(hsv.v)
      // Note: alpha is not part of hex colors, so we keep the current alpha value
    } catch (error) {
      console.warn('Failed to convert color to HSV:', error)
      // Set default values if conversion fails
      setHue(0)
      setSaturation(100)
      setValue(100)
    }
  }, [primaryColor])

  // Update internal state when primaryColor prop changes
  const updateHSVFromColor = useCallback((color: string) => {
    try {
      const hsv = rgbToHsv(color)
      setHue(hsv.h)
      setSaturation(hsv.s)
      setValue(hsv.v)
      setCurrentColor(color)
    } catch (error) {
      console.warn('Failed to convert color to HSV:', error)
    }
  }, [])

  useEffect(() => {
    if (primaryColor && primaryColor !== currentColor) {
      updateHSVFromColor(primaryColor)
    }
  }, [primaryColor, currentColor, updateHSVFromColor])

  // Stable callback for color changes
  const handleColorChange = useCallback((newColor: Color) => {
    onPrimaryColorChange(newColor)
  }, [onPrimaryColorChange])


  // Draw gradient canvas - only when hue changes
  useEffect(() => {
    const canvas = gradientRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas first
    ctx.clearRect(0, 0, width, height)
    
    // Create saturation/value gradient
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const s = (x / width) * 100
        const v = ((height - y) / height) * 100
        
        try {
          const color = hsvToRgb(hue, s, v)
          safeFillRect(ctx, x, y, 1, 1, color)
        } catch (error) {
          // Fallback to a safe color if conversion fails
          safeFillRect(ctx, x, y, 1, 1, '#000000')
        }
      }
    }
  }, [hue])

  // Draw hue bar - only once on mount
  useEffect(() => {
    const canvas = hueRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas first
    ctx.clearRect(0, 0, width, height)
    
    for (let x = 0; x < width; x++) {
      const h = (x / width) * 360
      
      try {
        const color = hsvToRgb(h, 100, 100)
        safeFillRect(ctx, x, 0, 1, height, color)
      } catch (error) {
        // Fallback to a safe color if conversion fails
        safeFillRect(ctx, x, 0, 1, height, '#000000')
      }
    }
  }, []) // Empty dependency array - only run once

  // Draw alpha bar - only when HSV changes
  useEffect(() => {
    const canvas = alphaRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas first
    ctx.clearRect(0, 0, width, height)
    
    // Draw checkerboard background pattern
    const checkerSize = 8
    for (let x = 0; x < width; x += checkerSize) {
      for (let y = 0; y < height; y += checkerSize) {
        const isEven = ((x / checkerSize) + (y / checkerSize)) % 2 === 0
        ctx.fillStyle = isEven ? '#ccc' : '#fff'
        ctx.fillRect(x, y, checkerSize, height - y < checkerSize ? height - y : checkerSize)
      }
    }
    
    try {
      // Create alpha gradient from transparent to full color
      const gradient = createSafeGradient(ctx, 0, 0, width, 0, [
        { offset: 0, color: 'transparent' },
        { offset: 1, color: hsvToRgb(hue, saturation, value) }
      ])
      
      if (gradient) {
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      } else {
        // Fallback to solid color if gradient creation fails
        const color = hsvToRgb(hue, saturation, value)
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
      }
    } catch (error) {
      console.warn('Failed to create alpha gradient:', error)
      // Fallback to solid color
      try {
        const color = hsvToRgb(hue, saturation, value)
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
      } catch (fallbackError) {
        // Final fallback
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, width, height)
      }
    }
  }, [hue, saturation, value, alpha])

  // Handle canvas clicks
  const handleGradientClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate saturation (0-100) from x position
    const s = Math.max(0, Math.min(100, (x / rect.width) * 100))
    // Calculate value (0-100) from y position (inverted since y=0 is at top)
    const v = Math.max(0, Math.min(100, ((rect.height - y) / rect.height) * 100))
    
    setHue(hue)
    setSaturation(s)
    setValue(v)
    
    try {
      const newColor = hsvToRgb(hue, s, v)
      handleColorChange(newColor)
    } catch (error) {
      console.warn('Failed to convert HSV to RGB in gradient click:', error)
    }
  }, [hue, handleColorChange])

  const handleHueClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Calculate hue (0-360) from x position
    const h = Math.max(0, Math.min(360, (x / rect.width) * 360))
    
    setHue(h)
    setSaturation(saturation)
    setValue(value)
    
    try {
      const newColor = hsvToRgb(h, saturation, value)
      handleColorChange(newColor)
    } catch (error) {
      console.warn('Failed to convert HSV to RGB in hue click:', error)
    }
  }, [saturation, value, handleColorChange])

  const handleAlphaClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Calculate alpha value (0-1) from x position
    const newAlpha = Math.max(0, Math.min(1, x / rect.width))
    
    setAlpha(newAlpha)
    
    try {
      const newColor = hsvToRgb(hue, saturation, value)
      handleColorChange(newColor)
    } catch (error) {
      console.warn('Failed to convert HSV to RGB in alpha click:', error)
    }
  }, [hue, saturation, value, handleColorChange])

  // Handle initial clicks when mouse down occurs
  const handleInitialClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>, type: 'gradient' | 'hue' | 'alpha') => {
    if (type === 'gradient') {
      handleGradientClick(e)
    } else if (type === 'alpha') {
      handleAlphaClick(e)
    } else if (type === 'hue') {
      handleHueClick(e)
    }
  }, [handleGradientClick, handleHueClick, handleAlphaClick])

  // Mouse event handlers for drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>, type: 'gradient' | 'hue' | 'alpha') => {
    setIsDragging(true)
    setDragType(type)
    e.preventDefault()
    
    // Handle the initial click
    handleInitialClick(e, type)
  }, [handleInitialClick])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragType) return
    
    if (dragType === 'gradient') {
      handleGradientClick(e)
    } else if (dragType === 'hue') {
      handleHueClick(e)
    } else if (dragType === 'alpha') {
      handleAlphaClick(e)
    }
  }, [isDragging, dragType, handleGradientClick, handleHueClick, handleAlphaClick])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  // Global mouse up handler to ensure drag stops even if mouse leaves canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setDragType(null)
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  // Handle hex input changes
  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (isValidHexColor(value)) {
      handleColorChange(value)
      try {
        const hsv = rgbToHsv(value)
        setHue(hsv.h)
        setSaturation(hsv.s)
        setValue(hsv.v)
        // Keep current alpha value when changing hex
      } catch (error) {
        console.warn('Failed to convert hex to HSV:', error)
      }
    }
  }, [handleColorChange])

  // Handle swap colors
  const handleSwapColors = useCallback(() => {
    const temp = primaryColor
    onPrimaryColorChange(secondaryColor)
    onSecondaryColorChange(temp)
  }, [primaryColor, secondaryColor, onPrimaryColorChange, onSecondaryColorChange])

  return (
    <div className="color-picker" style={{
      width: '100%',
      padding: '15px'
    }}>
      {/* Main color display */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          position: 'relative',
          border: '2px solid #fff',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {/* Checkerboard background to show transparency */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(45deg, #ccc 25%, transparent 25%),
              linear-gradient(-45deg, #ccc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ccc 75%),
              linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
          }} />
          {/* Primary color display */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getContrastTextColor(primaryColor),
            fontWeight: 'bold'
          }}>
            I
          </div>
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: secondaryColor,
          border: '2px solid #fff',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getContrastTextColor(secondaryColor),
          fontWeight: 'bold'
        }}>
          II
        </div>
        <button
          onClick={handleSwapColors}
          style={{
            padding: '8px',
            backgroundColor: '#555',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Swap Colors
        </button>
      </div>

      {/* Gradient picker */}
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <canvas
          ref={gradientRef}
          width={160}
          height={120}
          onMouseDown={(e) => handleMouseDown(e, 'gradient')}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: isDragging && dragType === 'gradient' ? 'grabbing' : 'crosshair'
          }}
        />
        {/* Current color marker on gradient */}
        <div
          style={{
            position: 'absolute',
            left: `${(saturation / 100) * 100}%`,
            top: `${((100 - value) / 100) * 100}%`,
            width: '12px',
            height: '12px',
            border: '2px solid #fff',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(0,0,0,0.8)'
          }}
        />
      </div>

      {/* Hue bar */}
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <canvas
          ref={hueRef}
          width={160}
          height={15}
          onMouseDown={(e) => handleMouseDown(e, 'hue')}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: isDragging && dragType === 'hue' ? 'grabbing' : 'crosshair'
          }}
        />
        {/* Current hue marker */}
        <div
          style={{
            position: 'absolute',
            left: `${(hue / 360) * 100}%`,
            top: '-1px',
            width: '8px',
            height: '23px',
            border: '2px solid #fff',
            borderRadius: '2px',
            backgroundColor: 'transparent',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(0,0,0,0.8)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Alpha bar */}
      <div style={{ marginBottom: '15px' }}>
        {/* Alpha bar container with relative positioning for the marker */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <canvas
            ref={alphaRef}
            width={160}
            height={15}
            onMouseDown={(e) => handleMouseDown(e, 'alpha')}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              width: '100%',
              height: 'auto',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: isDragging && dragType === 'alpha' ? 'grabbing' : 'crosshair'
            }}
          />
          {/* Current alpha marker - positioned relative to the canvas container */}
          <div
            style={{
              position: 'absolute',
              left: `${(alpha * 100)}%`,
              top: '-1px',
              width: '8px',
              height: '23px',
              border: '2px solid #fff',
              borderRadius: '2px',
              backgroundColor: 'transparent',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              boxShadow: '0 0 4px rgba(0,0,0,0.8)',
              boxSizing: 'border-box'
            }}
          />
        </div>
        

        
        {/* Alpha percentage display */}
        <div style={{
          fontSize: '10px',
          color: '#aaa',
          textAlign: 'center'
        }}>
          Alpha: {Math.round(alpha * 100)}%
        </div>
      </div>

      {/* Color inputs */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label>Hex:</label>
          <input
            type="text"
            value={primaryColor}
            onChange={handleHexChange}
            style={{
              width: '100%',
              padding: '4px',
              backgroundColor: '#444',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '11px'
            }}
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label>HSLA:</label>
          <input
            type="text"
            value={`hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(value)}%, ${alpha.toFixed(2)})`}
            readOnly
            style={{
              width: '100%',
              padding: '4px',
              backgroundColor: '#444',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '11px'
            }}
          />
        </div>
      </div>

      {/* Color swatches */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0px',
        marginTop: '15px'
      }}>
        {defaultColors.map((color, index) => (
          <div
            key={index}
            onClick={() => handleColorChange(color)}
            style={{
              width: '100%',
              height: '20px',
              backgroundColor: color,
              border: '1px solid #555',
              borderRadius: '0px',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: color === primaryColor ? '0 0 4px rgba(255,255,255,0.8)' : 'none'
            }}
          />
        ))}
      </div>

      {/* HSV values display */}
      <div style={{ 
        fontSize: '10px', 
        color: '#aaa',
        display: 'flex',
        gap: '15px',
        marginTop: '8px'
      }}>
        <span>H: {Math.round(hue)}°</span>
        <span>S: {Math.round(saturation)}%</span>
        <span>V: {Math.round(value)}%</span>
      </div>
    </div>
  )
}

export default ColorPicker
