import React, { useState } from 'react'
import { Layer, PixelData } from '../types'

// Function to generate thumbnail for a layer
const generateLayerThumbnail = (pixels: Map<string, PixelData> | undefined, layerId: number, canvasSize: number): string => {
  const thumbnailSize = 32 // 32x32 thumbnail
  const scale = thumbnailSize / canvasSize
  
  // Create a temporary canvas for the thumbnail
  const canvas = document.createElement('canvas')
  canvas.width = thumbnailSize
  canvas.height = thumbnailSize
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  // Clear with transparent background
  ctx.clearRect(0, 0, thumbnailSize, thumbnailSize)
  
  // Draw checkered background for transparency
  const checkerSize = Math.max(1, Math.floor(thumbnailSize / 8))
  for (let y = 0; y < thumbnailSize; y += checkerSize) {
    for (let x = 0; x < thumbnailSize; x += checkerSize) {
      const isEvenRow = Math.floor(y / checkerSize) % 2 === 0
      const isEvenCol = Math.floor(x / checkerSize) % 2 === 0
      const isLight = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)
      
      ctx.fillStyle = isLight ? '#f0f0f0' : '#d0d0d0'
      ctx.fillRect(x, y, checkerSize, checkerSize)
    }
  }
  
  // Filter pixels for this specific layer and draw them
  if (pixels) {
    pixels.forEach((pixel) => {
      if (pixel.layerId === layerId && pixel.color !== 'transparent') {
        const scaledX = Math.floor(pixel.x * scale)
        const scaledY = Math.floor(pixel.y * scale)
        const pixelSize = Math.max(1, Math.floor(scale))
        
        ctx.fillStyle = pixel.color
        ctx.fillRect(scaledX, scaledY, pixelSize, pixelSize)
      }
    })
  }
  
  return canvas.toDataURL('image/png')
}

interface LayerPanelProps {
  layers: Layer[]
  pixels: Map<string, PixelData>
  canvasSize: number
  onNewLayer: () => void
  onLayerToggle: (layerId: number) => void
  onLayerSelect: (layerId: number) => void
  onDeleteLayer: (layerId: number) => void
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  pixels,
  canvasSize,
  onNewLayer,
  onLayerToggle,
  onLayerSelect,
  onDeleteLayer
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Combined Layers Card */}
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Layers Header */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #555',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
            Layers
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onNewLayer}
              style={{
                padding: '4px 8px',
                backgroundColor: '#4a4a4a',
                border: '1px solid #555',
                borderRadius: '3px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="New Layer"
            >
              +
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#4a4a4a',
                border: '1px solid #555',
                borderRadius: '3px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Layers List */}
        {!isCollapsed && (
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px'
          }}>
          {layers.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px'
            }}>
              Add a layer to edit
            </div>
          ) : (
            layers.map(layer => (
              <div
                key={layer.id}
                className={`layer-item ${layer.active ? 'active' : ''}`}
                onClick={() => onLayerSelect(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: layer.active ? '#3a3a3a' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  className="layer-visibility"
                  checked={layer.visible}
                  onChange={() => onLayerToggle(layer.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ margin: 0 }}
                />
                
                {/* Layer Thumbnail */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #555',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src={generateLayerThumbnail(pixels, layer.id, canvasSize)}
                    alt={`${layer.name} thumbnail`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                
                <span style={{ 
                  color: '#fff', 
                  fontSize: '12px',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {layer.name}
                </span>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteLayer(layer.id)
                  }}
                  style={{
                    padding: '2px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '2px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#555'
                    e.currentTarget.style.color = '#ff6b6b'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#888'
                  }}
                  title="Delete Layer"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        )}
      </div>
    </div>
  )
}

export default LayerPanel
