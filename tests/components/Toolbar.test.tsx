import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Toolbar from '../../src/components/Toolbar'
import { Tool, Color, GridSettings } from '../../src/types'

describe('Toolbar', () => {
  const defaultProps = {
    selectedTool: 'pencil' as Tool,
    onToolSelect: jest.fn(),
    primaryColor: '#ff0000' as Color,
    onPrimaryColorChange: jest.fn(),
    secondaryColor: '#0000ff' as Color,
    onSecondaryColorChange: jest.fn(),
    brushSize: 2,
    onBrushSizeChange: jest.fn(),
    gridSettings: {
      visible: false,
      color: '#333',
      opacity: 0.5,
      quarter: false,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    } as GridSettings,
    onGridSettingsChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByText('Brush:')).toBeInTheDocument()
    expect(screen.getByText('2px')).toBeInTheDocument()
  })

  it('should display brush size control with correct styling', () => {
    render(<Toolbar {...defaultProps} />)

    const brushControl = screen.getByText('Brush:').closest('div[style*="background"]')
    expect(brushControl).toBeInTheDocument()
    expect(brushControl).toHaveStyle('background: rgb(74, 74, 74)')
    expect(brushControl).toHaveStyle('border: 1px solid #666')
    expect(brushControl).toHaveStyle('border-radius: 4px')
  })

  it('should display current brush size', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByText('2px')).toBeInTheDocument()
  })

  it('should call onBrushSizeChange when brush size is changed', () => {
    render(<Toolbar {...defaultProps} />)
    
    const brushSizeSelect = screen.getByDisplayValue('2')
    fireEvent.change(brushSizeSelect, { target: { value: '3' } })
    
    expect(defaultProps.onBrushSizeChange).toHaveBeenCalledWith(3)
  })

  it('should display all drawing tools', () => {
    render(<Toolbar {...defaultProps} />)
    
    expect(screen.getByTitle('Pencil')).toBeInTheDocument()
    expect(screen.getByTitle('Eraser')).toBeInTheDocument()
    expect(screen.getByTitle('Fill')).toBeInTheDocument()
    expect(screen.getByTitle('Eyedropper')).toBeInTheDocument()
    expect(screen.getByTitle('Rectangle')).toBeInTheDocument()
    expect(screen.getByTitle('Circle')).toBeInTheDocument()
    expect(screen.getByTitle('Line')).toBeInTheDocument()
  })

  it('should highlight selected tool', () => {
    render(<Toolbar {...defaultProps} selectedTool="eraser" />)
    
    const eraserButton = screen.getByTitle('Eraser')
    const pencilButton = screen.getByTitle('Pencil')
    
    expect(eraserButton).toHaveClass('active')
    expect(pencilButton).not.toHaveClass('active')
  })

  it('should call onToolSelect when tool is clicked', () => {
    render(<Toolbar {...defaultProps} />)
    
    const eraserButton = screen.getByTitle('Eraser')
    fireEvent.click(eraserButton)
    
    expect(defaultProps.onToolSelect).toHaveBeenCalledWith('eraser')
  })

  it('should display grid toggle button', () => {
    render(<Toolbar {...defaultProps} />)
    
    const gridButton = screen.getByTitle('Show Grid - Currently OFF')
    expect(gridButton).toBeInTheDocument()
  })

  it('should toggle grid visibility when grid button is clicked', () => {
    render(<Toolbar {...defaultProps} />)
    
    const gridButton = screen.getByTitle('Show Grid - Currently OFF')
    fireEvent.click(gridButton)
    
    expect(defaultProps.onGridSettingsChange).toHaveBeenCalledWith({
      ...defaultProps.gridSettings,
      visible: true
    })
  })

  it('should display grid subdivision tools', () => {
    render(<Toolbar {...defaultProps} />)
    
    expect(screen.getByTitle('Quarter Grid - Currently OFF')).toBeInTheDocument()
    expect(screen.getByTitle('Eighths Grid - Currently OFF')).toBeInTheDocument()
    expect(screen.getByTitle('Sixteenths Grid - Currently OFF')).toBeInTheDocument()
    expect(screen.getByTitle('Thirty-Second Grid - Currently OFF')).toBeInTheDocument()
    expect(screen.getByTitle('Sixty-Fourths Grid - Currently OFF')).toBeInTheDocument()
  })

  it('should activate quarter grid when clicked', () => {
    render(<Toolbar {...defaultProps} />)
    
    const quarterButton = screen.getByTitle('Quarter Grid - Currently OFF')
    fireEvent.click(quarterButton)
    
    expect(defaultProps.onGridSettingsChange).toHaveBeenCalledWith({
      ...defaultProps.gridSettings,
      quarter: true,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    })
  })

  it('should deactivate other grids when quarter grid is activated', () => {
    const gridSettingsWithEighths = {
      ...defaultProps.gridSettings,
      eighths: true
    }
    
    render(<Toolbar {...defaultProps} gridSettings={gridSettingsWithEighths} />)
    
    const quarterButton = screen.getByTitle('Quarter Grid - Currently OFF')
    fireEvent.click(quarterButton)
    
    expect(defaultProps.onGridSettingsChange).toHaveBeenCalledWith({
      ...gridSettingsWithEighths,
      quarter: true,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    })
  })

  it('should display color indicator with primary and secondary colors', () => {
    render(<Toolbar {...defaultProps} />)
    
    const colorIndicator = screen.getByTitle('Primary (I) / Secondary (II) Colors')
    expect(colorIndicator).toBeInTheDocument()
    
    // Check for the I and II labels
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('II')).toBeInTheDocument()
  })

  it('should display color indicator with correct styling', () => {
    render(<Toolbar {...defaultProps} />)
    
    const colorIndicator = screen.getByTitle('Primary (I) / Secondary (II) Colors')
    expect(colorIndicator).toHaveStyle('width: 36px')
    expect(colorIndicator).toHaveStyle('height: 36px')
    expect(colorIndicator).toHaveStyle('border: 2px solid #666')
    expect(colorIndicator).toHaveStyle('border-radius: 4px')
  })

  it('should maintain proper spacing and layout', () => {
    render(<Toolbar {...defaultProps} />)
    
    const toolbar = screen.getByText('Brush:').closest('.toolbar')
    expect(toolbar).toBeInTheDocument()
    
    // Check that the spacer exists to maintain centering
    const spacer = toolbar?.querySelector('div[style*="width: 200px"]')
    expect(spacer).toBeInTheDocument()
  })

  it('should handle brush size changes safely', () => {
    const mockOnBrushSizeChange = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    
    render(<Toolbar {...defaultProps} onBrushSizeChange={mockOnBrushSizeChange} />)
    
    const brushSizeSelect = screen.getByDisplayValue('2')
    
    // Should not crash when callback throws error
    expect(() => {
      fireEvent.change(brushSizeSelect, { target: { value: '3' } })
    }).not.toThrow()
  })

  it('should handle tool selection safely', () => {
    const mockOnToolSelect = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    
    render(<Toolbar {...defaultProps} onToolSelect={mockOnToolSelect} />)
    
    const eraserButton = screen.getByTitle('Eraser')
    
    // Should not crash when callback throws error
    expect(() => {
      fireEvent.click(eraserButton)
    }).not.toThrow()
  })

  it('should handle grid settings changes safely', () => {
    const mockOnGridSettingsChange = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    
    render(<Toolbar {...defaultProps} onGridSettingsChange={mockOnGridSettingsChange} />)
    
    const gridButton = screen.getByTitle('Show Grid - Currently OFF')
    
    // Should not crash when callback throws error
    expect(() => {
      fireEvent.click(gridButton)
    }).not.toThrow()
  })

  it('should display correct grid button states', () => {
    const gridSettingsWithVisible = {
      ...defaultProps.gridSettings,
      visible: true,
      quarter: true
    }
    
    render(<Toolbar {...defaultProps} gridSettings={gridSettingsWithVisible} />)
    
    expect(screen.getByTitle('Show Grid - Currently ON')).toBeInTheDocument()
    expect(screen.getByTitle('Quarter Grid - Currently ON')).toBeInTheDocument()
  })

  it('should handle missing grid settings gracefully', () => {
    render(<Toolbar {...defaultProps} gridSettings={undefined as any} />)
    
    // Should still render without crashing
    expect(screen.getByText('Brush:')).toBeInTheDocument()
    expect(screen.getByTitle('Show Grid - Currently OFF')).toBeInTheDocument()
  })

  it('should display brush size visual representation', () => {
    render(<Toolbar {...defaultProps} brushSize={3} />)
    
    const brushSizeSelect = screen.getByDisplayValue('3')
    expect(brushSizeSelect).toBeInTheDocument()
    
    // Check that the visual brush size circle exists
    const brushCircle = screen.getByText('3px').parentElement?.querySelector('div[style*="border-radius: 50%"]')
    expect(brushCircle).toBeInTheDocument()
  })

  it('should have proper tool button styling', () => {
    render(<Toolbar {...defaultProps} />)
    
    const pencilButton = screen.getByTitle('Pencil')
    expect(pencilButton).toHaveClass('tool-button')
    expect(pencilButton).toHaveClass('active')
  })

  it('should maintain tool button spacing', () => {
    render(<Toolbar {...defaultProps} />)
    
    const gridButton = screen.getByTitle('Show Grid - Currently OFF')
    expect(gridButton).toHaveStyle('margin-left: 8px')
  })

  it('should display color indicator with correct colors', () => {
    render(<Toolbar {...defaultProps} />)
    
    const colorIndicator = screen.getByTitle('Primary (I) / Secondary (II) Colors')
    
    // The colors should be applied via inline styles on child divs
    const colorDivs = colorIndicator.querySelectorAll('div[style*="background-color"]')
    expect(colorDivs.length).toBeGreaterThan(0)
  })

  it('should handle rapid state changes without crashing', () => {
    const { rerender } = render(<Toolbar {...defaultProps} />)
    
    // Rapidly change props
    for (let i = 0; i < 10; i++) {
      rerender(<Toolbar {...defaultProps} selectedTool={i % 2 === 0 ? 'pencil' : 'eraser'} />)
      rerender(<Toolbar {...defaultProps} brushSize={(i % 4) + 1} />)
    }
    
    expect(screen.getByTitle('Pencil')).toBeInTheDocument()
  })

  it('should maintain brush size control functionality', () => {
    render(<Toolbar {...defaultProps} />)
    
    const brushControl = screen.getByText('Brush:').closest('div[style*="background"]')
    expect(brushControl).toHaveAttribute('style')
    expect(brushControl?.getAttribute('style')).toContain('cursor: pointer')
    
    // Clicking should focus the hidden select
    fireEvent.click(brushControl!)
    
    const brushSizeSelect = screen.getByDisplayValue('2')
    expect(brushSizeSelect).toBeInTheDocument()
  })

  it('should display all brush size options', () => {
    render(<Toolbar {...defaultProps} />)
    
    const brushSizeSelect = screen.getByDisplayValue('2')
    expect(brushSizeSelect).toBeInTheDocument()
    
    // Check that all brush sizes are available
    const options = Array.from(brushSizeSelect.querySelectorAll('option'))
    expect(options).toHaveLength(4) // 1, 2, 3, 4
    expect(options.map(opt => opt.value)).toEqual(['1', '2', '3', '4'])
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing props gracefully', () => {
      const minimalProps = {
        selectedTool: 'pencil' as const,
        onToolSelect: jest.fn(),
        primaryColor: '#ff0000',
        onPrimaryColorChange: jest.fn(),
        secondaryColor: '#0000ff',
        onSecondaryColorChange: jest.fn(),
        brushSize: 1,
        onBrushSizeChange: jest.fn(),
        gridSettings: defaultProps.gridSettings,
        onGridSettingsChange: jest.fn()
      }
      
      render(<Toolbar {...minimalProps} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      expect(screen.getByText('Brush:')).toBeInTheDocument()
    })

    it('should handle missing grid settings gracefully', () => {
      const propsWithoutGrid = { ...defaultProps }
      delete (propsWithoutGrid as any).gridSettings
      
      render(<Toolbar {...propsWithoutGrid} gridSettings={{} as any} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash when grid settings are missing
    })

    it('should handle invalid grid settings gracefully', () => {
      const propsWithInvalidGrid = {
        ...defaultProps,
        gridSettings: {
          visible: 'invalid' as any,
          color: 'invalid-color' as any,
          opacity: 'not-a-number' as any,
          quarter: 'invalid' as any,
          eighths: 'true' as any,
          sixteenths: false,
          thirtyseconds: false,
          sixtyfourths: false
        }
      }
      
      render(<Toolbar {...propsWithInvalidGrid} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with invalid grid settings
    })

    it('should handle missing callback functions gracefully', () => {
      const propsWithoutCallbacks = { ...defaultProps }
      delete (propsWithoutCallbacks as any).onToolSelect
      delete (propsWithoutCallbacks as any).onPrimaryColorChange
      delete (propsWithoutCallbacks as any).onSecondaryColorChange
      delete (propsWithoutCallbacks as any).onBrushSizeChange
      
      render(<Toolbar {...propsWithoutCallbacks} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash when callbacks are missing
    })

    it('should handle invalid color values gracefully', () => {
      const propsWithInvalidColors = {
        ...defaultProps,
        primaryColor: 'invalid-color' as any,
        secondaryColor: null as any
      }
      
      render(<Toolbar {...propsWithInvalidColors} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with invalid colors
    })

    it('should handle invalid brush sizes gracefully', () => {
      const propsWithInvalidBrushSize = {
        ...defaultProps,
        brushSize: -1
      }
      
      render(<Toolbar {...propsWithInvalidBrushSize} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with invalid brush size
    })

    it('should handle extremely large brush sizes gracefully', () => {
      const propsWithLargeBrushSize = {
        ...defaultProps,
        brushSize: 1000000
      }
      
      render(<Toolbar {...propsWithLargeBrushSize} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with extremely large brush size
    })

    it('should handle invalid selected tool gracefully', () => {
      const propsWithInvalidTool = {
        ...defaultProps,
        selectedTool: 'invalid-tool' as any
      }
      
      render(<Toolbar {...propsWithInvalidTool} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with invalid tool
    })

    it('should handle missing selected tool gracefully', () => {
      const propsWithoutTool = { ...defaultProps }
      delete (propsWithoutTool as any).selectedTool
      
      render(<Toolbar {...propsWithoutTool} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash when selected tool is missing
    })

    it('should handle callback functions that throw errors gracefully', () => {
      const errorCallbacks = {
        ...defaultProps,
        onToolSelect: jest.fn().mockImplementation(() => {
          throw new Error('Tool selection error')
        }),
        onBrushSizeChange: jest.fn().mockImplementation(() => {
          throw new Error('Brush size change error')
        }),
        onPrimaryColorChange: jest.fn().mockImplementation(() => {
          throw new Error('Primary color change error')
        }),
        onSecondaryColorChange: jest.fn().mockImplementation(() => {
          throw new Error('Secondary color change error')
        })
      }
      
      render(<Toolbar {...errorCallbacks} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      
      // Should not crash when callbacks throw errors
      const pencilButton = screen.getByTitle('Pencil')
      fireEvent.click(pencilButton)
      
      expect(errorCallbacks.onToolSelect).toHaveBeenCalled()
    })

    it('should handle rapid tool selection gracefully', () => {
      const { rerender } = render(<Toolbar {...defaultProps} />)
      
      // Rapidly change selected tool
      for (let i = 0; i < 20; i++) {
        const tool = ['pencil', 'eraser', 'fill', 'eyedropper'][i % 4] as any
        rerender(<Toolbar {...defaultProps} selectedTool={tool} />)
      }
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash under rapid tool changes
    })

    it('should handle rapid brush size changes gracefully', () => {
      const { rerender } = render(<Toolbar {...defaultProps} />)
      
      // Rapidly change brush size
      for (let i = 0; i < 20; i++) {
        const brushSize = (i % 4) + 1
        rerender(<Toolbar {...defaultProps} brushSize={brushSize} />)
      }
      
      expect(screen.getByText('Brush:')).toBeInTheDocument()
      // Should not crash under rapid brush size changes
    })

    it('should handle rapid color changes gracefully', () => {
      const { rerender } = render(<Toolbar {...defaultProps} />)
      
      // Rapidly change colors
      for (let i = 0; i < 20; i++) {
        const color = `#${i.toString(16).padStart(6, '0')}`
        rerender(<Toolbar {...defaultProps} primaryColor={color} />)
      }
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash under rapid color changes
    })

    it('should handle component unmounting during interactions gracefully', () => {
      const { unmount } = render(<Toolbar {...defaultProps} />)
      
      const pencilButton = screen.getByTitle('Pencil')
      
      // Start interaction
      fireEvent.mouseDown(pencilButton)
      
      // Unmount during interaction
      unmount()
      
      // Should not crash
      expect(screen.queryByTitle('Pencil')).not.toBeInTheDocument()
    })

    it('should handle missing DOM elements gracefully', () => {
      // Mock querySelector to return null
      const originalQuerySelector = document.querySelector
      document.querySelector = jest.fn(() => null)
      
      render(<Toolbar {...defaultProps} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash when DOM elements are missing
      
      // Restore original method
      document.querySelector = originalQuerySelector
    })

    it('should handle grid settings with missing properties gracefully', () => {
      const incompleteGridSettings = {
        visible: true
        // Missing other properties
      } as any
      
      const propsWithIncompleteGrid = {
        ...defaultProps,
        gridSettings: incompleteGridSettings
      }
      
      render(<Toolbar {...propsWithIncompleteGrid} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with incomplete grid settings
    })

    it('should handle operations with extremely long tool names gracefully', () => {
      const longToolName = 'a'.repeat(1000)
      const propsWithLongTool = {
        ...defaultProps,
        selectedTool: longToolName as any
      }
      
      render(<Toolbar {...propsWithLongTool} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with extremely long tool names
    })

    it('should handle operations with special characters in strings gracefully', () => {
      const specialCharTool = 'pencil-🔧-tool'
      const propsWithSpecialChars = {
        ...defaultProps,
        selectedTool: specialCharTool as any
      }
      
      render(<Toolbar {...propsWithSpecialChars} />)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with special characters
    })

    it('should handle memory pressure gracefully', () => {
      // Test with many rapid re-renders
      const { rerender } = render(<Toolbar {...defaultProps} />)
      
      for (let i = 0; i < 100; i++) {
        rerender(<Toolbar {...defaultProps} brushSize={(i % 4) + 1} />)
      }
      
      expect(screen.getByText('Brush:')).toBeInTheDocument()
      // Should not crash under memory pressure
    })

    it('should handle concurrent state updates gracefully', () => {
      const { rerender } = render(<Toolbar {...defaultProps} />)
      
      // Simulate concurrent updates
      setTimeout(() => {
        rerender(<Toolbar {...defaultProps} selectedTool="eraser" />)
      }, 0)
      
      setTimeout(() => {
        rerender(<Toolbar {...defaultProps} brushSize={4} />)
      }, 0)
      
      expect(screen.getByTitle('Pencil')).toBeInTheDocument()
      // Should not crash with concurrent updates
    })
  })
})
