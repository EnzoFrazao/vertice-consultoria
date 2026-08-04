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

function createClient(): SupabaseClient {
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
      })
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
});
