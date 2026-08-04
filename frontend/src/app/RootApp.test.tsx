import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Link, MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AuthRepository, AuthenticatedUser } from "@/features/auth/auth";
import { createDemoRepository, type StorageLike } from "@/infrastructure/repository";
import { DEMO_CLIENT_ID } from "@/infrastructure/seed";
import { PortalDataProvider } from "@/features/portal-data/PortalDataProvider";
import RootApp, { ApplicationRoutes } from "@/app/RootApp";
import { createDemoAuthRepository } from "@/test/demoAuthRepository";

const LAZY_ROUTE_WAIT_OPTIONS = { timeout: 5_000 };

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

function renderApplication(
  path: string,
  repository = createRepository(),
  authRepository: AuthRepository = createDemoAuthRepository(repository)
) {
  return {
    repository,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <PortalDataProvider repository={repository} authRepository={authRepository}>
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
      <PortalDataProvider
        repository={createRepository()}
        authRepository={createDemoAuthRepository(createRepository())}
      >
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
      delete (Element.prototype as { scrollIntoView?: Element["scrollIntoView"] }).scrollIntoView;
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

  it("keeps browser scroll restoration manual across public routes until unmount", async () => {
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
      expect(
        await screen.findByRole("heading", { name: /acesse sua jornada/i }, LAZY_ROUTE_WAIT_OPTIONS)
      ).toBeInTheDocument();
      expect(window.history.scrollRestoration).toBe("manual");

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
  it("keeps the landing outside the route fallback and eventually renders lazy entry points", async () => {
    const landing = renderApplication("/");

    expect(
      screen.getByRole("heading", {
        name: /encontre o caminho certo para o seu imóvel/i
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /carregando área/i })).not.toBeInTheDocument();

    landing.unmount();
    const login = renderApplication("/login");

    expect(
      await screen.findByRole("heading", { name: /acesse sua jornada/i }, LAZY_ROUTE_WAIT_OPTIONS)
    ).toBeInTheDocument();

    login.unmount();
    renderApplication("/cadastro");

    expect(
      await screen.findByRole("heading", { name: /crie sua conta/i }, LAZY_ROUTE_WAIT_OPTIONS)
    ).toBeInTheDocument();
  });

  it("uses client-side navigation for public account and return links", async () => {
    renderApplication("/");

    const publicHeader = screen.getByRole("banner", { hidden: true });
    fireEvent.click(
      within(publicHeader).getByRole("link", {
        name: "Acessar minha conta",
        hidden: true
      })
    );
    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");

    fireEvent.click(
      await screen.findByRole("link", { name: "Voltar para o site" }, LAZY_ROUTE_WAIT_OPTIONS)
    );
    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
  });

  it("redirects protected areas to the single login", async () => {
    renderApplication("/cliente/processos");

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    });
    expect(
      await screen.findByRole("heading", { name: /acesse sua jornada/i }, LAZY_ROUTE_WAIT_OPTIONS)
    ).toBeInTheDocument();
  });

  it("sends a client with a pending selection to the new request", async () => {
    const repository = createRepository();
    repository.setPendingServiceId("escritura");
    renderApplication("/login", repository);

    fireEvent.change(await screen.findByLabelText(/e-mail/i, {}, LAZY_ROUTE_WAIT_OPTIONS), {
      target: { value: "cliente@demo.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: "cliente123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/cliente/nova-solicitacao");
    });
  });

  it("routes the administrator home and leaves a client service selection untouched", async () => {
    const repository = createRepository();
    repository.setPendingServiceId("usucapiao");
    renderApplication("/login", repository);

    fireEvent.change(await screen.findByLabelText(/e-mail/i, {}, LAZY_ROUTE_WAIT_OPTIONS), {
      target: { value: "admin@demo.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: "admin123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/admin");
    });
    expect(repository.getPendingServiceId()).toBe("usucapiao");
  });

  it("keeps each role inside its authorized portal", async () => {
    const repository = createRepository();
    repository.setSession({
      userId: DEMO_CLIENT_ID,
      role: "client",
      signedInAt: "2026-07-11T12:00:00.000Z"
    });
    renderApplication("/admin/processos", repository);

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/cliente");
    });
  });

  it("stores a public catalog choice and opens login", () => {
    const { repository } = renderApplication("/");

    fireEvent.click(screen.getByRole("button", { name: "Regularização e registro" }));
    fireEvent.click(screen.getByRole("button", { name: "Escritura" }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar solicitação de escritura/i }));

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    expect(repository.getPendingServiceId()).toBe("escritura");
  });

  it("entra no fluxo pendente quando o cadastro retorna uma sessão", async () => {
    const repository = createRepository();
    repository.setPendingServiceId("escritura");
    const authenticatedUser: AuthenticatedUser = {
      session: {
        userId: "new-user",
        role: "client",
        signedInAt: "2026-08-04T12:00:00.000Z"
      },
      user: {
        id: "new-user",
        role: "client",
        name: "Nova Cliente",
        email: "nova@example.com",
        cpf: "",
        phone: "",
        address: "",
        createdAt: "2026-08-04T12:00:00.000Z"
      }
    };
    const authRepository = {
      ...createDemoAuthRepository(repository),
      signUp: vi.fn().mockResolvedValue({ ok: true, data: authenticatedUser })
    };
    renderApplication("/cadastro", repository, authRepository);

    fireEvent.change(await screen.findByLabelText(/^nome completo$/i), {
      target: { value: "Nova Cliente" }
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "nova@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "senha-segura" }
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "senha-segura" }
    });
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location")).toHaveTextContent("/cliente/nova-solicitacao");
    });
    expect(repository.getPendingServiceId()).toBe("escritura");
  });

  it("permanece no cadastro quando a conta exige confirmação de e-mail", async () => {
    const repository = createRepository();
    const authRepository = {
      ...createDemoAuthRepository(repository),
      signUp: vi.fn().mockResolvedValue({ ok: true, data: null })
    };
    renderApplication("/cadastro", repository, authRepository);

    fireEvent.change(await screen.findByLabelText(/^nome completo$/i), {
      target: { value: "Nova Cliente" }
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "nova@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "senha-segura" }
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "senha-segura" }
    });
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText(/verifique seu e-mail/i)).toBeInTheDocument();
    expect(screen.getByTestId("current-location")).toHaveTextContent("/cadastro");
  });
});
