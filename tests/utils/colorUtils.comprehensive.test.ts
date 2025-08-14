import {
  hsvToRgb,
  rgbToHsv,
  isValidHexColor,
  isValidColor,
  createSafeGradient,
  safeFillRect
} from '../../src/utils/colorUtils';

// Mock canvas context for testing
const mockCanvasContext = {
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  fillRect: jest.fn(),
  fillStyle: ''
};

describe('Color Utilities - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HSV to RGB Conversion', () => {
    it('should convert pure red (H=0, S=100, V=100)', () => {
      const result = hsvToRgb(0, 100, 100);
      expect(result).toBe('#ff0000');
    });

    it('should convert pure green (H=120, S=100, V=100)', () => {
      const result = hsvToRgb(120, 100, 100);
      expect(result).toBe('#00ff00');
    });

    it('should convert pure blue (H=240, S=100, V=100)', () => {
      const result = hsvToRgb(240, 100, 100);
      expect(result).toBe('#0000ff');
    });

    it('should convert yellow (H=60, S=100, V=100)', () => {
      const result = hsvToRgb(60, 100, 100);
      expect(result).toBe('#ffff00');
    });

    it('should convert cyan (H=180, S=100, V=100)', () => {
      const result = hsvToRgb(180, 100, 100);
      expect(result).toBe('#00ffff');
    });

    it('should convert magenta (H=300, S=100, V=100)', () => {
      const result = hsvToRgb(300, 100, 100);
      expect(result).toBe('#ff00ff');
    });

    it('should handle saturation changes', () => {
      // Red with 50% saturation should be lighter
      const result = hsvToRgb(0, 50, 100);
      expect(result).toBe('#ff8080');
    });

    it('should handle value changes', () => {
      // Red with 50% value should be darker
      const result = hsvToRgb(0, 100, 50);
      expect(result).toBe('#800000');
    });

    it('should handle zero saturation (grayscale)', () => {
      // Any hue with 0% saturation should be grayscale
      const result1 = hsvToRgb(0, 0, 100);
      const result2 = hsvToRgb(120, 0, 100);
      const result3 = hsvToRgb(240, 0, 100);
      
      expect(result1).toBe('#ffffff');
      expect(result2).toBe('#ffffff');
      expect(result3).toBe('#ffffff');
    });

    it('should handle zero value (black)', () => {
      // Any hue/saturation with 0% value should be black
      const result1 = hsvToRgb(0, 100, 0);
      const result2 = hsvToRgb(120, 50, 0);
      const result3 = hsvToRgb(240, 0, 0);
      
      expect(result1).toBe('#000000');
      expect(result2).toBe('#000000');
      expect(result3).toBe('#000000');
    });

    it('should clamp values to valid ranges', () => {
      // Test values outside normal ranges
      const result1 = hsvToRgb(-10, 150, 120);  // Should clamp to valid ranges
      const result2 = hsvToRgb(400, -20, -5);   // Should clamp to valid ranges
      
      // Should not throw errors and should return valid hex colors
      expect(result1).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result2).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should handle edge case hue values', () => {
      // Test boundary values
      const result1 = hsvToRgb(0, 100, 100);    // 0 degrees
      const result2 = hsvToRgb(360, 100, 100);  // 360 degrees (should wrap)
      const result3 = hsvToRgb(180, 100, 100);  // 180 degrees
      
      expect(result1).toBe('#ff0000');  // Red
      expect(result2).toBe('#ff0000');  // Should wrap to red
      expect(result3).toBe('#00ffff');  // Cyan
    });
  });

  describe('RGB to HSV Conversion', () => {
    it('should convert pure red to HSV', () => {
      const result = rgbToHsv('#ff0000');
      expect(result).toEqual({ h: 0, s: 100, v: 100 });
    });

    it('should convert pure green to HSV', () => {
      const result = rgbToHsv('#00ff00');
      expect(result).toEqual({ h: 120, s: 100, v: 100 });
    });

    it('should convert pure blue to HSV', () => {
      const result = rgbToHsv('#0000ff');
      expect(result).toEqual({ h: 240, s: 100, v: 100 });
    });

    it('should convert yellow to HSV', () => {
      const result = rgbToHsv('#ffff00');
      expect(result).toEqual({ h: 60, s: 100, v: 100 });
    });

    it('should convert cyan to HSV', () => {
      const result = rgbToHsv('#00ffff');
      expect(result).toEqual({ h: 180, s: 100, v: 100 });
    });

    it('should convert magenta to HSV', () => {
      const result = rgbToHsv('#ff00ff');
      expect(result).toEqual({ h: 300, s: 100, v: 100 });
    });

    it('should handle grayscale colors', () => {
      const result1 = rgbToHsv('#ffffff');
      const result2 = rgbToHsv('#808080');
      const result3 = rgbToHsv('#000000');
      
      expect(result1).toEqual({ h: 0, s: 0, v: 100 });
      expect(result2).toEqual({ h: 0, s: 0, v: 50 });
      expect(result3).toEqual({ h: 0, s: 0, v: 0 });
    });

    it('should handle mixed colors', () => {
      const result1 = rgbToHsv('#ff8080');  // Light red
      const result2 = rgbToHsv('#800000');  // Dark red
      const result3 = rgbToHsv('#8080ff');  // Light blue
      
      expect(result1.h).toBe(0);      // Red hue
      expect(result1.s).toBeLessThan(100);  // Lower saturation
      expect(result1.v).toBe(100);    // Full value
      
      expect(result2.h).toBe(0);      // Red hue
      expect(result2.s).toBe(100);    // Full saturation
      expect(result2.v).toBeLessThan(100);  // Lower value
    });

    it('should handle edge case RGB values', () => {
      // Test boundary values
      const result1 = rgbToHsv('#000000');  // Black
      const result2 = rgbToHsv('#ffffff');  // White
      const result3 = rgbToHsv('#ff0000');  // Pure red
      
      expect(result1).toEqual({ h: 0, s: 0, v: 0 });
      expect(result2).toEqual({ h: 0, s: 0, v: 100 });
      expect(result3).toEqual({ h: 0, s: 100, v: 100 });
    });
  });

  describe('Hex Color Validation', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#ff0000')).toBe(true);
      expect(isValidHexColor('#00ff00')).toBe(true);
      expect(isValidHexColor('#0000ff')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#123456')).toBe(true);
      expect(isValidHexColor('#abcdef')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('ff0000')).toBe(false);      // Missing #
      expect(isValidHexColor('#ff000')).toBe(false);      // Too short
      expect(isValidHexColor('#ff00000')).toBe(false);    // Too long
      expect(isValidHexColor('#ff000g')).toBe(false);     // Invalid character
      expect(isValidHexColor('#ff000')).toBe(false);      // Incomplete
      expect(isValidHexColor('')).toBe(false);            // Empty string
      expect(isValidHexColor('#')).toBe(false);           // Just #
      expect(isValidHexColor('#ff')).toBe(false);         // Too short
    });

    it('should handle edge cases', () => {
      expect(isValidHexColor('#000000')).toBe(true);      // All zeros
      expect(isValidHexColor('#ffffff')).toBe(true);      // All f's
      expect(isValidHexColor('#123456')).toBe(true);      // Mixed numbers
      expect(isValidHexColor('#abcdef')).toBe(true);      // Mixed letters
      expect(isValidHexColor('#ABCDEF')).toBe(true);      // Uppercase should be allowed
    });
  });

  describe('General Color Validation', () => {
    it('should validate hex colors', () => {
      expect(isValidColor('#ff0000')).toBe(true);
      expect(isValidColor('#00ff00')).toBe(true);
      expect(isValidColor('#0000ff')).toBe(true);
    });

    it('should validate named colors', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('green')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
      expect(isValidColor('transparent')).toBe(true);
    });

    it('should reject invalid colors', () => {
      expect(isValidColor('invalid')).toBe(false);
      expect(isValidColor('')).toBe(false);
      expect(isValidColor('#ff000')).toBe(false);
    });
  });

  describe('Canvas Operations', () => {
    it('should create gradients safely', () => {
      const gradient = createSafeGradient(
        mockCanvasContext as any,
        0, 0, 100, 0,
        [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      );
      
      expect(gradient).toBeDefined();
      expect(mockCanvasContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 100, 0);
    });

    it('should handle gradient creation errors gracefully', () => {
      // Mock a failure
      mockCanvasContext.createLinearGradient.mockImplementationOnce(() => {
        throw new Error('Canvas not supported');
      });
      
      const gradient = createSafeGradient(
        mockCanvasContext as any,
        0, 0, 100, 0,
        [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      );
      
      expect(gradient).toBeNull();
    });

    it('should fill rectangles safely', () => {
      expect(() => {
        safeFillRect(mockCanvasContext as any, 0, 0, 100, 100, '#ff0000');
      }).not.toThrow();
      
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });
  });

  describe('Color Conversion Round-trip', () => {
    it('should maintain color integrity through HSV-RGB-HSV conversion', () => {
      const originalColor = '#ff0000';
      const hsv = rgbToHsv(originalColor);
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      
      expect(rgb).toBe(originalColor);
    });

    it('should handle multiple color conversions', () => {
      const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
      
      testColors.forEach(color => {
        const hsv = rgbToHsv(color);
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        expect(rgb).toBe(color);
      });
    });

    it('should handle edge case conversions', () => {
      // Test black, white, and grayscale
      const edgeColors = ['#000000', '#ffffff', '#808080'];
      
      edgeColors.forEach(color => {
        const hsv = rgbToHsv(color);
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        expect(rgb).toBe(color);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid successive conversions', () => {
      const start = Date.now();
      
      // Perform many conversions
      for (let i = 0; i < 1000; i++) {
        const h = i % 360;
        const s = (i % 100) + 1;
        const v = (i % 100) + 1;
        
        const rgb = hsvToRgb(h, s, v);
        expect(rgb).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle extreme HSV values', () => {
      // Test very large or very small values
      const extremeValues = [
        [1000, 200, 300],    // Very large values
        [-1000, -200, -300], // Very negative values
        [0.0001, 0.0001, 0.0001], // Very small values
        [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE], // Max values
        [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]  // Min values
      ];
      
      extremeValues.forEach(([h, s, v]) => {
        expect(() => {
          const result = hsvToRgb(h, s, v);
          expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }).not.toThrow();
      });
    });
  });
});
