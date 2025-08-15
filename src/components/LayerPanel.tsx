import React from 'react'
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
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  pixels,
  canvasSize,
  onNewLayer,
  onLayerToggle,
  onLayerSelect
}) => {
  return (
    <div className="layer-panel">
      <h3>Layers</h3>
      
      {layers.map(layer => (
        <div
          key={layer.id}
          className={`layer-item ${layer.active ? 'active' : ''}`}
          onClick={() => onLayerSelect(layer.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            border: '1px solid #555',
            borderRadius: '4px',
            marginBottom: '8px',
            cursor: 'pointer',
            backgroundColor: layer.active ? '#3a3a3a' : '#2a2a2a',
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
        </div>
      ))}
      
      <button
        className="tool-button"
        onClick={onNewLayer}
        style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
      >
        <img src="/icons/new.png" alt="New Layer" style={{ width: '16px', height: '16px' }} />
        New Layer
      </button>
    </div>
  )
}

export default LayerPanel
