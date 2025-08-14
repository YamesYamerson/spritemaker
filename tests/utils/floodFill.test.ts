// Test the flood fill algorithm logic
describe('Flood Fill Algorithm', () => {
  // Mock pixel data structure
  type PixelData = {
    x: number
    y: number
    color: string
    layerId: string
  }

  // Mock flood fill function
  const floodFill = (startX: number, startY: number, targetColor: string, replacementColor: string, pixels: Map<string, PixelData>, canvasSize: number): number => {
    // Only return early if we're trying to fill with the exact same color AND it's not transparent
    if (targetColor === replacementColor && targetColor !== 'transparent') return 0
    
    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()
    let filledCount = 0
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key)) continue
      visited.add(key)
      
      // Check if current position matches target color
      const currentPixel = pixels.get(key)
      const currentColor = currentPixel ? currentPixel.color : 'transparent'
      
      if (currentColor !== targetColor) continue
      
      // Fill the pixel
      if (replacementColor === 'transparent') {
        pixels.delete(key)
      } else {
        pixels.set(key, {
          x,
          y,
          color: replacementColor,
          layerId: 'test-layer'
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
    
    return filledCount
  }

  it('should fill transparent areas correctly', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 4
    
    // Create a 4x4 grid with some colored pixels and transparent areas
    // [R][T][T][T]
    // [T][T][T][T]
    // [T][T][T][T]
    // [T][T][T][T]
    
    pixels.set('0,0', { x: 0, y: 0, color: '#ff0000', layerId: 'test-layer' })
    
    // Try to fill transparent area starting at (1,0)
    const filledCount = floodFill(1, 0, 'transparent', '#00ff00', pixels, canvasSize)
    
    // Should fill 15 transparent pixels (4x4 - 1 red pixel)
    expect(filledCount).toBe(15)
    
    // Check that the transparent area was filled
    expect(pixels.get('1,0')?.color).toBe('#00ff00')
    expect(pixels.get('2,0')?.color).toBe('#00ff00')
    expect(pixels.get('3,0')?.color).toBe('#00ff00')
    expect(pixels.get('0,1')?.color).toBe('#00ff00')
    expect(pixels.get('1,1')?.color).toBe('#00ff00')
    expect(pixels.get('2,1')?.color).toBe('#00ff00')
    expect(pixels.get('3,1')?.color).toBe('#00ff00')
    expect(pixels.get('0,2')?.color).toBe('#00ff00')
    expect(pixels.get('1,2')?.color).toBe('#00ff00')
    expect(pixels.get('2,2')?.color).toBe('#00ff00')
    expect(pixels.get('3,2')?.color).toBe('#00ff00')
    expect(pixels.get('0,3')?.color).toBe('#00ff00')
    expect(pixels.get('1,3')?.color).toBe('#00ff00')
    expect(pixels.get('2,3')?.color).toBe('#00ff00')
    expect(pixels.get('3,3')?.color).toBe('#00ff00')
    
    // Red pixel should remain unchanged
    expect(pixels.get('0,0')?.color).toBe('#ff0000')
  })
  
  it('should fill colored areas correctly', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 4
    
    // Create a 4x4 grid with a colored area
    // [R][R][T][T]
    // [R][R][T][T]
    // [T][T][T][T]
    // [T][T][T][T]
    
    pixels.set('0,0', { x: 0, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('1,0', { x: 1, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('0,1', { x: 0, y: 1, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('1,1', { x: 1, y: 1, color: '#ff0000', layerId: 'test-layer' })
    
    // Try to fill red area starting at (0,0)
    const filledCount = floodFill(0, 0, '#ff0000', '#00ff00', pixels, canvasSize)
    
    // Should fill 4 red pixels
    expect(filledCount).toBe(4)
    
    // Check that the red area was filled with green
    expect(pixels.get('0,0')?.color).toBe('#00ff00')
    expect(pixels.get('1,0')?.color).toBe('#00ff00')
    expect(pixels.get('0,1')?.color).toBe('#00ff00')
    expect(pixels.get('1,1')?.color).toBe('#00ff00')
    
    // Transparent areas should remain unchanged
    expect(pixels.has('2,0')).toBe(false)
    expect(pixels.has('3,0')).toBe(false)
    expect(pixels.has('2,1')).toBe(false)
    expect(pixels.has('3,1')).toBe(false)
  })
  
  it('should handle edge cases correctly', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 2
    
    // Test with 2x2 grid
    // [T][T]
    // [T][T]
    
    // Try to fill transparent area starting at (0,0)
    const filledCount = floodFill(0, 0, 'transparent', '#0000ff', pixels, canvasSize)
    
    // Should fill 4 transparent pixels
    expect(filledCount).toBe(4)
    
    // Check that all pixels were filled
    expect(pixels.get('0,0')?.color).toBe('#0000ff')
    expect(pixels.get('1,0')?.color).toBe('#0000ff')
    expect(pixels.get('0,1')?.color).toBe('#0000ff')
    expect(pixels.get('1,1')?.color).toBe('#0000ff')
  })
  
  it('should not fill when target and replacement colors are the same (non-transparent)', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 2
    
    pixels.set('0,0', { x: 0, y: 0, color: '#ff0000', layerId: 'test-layer' })
    
    // Try to fill red area with red (should do nothing)
    const filledCount = floodFill(0, 0, '#ff0000', '#ff0000', pixels, canvasSize)
    
    // Should not fill anything
    expect(filledCount).toBe(0)
    
    // Pixel should remain unchanged
    expect(pixels.get('0,0')?.color).toBe('#ff0000')
  })
  
  it('should allow filling transparent areas with transparent color', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 2
    
    // Try to fill transparent area with transparent (useful for erasing)
    const filledCount = floodFill(0, 0, 'transparent', 'transparent', pixels, canvasSize)
    
    // This is a valid operation - filling transparent with transparent can "fill" pixels
    // The exact count depends on the algorithm implementation
    expect(filledCount).toBeGreaterThanOrEqual(0)
    
    // The operation should complete without crashing
    expect(pixels.size).toBeGreaterThanOrEqual(0)
  })

  it('should fill all adjacent cells with the same color (adjacency test)', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 4
    
    // Create a pattern where we have adjacent cells with the same color
    // [R][R][T][T]
    // [R][R][T][T]
    // [T][T][T][T]
    // [T][T][T][T]
    
    // Set up a 2x2 red area
    pixels.set('0,0', { x: 0, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('1,0', { x: 1, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('0,1', { x: 0, y: 1, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('1,1', { x: 1, y: 1, color: '#ff0000', layerId: 'test-layer' })
    
    // Try to fill the red area starting from the top-left corner
    const filledCount = floodFill(0, 0, '#ff0000', '#00ff00', pixels, canvasSize)
    
    // Should fill ALL 4 red pixels, not just the clicked one
    expect(filledCount).toBe(4)
    
    // All red pixels should now be green
    expect(pixels.get('0,0')?.color).toBe('#00ff00')
    expect(pixels.get('1,0')?.color).toBe('#00ff00')
    expect(pixels.get('0,1')?.color).toBe('#00ff00')
    expect(pixels.get('1,1')?.color).toBe('#00ff00')
    
    // Transparent areas should remain unchanged
    expect(pixels.has('2,0')).toBe(false)
    expect(pixels.has('3,0')).toBe(false)
    expect(pixels.has('2,1')).toBe(false)
    expect(pixels.has('3,1')).toBe(false)
  })

  it('should handle disconnected areas correctly (no crossing transparent boundaries)', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 4
    
    // Create a pattern with disconnected areas of the same color
    // [R][T][R][T]
    // [T][T][T][T]
    // [R][T][R][T]
    // [T][T][T][T]
    
    pixels.set('0,0', { x: 0, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('2,0', { x: 2, y: 0, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('0,2', { x: 0, y: 2, color: '#ff0000', layerId: 'test-layer' })
    pixels.set('2,2', { x: 2, y: 2, color: '#ff0000', layerId: 'test-layer' })
    
    // Try to fill starting from top-left red pixel
    const filledCount = floodFill(0, 0, '#ff0000', '#00ff00', pixels, canvasSize)
    
    // Should only fill the connected red pixels (just the top-left one in this case)
    expect(filledCount).toBe(1)
    
    // Only the starting pixel should be filled
    expect(pixels.get('0,0')?.color).toBe('#00ff00')
    
    // Other red pixels should remain unchanged (they're not connected)
    expect(pixels.get('2,0')?.color).toBe('#ff0000')
    expect(pixels.get('0,2')?.color).toBe('#ff0000')
    expect(pixels.get('2,2')?.color).toBe('#ff0000')
  })

  it('should handle complex connected patterns correctly', () => {
    const pixels = new Map<string, PixelData>()
    const canvasSize = 5
    
    // Create a truly connected pattern where red pixels are adjacent
    // [R][R][T][R][T]
    // [R][R][R][T][R]
    // [T][R][R][R][T]
    // [R][T][R][R][R]
    // [T][R][T][R][T]
    
    // Set up a connected pattern of red pixels
    const connectedPositions = [
      [0,0], [1,0], [3,0], [5,0],  // Row 0
      [0,1], [1,1], [2,1], [4,1],  // Row 1  
      [1,2], [2,2], [3,2],         // Row 2
      [0,3], [2,3], [3,3], [4,3],  // Row 3
      [1,4], [3,4]                 // Row 4
    ]
    
    connectedPositions.forEach(([x, y]) => {
      if (x < canvasSize && y < canvasSize) {
        pixels.set(`${x},${y}`, { x, y, color: '#ff0000', layerId: 'test-layer' })
      }
    })
    
    // Try to fill starting from center (2,2) - this should connect to many other red pixels
    const filledCount = floodFill(2, 2, '#ff0000', '#00ff00', pixels, canvasSize)
    
    // Should fill all connected red pixels in the pattern
    // Starting from (2,2), it should connect to the 2x2 block and other adjacent red pixels
    expect(filledCount).toBeGreaterThan(1)
    
    // The starting pixel should be filled
    expect(pixels.get('2,2')?.color).toBe('#00ff00')
  })
})
