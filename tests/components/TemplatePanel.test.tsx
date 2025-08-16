import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplatePanel from '../../src/components/TemplatePanel'

describe('TemplatePanel', () => {
  const defaultProps = {
    onTemplateSelect: jest.fn(),
    currentCanvasSize: 32
  }

  it('should render without crashing', () => {
    render(<TemplatePanel {...defaultProps} />)
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('should display the egg template', () => {
    render(<TemplatePanel {...defaultProps} />)
    expect(screen.getByText('Egg')).toBeInTheDocument()
  })

  it('should show size selection buttons', () => {
    render(<TemplatePanel {...defaultProps} />)
    expect(screen.getByText('16x16')).toBeInTheDocument()
    expect(screen.getByText('32x32')).toBeInTheDocument()
    expect(screen.getByText('64x64')).toBeInTheDocument()
  })

  it('should highlight current canvas size', () => {
    render(<TemplatePanel {...defaultProps} />)
    const currentSizeButton = screen.getByText('32x32')
    expect(currentSizeButton).toHaveStyle({ backgroundColor: '#4a7cff' })
  })

  it('should handle template selection', () => {
    render(<TemplatePanel {...defaultProps} />)
    const applyButton = screen.getByText('Apply Template')
    fireEvent.click(applyButton)
    expect(defaultProps.onTemplateSelect).toHaveBeenCalled()
  })

  it('should handle collapse/expand', () => {
    render(<TemplatePanel {...defaultProps} />)
    
    // Initially expanded
    expect(screen.getByText('Egg')).toBeInTheDocument()
    
    // Click collapse button
    const collapseButton = screen.getByTitle('Collapse')
    fireEvent.click(collapseButton)
    
    // Should be collapsed (only header visible)
    expect(screen.getByText('Templates')).toBeInTheDocument()
    expect(screen.queryByText('Egg')).not.toBeInTheDocument()
    
    // Click expand button
    const expandButton = screen.getByTitle('Expand')
    fireEvent.click(expandButton)
    
    // Should be expanded again
    expect(screen.getByText('Egg')).toBeInTheDocument()
  })
})
