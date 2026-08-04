import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { AuthResult, AuthenticatedUser } from "@/features/auth/auth";
import { RegisterPage } from "@/pages/register/RegisterPage";

const CONFIRMATION_REQUIRED: AuthResult<AuthenticatedUser | null> = {
  ok: true,
  data: null
};

function renderPage(
  onSignUp = vi.fn(() => Promise.resolve(CONFIRMATION_REQUIRED)),
  pendingServiceName?: string
) {
  render(
    <MemoryRouter>
      <RegisterPage pendingServiceName={pendingServiceName} onSignUp={onSignUp} />
    </MemoryRouter>
  );
  return onSignUp;
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/^nome completo$/i), {
    target: { value: "  Cliente Teste  " }
  });
  fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
    target: { value: "  CLIENTE@EXAMPLE.COM  " }
  });
  fireEvent.change(screen.getByLabelText(/^senha$/i), {
    target: { value: "senha-segura" }
  });
  fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
    target: { value: "senha-segura" }
  });
}

describe("RegisterPage", () => {
  it("apresenta o cadastro de cliente e preserva o contexto do serviço", () => {
    renderPage(undefined, "Escritura");

    expect(screen.getByRole("heading", { name: /crie sua conta/i })).toBeInTheDocument();
    expect(screen.getByText(/escritura/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /já tenho uma conta/i })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getAllByRole("img", { name: "Vértice Consultoria" })).toHaveLength(2);
  });

  it.each([
    ["campos vazios", () => {}, "Preencha todos os campos para continuar."],
    [
      "e-mail inválido",
      () => {
        fillValidForm();
        fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
          target: { value: "invalido" }
        });
      },
      "Informe um e-mail válido."
    ],
    [
      "senha curta",
      () => {
        fillValidForm();
        fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: "1234567" } });
        fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
          target: { value: "1234567" }
        });
      },
      "A senha deve ter pelo menos 8 caracteres."
    ],
    [
      "senhas diferentes",
      () => {
        fillValidForm();
        fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
          target: { value: "outra-senha" }
        });
      },
      "As senhas não coincidem."
    ]
  ])("bloqueia %s", async (_label, arrange, message) => {
    const onSignUp = renderPage();
    arrange();

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(onSignUp).not.toHaveBeenCalled();
  });

  it("normaliza os dados, bloqueia reenvio e orienta a confirmação por e-mail", async () => {
    let finishSignUp: (result: AuthResult<AuthenticatedUser | null>) => void = () => {};
    const onSignUp = vi.fn(
      () =>
        new Promise<AuthResult<AuthenticatedUser | null>>((resolve) => {
          finishSignUp = resolve;
        })
    );
    renderPage(onSignUp);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));
    fireEvent.click(screen.getByRole("button", { name: "Criando conta..." }));

    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onSignUp).toHaveBeenCalledWith({
      name: "Cliente Teste",
      email: "cliente@example.com",
      password: "senha-segura"
    });
    expect(screen.getByRole("button", { name: "Criando conta..." })).toBeDisabled();

    finishSignUp(CONFIRMATION_REQUIRED);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Cadastro realizado. Verifique seu e-mail para confirmar a conta."
    );
  });

  it.each([
    ["email_already_registered", "Este e-mail já está cadastrado."],
    ["weak_password", "A senha informada não atende aos requisitos de segurança."],
    ["network_error", "Não foi possível conectar ao servidor. Tente novamente."]
  ] as const)("traduz o erro %s", async (error, message) => {
    renderPage(vi.fn(() => Promise.resolve({ ok: false as const, error })));
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /criar conta/i })).toBeEnabled();
    });
  });
});
