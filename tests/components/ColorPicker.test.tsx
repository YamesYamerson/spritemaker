import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ColorPicker from '../../src/components/ColorPicker'
import { Color } from '../../src/types'

// Mock the color utilities
jest.mock('../../src/utils/colorUtils', () => ({
  hsvToRgb: jest.fn((h: number, s: number, v: number) => {
    // Simple mock implementation
    if (h === 0 && s === 100 && v === 100) return '#ff0000';
    if (h === 120 && s === 100 && v === 100) return '#00ff00';
    if (h === 240 && s === 100 && v === 100) return '#0000ff';
    return '#000000';
  }),
  rgbToHsv: jest.fn((color: Color) => {
    // Simple mock implementation
    if (color === '#ff0000') return { h: 0, s: 100, v: 100 };
    if (color === '#00ff00') return { h: 120, s: 100, v: 100 };
    if (color === '#0000ff') return { h: 240, s: 100, v: 100 };
    return { h: 0, s: 0, v: 100 };
  }),
  createSafeGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  safeFillRect: jest.fn(),
  getSafeColor: jest.fn((color: string) => color),
  isValidHexColor: jest.fn((color: string) => /^#[0-9A-Fa-f]{6}$/.test(color))
}));

describe('ColorPicker', () => {
  const defaultProps = {
    primaryColor: '#ff0000',
    onPrimaryColorChange: jest.fn(),
    secondaryColor: '#00ff00',
    onSecondaryColorChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ColorPicker {...defaultProps} />)
    
    // Check for main elements that should exist
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('II')).toBeInTheDocument()
    expect(screen.getByText('Swap Colors')).toBeInTheDocument()
  })

  it('should display the primary color correctly', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const primaryColorDisplay = screen.getByText('II').closest('div')
    expect(primaryColorDisplay).toHaveAttribute('style')
    expect(primaryColorDisplay?.getAttribute('style')).toContain('background-color')
  })

  it('should display the secondary color correctly', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const secondaryColorDisplay = screen.getByText('I').closest('div')
    expect(secondaryColorDisplay).toHaveAttribute('style')
    expect(secondaryColorDisplay?.getAttribute('style')).toContain('background-color')
  })

  it('should handle color swatch clicks', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const colorSwatches = screen.getAllByRole('button', { hidden: true })
    expect(colorSwatches.length).toBeGreaterThan(0)
    
    // Click on the first color swatch
    fireEvent.click(colorSwatches[0])
    expect(defaultProps.onPrimaryColorChange).toHaveBeenCalled()
  })

  it('should handle hex input changes', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const hexInput = screen.getByDisplayValue('#ff0000')
    expect(hexInput).toBeInTheDocument()
    
    // Verify the input can be interacted with
    fireEvent.change(hexInput, { target: { value: '#00ff00' } })
    
    // The input should still exist and be functional
    expect(hexInput).toBeInTheDocument()
  })

  it('should render swap colors button', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const swapButton = screen.getByText('Swap Colors')
    expect(swapButton).toBeInTheDocument()
    expect(swapButton.tagName).toBe('BUTTON')
  })

  it('should handle swap colors correctly', () => {
    render(<ColorPicker {...defaultProps} />)
    
    const swapButton = screen.getByText('Swap Colors')
    fireEvent.click(swapButton)
    
    expect(defaultProps.onPrimaryColorChange).toHaveBeenCalledWith(defaultProps.secondaryColor)
    expect(defaultProps.onSecondaryColorChange).toHaveBeenCalledWith(defaultProps.primaryColor)
  })

  it('should handle edge cases gracefully', () => {
    // Test with invalid props
    const invalidProps = {
      ...defaultProps,
      primaryColor: 'invalid-color' as Color
    }
    
    // Should not crash
    render(<ColorPicker {...invalidProps} />)
    
    // Check for main elements that should exist
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('II')).toBeInTheDocument()
  })
});
