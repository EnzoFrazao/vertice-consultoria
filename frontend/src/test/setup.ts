import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

globalThis.IntersectionObserver = MockIntersectionObserver;

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  writable: true,
  value: () => {}
});
