import { Color } from '../types'

/**
 * Validates if a string is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Validates if a string is a valid color (hex or named colors)
 */
export const isValidColor = (color: string): boolean => {
  // Check if it's a valid hex color
  if (isValidHexColor(color)) return true
  
  // Check if it's a valid CSS color by trying to create a temporary element
  const temp = document.createElement('div')
  temp.style.color = color
  return temp.style.color !== ''
}

/**
 * Safely converts HSV to RGB with validation
 */
export const hsvToRgb = (h: number, s: number, v: number): Color => {
  // Ensure values are within valid ranges
  const hue = Math.max(0, Math.min(360, h))
  const saturation = Math.max(0, Math.min(100, s)) / 100 // Convert to 0-1
  const value = Math.max(0, Math.min(100, v)) / 100 // Convert to 0-1
  
  const c = value * saturation
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
  const m = value - c

  let r = 0, g = 0, b = 0
  
  if (hue >= 0 && hue < 60) {
    r = c; g = x; b = 0
  } else if (hue >= 60 && hue < 120) {
    r = x; g = c; b = 0
  } else if (hue >= 120 && hue < 180) {
    r = 0; g = c; b = x
  } else if (hue >= 180 && hue < 240) {
    r = 0; g = x; b = c
  } else if (hue >= 240 && hue < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const red = Math.round((r + m) * 255)
  const green = Math.round((g + m) * 255)
  const blue = Math.round((b + m) * 255)
  
  // Ensure values are within valid range (0-255)
  const clampedRed = Math.max(0, Math.min(255, red))
  const clampedGreen = Math.max(0, Math.min(255, green))
  const clampedBlue = Math.max(0, Math.min(255, blue))
  
  return `#${clampedRed.toString(16).padStart(2, '0')}${clampedGreen.toString(16).padStart(2, '0')}${clampedBlue.toString(16).padStart(2, '0')}`
}

/**
 * Safely converts RGB to HSV with validation
 */
export const rgbToHsv = (color: Color): { h: number; s: number; v: number } => {
  try {
    if (!isValidHexColor(color)) {
      throw new Error(`Invalid hex color: ${color}`)
    }
    
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min

    let h = 0
    if (diff === 0) h = 0
    else if (max === r) h = ((g - b) / diff) % 6
    else if (max === g) h = (b - r) / diff + 2
    else h = (r - g) / diff + 4

    h = Math.round(h * 60)
    if (h < 0) h += 360

    const s = max === 0 ? 0 : Math.round((diff / max) * 100)
    const v = Math.round(max * 100)

    return { h, s, v }
  } catch (error) {
    console.error('Error converting RGB to HSV:', error)
    // Return default values if conversion fails
    return { h: 0, s: 100, v: 100 }
  }
}

/**
 * Safely creates a canvas gradient with error handling
 */
export const createSafeGradient = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colorStops: Array<{ offset: number; color: string }>
): CanvasGradient | null => {
  try {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
    
    for (const stop of colorStops) {
      if (isValidColor(stop.color)) {
        gradient.addColorStop(stop.offset, stop.color)
      } else {
        console.warn(`Invalid color in gradient: ${stop.color}`)
        // Use a fallback color
        gradient.addColorStop(stop.offset, '#000000')
      }
    }
    
    return gradient
  } catch (error) {
    console.error('Error creating gradient:', error)
    return null
  }
}

/**
 * Safely fills a canvas rectangle with error handling
 */
export const safeFillRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void => {
  try {
    if (isValidColor(color)) {
      ctx.fillStyle = color
      ctx.fillRect(x, y, width, height)
    } else {
      console.warn(`Invalid color for fill: ${color}`)
      // Use a fallback color
      ctx.fillStyle = '#000000'
      ctx.fillRect(x, y, width, height)
    }
  } catch (error) {
    console.error('Error filling rectangle:', error)
  }
}

/**
 * Gets a safe fallback color if the provided color is invalid
 */
export const getSafeColor = (color: string, fallback: string = '#000000'): string => {
  return isValidColor(color) ? color : fallback
}
