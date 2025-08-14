import React from 'react'
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
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  primaryColor,
  secondaryColor,
  brushSize,
  onBrushSizeChange,
  gridSettings,
  onGridSettingsChange
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

  const tools: { id: Tool; name: string; icon: string; iconType: 'svg' | 'png' }[] = [
    { id: 'pencil', name: 'Pencil', icon: '/icons/pencil.svg', iconType: 'svg' },
    { id: 'eraser', name: 'Eraser', icon: '/icons/eraser.svg', iconType: 'svg' },
    { id: 'fill', name: 'Fill', icon: '/icons/fill.svg', iconType: 'svg' },
    { id: 'eyedropper', name: 'Eyedropper', icon: '/icons/eyedropper.png', iconType: 'png' },
    { id: 'rectangle', name: 'Rectangle', icon: '/icons/rectangle.png', iconType: 'png' },
    { id: 'circle', name: 'Circle', icon: '/icons/circle.png', iconType: 'png' },
    { id: 'line', name: 'Line', icon: '/icons/line.png', iconType: 'png' }
  ]

  return (
    <div className="toolbar">
      {/* Brush Size Control - positioned to the left of tools */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          border: '1px solid #666',
          background: '#4a4a4a',
          borderRadius: '4px',
          height: '36px',
          justifyContent: 'center',
          marginRight: '15px',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => {
          const select = document.getElementById('brush-size-select') as HTMLSelectElement;
          if (select) {
            select.focus();
            select.click();
          }
        }}
      >
        <div style={{ fontSize: '10px', color: '#ccc', whiteSpace: 'nowrap' }}>Brush:</div>
        
        {/* Visual brush size representation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
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
            backgroundSize: '6px 6px',
            opacity: 0.2
          }} />
          
          {/* Brush size circle */}
          <div style={{
            width: `${brushSize * 4}px`,
            height: `${brushSize * 4}px`,
            backgroundColor: '#000',
            borderRadius: '50%',
            border: '1px solid #fff',
            position: 'relative',
            zIndex: 1
          }} />
        </div>
        
        <div style={{ fontSize: '10px', color: '#ccc' }}>{brushSize}px</div>
        
        {/* Hidden select element */}
        <select
          id="brush-size-select"
          value={brushSize}
          onChange={(e) => safeBrushSizeChange(parseInt(e.target.value))}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
        >
          {[1, 2, 3, 4].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {/* Tools */}
      <div>
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => safeToolSelect(tool.id)}
            title={tool.name}
          >
            {tool.iconType === 'svg' ? (
              <img src={tool.icon} alt={tool.name} style={{ width: '20px', height: '20px' }} />
            ) : (
              <img src={tool.icon} alt={tool.name} style={{ width: '20px', height: '20px' }} />
            )}
          </button>
        ))}
        
        {/* Grid Toggle Tool */}
        <button
          className={`tool-button ${safeGridSettings.visible ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            visible: !safeGridSettings.visible
          })}
          title={`Show Grid - Currently ${safeGridSettings.visible ? 'ON' : 'OFF'}`}
          style={{ marginLeft: '8px' }}
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
        </button>

        {/* Quarter Grid Tool */}
        <button
          className={`tool-button ${safeGridSettings.quarter ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            quarter: !safeGridSettings.quarter,
            eighths: false,
            sixteenths: false,
            thirtyseconds: false,
            sixtyfourths: false
          })}
          title={`Quarter Grid - Currently ${safeGridSettings.quarter ? 'ON' : 'OFF'}`}
        >
          <img
            src="/icons/quarter-new-icon.svg"
            alt="Quarter Grid"
            style={{ width: '20px', height: '20px' }}
          />
        </button>

        {/* Eighths Grid Tool */}
        <button
          className={`tool-button ${safeGridSettings.eighths ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            quarter: false,
            eighths: !safeGridSettings.eighths,
            sixteenths: false,
            thirtyseconds: false,
            sixtyfourths: false
          })}
          title={`Eighths Grid - Currently ${safeGridSettings.eighths ? 'ON' : 'OFF'}`}
        >
          <img
            src="/icons/eighth-new-icon.svg"
            alt="Eighths Grid"
            style={{ width: '20px', height: '20px' }}
          />
        </button>

        {/* Sixteenths Grid Tool */}
        <button
          className={`tool-button ${safeGridSettings.sixteenths ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            quarter: false,
            eighths: false,
            sixteenths: !safeGridSettings.sixteenths,
            thirtyseconds: false,
            sixtyfourths: false
          })}
          title={`Sixteenths Grid - Currently ${safeGridSettings.sixteenths ? 'ON' : 'OFF'}`}
        >
          <img
            src="/icons/sixteenths-icon.svg"
            alt="Sixteenths Grid"
            style={{ width: '20px', height: '20px' }}
          />
        </button>

        {/* Thirty-Second Grid Tool */}
        <button
          className={`tool-button ${safeGridSettings.thirtyseconds ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            quarter: false,
            eighths: false,
            sixteenths: false,
            thirtyseconds: !safeGridSettings.thirtyseconds,
            sixtyfourths: false
          })}
          title={`Thirty-Second Grid - Currently ${safeGridSettings.thirtyseconds ? 'ON' : 'OFF'}`}
        >
          <img
            src="/icons/thirtyseconds-icon.svg"
            alt="Thirty-Second Grid"
            style={{ width: '20px', height: '20px' }}
          />
        </button>

        {/* Sixty-Fourths Grid Tool */}
        <button
          className={`tool-button ${safeGridSettings.sixtyfourths ? 'active' : ''}`}
          onClick={() => safeGridSettingsChange({
            ...safeGridSettings,
            quarter: false,
            eighths: false,
            sixteenths: false,
            thirtyseconds: false,
            sixtyfourths: !safeGridSettings.sixtyfourths
          })}
          title={`Sixty-Fourths Grid - Currently ${safeGridSettings.sixtyfourths ? 'ON' : 'OFF'}`}
        >
          <img
            src="/icons/64-icon.svg"
            alt="Sixty-Fourths Grid"
            style={{ width: '20px', height: '20px' }}
          />
        </button>
      </div>

      {/* Color Display - Single icon box split diagonally */}
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
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
