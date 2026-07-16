import { fireEvent, render, screen, within } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createDemoRepository, type StorageLike } from "@/infrastructure/demo/repository";
import { DEMO_CLIENT_ID } from "@/infrastructure/demo/seed";
import { PortalDataProvider } from "@/features/portal-data/PortalDataProvider";
import RootApp, { ApplicationRoutes } from "@/app/RootApp";

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

function createRepository() {
  return createDemoRepository({
    localStorage: createStorage(),
    sessionStorage: createStorage()
  });
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname}</output>;
}

function renderApplication(path: string, repository = createRepository()) {
  return {
    repository,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <PortalDataProvider repository={repository}>
          <ApplicationRoutes />
          <LocationProbe />
        </PortalDataProvider>
      </MemoryRouter>
    )
  };
}

function LifecycleNavigation() {
  return (
    <nav aria-label="Rotas de teste">
      <Link to="/login">Abrir segunda rota</Link>
      <Link to="/#servicos">Abrir destino</Link>
    </nav>
  );
}

function renderWithLifecycle(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PortalDataProvider repository={createRepository()}>
        <LifecycleNavigation />
        <ApplicationRoutes />
      </PortalDataProvider>
    </MemoryRouter>
  );
}

describe("route lifecycle", () => {
  it("scrolls new pathnames to the top without smooth behavior", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    renderWithLifecycle("/");
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "Abrir segunda rota" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    scrollTo.mockRestore();
  });

  it("scrolls a rendered hash target into view", () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView
    });

    renderWithLifecycle("/login");

    fireEvent.click(screen.getByRole("link", { name: "Abrir destino" }));

    expect(document.getElementById("servicos")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });

    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        writable: true,
        value: originalScrollIntoView
      });
    } else {
      delete (Element.prototype as { scrollIntoView?: Element["scrollIntoView"] })
        .scrollIntoView;
    }
  });

  it("falls back to the top when the hash has malformed URI encoding", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    try {
      expect(() => renderWithLifecycle("/#%E0%A4%A")).not.toThrow();
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    } finally {
      scrollTo.mockRestore();
    }
  });

  it("keeps browser scroll restoration manual across routes until the root unmounts", () => {
    const originalScrollRestoration = window.history.scrollRestoration;
    window.history.replaceState(null, "", "/");
    window.history.scrollRestoration = "auto";
    window.localStorage.clear();
    window.sessionStorage.clear();
    const application = render(<RootApp />);

    try {
      expect(window.history.scrollRestoration).toBe("manual");

      fireEvent.click(screen.getByRole("button", { name: "Regularização e registro" }));
      fireEvent.click(screen.getByRole("button", { name: "Escritura" }));
      fireEvent.click(screen.getByRole("button", { name: /iniciar solicitação de escritura/i }));
      expect(screen.getByRole("heading", { name: /acesse sua jornada/i })).toBeInTheDocument();
      expect(window.history.scrollRestoration).toBe("manual");

      fireEvent.click(screen.getByRole("button", { name: /usar conta cliente/i }));
      fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));
      expect(screen.getByRole("heading", { name: "Nova solicitação" })).toBeInTheDocument();
      expect(window.history.scrollRestoration).toBe("manual");

      application.unmount();
      expect(window.history.scrollRestoration).toBe("auto");
    } finally {
      application.unmount();
      window.history.scrollRestoration = originalScrollRestoration;
      window.history.replaceState(null, "", "/");
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  });
});

describe("application routing and access", () => {
  it("uses client-side navigation for public account and return links", () => {
    renderApplication("/");

    const publicHeader = screen.getByRole("banner", { hidden: true });
    fireEvent.click(
      within(publicHeader).getByRole("link", {
        name: "Acessar minha conta",
        hidden: true
      })
    );
    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");

    fireEvent.click(screen.getByRole("link", { name: "Voltar para o site" }));
    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
  });

  it("redirects protected areas to the single login", () => {
    renderApplication("/cliente/processos");

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    expect(screen.getByRole("heading", { name: /acesse sua jornada/i })).toBeInTheDocument();
  });

  it("sends a client with a pending selection to the new request", () => {
    const repository = createRepository();
    repository.setPendingServiceId("escritura");
    renderApplication("/login", repository);

    fireEvent.click(screen.getByRole("button", { name: /usar conta cliente/i }));
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(screen.getByTestId("current-location")).toHaveTextContent(
      "/cliente/nova-solicitacao"
    );
  });

  it("routes the administrator home and leaves a client service selection untouched", () => {
    const repository = createRepository();
    repository.setPendingServiceId("usucapiao");
    renderApplication("/login", repository);

    fireEvent.click(screen.getByRole("button", { name: /usar conta administrador/i }));
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(screen.getByTestId("current-location")).toHaveTextContent("/admin");
    expect(repository.getPendingServiceId()).toBe("usucapiao");
  });

  it("keeps each role inside its authorized portal", () => {
    const repository = createRepository();
    repository.setSession({
      userId: DEMO_CLIENT_ID,
      role: "client",
      signedInAt: "2026-07-11T12:00:00.000Z"
    });
    renderApplication("/admin/processos", repository);

    expect(screen.getByTestId("current-location")).toHaveTextContent("/cliente");
  });

  it("stores a public catalog choice and opens login", () => {
    const { repository } = renderApplication("/");

    fireEvent.click(screen.getByRole("button", { name: "Regularização e registro" }));
    fireEvent.click(screen.getByRole("button", { name: "Escritura" }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar solicitação de escritura/i }));

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    expect(repository.getPendingServiceId()).toBe("escritura");
  });
});
