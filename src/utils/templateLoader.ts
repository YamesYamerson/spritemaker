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
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')
  
  // Get SVG dimensions
  const svg = doc.querySelector('svg')
  if (!svg) {
    throw new Error('Invalid SVG: no svg element found')
  }
  
  const width = parseInt(svg.getAttribute('width') || '0')
  const height = parseInt(svg.getAttribute('height') || '0')
  
  if (!width || !height) {
    throw new Error('Invalid SVG: missing width or height')
  }
  
  // Extract all rect elements (pixels)
  const rects = doc.querySelectorAll('rect')
  const pixels: TemplatePixel[] = []
  
  rects.forEach(rect => {
    const x = parseInt(rect.getAttribute('x') || '0')
    const y = parseInt(rect.getAttribute('y') || '0')
    const fill = rect.getAttribute('fill') || '#000000'
    const opacity = parseFloat(rect.getAttribute('opacity') || '1')
    
    // Only include non-transparent pixels
    if (opacity > 0 && fill !== 'none') {
      pixels.push({
        x,
        y,
        color: fill
      })
    }
  })
  
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
