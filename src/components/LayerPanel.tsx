import React from 'react'
import { Layer } from '../types'

interface LayerPanelProps {
  layers: Layer[]
  onNewLayer: () => void
  onLayerToggle: (layerId: number) => void
  onLayerSelect: (layerId: number) => void
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
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
        >
          <input
            type="checkbox"
            className="layer-visibility"
            checked={layer.visible}
            onChange={() => onLayerToggle(layer.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <span>{layer.name}</span>
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
