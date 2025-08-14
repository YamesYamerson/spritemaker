/**
 * Jest setup file for Sprite Maker tests
 */

// Import jest-dom for custom matchers
import '@testing-library/jest-dom';

// Import jest-canvas-mock for better Canvas API support
import 'jest-canvas-mock';

// Set up environment variables for tests
process.env.NODE_ENV = 'test';

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock fetch
global.fetch = jest.fn();

// Ensure window object is available
if (typeof window === 'undefined') {
  global.window = {} as any;
}

// Mock window.btoa for hash generation
global.btoa = (str: string) => Buffer.from(str).toString('base64');
window.btoa = (str: string) => Buffer.from(str, 'base64').toString('base64');

// Mock window.atob for hash decoding
global.atob = (str: string) => Buffer.from(str, 'base64').toString();
window.atob = (str: string) => Buffer.from(str, 'base64').toString();

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  const mock = {
    getItem(key: string): string | null {
      return store[key] || null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    // Helper method to reset the store for tests
    _reset(): void {
      store = {};
    }
  };

  return mock;
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock Canvas API for tests
const MockCanvas = function(this: any) {
  this.width = 100;
  this.height = 100;
} as any;

MockCanvas.prototype.getContext = function(type: string) {
  if (type === '2d') {
    return new MockCanvasRenderingContext2D();
  }
  return null;
};

const MockCanvasRenderingContext2D = function(this: any) {
  this.fillStyle = '#000000';
  this.strokeStyle = '#000000';
  this.lineWidth = 1;
  this.globalAlpha = 1.0;
} as any;

MockCanvasRenderingContext2D.prototype.fillRect = function(_x: number, _y: number, _width: number, _height: number) {};
MockCanvasRenderingContext2D.prototype.strokeRect = function(_x: number, _y: number, _width: number, _height: number) {};
MockCanvasRenderingContext2D.prototype.clearRect = function(_x: number, _y: number, _width: number, _height: number) {};
MockCanvasRenderingContext2D.prototype.beginPath = function() {};
MockCanvasRenderingContext2D.prototype.moveTo = function(_x: number, _y: number) {};
MockCanvasRenderingContext2D.prototype.lineTo = function(_x: number, _y: number) {};
MockCanvasRenderingContext2D.prototype.stroke = function() {};

MockCanvasRenderingContext2D.prototype.createLinearGradient = function(_x0: number, _y0: number, _x1: number, _y1: number) {
  return new MockCanvasGradient();
};

const MockCanvasGradient = function(this: any) {} as any;
MockCanvasGradient.prototype.addColorStop = function(_offset: number, _color: string) {};

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockCanvas,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'HTMLCanvasElement', {
  value: MockCanvas,
  writable: true,
  configurable: true,
});

// Mock CanvasRenderingContext2D
Object.defineProperty(global, 'CanvasRenderingContext2D', {
  value: MockCanvasRenderingContext2D,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'CanvasRenderingContext2D', {
  value: MockCanvasRenderingContext2D,
  writable: true,
  configurable: true,
});

// Mock CanvasGradient
Object.defineProperty(global, 'CanvasGradient', {
  value: MockCanvasGradient,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'CanvasGradient', {
  value: MockCanvasGradient,
  writable: true,
  configurable: true,
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  x: 0,
  y: 0,
  toJSON: () => ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 })
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Setup test utilities
(global as any).testUtils = {
  // Helper to create mock color
  createMockColor: (hex: string = '#000000') => hex,
  
  // Helper to create mock grid settings
  createMockGridSettings: (overrides = {}) => ({
    visible: false,
    color: '#333',
    opacity: 0.5,
    quarter: false,
    eighths: false,
    sixteenths: false,
    thirtyseconds: false,
    sixtyfourths: false,
    ...overrides,
  }),
  
  // Helper to create mock layer
  createMockLayer: (overrides = {}) => ({
    id: Date.now(),
    name: 'Test Layer',
    visible: true,
    active: true,
    ...overrides,
  }),
  
  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock canvas event
  createMockCanvasEvent: (x: number, y: number) => ({
    clientX: x,
    clientY: y,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }),
};

// Reset mocks before each test
beforeEach(() => {
  (localStorage as any)._reset();
  (global.fetch as jest.Mock).mockClear();
  
  // Reset canvas mocks
  jest.clearAllMocks();
});
