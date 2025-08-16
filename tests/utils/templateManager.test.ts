import { TemplateManager } from '../../src/utils/templateManager'
import { SavedTemplate, PixelData } from '../../src/types'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('TemplateManager', () => {
  let templateManager: TemplateManager
  let mockLocalStorage: { [key: string]: string }

  const mockTemplate: SavedTemplate = {
    id: 'test_template',
    name: 'Test Template',
    description: 'A test template',
    width: 32,
    height: 32,
    pixels: [
      { x: 0, y: 0, color: '#FF0000', layerId: 1 },
      { x: 1, y: 0, color: '#00FF00', layerId: 1 }
    ],
    createdAt: 1234567890,
    updatedAt: 1234567890,
    tags: ['test', '32x32']
  }

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset TemplateManager singleton for test isolation
    TemplateManager.resetInstance()
    
    // Mock localStorage
    mockLocalStorage = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key]),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key]
        })
      },
      writable: true
    })

    // Mock fetch to return success
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"success": true}')
    } as Response)

    // Get fresh instance
    templateManager = TemplateManager.getInstance()
  })

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = TemplateManager.getInstance()
      const instance2 = TemplateManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('saveTemplate', () => {
    it('should save template to memory and localStorage', async () => {
      const pixels = new Map<string, PixelData>([
        ['0,0', { x: 0, y: 0, color: '#FF0000', layerId: 1 }],
        ['1,0', { x: 1, y: 0, color: '#00FF00', layerId: 1 }]
      ])

      const result = await templateManager.saveTemplate(
        'Test Template',
        'A test template',
        32,
        32,
        pixels,
        ['test', '32x32']
      )

      expect(result.name).toBe('Test Template')
      expect(result.width).toBe(32)
      expect(result.height).toBe(32)
      expect(result.pixels).toHaveLength(2)
      expect(result.tags).toContain('32x32')
    })

    it('should call the API endpoint to save to file', async () => {
      const pixels = new Map<string, PixelData>([
        ['0,0', { x: 0, y: 0, color: '#FF0000', layerId: 1 }]
      ])

      await templateManager.saveTemplate(
        'Test Template',
        'A test template',
        32,
        32,
        pixels,
        ['test']
      )

      expect(mockFetch).toHaveBeenCalledWith('/api/save-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test_Template_32x32.json')
      })
      
      // Verify the body contains the expected structure
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.filename).toBe('Test_Template_32x32.json')
      expect(body.size).toBe('32x32')
      expect(body.content).toContain('Test Template')
      expect(body.content).toContain('"width": 32')
      expect(body.content).toContain('"height": 32')
    })

    it('should fallback to download if API fails', async () => {
      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('API Error'))

      // Mock document.createElement and related DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      const mockAppendChild = jest.fn()
      const mockRemoveChild = jest.fn()
      
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => mockLink),
        writable: true
      })
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      })
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      })

      // Mock URL.createObjectURL
      const mockCreateObjectURL = jest.fn(() => 'blob:mock')
      const mockRevokeObjectURL = jest.fn()
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true
      })

      const pixels = new Map<string, PixelData>([
        ['0,0', { x: 0, y: 0, color: '#FF0000', layerId: 1 }]
      ])

      await templateManager.saveTemplate(
        'Test Template',
        'A test template',
        32,
        32,
        pixels,
        ['test']
      )

      // Should have tried to download as fallback
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('getAllTemplates', () => {
    it('should return all templates sorted by update time', () => {
      // Add some templates with different timestamps
      const oldTemplate = { ...mockTemplate, id: 'old', updatedAt: 1000 }
      const newTemplate = { ...mockTemplate, id: 'new', updatedAt: 2000 }
      
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([oldTemplate, newTemplate])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const templates = freshManager.getAllTemplates()
      
      expect(templates).toHaveLength(2)
      expect(templates[0].id).toBe('new') // Most recent first
      expect(templates[1].id).toBe('old')
    })
  })

  describe('getTemplatesBySize', () => {
    it('should return only templates of specified size', () => {
      const template32 = { ...mockTemplate, id: '32x32', width: 32, height: 32 }
      const template64 = { ...mockTemplate, id: '64x64', width: 64, height: 64 }
      
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([template32, template64])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const templates32 = freshManager.getTemplatesBySize(32, 32)
      const templates64 = freshManager.getTemplatesBySize(64, 64)
      
      expect(templates32).toHaveLength(1)
      expect(templates32[0].id).toBe('32x32')
      expect(templates64).toHaveLength(1)
      expect(templates64[0].id).toBe('64x64')
    })
  })

  describe('searchTemplates', () => {
    it('should search by name', () => {
      const template1 = { ...mockTemplate, id: '1', name: 'Red Cross' }
      const template2 = { ...mockTemplate, id: '2', name: 'Blue Circle' }
      
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([template1, template2])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const results = freshManager.searchTemplates('Red')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Red Cross')
    })

    it('should search by description', () => {
      const template1 = { ...mockTemplate, id: '1', description: 'A red cross pattern' }
      const template2 = { ...mockTemplate, id: '2', description: 'A blue circle pattern' }
      
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([template1, template2])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const results = freshManager.searchTemplates('red')
      
      expect(results).toHaveLength(1)
      expect(results[0].description).toBe('A red cross pattern')
    })

    it('should search by tags', () => {
      const template1 = { ...mockTemplate, id: '1', tags: ['red', 'cross'] }
      const template2 = { ...mockTemplate, id: '2', tags: ['blue', 'circle'] }
      
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([template1, template2])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const results = freshManager.searchTemplates('red')
      
      expect(results).toHaveLength(1)
      expect(results[0].tags).toContain('red')
    })
  })

  describe('updateTemplate', () => {
    it('should update existing template', async () => {
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([mockTemplate])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const success = await freshManager.updateTemplate('test_template', {
        name: 'Updated Template',
        description: 'Updated description'
      })
      
      expect(success).toBe(true)
      
      // Should also save updated template to file
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template by ID', () => {
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([mockTemplate])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const success = freshManager.deleteTemplate('test_template')
      
      expect(success).toBe(true)
      
      const remainingTemplates = freshManager.getAllTemplates()
      expect(remainingTemplates).toHaveLength(0)
    })
  })

  describe('exportTemplate', () => {
    it('should export template as JSON string', () => {
      // Set up localStorage mock data
      mockLocalStorage['spritemaker_templates'] = JSON.stringify([mockTemplate])
      
      // Reset and get fresh instance to reload from localStorage
      TemplateManager.resetInstance()
      const freshManager = TemplateManager.getInstance()
      
      const exported = freshManager.exportTemplate('test_template')
      
      expect(exported).toBe(JSON.stringify(mockTemplate, null, 2))
    })
  })

  describe('importTemplate', () => {
    it('should import template from JSON string', () => {
      const jsonData = JSON.stringify(mockTemplate)
      
      const result = templateManager.importTemplate(jsonData)
      
      expect(result).toBeTruthy()
      expect(result!.name).toBe('Test Template')
      expect(result!.id).not.toBe('test_template') // Should generate new ID
    })

    it('should validate template structure', () => {
      const invalidJson = JSON.stringify({
        name: 'Invalid Template'
        // Missing required fields
      })
      
      const result = templateManager.importTemplate(invalidJson)
      
      expect(result).toBeNull()
    })
  })

  describe('generatePreview', () => {
    it('should generate preview data URL from pixels', () => {
      // Mock canvas methods for testing
      const mockCanvas = {
        width: 2,
        height: 1,
        getContext: jest.fn(() => ({
          clearRect: jest.fn(),
          fillStyle: '',
          fillRect: jest.fn()
        })),
        toDataURL: jest.fn(() => 'data:image/png;base64,mock-data')
      }
      
      // Mock document.createElement for canvas
      const originalCreateElement = document.createElement
      document.createElement = jest.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas as any
        }
        return originalCreateElement.call(document, tagName)
      })
      
      const pixels = [
        { x: 0, y: 0, color: '#FF0000', layerId: 1 },
        { x: 1, y: 0, color: '#00FF00', layerId: 1 }
      ]
      
      const preview = TemplateManager.generatePreview(pixels, 2, 1)
      
      expect(preview).toBe('data:image/png;base64,mock-data')
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png')
      
      // Restore original method
      document.createElement = originalCreateElement
    })
  })
})
