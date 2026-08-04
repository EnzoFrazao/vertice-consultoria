import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/features/auth/auth";
import { createDemoRepository, type StorageLike } from "@/infrastructure/repository";
import { PortalDataProvider, usePortalData } from "@/features/portal-data/PortalDataProvider";
import { createDemoAuthRepository } from "@/test/demoAuthRepository";

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

function Probe() {
  const app = usePortalData();
  return (
    <div>
      <p data-testid="session-role">{app.session?.role ?? "sem sessão"}</p>
      <p data-testid="user-name">{app.currentUser?.name ?? "sem usuário"}</p>
      <p data-testid="pending-service">{app.pendingServiceId ?? "sem serviço"}</p>
      <p data-testid="user-phone">{app.currentUser?.phone ?? "sem telefone"}</p>
      <p data-testid="repository-exposed">{"repository" in app ? "exposto" : "encapsulado"}</p>
      <button type="button" onClick={() => app.login("cliente@demo.com", "cliente123")}>
        Login cliente
      </button>
      <button type="button" onClick={() => app.login("cliente@demo.com", "errada")}>
        Login inválido
      </button>
      <button type="button" onClick={() => app.setPendingServiceId("escritura")}>
        Selecionar escritura
      </button>
      <button
        type="button"
        onClick={() =>
          app.signUp({
            name: "Nova Cliente",
            email: "nova@example.com",
            password: "senha-segura"
          })
        }
      >
        Cadastrar cliente
      </button>
      <button
        type="button"
        onClick={() =>
          app.updateUserProfile(app.currentUser!.id, {
            phone: "(85) 98888-0000",
            address: "Rua Atualizada, 10"
          })
        }
      >
        Atualizar perfil
      </button>
      <button type="button" onClick={app.logout}>
        Sair
      </button>
    </div>
  );
}

describe("PortalDataProvider", () => {
  it("keeps authentication and pending service reactive around one repository", async () => {
    const repository = createDemoRepository({
      localStorage: createStorage(),
      sessionStorage: createStorage()
    });

    render(
      <PortalDataProvider
        repository={repository}
        authRepository={createDemoAuthRepository(repository)}
      >
        <Probe />
      </PortalDataProvider>
    );

    expect(screen.getByTestId("session-role")).toHaveTextContent("sem sessão");
    expect(screen.getByTestId("repository-exposed")).toHaveTextContent("encapsulado");
    fireEvent.click(screen.getByRole("button", { name: "Login inválido" }));
    expect(screen.getByTestId("session-role")).toHaveTextContent("sem sessão");

    fireEvent.click(screen.getByRole("button", { name: "Login cliente" }));
    await waitFor(() => {
      expect(screen.getByTestId("session-role")).toHaveTextContent("client");
    });
    expect(screen.getByTestId("user-name")).toHaveTextContent("Marina Oliveira");

    fireEvent.click(screen.getByRole("button", { name: "Selecionar escritura" }));
    expect(screen.getByTestId("pending-service")).toHaveTextContent("escritura");

    fireEvent.click(screen.getByRole("button", { name: "Atualizar perfil" }));
    expect(screen.getByTestId("user-phone")).toHaveTextContent("(85) 98888-0000");

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => {
      expect(screen.getByTestId("session-role")).toHaveTextContent("sem sessão");
    });
  });

  it("reflete imediatamente a sessão criada pelo cadastro", async () => {
    const repository = createDemoRepository({
      localStorage: createStorage(),
      sessionStorage: createStorage()
    });
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

    render(
      <PortalDataProvider repository={repository} authRepository={authRepository}>
        <Probe />
      </PortalDataProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    await waitFor(() => {
      expect(screen.getByTestId("session-role")).toHaveTextContent("client");
      expect(screen.getByTestId("user-name")).toHaveTextContent("Nova Cliente");
    });
  });
});
