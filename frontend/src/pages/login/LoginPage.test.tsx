import { fireEvent, render as renderTestingLibrary, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/pages/login/LoginPage";

function render(ui: ReactElement) {
  return renderTestingLibrary(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LoginPage", () => {
  it("explains the demo accounts and preserves the selected service context", () => {
    render(
      <LoginPage
        pendingServiceName="Escritura"
        onLogin={() => false}
        onResetDemo={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: /acesse sua jornada/i })).toBeInTheDocument();
    expect(screen.getByText(/escritura/i)).toBeInTheDocument();
    expect(screen.getByText("cliente@demo.com")).toBeInTheDocument();
    expect(screen.getByText("admin@demo.com")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Vértice Consultoria" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /voltar para o site/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("submits controlled credentials and exposes invalid access clearly", () => {
    const onLogin = vi.fn(() => false);
    render(<LoginPage onLogin={onLogin} onResetDemo={() => {}} />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "cliente@demo.com" }
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "errada" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(onLogin).toHaveBeenCalledWith("cliente@demo.com", "errada");
    expect(screen.getByRole("alert")).toHaveTextContent(/credenciais inválidas/i);
  });

  it("can fill either demo account and reset the shared demonstration", () => {
    const onLogin = vi.fn(() => true);
    const onResetDemo = vi.fn();
    render(<LoginPage onLogin={onLogin} onResetDemo={onResetDemo} />);

    fireEvent.click(screen.getByRole("button", { name: /usar conta cliente/i }));
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("cliente@demo.com");
    expect(screen.getByLabelText(/^senha$/i)).toHaveValue("cliente123");

    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));
    expect(onLogin).toHaveBeenCalledWith("cliente@demo.com", "cliente123");

    fireEvent.click(screen.getByRole("button", { name: /reiniciar demonstração/i }));
    expect(onResetDemo).toHaveBeenCalledTimes(1);
  });

  it("keeps control boundaries and small supporting text at AA contrast", () => {
    render(<LoginPage onLogin={() => false} onResetDemo={() => {}} />);

    expect(screen.getByLabelText(/e-mail/i)).toHaveClass("border-cacao/55");
    expect(screen.getByLabelText(/^senha$/i)).toHaveClass("border-cacao/55");
    expect(screen.getByText("Acompanhe processos, documentos e pendências.")).toHaveClass(
      "text-cacao/75"
    );
  });
});
