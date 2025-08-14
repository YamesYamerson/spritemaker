import {
  isValidHexColor,
  isValidColor,
  hsvToRgb,
  rgbToHsv,
  createSafeGradient,
  safeFillRect,
  getSafeColor
} from '../../src/utils/colorUtils';

describe('colorUtils', () => {
  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#ff0000')).toBe(true);
      expect(isValidHexColor('#00ff00')).toBe(true);
      expect(isValidHexColor('#0000ff')).toBe(true);
      expect(isValidHexColor('#123456')).toBe(true);
      expect(isValidHexColor('#abcdef')).toBe(true);
      expect(isValidHexColor('#ABCDEF')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('000000')).toBe(false); // Missing #
      expect(isValidHexColor('#00000')).toBe(false); // Too short
      expect(isValidHexColor('#0000000')).toBe(false); // Too long
      expect(isValidHexColor('#00000g')).toBe(false); // Invalid character
      expect(isValidHexColor('#00000G')).toBe(false); // Invalid character
      expect(isValidHexColor('')).toBe(false); // Empty string
      expect(isValidHexColor('#')).toBe(false); // Just #
      expect(isValidHexColor('invalid')).toBe(false); // Invalid string
    });

    it('should handle edge cases', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#123456')).toBe(true);
      expect(isValidHexColor('#abcdef')).toBe(true);
    });
  });

  describe('isValidColor', () => {
    it('should validate hex colors', () => {
      expect(isValidColor('#000000')).toBe(true);
      expect(isValidColor('#ffffff')).toBe(true);
      expect(isValidColor('#ff0000')).toBe(true);
    });

    it('should validate named colors', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
      expect(isValidColor('green')).toBe(true);
      expect(isValidColor('black')).toBe(true);
      expect(isValidColor('white')).toBe(true);
    });

    it('should reject invalid colors', () => {
      expect(isValidColor('')).toBe(false);
      expect(isValidColor('invalid')).toBe(false);
      expect(isValidColor('#00000g')).toBe(false);
    });
  });

  describe('hsvToRgb', () => {
    it('should convert HSV to RGB correctly', () => {
      expect(hsvToRgb(0, 100, 100)).toBe('#ff0000'); // Red
      expect(hsvToRgb(120, 100, 100)).toBe('#00ff00'); // Green
      expect(hsvToRgb(240, 100, 100)).toBe('#0000ff'); // Blue
      expect(hsvToRgb(0, 0, 100)).toBe('#ffffff'); // White
      expect(hsvToRgb(0, 0, 0)).toBe('#000000'); // Black
    });

    it('should handle edge cases', () => {
      expect(hsvToRgb(360, 100, 100)).toBe('#ff0000'); // 360 = 0
      expect(hsvToRgb(180, 50, 50)).toBe('#408080'); // Mixed values (cyan with 50% saturation and value)
      expect(hsvToRgb(90, 75, 25)).toBe('#284010'); // Low value (calculated)
    });

    it('should clamp values to valid ranges', () => {
      expect(hsvToRgb(-10, 100, 100)).toBe('#ff0000'); // Negative hue
      expect(hsvToRgb(400, 100, 100)).toBe('#ff0000'); // Hue > 360
      expect(hsvToRgb(0, -10, 100)).toBe('#ffffff'); // Negative saturation
      expect(hsvToRgb(0, 110, 100)).toBe('#ff0000'); // Saturation > 100
      expect(hsvToRgb(0, 100, -10)).toBe('#000000'); // Negative value
      expect(hsvToRgb(0, 100, 110)).toBe('#ff0000'); // Value > 100
    });
  });

  describe('rgbToHsv', () => {
    it('should convert RGB to HSV correctly', () => {
      expect(rgbToHsv('#ff0000')).toEqual({ h: 0, s: 100, v: 100 }); // Red
      expect(rgbToHsv('#00ff00')).toEqual({ h: 120, s: 100, v: 100 }); // Green
      expect(rgbToHsv('#0000ff')).toEqual({ h: 240, s: 100, v: 100 }); // Blue
      expect(rgbToHsv('#ffffff')).toEqual({ h: 0, s: 0, v: 100 }); // White
      expect(rgbToHsv('#000000')).toEqual({ h: 0, s: 0, v: 0 }); // Black
    });

    it('should handle mixed colors', () => {
      expect(rgbToHsv('#808080')).toEqual({ h: 0, s: 0, v: 50 }); // Gray
      expect(rgbToHsv('#ff8000')).toEqual({ h: 30, s: 100, v: 100 }); // Orange
      expect(rgbToHsv('#8000ff')).toEqual({ h: 270, s: 100, v: 100 }); // Purple
    });

    it('should handle edge cases gracefully', () => {
      // Test with invalid hex colors
      expect(() => rgbToHsv('invalid')).not.toThrow();
      expect(() => rgbToHsv('#00000')).not.toThrow();
      expect(() => rgbToHsv('')).not.toThrow();
    });
  });

  describe('createSafeGradient', () => {
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn()
        }))
      };
    });

    it('should create gradient with valid colors', () => {
      const gradient = createSafeGradient(
        mockCtx,
        0, 0, 100, 0,
        [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#ffffff' }
        ]
      );

      expect(gradient).toBeTruthy();
      expect(mockCtx.createLinearGradient).toHaveBeenCalledWith(0, 0, 100, 0);
    });

    it('should handle invalid colors gracefully', () => {
      const gradient = createSafeGradient(
        mockCtx,
        0, 0, 100, 0,
        [
          { offset: 0, color: 'invalid' },
          { offset: 1, color: '#ffffff' }
        ]
      );

      expect(gradient).toBeTruthy();
    });

    it('should return null on error', () => {
      mockCtx.createLinearGradient = jest.fn(() => {
        throw new Error('Canvas error');
      });

      const gradient = createSafeGradient(
        mockCtx,
        0, 0, 100, 0,
        [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#ffffff' }
        ]
      );

      expect(gradient).toBeNull();
    });
  });

  describe('safeFillRect', () => {
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        fillStyle: '#000000',
        fillRect: jest.fn()
      };
    });

    it('should fill rectangle with valid color', () => {
      safeFillRect(mockCtx, 0, 0, 100, 100, '#ff0000');
      
      expect(mockCtx.fillStyle).toBe('#ff0000');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });

    it('should use fallback color for invalid colors', () => {
      safeFillRect(mockCtx, 0, 0, 100, 100, 'invalid');
      
      expect(mockCtx.fillStyle).toBe('#000000'); // Fallback
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });

    it('should handle errors gracefully', () => {
      mockCtx.fillRect = jest.fn(() => {
        throw new Error('Canvas error');
      });

      expect(() => {
        safeFillRect(mockCtx, 0, 0, 100, 100, '#ff0000');
      }).not.toThrow();
    });
  });

  describe('getSafeColor', () => {
    it('should return valid colors as-is', () => {
      expect(getSafeColor('#ff0000')).toBe('#ff0000');
      expect(getSafeColor('#00ff00')).toBe('#00ff00');
      expect(getSafeColor('#0000ff')).toBe('#0000ff');
    });

    it('should return fallback for invalid colors', () => {
      expect(getSafeColor('invalid')).toBe('#000000');
      expect(getSafeColor('')).toBe('#000000');
      expect(getSafeColor('#00000g')).toBe('#000000');
    });

    it('should use custom fallback', () => {
      expect(getSafeColor('invalid', '#ffffff')).toBe('#ffffff');
      expect(getSafeColor('', '#ff0000')).toBe('#ff0000');
    });
  });
});
