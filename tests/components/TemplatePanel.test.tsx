import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplatePanel from '../../src/components/TemplatePanel'

// Mock the template selection callback
const mockOnTemplateSelect = jest.fn()

describe('TemplatePanel', () => {
  const defaultProps = {
    canvasSize: 32,
    onTemplateSelect: mockOnTemplateSelect
  }

  beforeEach(() => {
    mockOnTemplateSelect.mockClear()
  })

  describe('Basic Rendering', () => {
    it('should render the template panel header', () => {
      render(<TemplatePanel {...defaultProps} />)
      expect(screen.getByText('Sprite Templates')).toBeInTheDocument()
    })

    it('should show the egg template', () => {
      render(<TemplatePanel {...defaultProps} />)
      expect(screen.getByText('Egg Sprite')).toBeInTheDocument()
      expect(screen.getByText('A simple egg sprite')).toBeInTheDocument()
    })

    it('should show the correct canvas size', () => {
      render(<TemplatePanel {...defaultProps} />)
      expect(screen.getByText('Size: 32x32 ✓')).toBeInTheDocument()
    })
  })

  describe('Template Data Structure', () => {
    it('should have valid egg template data for 32x32', () => {
      render(<TemplatePanel {...defaultProps} />)
      
      // The egg template should exist and have data
      const templateElement = screen.getByText('Egg Sprite').closest('div')
      expect(templateElement).toBeInTheDocument()
      
      // Click to trigger template selection
      fireEvent.click(templateElement!)
      
      // Check that the modal appears
      expect(screen.getByText('Do you want to apply the "Egg Sprite" template?')).toBeInTheDocument()
    })

    it('should show size compatibility correctly', () => {
      // Test with 16x16 canvas
      render(<TemplatePanel canvasSize={16} onTemplateSelect={mockOnTemplateSelect} />)
      expect(screen.getByText('Size: 16x16 ✓')).toBeInTheDocument()
      
      // Test with 64x64 canvas
      render(<TemplatePanel canvasSize={64} onTemplateSelect={mockOnTemplateSelect} />)
      expect(screen.getByText('Size: 64x64 ✓')).toBeInTheDocument()
    })
  })

  describe('Template Selection Flow', () => {
    it('should show modal when template is clicked', () => {
      render(<TemplatePanel {...defaultProps} />)
      
      const templateElement = screen.getByText('Egg Sprite').closest('div')
      fireEvent.click(templateElement!)
      
      expect(screen.getByText('Do you want to apply the "Egg Sprite" template?')).toBeInTheDocument()
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    it('should call onTemplateSelect when Yes is clicked', () => {
      render(<TemplatePanel {...defaultProps} />)
      
      // Click template to show modal
      const templateElement = screen.getByText('Egg Sprite').closest('div')
      fireEvent.click(templateElement!)
      
      // Click Yes to confirm
      const yesButton = screen.getByText('Yes')
      fireEvent.click(yesButton)
      
      // Should call the callback with template data
      expect(mockOnTemplateSelect).toHaveBeenCalledTimes(1)
      expect(mockOnTemplateSelect).toHaveBeenCalledWith(expect.any(Array))
    })

    it('should not call onTemplateSelect when No is clicked', () => {
      render(<TemplatePanel {...defaultProps} />)
      
      // Click template to show modal
      const templateElement = screen.getByText('Egg Sprite').closest('div')
      fireEvent.click(templateElement!)
      
      // Click No to cancel
      const noButton = screen.getByText('No')
      fireEvent.click(noButton)
      
      // Should not call the callback
      expect(mockOnTemplateSelect).not.toHaveBeenCalled()
    })
  })

  describe('Template Data Validation', () => {
    it('should have valid egg template structure', () => {
      render(<TemplatePanel {...defaultProps} />)
      
      // Click template to trigger selection
      const templateElement = screen.getByText('Egg Sprite').closest('div)
      fireEvent.click(templateElement!)
      
      // Click Yes to get template data
      const yesButton = screen.getByText('Yes')
      fireEvent.click(yesButton)
      
      // Verify the callback was called with valid data
      expect(mockOnTemplateSelect).toHaveBeenCalledWith(expect.any(Array))
      
      const templateData = mockOnTemplateSelect.mock.calls[0][0]
      
      // Template should be a 2D array
      expect(Array.isArray(templateData)).toBe(true)
      expect(templateData.length).toBeGreaterThan(0)
      expect(Array.isArray(templateData[0])).toBe(true)
      
      // Should contain some white pixels (#fff)
      const hasWhitePixels = templateData.some(row => 
        row.some(pixel => pixel === '#fff')
      )
      expect(hasWhitePixels).toBe(true)
      
      // Should contain some empty pixels
      const hasEmptyPixels = templateData.some(pixel => 
        row.some(pixel => pixel === '' || pixel === undefined)
      )
      expect(hasEmptyPixels).toBe(true)
    })
  })
})
