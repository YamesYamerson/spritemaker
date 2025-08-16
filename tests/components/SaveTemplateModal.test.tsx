import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SaveTemplateModal from '../../src/components/SaveTemplateModal'

describe('SaveTemplateModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    canvasSize: 32
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when open', () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    expect(screen.getByText('Save as Template')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter template name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe your template (optional)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter tags separated by commas (optional)')).toBeInTheDocument()
    expect(screen.getByText('Save Template')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SaveTemplateModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Save as Template')).not.toBeInTheDocument()
  })

  it('shows current canvas size', () => {
    render(<SaveTemplateModal {...defaultProps} canvasSize={64} />)
    
    // Check that the canvas size information is displayed
    expect(screen.getByText(/Canvas Size:/)).toBeInTheDocument()
    // The text is split, so we check the container has the right content
    const container = screen.getByText(/Canvas Size:/).closest('div')
    expect(container?.textContent).toContain('64')
    expect(container?.textContent).toContain('x')
  })

  it('shows template save location', () => {
    render(<SaveTemplateModal {...defaultProps} canvasSize={128} />)
    
    expect(screen.getByText('Template will be saved to:')).toBeInTheDocument()
    // The path is split, so we check the container has the right content
    const container = screen.getByText('Template will be saved to:').closest('div')
    expect(container?.textContent).toContain('public/templates/')
    expect(container?.textContent).toContain('128')
    expect(container?.textContent).toContain('x')
  })

  it('calls onSave with form data when submitted', async () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    // Fill out the form
    const nameInput = screen.getByPlaceholderText('Enter template name')
    const descriptionInput = screen.getByPlaceholderText('Describe your template (optional)')
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas (optional)')
    
    fireEvent.change(nameInput, { target: { value: 'My Awesome Template' } })
    fireEvent.change(descriptionInput, { target: { value: 'This is a really cool template' } })
    fireEvent.change(tagsInput, { target: { value: 'awesome, pixel-art, character' } })
    
    // Submit the form
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        'My Awesome Template',
        'This is a really cool template',
        ['awesome', 'pixel-art', 'character']
      )
    })
  })

  it('requires template name', async () => {
    // Mock alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<SaveTemplateModal {...defaultProps} />)
    
    // Try to submit without a name
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    expect(mockAlert).toHaveBeenCalledWith('Please enter a template name')
    expect(defaultProps.onSave).not.toHaveBeenCalled()
    
    mockAlert.mockRestore()
  })

  it('handles empty description and tags', async () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    // Only fill name
    const nameInput = screen.getByPlaceholderText('Enter template name')
    fireEvent.change(nameInput, { target: { value: 'Simple Template' } })
    
    // Submit the form
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        'Simple Template',
        '',
        []
      )
    })
  })

  it('trims whitespace from inputs', async () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    // Fill with whitespace
    const nameInput = screen.getByPlaceholderText('Enter template name')
    const descriptionInput = screen.getByPlaceholderText('Describe your template (optional)')
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas (optional)')
    
    fireEvent.change(nameInput, { target: { value: '  Template Name  ' } })
    fireEvent.change(descriptionInput, { target: { value: '  Description  ' } })
    fireEvent.change(tagsInput, { target: { value: '  tag1 , tag2 , tag3  ' } })
    
    // Submit the form
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        'Template Name',
        'Description',
        ['tag1', 'tag2', 'tag3']
      )
    })
  })

  it('filters out empty tags', async () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    const nameInput = screen.getByPlaceholderText('Enter template name')
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas (optional)')
    
    fireEvent.change(nameInput, { target: { value: 'Test Template' } })
    fireEvent.change(tagsInput, { target: { value: 'tag1, , tag2, , tag3' } })
    
    // Submit the form
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        'Test Template',
        '',
        ['tag1', 'tag2', 'tag3']
      )
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose after successful save', async () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    // Fill and submit form
    const nameInput = screen.getByPlaceholderText('Enter template name')
    fireEvent.change(nameInput, { target: { value: 'Test Template' } })
    
    const saveButton = screen.getByText('Save Template')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('resets form when closed', async () => {
    const { rerender } = render(<SaveTemplateModal {...defaultProps} />)
    
    // Fill out the form
    const nameInput = screen.getByPlaceholderText('Enter template name')
    const descriptionInput = screen.getByPlaceholderText('Describe your template (optional)')
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas (optional)')
    
    fireEvent.change(nameInput, { target: { value: 'Test Template' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.change(tagsInput, { target: { value: 'test, tag' } })
    
    // Close the modal
    rerender(<SaveTemplateModal {...defaultProps} isOpen={false} />)
    
    // Reopen the modal
    rerender(<SaveTemplateModal {...defaultProps} isOpen={true} />)
    
    // Form should be reset - wait for state update
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter template name')).toHaveValue('')
      expect(screen.getByPlaceholderText('Describe your template (optional)')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter tags separated by commas (optional)')).toHaveValue('')
    })
  })

  it('auto-focuses name input when opened', () => {
    render(<SaveTemplateModal {...defaultProps} />)
    
    const nameInput = screen.getByPlaceholderText('Enter template name')
    expect(nameInput).toHaveFocus()
  })
})
