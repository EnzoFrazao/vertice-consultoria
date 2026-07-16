import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LazyRouteErrorBoundary } from "@/app/LazyRouteErrorBoundary";

function BrokenLazyChunk(): never {
  throw new Error("Failed to fetch dynamically imported module");
}

describe("LazyRouteErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers an accessible retry when a lazy route chunk fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onRetry = vi.fn();

    render(
      <LazyRouteErrorBoundary onRetry={onRetry}>
        <BrokenLazyChunk />
      </LazyRouteErrorBoundary>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar esta área");
    expect(alert).toHaveTextContent("Verifique sua conexão");

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
