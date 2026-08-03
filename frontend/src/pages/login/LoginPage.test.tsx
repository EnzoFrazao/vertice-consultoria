import {
  fireEvent,
  render as renderTestingLibrary,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser, AuthResult } from "@/features/auth/auth";
import { LoginPage } from "@/pages/login/LoginPage";

const INVALID_LOGIN: AuthResult<AuthenticatedUser> = {
  ok: false,
  error: "invalid_credentials"
};

const SUCCESSFUL_LOGIN: AuthResult<AuthenticatedUser> = {
  ok: true,
  data: {
    session: {
      userId: "user-1",
      role: "client",
      signedInAt: "2026-08-03T20:00:00.000Z"
    },
    user: {
      id: "user-1",
      role: "client",
      name: "Cliente",
      email: "cliente@example.com",
      cpf: "",
      phone: "",
      address: "",
      createdAt: "2026-08-03T20:00:00.000Z"
    }
  }
};

function render(ui: ReactElement) {
  return renderTestingLibrary(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LoginPage", () => {
  it("explains the demo accounts and preserves the selected service context", () => {
    render(
      <LoginPage
        pendingServiceName="Escritura"
        onLogin={() => Promise.resolve(INVALID_LOGIN)}
        onResetDemo={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: /acesse sua jornada/i })).toBeInTheDocument();
    expect(screen.getByText(/escritura/i)).toBeInTheDocument();
    expect(screen.getByText("cliente@demo.com")).toBeInTheDocument();
    expect(screen.getByText("admin@demo.com")).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Vértice Consultoria" }).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /voltar para o site/i })).toHaveAttribute("href", "/");
  });

  it("awaits login and exposes invalid credentials clearly", async () => {
    const onLogin = vi.fn(() => Promise.resolve(INVALID_LOGIN));
    render(<LoginPage onLogin={onLogin} onResetDemo={() => {}} />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "cliente@demo.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "errada" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(onLogin).toHaveBeenCalledWith("cliente@demo.com", "errada");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos."
    );
  });

  it("prevents repeated submissions while authentication is pending", async () => {
    let finishLogin: (result: AuthResult<AuthenticatedUser>) => void = () => {};
    const onLogin = vi.fn(
      () =>
        new Promise<AuthResult<AuthenticatedUser>>((resolve) => {
          finishLogin = resolve;
        })
    );
    render(<LoginPage onLogin={onLogin} onResetDemo={() => {}} />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "cliente@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "senha-segura" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();

    finishLogin(INVALID_LOGIN);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos."
    );
  });

  it("can fill either demo account and reset the shared demonstration", async () => {
    const onLogin = vi.fn(() => Promise.resolve(SUCCESSFUL_LOGIN));
    const onResetDemo = vi.fn();
    render(<LoginPage onLogin={onLogin} onResetDemo={onResetDemo} />);

    fireEvent.click(screen.getByRole("button", { name: /usar conta cliente/i }));
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("cliente@demo.com");
    expect(screen.getByLabelText(/^senha$/i)).toHaveValue("cliente123");

    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));
    expect(onLogin).toHaveBeenCalledWith("cliente@demo.com", "cliente123");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^entrar$/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /reiniciar demonstração/i }));
    expect(onResetDemo).toHaveBeenCalledTimes(1);
  });

  it("keeps control boundaries and small supporting text at AA contrast", () => {
    render(
      <LoginPage
        onLogin={() => Promise.resolve(INVALID_LOGIN)}
        onResetDemo={() => {}}
      />
    );

    expect(screen.getByLabelText(/e-mail/i)).toHaveClass("border-cacao/55");
    expect(screen.getByLabelText(/^senha$/i)).toHaveClass("border-cacao/55");
    expect(screen.getByText("Acompanhe processos, documentos e pendências.")).toHaveClass(
      "text-cacao/75"
    );
  });
});
