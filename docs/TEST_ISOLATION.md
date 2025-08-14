# Test Isolation Between Type Trainer and Sprite Maker

## Overview
This document explains how the test isolation is maintained between the Type Trainer and Sprite Maker projects to prevent cross-contamination.

## Project Structure
```
type-trainer/                    # Main typing trainer project
├── tests/                      # Type trainer tests
├── src/                        # Type trainer source
├── jest.config.cjs            # Type trainer Jest config
├── tsconfig.test.json         # Type trainer test TypeScript config
└── package.json               # Type trainer dependencies

spritemaker/                    # Sprite maker project (separate)
├── tests/                     # Sprite maker tests
├── src/                       # Sprite maker source
├── jest.config.cjs           # Sprite maker Jest config
├── tsconfig.test.json        # Sprite maker test TypeScript config
└── package.json              # Sprite maker dependencies
```

## Key Isolation Mechanisms

### 1. Separate Jest Configurations
- **Type Trainer**: `jest.config.cjs` in root directory
- **Sprite Maker**: `jest.config.cjs` in `spritemaker/` directory
- Each config uses `<rootDir>` relative paths, ensuring they only look in their own project directories

### 2. Separate TypeScript Test Configurations
- **Type Trainer**: `tsconfig.test.json` in root directory
- **Sprite Maker**: `tsconfig.test.json` in `spritemaker/` directory
- Each config extends its own base `tsconfig.json`

### 3. Separate Test Setup Files
- **Type Trainer**: `tests/setup.ts` in root directory
- **Sprite Maker**: `tests/setup.ts` in `spritemaker/` directory
- Each setup file is tailored to its project's needs

### 4. Separate Package Dependencies
- **Type Trainer**: Has its own `package.json` with testing dependencies
- **Sprite Maker**: Has its own `package.json` with testing dependencies
- No shared `node_modules` between projects

## Test Execution

### Running Type Trainer Tests
```bash
# From type-trainer root directory
npm test                           # Run all tests
npm test -- --testPathPattern="utils"  # Run specific test pattern
```

### Running Sprite Maker Tests
```bash
# From spritemaker directory
cd spritemaker
npm test                           # Run all tests
npm test -- --testPathPattern="ColorPicker"  # Run specific test pattern
```

## What Was Fixed

### Problem
The root `tsconfig.test.json` had a broad include pattern:
```json
"include": [
  "src",
  "tests",
  "**/*.test.ts",        // ❌ This was too broad
  "**/*.test.tsx"        // ❌ This was too broad
]
```

This caused TypeScript to pick up ALL test files in the entire workspace, including spritemaker tests.

### Solution
Changed the include pattern to be project-specific:
```json
"include": [
  "src",
  "tests",
  "server"               // ✅ Only includes typing trainer directories
]
```

## Verification

### Type Trainer Isolation
- ✅ Type trainer tests only find their own test files
- ✅ No spritemaker tests are discovered
- ✅ Jest configuration is isolated

### Sprite Maker Isolation
- ✅ Sprite maker tests only find their own test files
- ✅ No type trainer tests are discovered
- ✅ Jest configuration is isolated

## Best Practices

1. **Always run tests from the correct project directory**
2. **Never modify root-level configs to include spritemaker files**
3. **Keep project dependencies separate**
4. **Use project-specific Jest and TypeScript configurations**
5. **Test isolation should be verified after any configuration changes**

## Troubleshooting

If you encounter cross-contamination issues:

1. Check that you're running tests from the correct project directory
2. Verify that Jest configs use `<rootDir>` relative paths
3. Ensure TypeScript test configs don't have overly broad include patterns
4. Check that each project has its own `node_modules` and dependencies

### Jest DOM Type Issues

If you encounter TypeScript errors like:
```
Property 'toBeInTheDocument' does not exist on type 'JestMatchers<HTMLElement>'
```

This is a known issue with `@testing-library/jest-dom` version 6.x.x. The solution is to:

1. **Use the latest version 6.x.x** with proper TypeScript configuration:
   ```bash
   npm install --save-dev @testing-library/jest-dom@latest
   ```

2. **Create a custom matcher types file** at `types/custom-matcher.d.ts`:
   ```typescript
   import '@testing-library/jest-dom';
   
   declare global {
     namespace jest {
       interface Matchers<R, T> {
         toBeInTheDocument(): R;
         toHaveAttribute(attr: string, value?: string): R;
         toHaveValue(value: string | number | string[]): R;
         toHaveStyle(css: string | Record<string, any>): R;
         // ... other matchers
       }
     }
   }
   
   export {};
   ```

3. **Update tsconfig.test.json** to include the types directory:
   ```json
   {
     "include": [
       "src/**/*",
       "tests/**/*",
       "types/**/*"
     ]
   }
   ```

4. **Keep the standard import in setup.ts**:
   ```typescript
   import '@testing-library/jest-dom';
   ```

**Note**: This approach works with the latest version 6.x.x and provides full TypeScript support. The key is properly configuring the TypeScript compiler to recognize the custom matcher types.
