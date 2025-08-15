import { generateBrushPattern, applyBrushPattern, getBrushBounds, BrushPattern } from '../../src/utils/brushPatterns'

describe('Brush Patterns', () => {
  describe('generateBrushPattern', () => {
    it('should generate 1px brush pattern', () => {
      const pattern = generateBrushPattern(1)
      
      expect(pattern.width).toBe(1)
      expect(pattern.height).toBe(1)
      expect(pattern.pattern).toEqual([[true]])
      expect(pattern.centerX).toBe(0)
      expect(pattern.centerY).toBe(0)
    })

    it('should generate 2px brush pattern', () => {
      const pattern = generateBrushPattern(2)
      
      expect(pattern.width).toBe(2)
      expect(pattern.height).toBe(2)
      expect(pattern.pattern).toEqual([
        [true, true],
        [true, true]
      ])
      expect(pattern.centerX).toBe(0)
      expect(pattern.centerY).toBe(0)
    })

    it('should generate 3px brush pattern (solid)', () => {
      const pattern = generateBrushPattern(3)
      
      expect(pattern.width).toBe(3)
      expect(pattern.height).toBe(3)
      expect(pattern.pattern).toEqual([
        [true, true, true],
        [true, true, true],
        [true, true, true]
      ])
      expect(pattern.centerX).toBe(1)
      expect(pattern.centerY).toBe(1)
    })

    it('should generate 4px brush pattern', () => {
      const pattern = generateBrushPattern(4)
      
      expect(pattern.width).toBe(4)
      expect(pattern.height).toBe(4)
      expect(pattern.pattern).toEqual([
        [false, true, true, false],
        [true, true, true, true],
        [true, true, true, true],
        [false, true, true, false]
      ])
      expect(pattern.centerX).toBe(1)
      expect(pattern.centerY).toBe(1)
    })

    it('should fallback to 1px for invalid thickness', () => {
      const pattern = generateBrushPattern(0)
      
      expect(pattern.width).toBe(1)
      expect(pattern.height).toBe(1)
      expect(pattern.pattern).toEqual([[true]])
    })

    it('should fallback to 1px for negative thickness', () => {
      const pattern = generateBrushPattern(-1)
      
      expect(pattern.width).toBe(1)
      expect(pattern.height).toBe(1)
      expect(pattern.pattern).toEqual([[true]])
    })

    it('should fallback to 1px for very large thickness', () => {
      const pattern = generateBrushPattern(100)
      
      expect(pattern.width).toBe(1)
      expect(pattern.height).toBe(1)
      expect(pattern.pattern).toEqual([[true]])
    })
  })

  describe('applyBrushPattern', () => {
    it('should apply 1px pattern correctly', () => {
      const pattern = generateBrushPattern(1)
      const drawnPixels: Array<[number, number]> = []
      
      applyBrushPattern(pattern, 5, 5, (x, y) => {
        drawnPixels.push([x, y])
      })
      
      expect(drawnPixels).toEqual([[5, 5]])
    })

    it('should apply 2px pattern correctly', () => {
      const pattern = generateBrushPattern(2)
      const drawnPixels: Array<[number, number]> = []
      
      applyBrushPattern(pattern, 5, 5, (x, y) => {
        drawnPixels.push([x, y])
      })
      
      // Should draw 4 pixels in a 2x2 square
      expect(drawnPixels).toHaveLength(4)
      expect(drawnPixels).toContainEqual([5, 5])
      expect(drawnPixels).toContainEqual([6, 5])
      expect(drawnPixels).toContainEqual([5, 6])
      expect(drawnPixels).toContainEqual([6, 6])
    })

    it('should apply 3px pattern correctly (solid)', () => {
      const pattern = generateBrushPattern(3)
      const drawnPixels: Array<[number, number]> = []
      
      applyBrushPattern(pattern, 5, 5, (x, y) => {
        drawnPixels.push([x, y])
      })
      
      // Should draw 9 pixels in a solid 3x3 square
      expect(drawnPixels).toHaveLength(9)
      
      // Check that all 9 pixels in the 3x3 area are drawn
      expect(drawnPixels).toContainEqual([4, 4]) // top-left
      expect(drawnPixels).toContainEqual([5, 4]) // top-center
      expect(drawnPixels).toContainEqual([6, 4]) // top-right
      expect(drawnPixels).toContainEqual([4, 5]) // middle-left
      expect(drawnPixels).toContainEqual([5, 5]) // center
      expect(drawnPixels).toContainEqual([6, 5]) // middle-right
      expect(drawnPixels).toContainEqual([4, 6]) // bottom-left
      expect(drawnPixels).toContainEqual([5, 6]) // bottom-center
      expect(drawnPixels).toContainEqual([6, 6]) // bottom-right
    })

    it('should apply 4px pattern correctly', () => {
      const pattern = generateBrushPattern(4)
      const drawnPixels: Array<[number, number]> = []
      
      applyBrushPattern(pattern, 5, 5, (x, y) => {
        drawnPixels.push([x, y])
      })
      
      // Should draw 12 pixels (4x4 with corners removed)
      expect(drawnPixels).toHaveLength(12)
      
      // Check that corners are not drawn
      expect(drawnPixels).not.toContainEqual([4, 4]) // top-left corner
      expect(drawnPixels).not.toContainEqual([7, 4]) // top-right corner
      expect(drawnPixels).not.toContainEqual([4, 7]) // bottom-left corner
      expect(drawnPixels).not.toContainEqual([7, 7]) // bottom-right corner
      
      // Check that center pixels are drawn
      expect(drawnPixels).toContainEqual([5, 5])
      expect(drawnPixels).toContainEqual([6, 5])
      expect(drawnPixels).toContainEqual([5, 6])
      expect(drawnPixels).toContainEqual([6, 6])
    })

    it('should handle decimal center coordinates correctly', () => {
      const pattern = generateBrushPattern(2)
      const drawnPixels: Array<[number, number]> = []
      
      applyBrushPattern(pattern, 5.5, 5.5, (x, y) => {
        drawnPixels.push([x, y])
      })
      
      // Should center around the exact coordinates (no rounding)
      expect(drawnPixels).toHaveLength(4)
      expect(drawnPixels).toContainEqual([5.5, 5.5])
      expect(drawnPixels).toContainEqual([6.5, 5.5])
      expect(drawnPixels).toContainEqual([5.5, 6.5])
      expect(drawnPixels).toContainEqual([6.5, 6.5])
    })
  })

  describe('getBrushBounds', () => {
    it('should get correct bounds for 1px brush', () => {
      const pattern = generateBrushPattern(1)
      const bounds = getBrushBounds(pattern, 5, 5)
      
      expect(bounds.minX).toBe(5)
      expect(bounds.maxX).toBe(5)
      expect(bounds.minY).toBe(5)
      expect(bounds.maxY).toBe(5)
    })

    it('should get correct bounds for 2px brush', () => {
      const pattern = generateBrushPattern(2)
      const bounds = getBrushBounds(pattern, 5, 5)
      
      expect(bounds.minX).toBe(5)
      expect(bounds.maxX).toBe(6)
      expect(bounds.minY).toBe(5)
      expect(bounds.maxY).toBe(6)
    })

    it('should get correct bounds for 3px brush', () => {
      const pattern = generateBrushPattern(3)
      const bounds = getBrushBounds(pattern, 5, 5)
      
      expect(bounds.minX).toBe(4)
      expect(bounds.maxX).toBe(6)
      expect(bounds.minY).toBe(4)
      expect(bounds.maxY).toBe(6)
    })

    it('should get correct bounds for 4px brush', () => {
      const pattern = generateBrushPattern(4)
      const bounds = getBrushBounds(pattern, 5, 5)
      
      expect(bounds.minX).toBe(4)
      expect(bounds.maxX).toBe(7)
      expect(bounds.minY).toBe(4)
      expect(bounds.maxY).toBe(7)
    })

    it('should handle decimal center coordinates correctly', () => {
      const pattern = generateBrushPattern(2)
      const bounds = getBrushBounds(pattern, 5.5, 5.5)
      
      expect(bounds.minX).toBe(5.5)
      expect(bounds.maxX).toBe(6.5)
      expect(bounds.minY).toBe(5.5)
      expect(bounds.maxY).toBe(6.5)
    })
  })

  describe('Pattern Validation', () => {
    it('should have valid pattern dimensions', () => {
      for (let thickness = 1; thickness <= 4; thickness++) {
        const pattern = generateBrushPattern(thickness)
        
        expect(pattern.pattern.length).toBe(pattern.height)
        pattern.pattern.forEach(row => {
          expect(row.length).toBe(pattern.width)
        })
      }
    })

    it('should have valid center coordinates', () => {
      for (let thickness = 1; thickness <= 4; thickness++) {
        const pattern = generateBrushPattern(thickness)
        
        expect(pattern.centerX).toBeGreaterThanOrEqual(0)
        expect(pattern.centerY).toBeGreaterThanOrEqual(0)
        expect(pattern.centerX).toBeLessThan(pattern.width)
        expect(pattern.centerY).toBeLessThan(pattern.height)
      }
    })

    it('should have at least one pixel in each pattern', () => {
      for (let thickness = 1; thickness <= 4; thickness++) {
        const pattern = generateBrushPattern(thickness)
        
        const hasPixels = pattern.pattern.some(row => 
          row.some(pixel => pixel)
        )
        
        expect(hasPixels).toBe(true)
      }
    })
  })
})
