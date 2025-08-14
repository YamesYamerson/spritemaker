import React from 'react'
import { Color } from '../types'

interface ColorPaletteProps {
  selectedColor: Color
  onColorSelect: (color: Color) => void
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorSelect
}) => {
  const defaultColors: Color[] = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
    '#00ff80', '#ff0080', '#808000', '#800080', '#008080',
    '#808080', '#404040', '#c0c0c0', '#e0e0e0', '#a0a0a0'
  ]

  return (
    <div className="palette">
      {defaultColors.map((color, index) => (
        <div
          key={index}
          className={`palette-color ${selectedColor === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
          title={color}
        />
      ))}
    </div>
  )
}

export default ColorPalette
