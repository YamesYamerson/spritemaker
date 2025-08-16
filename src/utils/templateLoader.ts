import { PixelData } from '../types'

export interface TemplatePixel {
  x: number
  y: number
  color: string
}

export interface ParsedTemplate {
  width: number
  height: number
  pixels: TemplatePixel[]
}

/**
 * Loads and parses an SVG template file
 * @param svgPath Path to the SVG template
 * @returns Promise that resolves to parsed template data
 */
export async function loadTemplate(svgPath: string): Promise<ParsedTemplate> {
  try {
    const response = await fetch(svgPath)
    const svgText = await response.text()
    return parseSVGTemplate(svgText)
  } catch (error) {
    console.error('Failed to load template:', error)
    throw new Error(`Failed to load template: ${error}`)
  }
}

/**
 * Parses SVG content and extracts pixel data
 * @param svgContent Raw SVG content
 * @returns Parsed template with pixel data
 */
function parseSVGTemplate(svgContent: string): ParsedTemplate {
  console.log('Parsing SVG template with regex approach')
  console.log('SVG content length:', svgContent.length)
  
  // Extract width and height using regex
  const widthMatch = svgContent.match(/width="(\d+)"/)
  const heightMatch = svgContent.match(/height="(\d+)"/)
  
  if (!widthMatch || !heightMatch) {
    throw new Error('Invalid SVG: missing width or height')
  }
  
  const width = parseInt(widthMatch[1])
  const height = parseInt(heightMatch[1])
  
  console.log(`SVG dimensions: ${width}x${height}`)
  
  // Extract all rect elements using regex
  const rectRegex = /<rect\s+([^>]+)\s*\/?>/g
  const pixels: TemplatePixel[] = []
  let match
  let rectCount = 0
  
  while ((match = rectRegex.exec(svgContent)) !== null) {
    rectCount++
    const rectAttributes = match[1]
    
    // Extract x, y, fill, and opacity attributes
    const xMatch = rectAttributes.match(/x="(\d+)"/)
    const yMatch = rectAttributes.match(/y="(\d+)"/)
    const fillMatch = rectAttributes.match(/fill="([^"]+)"/)
    const opacityMatch = rectAttributes.match(/opacity="([^"]+)"/)
    
    if (xMatch && yMatch && fillMatch) {
      const x = parseInt(xMatch[1])
      const y = parseInt(yMatch[1])
      const fill = fillMatch[1]
      const opacity = opacityMatch ? parseFloat(opacityMatch[1]) : 1
      
      console.log(`Rect ${rectCount}: x=${x}, y=${y}, fill=${fill}, opacity=${opacity}`)
      
      // Include pixels with any opacity > 0 (including 0.8)
      if (opacity > 0 && fill !== 'none') {
        pixels.push({
          x,
          y,
          color: fill
        })
        console.log(`  -> Added pixel at (${x}, ${y}) with color ${fill}`)
      } else {
        console.log(`  -> Skipped pixel at (${x}, ${y}) - opacity: ${opacity}, fill: ${fill}`)
      }
    } else {
      console.log(`Rect ${rectCount}: Missing required attributes`)
    }
  }
  
  console.log(`Final template: ${pixels.length} pixels extracted from ${rectCount} rect elements`)
  
  return {
    width,
    height,
    pixels
  }
}

/**
 * Converts template pixels to the format expected by the sprite editor
 * @param template Parsed template data
 * @param layerId Target layer ID
 * @returns Map of pixel data compatible with the sprite editor
 */
export function convertTemplateToPixels(
  template: ParsedTemplate, 
  layerId: number
): Map<string, PixelData> {
  const pixelMap = new Map<string, PixelData>()
  
  template.pixels.forEach(pixel => {
    const key = `${pixel.x},${pixel.y}`
    pixelMap.set(key, {
      x: pixel.x,
      y: pixel.y,
      color: pixel.color,
      layerId
    })
  })
  
  return pixelMap
}

/**
 * Applies a template to the canvas by replacing all pixels
 * @param template Parsed template data
 * @param layerId Target layer ID
 * @returns New pixel map with template applied
 */
export function applyTemplateToCanvas(
  template: ParsedTemplate,
  layerId: number
): Map<string, PixelData> {
  // Create a completely new pixel map with the template
  return convertTemplateToPixels(template, layerId)
}
