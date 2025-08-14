import '@testing-library/jest-dom';

// Extend Jest matchers for jest-dom v6.x.x
declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveFocus(): R;
      toHaveDisplayValue(value: string | RegExp | string[]): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveAccessibleName(name: string | RegExp): R;
      toHaveAccessibleDescription(description: string | RegExp): R;
      toHaveAccessibleRole(role: string): R;
      toHaveNoViolations(): R;
    }
  }
}

// Also extend the global Jest namespace
declare module '@jest/globals' {
  interface Matchers<R, T> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveValue(value: string | number | string[]): R;
    toHaveStyle(css: string | Record<string, any>): R;
    toHaveClass(className: string): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeChecked(): R;
    toBeRequired(): R;
    toBeValid(): R;
    toBeInvalid(): R;
    toHaveFocus(): R;
    toHaveDisplayValue(value: string | RegExp | string[]): R;
    toHaveFormValues(expectedValues: Record<string, any>): R;
    toHaveAccessibleName(name: string | RegExp): R;
    toHaveAccessibleDescription(description: string | RegExp): R;
    toHaveAccessibleRole(role: string): R;
    toHaveNoViolations(): R;
  }
}

export {};
