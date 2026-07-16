export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

export function getBrowserStorage(
  name: "localStorage" | "sessionStorage"
): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window[name];
  } catch {
    return null;
  }
}
