import { SavedTemplate, PixelData } from '../types'

const TEMPLATE_STORAGE_KEY = 'spritemaker_templates'

export class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, SavedTemplate> = new Map()

  private constructor() {
    this.loadTemplates()
  }

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  // For testing purposes - reset the singleton instance
  static resetInstance(): void {
    TemplateManager.instance = undefined as any
  }

  // Save current canvas as a template
  async saveTemplate(
    name: string,
    description: string,
    width: number,
    height: number,
    pixels: Map<string, PixelData>,
    tags: string[] = []
  ): Promise<SavedTemplate> {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()
    
    const template: SavedTemplate = {
      id,
      name,
      description,
      width,
      height,
      pixels: Array.from(pixels.values()),
      createdAt: now,
      updatedAt: now,
      tags
    }

    // Save to memory
    this.templates.set(id, template)
    
    // Save to localStorage as backup
    this.saveTemplates()
    
    // Save to file system
    try {
      await this.saveTemplateToFile(template)
    } catch (error) {
      console.error('Failed to save template to file:', error)
      // Continue with localStorage backup
    }
    
    return template
  }

  // Save template as JSON file
  private async saveTemplateToFile(template: SavedTemplate): Promise<void> {
    const templateData = JSON.stringify(template, null, 2)
    
    try {
      // For development: save directly to templates folder
      const response = await fetch('/api/save-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${template.width}x${template.height}.json`,
          content: templateData,
          size: `${template.width}x${template.height}`
        })
      })
      
      const responseText = await response.text()
      
      if (response.ok) {
        // Template saved successfully
      } else {
        throw new Error(`Failed to save to templates folder: ${response.status} ${responseText}`)
      }
    } catch (error) {
      console.error('Failed to save to templates folder, falling back to download:', error)
      
      // Fallback: download the file
      const blob = new Blob([templateData], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      
      const filename = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${template.width}x${template.height}.json`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }
  }

  // Load template from JSON file
  async loadTemplateFromFile(file: File): Promise<SavedTemplate | null> {
    try {
      const text = await file.text()
      const template = JSON.parse(text) as SavedTemplate
      
      // Validate template structure
      if (!template.name || !template.width || !template.height || !template.pixels) {
        throw new Error('Invalid template format')
      }

      // Generate new ID to avoid conflicts
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = Date.now()
      
      const importedTemplate: SavedTemplate = {
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      }

      // Add to memory and localStorage
      this.templates.set(id, importedTemplate)
      this.saveTemplates()
      
      return importedTemplate
    } catch (error) {
      console.error('Failed to import template from file:', error)
      return null
    }
  }

  // Get all templates
  getAllTemplates(): SavedTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  // Get template by ID
  getTemplate(id: string): SavedTemplate | undefined {
    return this.templates.get(id)
  }

  // Update template
  async updateTemplate(id: string, updates: Partial<SavedTemplate>): Promise<boolean> {
    const template = this.templates.get(id)
    if (!template) return false

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now()
    }

    this.templates.set(id, updatedTemplate)
    this.saveTemplates()
    
    // Also save updated template to file
    try {
      await this.saveTemplateToFile(updatedTemplate)
    } catch (error) {
      console.error('Failed to save updated template to file:', error)
    }
    
    return true
  }

  // Delete template
  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id)
    if (deleted) {
      this.saveTemplates()
    }
    return deleted
  }

  // Search templates by name or tags
  searchTemplates(query: string): SavedTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.templates.values()).filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // Get templates by size
  getTemplatesBySize(width: number, height: number): SavedTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.width === width && template.height === height
    )
  }

  // Export template to JSON
  exportTemplate(id: string): string | null {
    const template = this.templates.get(id)
    if (!template) return null
    
    return JSON.stringify(template, null, 2)
  }

  // Import template from JSON
  importTemplate(jsonData: string): SavedTemplate | null {
    try {
      const template = JSON.parse(jsonData) as SavedTemplate
      
      // Validate template structure
      if (!template.name || !template.width || !template.height || !template.pixels) {
        throw new Error('Invalid template format')
      }

      // Generate new ID to avoid conflicts
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = Date.now()
      
      const importedTemplate: SavedTemplate = {
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      }

      this.templates.set(id, importedTemplate)
      this.saveTemplates()
      
      return importedTemplate
    } catch (error) {
      console.error('Failed to import template:', error)
      return null
    }
  }

  // Private methods for persistence
  private saveTemplates(): void {
    try {
      const templatesArray = Array.from(this.templates.values())
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templatesArray))
    } catch (error) {
      console.error('Failed to save templates to localStorage:', error)
    }
  }

  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      if (stored) {
        const templatesArray = JSON.parse(stored) as SavedTemplate[]
        this.templates.clear()
        templatesArray.forEach(template => {
          this.templates.set(template.id, template)
        })
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error)
    }
  }

  // Generate preview data URL from pixels
  static generatePreview(pixels: PixelData[], width: number, height: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''

    // Clear with transparent background
    ctx.clearRect(0, 0, width, height)
    
    // Draw pixels
    pixels.forEach(pixel => {
      if (pixel.color !== 'transparent') {
        ctx.fillStyle = pixel.color
        ctx.fillRect(pixel.x, pixel.y, 1, 1)
      }
    })
    
    return canvas.toDataURL('image/png')
  }
}
