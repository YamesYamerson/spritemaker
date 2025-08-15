export interface BrushPattern {
  width: number
  height: number
  pattern: boolean[][]
  centerX: number
  centerY: number
}

/**
 * Generates brush patterns for different thicknesses
 * @param thickness - The brush thickness (1-4)
 * @returns A BrushPattern object with the pattern matrix and center coordinates
 */
export function generateBrushPattern(thickness: number): BrushPattern {
  switch (thickness) {
    case 1:
      return {
        width: 1,
        height: 1,
        pattern: [[true]],
        centerX: 0,
        centerY: 0
      }
    
    case 2:
      return {
        width: 2,
        height: 2,
        pattern: [
          [true, true],
          [true, true]
        ],
        centerX: 0,
        centerY: 0
      }
    
    case 3:
      return {
        width: 3,
        height: 3,
        pattern: [
          [true, true, true],
          [true, true, true],
          [true, true, true]
        ],
        centerX: 1,
        centerY: 1
      }
    
    case 4:
      return {
        width: 4,
        height: 4,
        pattern: [
          [false, true, true, false],
          [true, true, true, true],
          [true, true, true, true],
          [false, true, true, false]
        ],
        centerX: 1,
        centerY: 1
      }
    
    default:
      // Fallback to 1px for invalid thickness
      return {
        width: 1,
        height: 1,
        pattern: [[true]],
        centerX: 0,
        centerY: 0
      }
  }
}

/**
 * Applies a brush pattern at a specific position
 * @param pattern - The brush pattern to apply
 * @param centerX - The center X coordinate
 * @param centerY - The center Y coordinate
 * @param drawFunction - Function to call for each pixel in the pattern
 */
export function applyBrushPattern(
  pattern: BrushPattern,
  centerX: number,
  centerY: number,
  drawFunction: (x: number, y: number) => void
): void {
  const startX = centerX - pattern.centerX
  const startY = centerY - pattern.centerY
  
  let pixelsApplied = 0
  
  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      if (pattern.pattern[y][x]) {
        const pixelX = startX + x
        const pixelY = startY + y
        drawFunction(pixelX, pixelY)
        pixelsApplied++
      }
    }
  }
  
}

/**
 * Gets the bounding box for a brush pattern at a specific position
 * @param pattern - The brush pattern
 * @param centerX - The center X coordinate
 * @param centerY - The center Y coordinate
 * @returns Object with min/max coordinates
 */
export function getBrushBounds(
  pattern: BrushPattern,
  centerX: number,
  centerY: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  const startX = centerX - pattern.centerX
  const startY = centerY - pattern.centerY
  
  return {
    minX: startX,
    maxX: startX + pattern.width - 1,
    minY: startY,
    maxY: startY + pattern.height - 1
  }
}
