import { useState } from 'react'
import SpriteEditor from './components/SpriteEditor'
import Toolbar from './components/Toolbar'
import LayerPanel from './components/LayerPanel'
import ColorPicker from './components/ColorPicker'
import HistoryPanel from './components/HistoryPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { Tool, Color, Layer, GridSettings } from './types'

function App() {
  const [selectedTool, setSelectedTool] = useState<Tool>('pencil')
  const [primaryColor, setPrimaryColor] = useState<Color>('#000000')
  const [secondaryColor, setSecondaryColor] = useState<Color>('#ffffff')
  const [brushSize, setBrushSize] = useState(1)
  const [canvasSize, setCanvasSize] = useState(32)
  const [layers, setLayers] = useState<Layer[]>([
    { id: 1, name: 'Layer 1', visible: true, active: true }
  ])
  const [canvasRef, setCanvasRef] = useState<React.RefObject<HTMLCanvasElement> | null>(null)
  const [pixels, setPixels] = useState<Map<string, { x: number; y: number; color: string; layerId: number }>>(new Map())
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    visible: false,
    color: '#333',
    opacity: 0.5,
    quarter: false,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false,
    sixtyfourths: false
  })

  const handleNewLayer = () => {
    const newLayer: Layer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      active: false
    }
    setLayers(prev => prev.map(l => ({ ...l, active: false })).concat(newLayer))
  }

  const handleLayerToggle = (layerId: number) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ))
  }

  const handleLayerSelect = (layerId: number) => {
    setLayers(prev => prev.map(l => ({ ...l, active: l.id === layerId })))
  }

  // File menu handlers
  const handleNewProject = () => {
    // TODO: Implement new project functionality
    console.log('New Project clicked')
  }

  const handleOpenProject = () => {
    // TODO: Implement open project functionality
    console.log('Open Project clicked')
  }

  const handleSaveProject = () => {
    // TODO: Implement save project functionality
    console.log('Save Project clicked')
  }

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log('Settings clicked')
  }

  return (
    <div className="App" style={{ 
      display: 'flex', 
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Fixed Left Sidebar Column - Extends to top of page */}
      <div style={{ 
        width: '280px',
        backgroundColor: '#1e1e1e',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        padding: '15px',
        gap: '15px',
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        {/* File Menu - Top of left column */}
        <div style={{ 
          width: '100%',
          flexShrink: 0
        }}>
          <FileMenu
            onNewProject={handleNewProject}
            onOpenProject={handleOpenProject}
            onSaveProject={handleSaveProject}
            onSettings={handleSettings}
            canvasSize={canvasSize}
            onCanvasSizeChange={setCanvasSize}
            canvasRef={canvasRef}
          />
        </div>

        {/* Color Picker - Below File Menu */}
        <div style={{ 
          width: '100%',
          flexShrink: 0
        }}>
          <ErrorBoundary>
            <ColorPicker
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              secondaryColor={secondaryColor}
              onSecondaryColorChange={setSecondaryColor}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Right side content area */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Toolbar - Only spans the main content area */}
        <div style={{ paddingTop: '15px' }}>
          <Toolbar
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            primaryColor={primaryColor}
            onPrimaryColorChange={setPrimaryColor}
            secondaryColor={secondaryColor}
            onSecondaryColorChange={setSecondaryColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            gridSettings={gridSettings}
            onGridSettingsChange={setGridSettings}
          />
        </div>

        {/* Main Canvas Area - Takes remaining space */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          overflow: 'auto'
        }}>
          <ErrorBoundary>
            <SpriteEditor
              selectedTool={selectedTool}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              brushSize={brushSize}
              canvasSize={canvasSize}
              layers={layers}
              onCanvasRef={setCanvasRef}
              onPrimaryColorChange={setPrimaryColor}
              onPixelsChange={setPixels}
              gridSettings={gridSettings}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Fixed Right Sidebar Column */}
      <div style={{ 
        width: '280px',
        backgroundColor: '#1e1e1e',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        padding: '15px',
        gap: '15px',
        flexShrink: 0,
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Layer Panel - Top of right column */}
        <div style={{ 
          width: '100%',
          flexShrink: 0
        }}>
          <LayerPanel
            layers={layers}
            pixels={pixels}
            canvasSize={canvasSize}
            onNewLayer={handleNewLayer}
            onLayerToggle={handleLayerToggle}
            onLayerSelect={handleLayerSelect}
          />
        </div>

        {/* History Panel - Below Layer Panel */}
        <div style={{ 
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <HistoryPanel
            canvasRef={canvasRef}
          />
        </div>
      </div>
    </div>
  )
}

// File Menu Component - Moved from Toolbar to left sidebar
const FileMenu: React.FC<{
  onNewProject: () => void
  onOpenProject: () => void
  onSaveProject: () => void
  onSettings: () => void
  canvasSize: number
  onCanvasSizeChange: (size: number) => void
  canvasRef: React.RefObject<HTMLCanvasElement> | null
}> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSettings,
  canvasSize,
  onCanvasSizeChange,
  canvasRef
}) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)

  const exportAsPNG = () => {
    if (!canvasRef?.current) return
    
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `sprite-${canvasSize}x${canvasSize}.png`
    link.href = canvas.toDataURL()
    link.click()
    setIsFileMenuOpen(false)
  }

  const exportAsJSON = () => {
    // This would export the pixel data as JSON for later editing
    // For now, just show an alert
    alert('JSON export coming soon!')
    setIsFileMenuOpen(false)
  }

  return (
    <div style={{ width: '100%' }}>
      {/* File Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          width: '100%',
          justifyContent: 'flex-start'
        }}
        onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
        title="File Menu - Click to open"
      >
        {/* File Icon */}
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ flexShrink: 0 }}
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        <span>File</span>
      </div>

      {/* File Modal Overlay */}
      {isFileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
            onClick={() => setIsFileMenuOpen(false)}
          />
          
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 1001,
              minWidth: '300px',
              maxWidth: '400px'
            }}
          >
          {/* File Operations */}
          <div
            style={{
              padding: '8px 0',
              borderBottom: '1px solid #555'
            }}
          >
            <button
              onClick={onNewProject}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              New Project
            </button>
            
            <button
              onClick={onOpenProject}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Open Project
            </button>
            
            <button
              onClick={onSaveProject}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
              </svg>
              Save Project
            </button>
          </div>

          {/* Export Operations */}
          <div
            style={{
              padding: '8px 0',
              borderBottom: '1px solid #555'
            }}
          >
            <button
              onClick={exportAsPNG}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Export PNG
            </button>
            
            <button
              onClick={exportAsJSON}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Export JSON
            </button>
          </div>

          {/* Settings */}
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={onSettings}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Canvas Size Selection */}
          <div style={{ padding: '8px 0', borderTop: '1px solid #555' }}>
            <div style={{ padding: '8px 12px', color: '#ccc', fontSize: '12px', borderBottom: '1px solid #555' }}>
              Canvas Size
            </div>
            {[16, 32, 64, 128, 256].map(size => (
              <button
                key={size}
                onClick={() => {
                  onCanvasSizeChange(size)
                  setIsFileMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: canvasSize === size ? '#4CAF50' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: canvasSize === size ? 'bold' : 'normal'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z" />
                </svg>
                {size}×{size}
              </button>
            ))}
          </div>
          
          {/* Close Button */}
          <div style={{ 
            padding: '12px', 
            borderTop: '1px solid #555',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setIsFileMenuOpen(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#555',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#666'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#555'}
            >
              Close
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

export default App
