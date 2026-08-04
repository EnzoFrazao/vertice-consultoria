import { fireEvent, render as renderTestingLibrary, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser, AuthResult } from "@/features/auth/auth";
import { LoginPage } from "@/pages/login/LoginPage";

const INVALID_LOGIN: AuthResult<AuthenticatedUser> = {
  ok: false,
  error: "invalid_credentials"
};

function render(ui: ReactElement) {
  return renderTestingLibrary(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LoginPage", () => {
  it("preserva o serviço e oferece cadastro sem atalhos de conta demo", () => {
    render(
      <LoginPage
        pendingServiceName="Escritura"
        onLogin={() => Promise.resolve(INVALID_LOGIN)}
        onResetDemo={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: /acesse sua jornada/i })).toBeInTheDocument();
    expect(screen.getByText(/escritura/i)).toBeInTheDocument();
    expect(screen.queryByText(/preencher uma conta demo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /usar conta/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cadastre-se/i })).toHaveAttribute("href", "/cadastro");
    expect(screen.getByRole("link", { name: /cadastre-se/i })).toHaveClass(
      "min-h-12",
      "rounded-full"
    );
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
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
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
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
  });

  it("mantém a ação separada de reiniciar a demonstração", () => {
    const onResetDemo = vi.fn();
    render(<LoginPage onLogin={() => Promise.resolve(INVALID_LOGIN)} onResetDemo={onResetDemo} />);

    fireEvent.click(screen.getByRole("button", { name: /reiniciar demonstração/i }));
    expect(onResetDemo).toHaveBeenCalledTimes(1);
  });

  it("keeps control boundaries and small supporting text at AA contrast", () => {
    render(<LoginPage onLogin={() => Promise.resolve(INVALID_LOGIN)} onResetDemo={() => {}} />);

    expect(screen.getByLabelText(/e-mail/i)).toHaveClass("border-cacao/55");
    expect(screen.getByLabelText(/^senha$/i)).toHaveClass("border-cacao/55");
    expect(screen.getByText(/ainda não tem uma conta/i)).toHaveClass("text-cacao/75");
  });
});
