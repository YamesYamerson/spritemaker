import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplatePanel from '../../src/components/TemplatePanel'
import { TemplateManager } from '../../src/utils/templateManager'
import { SavedTemplate } from '../../src/types'

// Mock TemplateManager
jest.mock('../../src/utils/templateManager')

const mockTemplateManager = {
  getInstance: jest.fn(),
  getAllTemplates: jest.fn(),
  getTemplatesBySize: jest.fn(),
  saveTemplate: jest.fn(),
  deleteTemplate: jest.fn()
}

const MockedTemplateManager = TemplateManager as jest.MockedClass<typeof TemplateManager>

describe('TemplatePanel', () => {
  const mockCanvasRef = {
    current: {
      getCurrentPixels: jest.fn(() => new Map([['0,0', { x: 0, y: 0, color: '#FF0000', layerId: 1 }]])),
      getCanvasSize: jest.fn(() => 32)
    }
  }

  const mockTemplates: SavedTemplate[] = [
    {
      id: 'template1',
      name: 'Test Template 32x32',
      description: 'A test template',
      width: 32,
      height: 32,
      pixels: [{ x: 0, y: 0, color: '#FF0000', layerId: 1 }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['test', '32x32']
    },
    {
      id: 'template2',
      name: 'Test Template 64x64',
      description: 'Another test template',
      width: 64,
      height: 64,
      pixels: [{ x: 0, y: 0, color: '#00FF00', layerId: 1 }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['test', '64x64']
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    MockedTemplateManager.getInstance.mockReturnValue(mockTemplateManager as any)
    mockTemplateManager.getAllTemplates.mockReturnValue(mockTemplates)
    mockTemplateManager.getTemplatesBySize.mockReturnValue([])
    mockTemplateManager.saveTemplate.mockResolvedValue(mockTemplates[0])
    mockTemplateManager.deleteTemplate.mockReturnValue(true)
  })

  it('renders template panel with correct title and count', () => {
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    expect(screen.getByText('Templates (2)')).toBeInTheDocument()
    expect(screen.getByText('Current Canvas: 32x32')).toBeInTheDocument()
  })

  it('filters templates by current canvas size', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([mockTemplates[0]])
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    // Should only show 32x32 templates
    expect(screen.getByText('Test Template 32x32')).toBeInTheDocument()
    expect(screen.queryByText('Test Template 64x64')).not.toBeInTheDocument()
  })

  it('shows message when no templates exist for current size', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([])
    
    render(<TemplatePanel currentCanvasSize={16} canvasRef={mockCanvasRef as any} />)
    
    expect(screen.getByText('No templates for 16x16 canvas. Create one by drawing and saving!')).toBeInTheDocument()
  })

  it('opens save modal when save button is clicked', () => {
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
    
    expect(screen.getByText('Save as Template')).toBeInTheDocument()
  })

  it('saves template with correct data when save form is submitted', async () => {
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    // Open save modal
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
    
    // Fill form
    const nameInput = screen.getByPlaceholderText('Enter template name')
    const descriptionInput = screen.getByPlaceholderText('Describe your template (optional)')
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas (optional)')
    
    fireEvent.change(nameInput, { target: { value: 'My Template' } })
    fireEvent.change(descriptionInput, { target: { value: 'A great template' } })
    fireEvent.change(tagsInput, { target: { value: 'awesome, pixel-art' } })
    
    // Submit form
    const saveTemplateButton = screen.getByText('Save Template')
    fireEvent.click(saveTemplateButton)
    
    await waitFor(() => {
      expect(mockTemplateManager.saveTemplate).toHaveBeenCalledWith(
        'My Template',
        'A great template',
        32,
        32,
        expect.any(Map),
        ['awesome', 'pixel-art', '32x32']
      )
    })
  })

  it('shows template details correctly', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([mockTemplates[0]])
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    expect(screen.getByText('Test Template 32x32')).toBeInTheDocument()
    expect(screen.getByText('A test template')).toBeInTheDocument()
    expect(screen.getByText('32x32 • 1 pixels')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('32x32')).toBeInTheDocument()
  })

  it('deletes template when delete button is clicked', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([mockTemplates[0]])
    
    // Mock confirm to return true
    global.confirm = jest.fn(() => true)
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    const deleteButton = screen.getByText('×')
    fireEvent.click(deleteButton)
    
    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?')
    expect(mockTemplateManager.deleteTemplate).toHaveBeenCalledWith('template1')
  })

  it('filters templates by search query', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([mockTemplates[0]])
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'Test' } })
    
    expect(screen.getByText('Test Template 32x32')).toBeInTheDocument()
  })

  it('shows no results message when search has no matches', () => {
    mockTemplateManager.getTemplatesBySize.mockReturnValue([mockTemplates[0]])
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
    
    expect(screen.getByText('No templates found')).toBeInTheDocument()
  })

  it('collapses and expands correctly', () => {
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    // Initially expanded
    expect(screen.getByText('Current Canvas: 32x32')).toBeInTheDocument()
    
    // Collapse
    const collapseButton = screen.getByTitle('Collapse')
    fireEvent.click(collapseButton)
    
    // Should be collapsed
    expect(screen.queryByText('Current Canvas: 32x32')).not.toBeInTheDocument()
    expect(screen.getByText('Templates (2)')).toBeInTheDocument()
    
    // Expand
    const expandButton = screen.getByTitle('Expand')
    fireEvent.click(expandButton)
    
    // Should be expanded again
    expect(screen.getByText('Current Canvas: 32x32')).toBeInTheDocument()
  })

  it('creates sample templates when none exist', () => {
    mockTemplateManager.getAllTemplates.mockReturnValue([])
    mockTemplateManager.getTemplatesBySize.mockReturnValue([])
    
    render(<TemplatePanel currentCanvasSize={32} canvasRef={mockCanvasRef as any} />)
    
    // Should create sample templates
    expect(mockTemplateManager.saveTemplate).toHaveBeenCalled()
  })
})
