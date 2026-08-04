import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

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
