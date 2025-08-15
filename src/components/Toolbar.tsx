import React, { useState, useEffect, useRef } from 'react'
import { Tool, Color, GridSettings } from '../types'

interface ToolbarProps {
  selectedTool: Tool
  onToolSelect: (tool: Tool) => void
  primaryColor: Color
  onPrimaryColorChange: (color: Color) => void
  secondaryColor: Color
  onSecondaryColorChange: (color: Color) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  gridSettings: GridSettings
  onGridSettingsChange: (settings: GridSettings) => void
  hasActiveSelection?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  primaryColor,
  secondaryColor,
  brushSize,
  onBrushSizeChange,
  gridSettings,
  onGridSettingsChange,
  hasActiveSelection = false
}) => {
  // Safe grid settings with defaults
  const safeGridSettings = gridSettings || {
    visible: false,
    color: '#333',
    opacity: 0.5,
    quarter: false,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false
  }

  // Safe callback wrappers to prevent crashes from callback errors
  const safeToolSelect = (tool: Tool) => {
    try {
      onToolSelect(tool)
    } catch (error) {
      console.warn('Error in tool selection callback:', error)
    }
  }

  const safeBrushSizeChange = (size: number) => {
    try {
      onBrushSizeChange(size)
    } catch (error) {
      console.warn('Error in brush size change callback:', error)
    }
  }

  const safeGridSettingsChange = (settings: GridSettings) => {
    try {
      onGridSettingsChange(settings)
    } catch (error) {
      console.warn('Error in grid settings change callback:', error)
    }
  }

  // State for dropdown visibility
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false)
  const [isRectangleDropdownOpen, setIsRectangleDropdownOpen] = useState(false)
  const [isCircleDropdownOpen, setIsCircleDropdownOpen] = useState(false)
  const [isBrushDropdownOpen, setIsBrushDropdownOpen] = useState(false)
  
  // State for tracking last selected variants
  const [lastRectangleVariant, setLastRectangleVariant] = useState<'rectangle-border' | 'rectangle-filled'>('rectangle-border')
  const [lastCircleVariant, setLastCircleVariant] = useState<'circle-border' | 'circle-filled'>('circle-border')
  
  const gridDropdownRef = useRef<HTMLDivElement>(null)
  const rectangleDropdownRef = useRef<HTMLDivElement>(null)
  const circleDropdownRef = useRef<HTMLDivElement>(null)
  const brushDropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridDropdownRef.current && !gridDropdownRef.current.contains(event.target as Node)) {
        setIsGridDropdownOpen(false)
      }
      if (rectangleDropdownRef.current && !rectangleDropdownRef.current.contains(event.target as Node)) {
        setIsRectangleDropdownOpen(false)
      }
      if (circleDropdownRef.current && !circleDropdownRef.current.contains(event.target as Node)) {
        setIsCircleDropdownOpen(false)
      }
      if (brushDropdownRef.current && !brushDropdownRef.current.contains(event.target as Node)) {
        setIsBrushDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Helper function to get current grid type for dropdown
  const getCurrentGridType = (): string => {
    if (safeGridSettings.quarter) return 'quarter'
    if (safeGridSettings.eighths) return 'eighths'
    if (safeGridSettings.sixteenths) return 'sixteenths'
    if (safeGridSettings.thirtyseconds) return 'thirtyseconds'
    if (safeGridSettings.sixtyfourths) return 'sixtyfourths'
    return 'none'
  }

  // Helper functions to get current shape tool variants
  const getCurrentRectangleTool = (): 'rectangle-border' | 'rectangle-filled' => {
    if (selectedTool === 'rectangle-border' || selectedTool === 'rectangle-filled') {
      return selectedTool
    }
    return lastRectangleVariant
  }

  const getCurrentCircleTool = (): 'circle-border' | 'circle-filled' => {
    if (selectedTool === 'circle-border' || selectedTool === 'circle-filled') {
      return selectedTool
    }
    return lastCircleVariant
  }

  // Helper function to handle grid type change
  const handleGridTypeChange = (gridType: string) => {
    const newSettings = {
      ...safeGridSettings,
      quarter: false,
      eighths: false,
      sixteenths: false,
      thirtyseconds: false,
      sixtyfourths: false
    }
    
    switch (gridType) {
      case 'quarter':
        newSettings.quarter = true
        break
      case 'eighths':
        newSettings.eighths = true
        break
      case 'sixteenths':
        newSettings.sixteenths = true
        break
      case 'thirtyseconds':
        newSettings.thirtyseconds = true
        break
      case 'sixtyfourths':
        newSettings.sixtyfourths = true
        break
      case 'none':
      default:
        // All grid types are already false
        break
    }
    
    safeGridSettingsChange(newSettings)
  }



  const tools: { id: Tool; name: string; icon: string; iconType: 'svg' | 'png' }[] = [
    { id: 'move-selection', name: 'Move Selection', icon: '/icons/move-selection.svg', iconType: 'svg' },
    { id: 'select', name: 'Select', icon: '/icons/select.svg', iconType: 'svg' },
    { id: 'lasso', name: 'Lasso', icon: '/icons/lasso.svg', iconType: 'svg' },
    { id: 'brush-size', name: 'Brush Size', icon: '', iconType: 'svg' },
    { id: 'pencil', name: 'Pencil', icon: '/icons/pencil.svg', iconType: 'svg' },
    { id: 'eraser', name: 'Eraser', icon: '/icons/eraser.svg', iconType: 'svg' },
    { id: 'fill', name: 'Fill', icon: '/icons/fill.svg', iconType: 'svg' },
    { id: 'eyedropper', name: 'Eyedropper', icon: '/icons/eyedropper.png', iconType: 'png' },
    { id: 'line', name: 'Line', icon: '/icons/line.svg', iconType: 'svg' }
  ]

  return (
    <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>


      {/* Tools and Grid Controls - All in one row */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {tools.map(tool => {
          if (tool.id === 'brush-size') {
            return (
              <div
                key={tool.id}
                ref={brushDropdownRef}
                style={{ 
                  position: 'relative'
                }}
              >
                <button
                  className="tool-button"
                  onClick={() => setIsBrushDropdownOpen(!isBrushDropdownOpen)}
                  title={tool.name}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {/* Create an SVG that matches the exact 20x20px dimensions of other tool icons */}
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
                    {/* Background grid for scale reference */}
                    <defs>
                      <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                        <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="20" height="20" fill="url(#grid)" opacity="0.2"/>
                    
                    {/* Brush size circle - centered in the 20x20px area */}
                    <circle
                      cx="10"
                      cy="10"
                      r={Math.min(brushSize * 1.5, 8)}
                      fill="#000"
                      stroke="#fff"
                      strokeWidth="1"
                    />
                  </svg>
                  
                  {/* Dropdown arrow indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '0',
                    height: '0',
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '4px solid #ccc',
                    fontSize: '8px'
                  }} />
                </button>

                {/* Brush Size Options Dropdown */}
                {isBrushDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    backgroundColor: '#4a4a4a',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    padding: '4px',
                    zIndex: 9999,
                    minWidth: '80px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    marginTop: '2px'
                  }}>
                    {[1, 2, 3, 4].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          safeBrushSizeChange(size)
                          setIsBrushDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          backgroundColor: brushSize === size ? '#666' : 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '2px'
                        }}
                        onMouseEnter={(e) => {
                          if (brushSize !== size) {
                            e.currentTarget.style.backgroundColor = '#555'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (brushSize !== size) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                        title={`${size}px`}
                      >
                        {/* Visual brush size representation */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          position: 'relative'
                        }}>
                          {/* Subtle background grid for scale reference */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `
                              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '3px 3px',
                            opacity: 0.2
                          }} />
                          
                          {/* Brush size circle */}
                          <div style={{
                            width: `${size * 2}px`,
                            height: `${size * 2}px`,
                            backgroundColor: '#000',
                            borderRadius: '50%',
                            border: '1px solid #fff',
                            position: 'relative',
                            zIndex: 1
                          }} />
                        </div>
                        {size}px
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <button
              key={tool.id}
              className={`tool-button ${selectedTool === tool.id || (tool.id === 'select' && hasActiveSelection) ? 'active' : ''}`}
              onClick={() => safeToolSelect(tool.id)}
              title={tool.name}
            >
              {tool.iconType === 'svg' ? (
                <img src={tool.icon} alt={tool.name} style={{ width: '20px', height: '20px' }} />
              ) : (
                <img src={tool.icon} alt={tool.name} style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          );
        })}
        

        
        {/* Copy and Cut operations are handled via keyboard shortcuts (Cmd+C, Cmd+X) */}
        {/* No visible buttons needed - prevents layout shift */}
        
        {/* Rectangle Tool Dropdown */}
        <div 
          ref={rectangleDropdownRef}
          style={{ 
            position: 'relative',
            marginLeft: '8px'
          }}
        >
          <button
            className={`tool-button ${getCurrentRectangleTool() === selectedTool ? 'active' : ''}`}
            onClick={() => setIsRectangleDropdownOpen(!isRectangleDropdownOpen)}
            title={`Rectangle Tool - Currently ${getCurrentRectangleTool() === 'rectangle-filled' ? 'Filled' : 'Border'}`}
            style={{ position: 'relative' }}
          >
            <img
              src={getCurrentRectangleTool() === 'rectangle-filled' ? '/icons/rectangle-filled.svg' : '/icons/rectangle-border.svg'}
              alt="Rectangle"
              style={{ width: '20px', height: '20px' }}
            />
            
            {/* Dropdown arrow indicator */}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #ccc',
              fontSize: '8px'
            }} />
          </button>

          {/* Rectangle Options Dropdown */}
          {isRectangleDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              backgroundColor: '#4a4a4a',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px',
              zIndex: 9999,
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              marginTop: '2px'
            }}>
              {[
                { value: 'rectangle-border', label: 'Border Rectangle', icon: '/icons/rectangle-border.svg' },
                { value: 'rectangle-filled', label: 'Filled Rectangle', icon: '/icons/rectangle-filled.svg' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    safeToolSelect(option.value as Tool)
                    setLastRectangleVariant(option.value as 'rectangle-border' | 'rectangle-filled')
                    setIsRectangleDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: getCurrentRectangleTool() === option.value ? '#666' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (getCurrentRectangleTool() !== option.value) {
                      e.currentTarget.style.backgroundColor = '#555'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getCurrentRectangleTool() !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  title={option.label}
                >
                  <img
                    src={option.icon}
                    alt={option.label}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Circle Tool Dropdown */}
        <div 
          ref={circleDropdownRef}
          style={{ 
            position: 'relative'
          }}
        >
          <button
            className={`tool-button ${getCurrentCircleTool() === selectedTool ? 'active' : ''}`}
            onClick={() => setIsCircleDropdownOpen(!isCircleDropdownOpen)}
            title={`Circle Tool - Currently ${getCurrentCircleTool() === 'circle-filled' ? 'Filled' : 'Border'}`}
            style={{ position: 'relative' }}
          >
            <img
              src={getCurrentCircleTool() === 'circle-filled' ? '/icons/circle-filled.svg' : '/icons/circle-border.svg'}
              alt="Circle"
              style={{ width: '20px', height: '20px' }}
            />
            
            {/* Dropdown arrow indicator */}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #ccc',
              fontSize: '8px'
            }} />
          </button>

          {/* Circle Options Dropdown */}
          {isCircleDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              backgroundColor: '#4a4a4a',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px',
              zIndex: 9999,
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              marginTop: '2px'
            }}>
              {[
                { value: 'circle-border', label: 'Border Circle', icon: '/icons/circle-border.svg' },
                { value: 'circle-filled', label: 'Filled Circle', icon: '/icons/circle-filled.svg' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    safeToolSelect(option.value as Tool)
                    setLastCircleVariant(option.value as 'circle-border' | 'circle-filled')
                    setIsCircleDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: getCurrentCircleTool() === option.value ? '#666' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (getCurrentCircleTool() !== option.value) {
                      e.currentTarget.style.backgroundColor = '#555'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getCurrentCircleTool() !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  title={option.label}
                >
                  <img
                    src={option.icon}
                    alt={option.label}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Grid Controls - Icon-based dropdown */}
        <div 
          ref={gridDropdownRef}
          style={{ 
            position: 'relative', 
            marginLeft: '8px' 
          }}
        >
          {/* Grid Toggle Button - Main clickable icon */}
          <button
            className={`tool-button ${safeGridSettings.visible ? 'active' : ''}`}
            onClick={() => setIsGridDropdownOpen(!isGridDropdownOpen)}
            title={`Grid Options - Currently ${safeGridSettings.visible ? 'ON' : 'OFF'}`}
            style={{ position: 'relative' }}
          >
            <img
              src={safeGridSettings.visible ? '/icons/gimp-all/default-svg/gimp-grid.svg' : '/icons/gimp-all/default-svg/gimp-grid-symbolic.svg'}
              alt="Grid"
              style={{ 
                width: '20px', 
                height: '20px',
                filter: safeGridSettings.visible ? 'brightness(1.2) saturate(1.2)' : 'none',
                border: safeGridSettings.visible ? '1px solid #666' : 'none',
                borderRadius: safeGridSettings.visible ? '2px' : '0'
              }}
            />
            
            {/* Dropdown arrow indicator */}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #ccc',
              fontSize: '8px'
            }} />
          </button>

          {/* Grid Options Dropdown */}
          {isGridDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              backgroundColor: '#4a4a4a',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px',
              zIndex: 9999,
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              marginTop: '2px'
            }}>
              {/* Grid Visibility Toggle */}
              <button
                onClick={() => {
                  safeGridSettingsChange({
                    ...safeGridSettings,
                    visible: !safeGridSettings.visible
                  })
                  setIsGridDropdownOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '2px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#555'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={`Toggle Grid Visibility - Currently ${safeGridSettings.visible ? 'ON' : 'OFF'}`}
              >
                <img
                  src={safeGridSettings.visible ? '/icons/gimp-all/default-svg/gimp-grid.svg' : '/icons/gimp-all/default-svg/gimp-grid-symbolic.svg'}
                  alt="Grid Visibility"
                  style={{ width: '16px', height: '16px' }}
                />
                {safeGridSettings.visible ? 'Hide Grid' : 'Full Grid'}
              </button>

              <div style={{ 
                height: '1px', 
                backgroundColor: '#666', 
                margin: '4px 0' 
              }} />

              {/* Grid Type Options */}
              {[
                { value: 'none', label: 'No Grid', icon: '/icons/gimp-all/default-svg/gimp-grid-symbolic.svg' },
                { value: 'quarter', label: '1/4 Grid', icon: '/icons/quarter-new-icon.svg' },
                { value: 'eighths', label: '1/8 Grid', icon: '/icons/eighth-new-icon.svg' },
                { value: 'sixteenths', label: '1/16 Grid', icon: '/icons/sixteenths-icon.svg' },
                { value: 'thirtyseconds', label: '1/32 Grid', icon: '/icons/thirtyseconds-icon.svg' },
                { value: 'sixtyfourths', label: '1/64 Grid', icon: '/icons/64-icon.svg' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleGridTypeChange(option.value)
                    setIsGridDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: getCurrentGridType() === option.value ? '#666' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (getCurrentGridType() !== option.value) {
                      e.currentTarget.style.backgroundColor = '#555'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getCurrentGridType() !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  title={option.label}
                >
                  <img
                    src={option.icon}
                    alt={option.label}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Color Display - Single icon box split diagonally */}
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', alignSelf: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            position: 'relative',
            border: '2px solid #666',
            borderRadius: '4px',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          title="Primary (I) / Secondary (II) Colors"
        >
          {/* Primary color (top-left) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: primaryColor,
              clipPath: 'polygon(0 0, 100% 0, 0 100%)'
            }}
          />
          
          {/* Secondary color (bottom-right) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: secondaryColor,
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
            }}
          />
          
          {/* "I" label for primary */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '1px 1px 1px #000',
              zIndex: 2
            }}
          >
            I
          </div>
          
          {/* "II" label for secondary */}
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '1px 1px 1px #000',
              zIndex: 2
            }}
          >
            II
          </div>
        </div>
      </div>

      {/* Spacer to maintain centering of other content */}
      <div style={{ width: '200px', flexShrink: 0 }}></div>
    </div>
  )
}

export default Toolbar
