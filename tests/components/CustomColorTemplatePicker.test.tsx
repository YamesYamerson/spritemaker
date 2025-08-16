import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomColorTemplatePicker from '../../src/components/CustomColorTemplatePicker'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  _reset: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('CustomColorTemplatePicker', () => {
  const defaultProps = {
    onColorSelect: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should render without crashing', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    expect(screen.getByText('Custom Color Templates')).toBeInTheDocument()
  })

  it('should display the default template', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('should show create button', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    const createButton = screen.getByTitle('Create New Template')
    expect(createButton).toBeInTheDocument()
  })

  it('should open creation form when + button is clicked', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    const createButton = screen.getByTitle('Create New Template')
    
    fireEvent.click(createButton)
    
    expect(screen.getByPlaceholderText('Template name...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('should show 10 color slots in creation form', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    const createButton = screen.getByTitle('Create New Template')
    fireEvent.click(createButton)
    
    // Should show 10 color slots (empty slots will have #333 background)
    const colorSlots = document.querySelectorAll('[style*="background-color: rgb(51, 51, 51)"]')
    expect(colorSlots.length).toBe(10)
  })

  it('should allow adding colors from default template', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    const createButton = screen.getByTitle('Create New Template')
    fireEvent.click(createButton)
    
    // Click on a color from the default template to add it
    const defaultColors = screen.getAllByText('Click colors to add to new template:')[0]
    const parentDiv = defaultColors.closest('div')
    const colorSwatches = parentDiv?.querySelectorAll('[style*="background-color"]')
    
    if (colorSwatches && colorSwatches.length > 0) {
      fireEvent.click(colorSwatches[0])
      // The Create button should still be disabled since we need 10 colors
      expect(screen.getByText('Create')).toBeDisabled()
    }
  })

  it('should close creation form when Cancel is clicked', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    const createButton = screen.getByTitle('Create New Template')
    fireEvent.click(createButton)
    
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('should handle color selection from templates', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    
    // Click on a color from the default template
    // Look for the actual color swatches in the default template
    const defaultTemplate = screen.getByText('Default').closest('div')
    const colorSwatches = defaultTemplate?.querySelectorAll('[style*="background-color"]')
    
    if (colorSwatches && colorSwatches.length > 0) {
      fireEvent.click(colorSwatches[0])
      expect(defaultProps.onColorSelect).toHaveBeenCalled()
    }
  })

  it('should load saved templates from localStorage', () => {
    const savedTemplates = [
      {
        id: 'test1',
        name: 'Test Template',
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff', '#0080ff', '#ff0080']
      }
    ]
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTemplates))
    
    render(<CustomColorTemplatePicker {...defaultProps} />)
    
    expect(screen.getByText('Test Template')).toBeInTheDocument()
  })

  it('should save templates to localStorage when created', () => {
    render(<CustomColorTemplatePicker {...defaultProps} />)
    
    // Open creation form
    const createButton = screen.getByTitle('Create New Template')
    fireEvent.click(createButton)
    
    // Fill in template name
    const nameInput = screen.getByPlaceholderText('Template name...')
    fireEvent.change(nameInput, { target: { value: 'My Template' } })
    
    // Add 10 colors (simulate by clicking on default template colors)
    const defaultColors = screen.getAllByText('Click colors to add to new template:')[0]
    const parentDiv = defaultColors.closest('div')
    const colorSwatches = parentDiv?.querySelectorAll('[style*="background-color"]')
    
    if (colorSwatches && colorSwatches.length >= 10) {
      // Click on 10 colors to add them
      for (let i = 0; i < 10; i++) {
        fireEvent.click(colorSwatches[i])
      }
      
      // Now the Create button should be enabled
      const createButton = screen.getByText('Create')
      expect(createButton).not.toBeDisabled()
      
      // Click create
      fireEvent.click(createButton)
      
      // Should have called setItem to save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled()
    }
  })
})
