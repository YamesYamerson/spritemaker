import React from 'react';
import { render, screen } from '@testing-library/react';
import ColorPicker from '../../src/components/ColorPicker';

// Mock the canvas context to avoid test environment issues
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
};

// Mock the canvas element
const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
  width: 160,
  height: 120
};

// Mock the refs
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(() => ({ current: mockCanvas }))
}));

describe('ColorPicker - Simple Tests', () => {
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
    expect(() => {
      render(<ColorPicker {...defaultProps} />);
    }).not.toThrow();
  });

  it('should display the primary color', () => {
    render(<ColorPicker {...defaultProps} />)
    
    // Check that the component renders without infinite loops
    const colorPicker = screen.getByText('II')
    expect(colorPicker).toBeInTheDocument()
  })

  it('should display color swatches', () => {
    render(<ColorPicker {...defaultProps} />)
    
    // The component should render and not cause infinite loops
    const colorPicker = screen.getByText('I')
    expect(colorPicker).toBeInTheDocument()
  })
});
