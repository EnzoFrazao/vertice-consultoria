import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { SupabaseAuthRepository } from "@/infrastructure/supabase/SupabaseAuthRepository";

const SESSION: Session = {
  access_token: "access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 1_786_000_000,
  refresh_token: "refresh-token",
  user: {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-01T10:00:00.000Z",
    email: "cliente@example.com"
  }
};

function createClient(
  signUpResult: {
    data: { session: Session | null };
    error: null | { code: string };
  } = { data: { session: null }, error: null }
): SupabaseClient {
  const profileResult = {
    data: {
      id: "user-1",
      name: "Cliente Teste",
      email: "cliente@example.com",
      phone: null,
      created_at: "2026-07-01T10:00:00.000Z"
    },
    error: null
  };
  const rolesResult = {
    data: [{ roles: { code: "client" } }],
    error: null
  };

  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: SESSION },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue(signUpResult)
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          table === "profiles"
            ? { single: vi.fn().mockResolvedValue(profileResult) }
            : Promise.resolve(rolesResult)
        )
      }))
    }))
  };

  return client as unknown as SupabaseClient;
}

describe("SupabaseAuthRepository", () => {
  it("restaura a sessão mapeando somente colunas existentes do perfil", async () => {
    const repository = new SupabaseAuthRepository(createClient());

    const result = await repository.restoreSession();

    expect(result.ok).toBe(true);
    if (!result.ok || !result.data) {
      throw new Error("A sessão autenticada era esperada");
    }

    expect(result.data.user).toEqual({
      id: "user-1",
      role: "client",
      name: "Cliente Teste",
      email: "cliente@example.com",
      cpf: "",
      phone: "",
      address: "",
      createdAt: "2026-07-01T10:00:00.000Z"
    });
  });

  it("normaliza os dados e representa cadastro sujeito a confirmação sem sessão", async () => {
    const client = createClient();
    const repository = new SupabaseAuthRepository(client);

    const result = await repository.signUp({
      name: "  Cliente Teste  ",
      email: "  CLIENTE@EXAMPLE.COM  ",
      password: "senha-segura"
    });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "cliente@example.com",
      password: "senha-segura",
      options: { data: { name: "Cliente Teste" } }
    });
    expect(result).toEqual({ ok: true, data: null });
  });

  it("hidrata o cliente quando o cadastro cria uma sessão imediata", async () => {
    const repository = new SupabaseAuthRepository(
      createClient({ data: { session: SESSION }, error: null })
    );

    const result = await repository.signUp({
      name: "Cliente Teste",
      email: "cliente@example.com",
      password: "senha-segura"
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !result.data) throw new Error("A sessão criada era esperada");
    expect(result.data.user).toEqual(
      expect.objectContaining({ id: "user-1", role: "client", email: "cliente@example.com" })
    );
  });

  it("traduz a rejeição de senha fraca", async () => {
    const repository = new SupabaseAuthRepository(
      createClient({ data: { session: null }, error: { code: "weak_password" } })
    );

    await expect(
      repository.signUp({
        name: "Cliente Teste",
        email: "cliente@example.com",
        password: "12345678"
      })
    ).resolves.toEqual({ ok: false, error: "weak_password" });
  });
});
