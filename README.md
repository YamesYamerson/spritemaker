# Sprite Maker

A pixel art sprite editor application similar to Aseprite, built with React and TypeScript.

## Features

- **Multiple Drawing Tools**: Pencil, eraser, fill, eyedropper, rectangle, circle, and line tools
- **Layer System**: Create and manage multiple layers for complex sprites
- **Customizable Canvas**: Choose from 16x16 to 256x256 pixel canvas sizes
- **Color Management**: Primary and secondary color selection with color pickers
- **Brush Sizes**: Adjustable brush size from 1 to 10 pixels
- **Real-time Preview**: See your changes immediately on the canvas

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3001`

## Usage

### Tools
- **Pencil**: Draw individual pixels or drag to create lines
- **Eraser**: Remove pixels (sets them to transparent)
- **Fill**: Flood fill connected areas of the same color
- **Eyedropper**: Pick colors from the canvas
- **Rectangle**: Draw rectangular shapes (coming soon)
- **Circle**: Draw circular shapes (coming soon)
- **Line**: Draw straight lines (coming soon)

### Layers
- Create new layers using the "+ New Layer" button
- Toggle layer visibility with the checkbox
- Click on a layer to make it active
- Only the active layer can be drawn on

### Canvas Controls
- Change canvas size using the dropdown (16x16 to 256x256)
- Adjust brush size using the slider
- Select primary and secondary colors using the color pickers

## Development

This project uses:
- React 18 with TypeScript
- Vite for fast development and building
- Canvas API for pixel-perfect drawing
- Modern ES6+ features

## Future Enhancements

- Save/Load functionality
- Animation support
- More drawing tools (polygon, freehand)
- Undo/Redo system
- Export to various formats (PNG, GIF, etc.)
- Palette management
- Sprite sheet support
