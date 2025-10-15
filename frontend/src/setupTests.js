/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
import "@testing-library/jest-dom";

// Mock import.meta.env
global.importMetaEnv = {
  VITE_API_BASE_URL: "http://localhost:5001",
};

// Polyfill for import.meta
if (typeof global.import === "undefined") {
  global.import = {};
}
if (typeof global.import.meta === "undefined") {
  global.import.meta = {};
}
global.import.meta.env = {
  VITE_API_BASE_URL: "http://localhost:5000",
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
