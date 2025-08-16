import { loadTemplate, convertTemplateToPixels, ParsedTemplate } from '../../src/utils/templateLoader'

// Mock fetch
global.fetch = jest.fn()

describe('Template Loader Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loadTemplate', () => {
    it('should load SVG template successfully', async () => {
      const mockSVG = '<svg width="16" height="16"><rect x="0" y="0" width="1" height="1" fill="#FF0000"/></svg>'
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockSVG)
      })

      const result = await loadTemplate('/templates/test.svg')
      expect(result).toEqual({
        width: 16,
        height: 16,
        pixels: [{ x: 0, y: 0, color: '#FF0000' }]
      })
      expect(fetch).toHaveBeenCalledWith('/templates/test.svg')
    })

    it('should throw error for failed fetch', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      await expect(loadTemplate('/templates/notfound.svg')).rejects.toThrow('Failed to load template')
    })

    it('should throw error for network failure', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(loadTemplate('/templates/test.svg')).rejects.toThrow('Network error')
    })
  })

  describe('convertTemplateToPixels', () => {
    it('should convert template pixels to correct format', () => {
      const template: ParsedTemplate = {
        width: 16,
        height: 16,
        pixels: [
          { x: 0, y: 0, color: '#FF0000' },
          { x: 1, y: 0, color: '#00FF00' },
          { x: 0, y: 1, color: '#0000FF' }
        ]
      }

      const result = convertTemplateToPixels(template, 1)
      
      expect(result.size).toBe(3)
      expect(result.get('0,0')).toEqual({
        x: 0,
        y: 0,
        color: '#FF0000',
        layerId: 1
      })
      expect(result.get('1,0')).toEqual({
        x: 1,
        y: 0,
        color: '#00FF00',
        layerId: 1
      })
      expect(result.get('0,1')).toEqual({
        x: 0,
        y: 1,
        color: '#0000FF',
        layerId: 1
      })
    })

    it('should handle empty template pixels', () => {
      const template: ParsedTemplate = {
        width: 16,
        height: 16,
        pixels: []
      }
      
      const result = convertTemplateToPixels(template, 1)
      
      expect(result.size).toBe(0)
    })

    it('should use correct layer ID', () => {
      const template: ParsedTemplate = {
        width: 16,
        height: 16,
        pixels: [
          { x: 0, y: 0, color: '#FF0000' }
        ]
      }

      const result = convertTemplateToPixels(template, 5)
      
      expect(result.get('0,0')?.layerId).toBe(5)
    })
  })

  describe('Integration', () => {
    it('should process complete template loading workflow', async () => {
      const mockSVG = `
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="0" y="0" width="1" height="1" fill="#FF0000"/>
          <rect x="1" y="0" width="1" height="1" fill="#00FF00"/>
        </svg>
      `
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockSVG)
      })

      // Load template
      const result = await loadTemplate('/templates/test.svg')
      expect(result.width).toBe(16)
      expect(result.height).toBe(16)
      expect(result.pixels).toHaveLength(2)
      
      // Convert to pixel format
      const pixelMap = convertTemplateToPixels(result, 1)
      expect(pixelMap.size).toBe(2)
      expect(pixelMap.get('0,0')?.color).toBe('#FF0000')
      expect(pixelMap.get('1,0')?.color).toBe('#00FF00')
    })
  })
})
