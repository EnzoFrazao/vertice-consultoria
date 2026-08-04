import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PortalDataProvider } from "@/features/portal-data/PortalDataProvider";
import {
  DEMO_STATE_STORAGE_KEY,
  createDemoRepository,
  type DemoRepository,
  type StorageLike
} from "@/infrastructure/repository";
import { DEMO_ADMIN_ID, DEMO_CLIENT_ID, createDemoSeed } from "@/infrastructure/seed";
import { ClientPortal } from "@/pages/client/ClientPortal";
import { createDemoAuthRepository } from "@/test/demoAuthRepository";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

function createIsolatedRepository(initialState = createDemoSeed()) {
  return createDemoRepository({
    localStorage: createMemoryStorage({
      [DEMO_STATE_STORAGE_KEY]: JSON.stringify(initialState)
    }),
    sessionStorage: createMemoryStorage()
  });
}

async function renderClient(
  path = "/cliente",
  repository: DemoRepository = createIsolatedRepository()
) {
  repository.setSession({
    userId: DEMO_CLIENT_ID,
    role: "client",
    signedInAt: "2026-07-11T12:00:00.000Z"
  });

  const result = {
    repository,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <PortalDataProvider
          repository={repository}
          authRepository={createDemoAuthRepository(repository)}
        >
          <Routes>
            <Route path="/cliente/*" element={<ClientPortal />} />
            <Route path="/login" element={<h1>Entrar na conta</h1>} />
          </Routes>
        </PortalDataProvider>
      </MemoryRouter>
    )
  };

  await waitFor(() => {
    expect(screen.queryByText("Carregando sessão…")).not.toBeInTheDocument();
  });

  return result;
}

