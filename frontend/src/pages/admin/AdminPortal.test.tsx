import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PortalDataProvider } from "@/features/portal-data/PortalDataProvider";
import {
  createDemoRepository,
  type DemoRepository,
  type StorageLike
} from "@/infrastructure/demo/repository";
import { DEMO_ADMIN_ID } from "@/infrastructure/demo/seed";
import { AdminPortal } from "@/pages/admin/AdminPortal";

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

function createAdminRepository() {
  const repository = createDemoRepository({
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    now: () => new Date("2026-07-11T12:00:00.000Z")
  });
  repository.setSession({
    userId: DEMO_ADMIN_ID,
    role: "admin",
    signedInAt: "2026-07-11T12:00:00.000Z"
  });
  return repository;
}

function renderAdmin(path = "/admin", repository: DemoRepository = createAdminRepository()) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <PortalDataProvider repository={repository}>
        <Routes>
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="/login" element={<h1>Login da demonstração</h1>} />
        </Routes>
      </PortalDataProvider>
    </MemoryRouter>
  );
  return repository;
}

describe("AdminPortal", () => {
  it("organiza a Mesa de Operações em pauta, fólio ativo e despacho contextual", async () => {
    renderAdmin();

    expect(screen.getByRole("heading", { name: "Mesa de Operações", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pauta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Decidir agora" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Depende do cliente" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Em andamento" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pulso operacional" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Fólio RV-2026-0003" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Despacho contextual" })).toBeInTheDocument();
    expect(screen.getByText("Despachar e seguir")).toBeInTheDocument();
    expect(screen.queryByText("Fila de trabalho")).not.toBeInTheDocument();
    expect(screen.queryByText("Indicadores gerais")).not.toBeInTheDocument();

    const pautaItem = screen.getAllByRole("button", { name: /RV-2026-0001/i })[0];
    fireEvent.click(pautaItem);
    const mobileDossier = screen.getByRole("dialog", { name: "Dossiê operacional RV-2026-0001" });
    expect(within(mobileDossier).getByRole("article", { name: "Fólio RV-2026-0001" })).toBeInTheDocument();
    fireEvent.click(within(mobileDossier).getByRole("button", { name: "Voltar à pauta" }));
    await waitFor(() => expect(pautaItem).toHaveFocus());

    for (const label of ["Início", "Processos", "Documentos", "Clientes"]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(screen.getByRole("heading", { name: "Login da demonstração" })).toBeInTheDocument();
  });

  it("busca e filtra processos por status, serviço e cliente", () => {
    renderAdmin("/admin/processos");

    expect(screen.getByRole("heading", { name: "Processos", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RV-2026-0001/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RV-2026-0002/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RV-2026-0003/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar processos"), {
      target: { value: "Fernanda" }
    });
    expect(screen.getByRole("link", { name: /RV-2026-0003/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /RV-2026-0001/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar processos"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por status"), {
      target: { value: "Análise técnica" }
    });
    expect(screen.getByRole("link", { name: /RV-2026-0002/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /RV-2026-0003/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por status"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por serviço"), {
      target: { value: "escritura" }
    });
    expect(screen.getByRole("link", { name: /RV-2026-0003/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /RV-2026-0002/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por serviço"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por cliente"), {
      target: { value: "user-client-demo" }
    });
    expect(screen.getByRole("link", { name: /RV-2026-0001/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RV-2026-0002/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /RV-2026-0003/i })).not.toBeInTheDocument();
  });

  it("atualiza o status, confirma a conclusão e torna o processo concluído somente leitura", () => {
    const repository = createAdminRepository();
    renderAdmin("/admin/processos/case-0002", repository);

    expect(screen.getByRole("heading", { name: "RV-2026-0002", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Análise de Valor de Mercado")).toBeInTheDocument();
    expect(screen.getByText("Marina Oliveira")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Novo status do processo"), {
      target: { value: "Prefeitura/cartório" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar status" }));
    expect(repository.getState().cases.find((item) => item.id === "case-0002")?.status).toBe(
      "Prefeitura/cartório"
    );
    expect(
      repository.getState().cases.find((item) => item.id === "case-0002")?.timeline.some(
        (event) => event.type === "status-changed" && event.title.includes("Prefeitura/cartório")
      )
    ).toBe(true);
    expect(
      repository.getState().notifications.some(
        (notification) =>
          notification.userId === "user-client-demo" &&
          notification.caseId === "case-0002" &&
          notification.type === "status-changed"
      )
    ).toBe(true);

    fireEvent.change(screen.getByLabelText("Novo status do processo"), {
      target: { value: "Concluído" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar status" }));

    const confirmation = screen.getByRole("alertdialog", { name: "Concluir processo?" });
    expect(within(confirmation).getByText(/não poderá mais ser alterado/i)).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Confirmar conclusão" }));

    expect(repository.getState().cases.find((item) => item.id === "case-0002")?.status).toBe(
      "Concluído"
    );
    expect(screen.getByText("Processo concluído e somente leitura")).toBeInTheDocument();
    expect(screen.queryByLabelText("Novo status do processo")).not.toBeInTheDocument();
  });

  it("confirma a mudança de estado em um diálogo acessível no mobile", async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("max-width: 639px"),
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true
      }))
    );

    try {
      const repository = createAdminRepository();
      renderAdmin("/admin/processos/case-0002", repository);
      fireEvent.change(screen.getByLabelText("Novo status do processo"), {
        target: { value: "Prefeitura/cartório" }
      });
      const trigger = screen.getByRole("button", { name: "Atualizar status" });
      fireEvent.click(trigger);

      const dialog = screen.getByRole("dialog", { name: "Alterar estado do processo?" });
      const cancel = within(dialog).getByRole("button", { name: "Cancelar" });
      await waitFor(() => expect(cancel).toHaveFocus());
      expect(repository.getState().cases.find((item) => item.id === "case-0002")?.status).toBe("Análise técnica");

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());

      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("button", { name: "Confirmar novo estado" }));
      expect(repository.getState().cases.find((item) => item.id === "case-0002")?.status).toBe("Prefeitura/cartório");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("registra o contato por WhatsApp com serviço e protocolo", () => {
    const repository = createAdminRepository();
    renderAdmin("/admin/processos/case-0003", repository);
    const before = repository.getState().cases.find((item) => item.id === "case-0003")!.timeline.length;

    const whatsapp = screen.getByRole("link", { name: "Conversar com Fernanda Alves no WhatsApp" });
    expect(whatsapp.getAttribute("href")).toContain("RV-2026-0003");
    expect(whatsapp.getAttribute("href")).toContain(encodeURIComponent("Escritura"));

    fireEvent.click(whatsapp);
    const item = repository.getState().cases.find((candidate) => candidate.id === "case-0003")!;
    expect(item.timeline).toHaveLength(before + 1);
    expect(item.timeline[item.timeline.length - 1]?.type).toBe("whatsapp-started");
  });

  it("inicia a análise, aprova documentos e exige motivo próximo ao campo de rejeição", () => {
    const repository = createAdminRepository();
    renderAdmin("/admin/documentos", repository);

    expect(screen.getByRole("heading", { name: "Documentos", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /Documento Versão Tamanho Processo Cliente Estado Atualização Despacho/i,
        hidden: true
      })
    ).toHaveClass("2xl:grid");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Iniciar análise de Comprovante de residência do protocolo RV-2026-0001"
      })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Rejeitar Comprovante de residência do protocolo RV-2026-0001"
      })
    );

    const reason = screen.getByLabelText(
      "Motivo da rejeição de Comprovante de residência do protocolo RV-2026-0001"
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rejeição" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o motivo da rejeição.");

    fireEvent.change(reason, { target: { value: "Documento sem todas as páginas." } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rejeição" }));

    const rejected = repository
      .getState()
      .cases.find((item) => item.id === "case-0001")!
      .documents.find((document) => document.kind === "comprovante-residencia")!;
    expect(rejected.status).toBe("Rejeitado");
    expect(rejected.rejectionReason).toBe("Documento sem todas as páginas.");
    expect(
      repository.getState().cases.find((item) => item.id === "case-0001")?.timeline.some(
        (event) => event.type === "document-rejected" && event.description === rejected.rejectionReason
      )
    ).toBe(true);
    expect(
      repository.getState().notifications.some(
        (notification) =>
          notification.userId === "user-client-demo" &&
          notification.documentId === rejected.id &&
          notification.type === "document-rejected"
      )
    ).toBe(true);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Iniciar análise de IPTU do protocolo RV-2026-0001"
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aprovar IPTU do protocolo RV-2026-0001" })
    );
    expect(
      repository
        .getState()
        .cases.find((item) => item.id === "case-0001")!
        .documents.find((document) => document.kind === "iptu")?.status
    ).toBe("Aprovado");
  });

  it("abre o diálogo de rejeição a partir do despacho contextual por hash", async () => {
    renderAdmin("/admin/documentos#documento-case-0003-doc-rg-cpf");

    const dialog = await screen.findByRole("dialog", { name: "Registrar ajuste necessário" });
    const reason = within(dialog).getByLabelText(
      "Motivo da rejeição de RG/CPF do protocolo RV-2026-0003"
    );
    await waitFor(() => expect(reason).toHaveFocus());
  });

  it("mantém o diretório de clientes somente leitura e integra o filtro de processos", () => {
    renderAdmin("/admin/clientes");

    expect(screen.getByRole("heading", { name: "Clientes", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Marina Oliveira")).toBeInTheDocument();
    expect(screen.getByText("Fernanda Alves")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /novo cliente|editar cliente/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver processos de Marina Oliveira" })).toHaveAttribute(
      "href",
      "/admin/processos?cliente=user-client-demo"
    );
  });

  it("permite marcar as notificações administrativas como lidas", () => {
    const repository = createAdminRepository();
    renderAdmin("/admin", repository);

    fireEvent.click(screen.getByRole("button", { name: "Notificações, 1 não lida" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    expect(
      repository
        .getState()
        .notifications.filter((notification) => notification.userId === DEMO_ADMIN_ID)
        .every((notification) => Boolean(notification.readAt))
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });
});
