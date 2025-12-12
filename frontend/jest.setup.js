// Set up TextEncoder/TextDecoder FIRST before any other imports
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Firebase environment variables for tests
// Using a properly formatted fake API key (39 characters, alphanumeric with hyphens and underscores)
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyDtVx7Z8QwXxYz1234567890abcdefGHIJK';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';

// Node.js 18+ has built-in fetch, but we need to ensure globals are set for MSW
if (!global.fetch) {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}

// Mock HTMLCanvasElement.prototype.getContext for jsdom (used by jest-axe)
// This prevents "Not implemented: HTMLCanvasElement.prototype.getContext" error
HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: [] })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      canvas: this,
    };
  }
  return null;
};

// Mock IntersectionObserver for Next.js Link component
// This prevents the "act(...)" warning from use-intersection.tsx
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Immediately trigger the callback with isIntersecting: true
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock requestIdleCallback and cancelIdleCallback to prevent async state updates
global.requestIdleCallback = (callback) => {
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
};
global.cancelIdleCallback = (id) => {
  clearTimeout(id);
};

// Polyfill for Web Streams API (required by MSW v2)
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Set BroadcastChannel if not available
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Now import the rest
require('@testing-library/jest-dom');
const { toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);