describe("ClientPortal", () => {
  it("abre o processo com ação mais recente como fólio ativo", async () => {
    await renderClient();

    const activeFolio = screen.getByRole("article", { name: "Fólio RV-2026-0001" });
    const coverHeading = within(activeFolio).getByRole("heading", {
      name: "Regularização de imóveis"
    });
    expect(coverHeading).toBeInTheDocument();
    expect(within(activeFolio).getByText(/Casa · Rua das Acácias, 245/i)).toBeInTheDocument();
    const nowHeading = within(activeFolio).getByRole("heading", { name: "Agora" });
    expect(screen.getAllByRole("heading", { name: "Agora" })).toHaveLength(1);
    const progressHeading = within(activeFolio).getByRole("heading", { name: "Andamento" });
    expect(
      coverHeading.compareDocumentPosition(nowHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      nowHeading.compareDocumentPosition(progressHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByText("mais 2 ações")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RV-2026-0001/i })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.getByRole("navigation", { name: /navegação do portal/i })).toHaveTextContent(
      "Meus processos"
    );
    expect(within(activeFolio).getByText("Fase 2 de 5")).toBeInTheDocument();
    expect(
      within(activeFolio).getByRole("list", { name: "Andamento do processo" })
    ).toHaveTextContent("EntradaDocumentaçãoAnálise técnicaÓrgãosConclusão");
  });

  it("explicita quando nada depende do cliente", async () => {
    const state = createDemoSeed();
    state.cases
      .filter((item) => item.clientId === DEMO_CLIENT_ID)
      .forEach((item) => {
        item.status = "Análise técnica";
        item.documents.forEach((document) => {
          document.status = "Aprovado";
          delete document.rejectionReason;
        });
      });
    const repository = createIsolatedRepository(state);

    await renderClient("/cliente", repository);

    expect(screen.getByRole("heading", { name: "Agora" })).toBeInTheDocument();
    expect(screen.getByText("Nada precisa de você agora")).toBeInTheDocument();
    expect(screen.getByText("Estado atual: Análise técnica")).toBeInTheDocument();
    expect(screen.queryByText(/mais \d+ ações/i)).not.toBeInTheDocument();
  });

  it("abre uma resposta real quando o processo aguarda o cliente sem documento", async () => {
    const state = createDemoSeed();
    const item = state.cases.find((candidate) => candidate.id === "case-0001")!;
    item.status = "Aguardando cliente";
    item.documents.forEach((document) => {
      document.status = "Aprovado";
      delete document.rejectionReason;
    });
    const repository = createIsolatedRepository(state);

    await renderClient("/cliente", repository);

    expect(screen.getByText("Fase em pausa")).toBeInTheDocument();
    const response = screen.getByRole("link", { name: "Responder à orientação recebida" });
    expect(response).toHaveAttribute("href", expect.stringContaining("wa.me"));
    fireEvent.click(response);
    expect(
      repository
        .getState()
        .cases.find((candidate) => candidate.id === "case-0001")
        ?.timeline.at(-1)?.type
    ).toBe("whatsapp-started");
  });

  it("leva a pendência ao documento correspondente e move o foco", async () => {
    await renderClient();

    const action = screen.getByRole("link", { name: /Adicionar Matrícula do imóvel/i });
    expect(action).toHaveAttribute(
      "href",
      "/cliente/processos/case-0001#documento-case-0001-doc-matricula-imovel"
    );
    fireEvent.click(action);

    const documentHeading = await screen.findByRole("heading", { name: "Matrícula do imóvel" });
    expect(documentHeading).toHaveAttribute("id", "documento-case-0001-doc-matricula-imovel");
    await waitFor(() => expect(documentHeading).toHaveFocus());
  });

  it("mantém uma única ação dominante visível em cada breakpoint do detalhe", async () => {
    await renderClient("/cliente/processos/case-0001");

    const actions = screen.getAllByRole("link", { name: /Adicionar Matrícula do imóvel/i });
    expect(actions).toHaveLength(2);
    expect(
      actions.some(
        (action) =>
          action.classList.contains("hidden") && action.classList.contains("sm:inline-flex")
      )
    ).toBe(true);
    expect(
      actions.some(
        (action) => action.classList.contains("sm:hidden") && action.classList.contains("fixed")
      )
    ).toBe(true);
  });

  it("lista somente os processos do cliente e abre seus detalhes", async () => {
    await renderClient("/cliente/processos");

    expect(screen.getByRole("heading", { name: "Meus processos" })).toBeInTheDocument();
    expect(screen.getByText("RV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("RV-2026-0002")).toBeInTheDocument();
    expect(screen.queryByText("RV-2026-0003")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /rv-2026-0001/i }));

    expect(screen.getByRole("heading", { name: "Regularização de imóveis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documentos" })).toBeInTheDocument();
    const historyHeading = screen.getByRole("heading", { name: "Histórico do processo" });
    expect(historyHeading).toBeInTheDocument();
    expect(historyHeading.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "Agora" }).closest("section")).toHaveAttribute(
      "tabindex",
      "-1"
    );
    expect(screen.queryByText(/assinatura digital/i)).not.toBeInTheDocument();
  });

  it("adiciona e reenvia documentos sem perder o contexto e anuncia o sucesso", async () => {
    const repository = createIsolatedRepository();
    const rejectedDocumentId = "case-0001-doc-comprovante-residencia";
    repository.startDocumentReview("case-0001", rejectedDocumentId, DEMO_ADMIN_ID);
    repository.reviewDocument(
      "case-0001",
      rejectedDocumentId,
      { decision: "reject", reason: "A imagem está cortada." },
      DEMO_ADMIN_ID
    );
    await renderClient("/cliente/processos/case-0001", repository);

    const pendingDocument = screen.getByTestId("document-matricula-imovel");
    expect(within(pendingDocument).getByText("Pendente")).toBeInTheDocument();
    fireEvent.click(within(pendingDocument).getByRole("button", { name: "Adicionar exemplo" }));
    expect(within(pendingDocument).getByText("Enviado")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Matrícula do imóvel enviado para análise"
    );
    await waitFor(() =>
      expect(
        within(pendingDocument).getByRole("heading", { name: "Matrícula do imóvel" })
      ).toHaveFocus()
    );

    const rejectedDocument = screen.getByTestId("document-comprovante-residencia");
    expect(within(rejectedDocument).getByText("A imagem está cortada.")).toBeInTheDocument();
    fireEvent.click(within(rejectedDocument).getByRole("button", { name: "Nova versão" }));
    expect(within(rejectedDocument).getByText("Enviado")).toBeInTheDocument();
    expect(repository.getState().cases[0].timeline.at(-1)?.title).toMatch(/reenviado/i);
  });

  it("mostra um início e um índice vazios com caminho para o primeiro imóvel", async () => {
    const state = createDemoSeed();
    state.cases = state.cases.filter((item) => item.clientId !== DEMO_CLIENT_ID);
    state.notifications = state.notifications.filter(
      (notification) =>
        !notification.caseId || state.cases.some((item) => item.id === notification.caseId)
    );
    const repository = createIsolatedRepository(state);

    const dashboard = await renderClient("/cliente", repository);
    expect(
      screen.getByRole("heading", { name: "Este espaço começa com o seu imóvel" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /criar primeira solicitação/i })).toHaveAttribute(
      "href",
      "/cliente/nova-solicitacao"
    );
    dashboard.unmount();

    await renderClient("/cliente/processos", repository);
    expect(
      screen.getByRole("heading", { name: "Este espaço começa com o seu imóvel" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar solicitação/i })).toHaveAttribute(
      "href",
      "/cliente/nova-solicitacao"
    );
  });

  it("explicita quando o processo solicitado não existe", async () => {
    await renderClient("/cliente/processos/processo-inexistente");

    expect(screen.getByRole("heading", { name: "Processo não encontrado" })).toBeInTheDocument();
    expect(screen.getByText(/não existe ou não pertence à sua conta/i)).toBeInTheDocument();
  });

  it("registra o contato de WhatsApp com serviço e protocolo", async () => {
    const { repository } = await renderClient("/cliente/processos/case-0001");
    const link = screen.getByRole("link", { name: /falar sobre este processo no whatsapp/i });

    expect(link).toHaveAttribute("href", expect.stringContaining("RV-2026-0001"));
    expect(link).toHaveAttribute("href", expect.stringContaining("Regulariza%C3%A7%C3%A3o"));
    fireEvent.click(link);

    expect(repository.getState().cases[0].timeline.at(-1)?.type).toBe("whatsapp-started");
  });

  it("mantém um processo concluído somente para consulta", async () => {
    const repository = createIsolatedRepository();
    repository.updateCaseStatus("case-0001", "Concluído", DEMO_ADMIN_ID);
    await renderClient("/cliente/processos/case-0001", repository);

    expect(
      screen.getByText(/processo concluído e disponível somente para consulta/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar exemplo|nova versão/i })
    ).not.toBeInTheDocument();
  });

  it("cria uma solicitação em quatro passos sem exigir todos os documentos", async () => {
    const repository = createIsolatedRepository();
    repository.setPendingServiceId("usucapiao");
    await renderClient("/cliente/nova-solicitacao", repository);

    expect(screen.getByText("Etapa 1 de 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Serviço")).toHaveValue("usucapiao");
    fireEvent.change(screen.getByLabelText("Objetivo da solicitação"), {
      target: { value: "Regularizar a posse do imóvel onde minha família vive." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Etapa 2 de 4")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByLabelText("CPF")).toBeDisabled();
    expect(screen.getByLabelText("Telefone")).toHaveValue("(85) 99999-1001");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Etapa 3 de 4")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tipo do imóvel"), { target: { value: "Casa" } });
    fireEvent.change(screen.getByLabelText("Endereço do imóvel"), {
      target: { value: "Rua do Cajueiro" }
    });
    fireEvent.change(screen.getByLabelText("Número"), { target: { value: "88" } });
    fireEvent.change(screen.getByLabelText("Bairro"), { target: { value: "Aldeota" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Fortaleza" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "CE" } });
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "60150-000" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Etapa 4 de 4")).toBeInTheDocument();
    const documentOptions = screen.getAllByRole("checkbox");
    expect(documentOptions).toHaveLength(6);
    fireEvent.click(screen.getByLabelText("Adicionar RG/CPF"));
    fireEvent.click(screen.getByLabelText("Adicionar Matrícula do imóvel"));
    fireEvent.click(screen.getByRole("button", { name: "Criar solicitação" }));

    expect(screen.getByRole("heading", { name: "Usucapião" })).toBeInTheDocument();
    expect(screen.getByText("RV-2026-0004")).toBeInTheDocument();
    expect(screen.getAllByText("Documentos pendentes").length).toBeGreaterThan(0);
    expect(repository.getPendingServiceId()).toBeNull();
    expect(
      repository
        .getState()
        .cases.at(-1)
        ?.documents.filter((item) => item.status === "Enviado")
    ).toHaveLength(2);
  });

  it("moves focus to the current step heading when returning to the first step", async () => {
    await renderClient("/cliente/nova-solicitacao");

    fireEvent.change(screen.getByLabelText("Objetivo da solicitação"), {
      target: { value: "Regularizar a posse do imóvel." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    const backButton = screen.getByRole("button", { name: "Voltar" });
    backButton.focus();
    fireEvent.click(backButton);

    expect(screen.getByRole("heading", { name: "Serviço e objetivo" })).toHaveFocus();
  });

  it("atualiza telefone e endereço sem liberar e-mail e CPF", async () => {
    const { repository } = await renderClient("/cliente/perfil");

    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByLabelText("CPF")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "(85) 98888-7777" } });
    fireEvent.change(screen.getByLabelText("Endereço"), {
      target: { value: "Rua Nova, 45 · Fortaleza, CE" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("status")).toHaveTextContent("Perfil atualizado");
    expect(repository.getState().users.find((item) => item.id === DEMO_CLIENT_ID)?.phone).toBe(
      "(85) 98888-7777"
    );
  });

  it("permite ler notificações e encerrar a sessão", async () => {
    const { repository } = await renderClient();

    fireEvent.click(screen.getByRole("button", { name: /notificações, 1 não lida/i }));
    expect(screen.getByText("Processo em análise técnica")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /marcar processo em análise técnica como lida/i })
    );
    expect(
      repository.getState().notifications.find((item) => item.id === "notification-client-0001")
        ?.readAt
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(screen.getByRole("heading", { name: "Entrar na conta" })).toBeInTheDocument();
    expect(repository.getSession()).toBeNull();
  });
});
