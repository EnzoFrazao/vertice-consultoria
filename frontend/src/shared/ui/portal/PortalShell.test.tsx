import { act, fireEvent, render as testingRender, screen, within } from "@testing-library/react";
import { Bell, FolderKanban, LayoutDashboard } from "lucide-react";
import type { ReactElement } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EmptyState,
  PageHeader,
  PortalShell,
  StatCard,
  StatusBadge,
  type PortalNotification
} from "@/shared/ui/portal";

const navigation = [
  { label: "Visão geral", href: "/cliente", icon: LayoutDashboard },
  { label: "Meus processos", href: "/cliente/processos", icon: FolderKanban }
];

const notifications: PortalNotification[] = [
  {
    id: "notification-unread",
    title: "Documento aprovado",
    message: "A matrícula do imóvel foi aprovada.",
    createdAtLabel: "Há 10 minutos",
    isRead: false,
    href: "/cliente/processos/RV-2026-0001"
  },
  {
    id: "notification-read",
    title: "Processo atualizado",
    message: "O processo avançou para análise técnica.",
    createdAtLabel: "Ontem",
    isRead: true
  }
];

function render(ui: ReactElement, initialEntries = ["/cliente"]) {
  return testingRender(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Rota atual">{location.pathname}</output>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

describe("PortalShell", () => {
  it("renders the Vértice identity, numbered index, active rule and xl desktop shell", () => {
    const onLogout = vi.fn();

    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente/processos"
        notifications={notifications}
        onLogout={onLogout}
      >
        <h1>Meus processos</h1>
      </PortalShell>
    );

    const brandLink = screen.getByRole("link", { name: "Vértice Consultoria" });
    expect(within(brandLink).getByRole("img", { name: "Vértice Consultoria" })).toHaveAttribute(
      "src",
      "/brand/vertice-consultoria.png"
    );
    expect(brandLink).toHaveClass("min-h-11");
    expect(screen.getByText("Área do cliente")).toBeInTheDocument();
    expect(screen.getByText("Marina Costa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Meus processos" })).toBeInTheDocument();

    const desktopIndex = screen.getByTestId("portal-desktop-index");
    expect(desktopIndex).toHaveClass("hidden", "w-60", "xl:flex");
    expect(desktopIndex).not.toHaveClass("lg:flex");

    const overviewLink = within(desktopIndex).getByRole("link", { name: "Visão geral" });
    const processesLink = within(desktopIndex).getByRole("link", { name: "Meus processos" });
    expect(overviewLink).toHaveTextContent("01");
    expect(processesLink).toHaveTextContent("02");
    expect(processesLink).toHaveAttribute("aria-current", "page");
    expect(processesLink).toHaveClass("min-h-11", "border-l-2", "border-bronze");
    expect(overviewLink).not.toHaveAttribute("aria-current");

    const menuButton = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(menuButton).toHaveClass("xl:hidden");
    expect(menuButton).not.toHaveClass("lg:hidden");

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("uses client-side routing for the index, brand and notification destinations", () => {
    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={notifications}
        onLogout={() => {}}
      >
        <LocationProbe />
      </PortalShell>
    );

    const desktopIndex = screen.getByTestId("portal-desktop-index");
    fireEvent.click(within(desktopIndex).getByRole("link", { name: "Meus processos" }));
    expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent(
      "/cliente/processos"
    );

    fireEvent.click(screen.getByRole("link", { name: "Vértice Consultoria" }));
    expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent("/cliente");

    fireEvent.click(screen.getByRole("button", { name: "Notificações, 1 não lida" }));
    fireEvent.click(screen.getByRole("link", { name: /Documento aprovado/i }));
    expect(screen.getByRole("status", { name: "Rota atual" })).toHaveTextContent(
      "/cliente/processos/RV-2026-0001"
    );
  });

  it("opens and closes an accessible mobile navigation drawer", () => {
    render(
      <PortalShell
        role="admin"
        userName="Equipe Regularização"
        navigation={navigation}
        currentPath="/cliente"
        notifications={[]}
        onLogout={() => {}}
      >
        <p>Fila operacional</p>
      </PortalShell>
    );

    const openButton = screen.getByRole("button", {
      name: "Abrir menu de navegação"
    });
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);

    const drawer = screen.getByRole("dialog", { name: "Menu de navegação" });
    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(within(drawer).getByText("Área administrativa")).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "Visão geral" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Fechar menu" }));
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).not.toBeInTheDocument();
  });

  it("moves, traps and restores focus while isolating the page behind the mobile drawer", () => {
    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={[]}
        onLogout={() => {}}
      >
        <button type="button">Ação da página</button>
      </PortalShell>
    );

    const openButton = screen.getByRole("button", {
      name: "Abrir menu de navegação"
    });
    fireEvent.click(openButton);

    const drawer = screen.getByRole("dialog", { name: "Menu de navegação" });
    const closeButton = within(drawer).getByRole("button", { name: "Fechar menu" });
    const lastDrawerLink = within(drawer).getByRole("link", { name: "Meus processos" });
    const application = screen.getByTestId("portal-application");

    expect(closeButton).toHaveFocus();
    expect(application).toHaveAttribute("inert");
    expect(application).toHaveAttribute("aria-hidden", "true");

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastDrawerLink).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    expect(application).not.toHaveAttribute("inert");
    expect(application).not.toHaveAttribute("aria-hidden");
  });

  it("closes the mobile drawer and releases the page when the viewport reaches desktop", () => {
    let matchesDesktop = false;
    const changeListeners = new Set<(event: MediaQueryListEvent) => void>();
    const desktopQuery = {
      get matches() {
        return matchesDesktop;
      },
      media: "(min-width: 1280px)",
      onchange: null,
      addEventListener: vi.fn(
        (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          changeListeners.add(listener);
        }
      ),
      removeEventListener: vi.fn(
        (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          changeListeners.delete(listener);
        }
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => desktopQuery));

    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={[]}
        onLogout={() => {}}
      >
        <p>Conteúdo</p>
      </PortalShell>
    );

    const openButton = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1280px)");
    fireEvent.click(openButton);
    const application = screen.getByTestId("portal-application");

    expect(screen.getByRole("dialog", { name: "Menu de navegação" })).toBeInTheDocument();
    expect(application).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      matchesDesktop = true;
      changeListeners.forEach((listener) =>
        listener({ matches: true, media: desktopQuery.media } as MediaQueryListEvent)
      );
    });

    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).not.toBeInTheDocument();
    expect(application).not.toHaveAttribute("inert");
    expect(application).not.toHaveAttribute("aria-hidden");
    expect(document.body.style.overflow).toBe("");
    expect(openButton).toHaveFocus();
  });

  it("shows notifications and exposes individual and bulk read actions", () => {
    const onMarkNotification = vi.fn();
    const onMarkAllNotifications = vi.fn();

    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={notifications}
        onLogout={() => {}}
        onMarkNotification={onMarkNotification}
        onMarkAllNotifications={onMarkAllNotifications}
      >
        <p>Conteúdo</p>
      </PortalShell>
    );

    const notificationButton = screen.getByRole("button", {
      name: "Notificações, 1 não lida"
    });
    expect(notificationButton).toHaveTextContent("1");

    fireEvent.click(notificationButton);

    const panel = screen.getByRole("region", { name: "Notificações" });
    expect(panel).toHaveClass(
      "fixed",
      "left-3",
      "right-3",
      "w-auto",
      "sm:absolute",
      "sm:left-auto",
      "sm:right-0"
    );
    expect(within(panel).getByText("Documento aprovado")).toBeInTheDocument();
    expect(within(panel).getByText("A matrícula do imóvel foi aprovada.")).toBeInTheDocument();
    expect(within(panel).getByText("Não lida.")).toHaveClass("sr-only");
    expect(within(panel).getByText("Lida.")).toHaveClass("sr-only");
    expect(
      within(panel).getByRole("link", { name: /Documento aprovado/i })
    ).toHaveAttribute("href", "/cliente/processos/RV-2026-0001");
    expect(
      within(panel).getByRole("link", { name: /Documento aprovado/i })
    ).toHaveClass("min-h-11");

    fireEvent.click(
      within(panel).getByRole("button", {
        name: "Marcar Documento aprovado como lida"
      })
    );
    fireEvent.click(within(panel).getByRole("button", { name: "Marcar todas como lidas" }));

    expect(onMarkNotification).toHaveBeenCalledWith("notification-unread");
    expect(onMarkAllNotifications).toHaveBeenCalledTimes(1);
  });

  it("uses notification disclosure semantics and restores focus on Escape", () => {
    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={notifications}
        onLogout={() => {}}
      >
        <p>Conteúdo</p>
      </PortalShell>
    );

    const trigger = screen.getByRole("button", { name: "Notificações, 1 não lida" });
    fireEvent.click(trigger);

    const disclosure = screen.getByRole("region", { name: "Notificações" });
    const notificationLink = within(disclosure).getByRole("link", {
      name: /Documento aprovado/i
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog", { name: "Notificações" })).not.toBeInTheDocument();

    notificationLink.focus();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("region", { name: "Notificações" })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("renders a clear empty notification state", () => {
    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={[]}
        onLogout={() => {}}
      >
        <p>Conteúdo</p>
      </PortalShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Notificações" }));
    expect(screen.getByText("Nenhuma notificação por enquanto.")).toBeInTheDocument();
  });

  it("keeps the brand and title-only notification links at least 44 pixels tall", () => {
    render(
      <PortalShell
        role="client"
        userName="Marina Costa"
        navigation={navigation}
        currentPath="/cliente"
        notifications={[
          {
            id: "title-only",
            title: "Nova etapa disponível",
            isRead: false,
            href: "/cliente/processos/RV-2026-0001"
          }
        ]}
        onLogout={() => {}}
      >
        <p>Conteúdo</p>
      </PortalShell>
    );

    expect(screen.getByRole("link", { name: "Vértice Consultoria" })).toHaveClass("min-h-11");

    fireEvent.click(screen.getByRole("button", { name: "Notificações, 1 não lida" }));
    expect(screen.getByRole("link", { name: /Nova etapa disponível/i })).toHaveClass(
      "min-h-11"
    );
  });
});

describe("portal presentation components", () => {
  it("renders page headings and supporting content with semantic structure", () => {
    render(
      <PageHeader
        eyebrow="Processos"
        title="Acompanhe seus processos"
        description="Veja o andamento e as próximas ações."
        actions={<button type="button">Nova solicitação</button>}
      />
    );

    expect(screen.getByRole("heading", { name: "Acompanhe seus processos", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Veja o andamento e as próximas ações.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova solicitação" })).toBeInTheDocument();
  });

  it("maps common workflow statuses to distinct badge tones", () => {
    const { rerender } = render(<StatusBadge status="Aprovado" />);
    expect(screen.getByText("Aprovado")).toHaveClass("bg-tealTech/10", "text-tealTech");

    rerender(<StatusBadge status="Rejeitado" />);
    expect(screen.getByText("Rejeitado")).toHaveClass("bg-red-50", "text-red-700");

    rerender(<StatusBadge status="Aguardando cliente" />);
    expect(screen.getByText("Aguardando cliente")).toHaveClass("bg-amber-50", "text-amber-800");
  });

  it("does not classify explicitly negative status labels as successful", () => {
    const { rerender } = render(<StatusBadge status="Não aprovado" />);
    expect(screen.getByText("Não aprovado")).toHaveClass("bg-espresso/5", "text-cacao/75");
    expect(screen.getByText("Não aprovado")).not.toHaveClass("bg-tealTech/10");

    rerender(<StatusBadge status="Não concluído" />);
    expect(screen.getByText("Não concluído")).toHaveClass("bg-espresso/5", "text-cacao/75");
    expect(screen.getByText("Não concluído")).not.toHaveClass("bg-tealTech/10");
  });

  it("renders reusable empty and metric cards", () => {
    render(
      <>
        <EmptyState
          icon={Bell}
          title="Tudo em dia"
          description="Nenhuma pendência exige sua atenção."
          action={<button type="button">Ver processos</button>}
        />
        <StatCard label="Em andamento" value="3" hint="Um atualizado hoje" />
      </>
    );

    expect(screen.getByRole("heading", { name: "Tudo em dia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver processos" })).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Um atualizado hoje")).toBeInTheDocument();
  });
});
