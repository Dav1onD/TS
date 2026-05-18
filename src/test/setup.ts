import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

if (typeof window !== 'undefined') {
  if ('Request' in window) {
    Object.defineProperty(globalThis, 'Request', {
      writable: true,
      configurable: true,
      value: window.Request,
    });
  }

  if ('Headers' in window) {
    Object.defineProperty(globalThis, 'Headers', {
      writable: true,
      configurable: true,
      value: window.Headers,
    });
  }

  if ('Response' in window) {
    Object.defineProperty(globalThis, 'Response', {
      writable: true,
      configurable: true,
      value: window.Response,
    });
  }
}
