import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => {},
  },
});

// Enable testing library matchers
declare global {
  namespace Vitest {
    interface Suite {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface Test {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface TestContext {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface Hook {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface HookContext {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface SuiteAPI {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
    interface TestAPI {
      only?: unknown;
      skip?: unknown;
      todo?: unknown;
    }
  }
}
