import { describe, expect, it, vi } from "vitest";

import type { AuthRepository, AuthenticatedUser } from "@/features/auth/auth";
import { createLazySupabaseAuthRepository } from "@/infrastructure/supabase/LazySupabaseAuthRepository";

const AUTHENTICATED_USER: AuthenticatedUser = {
  session: {
    userId: "user-1",
    role: "client",
    signedInAt: "2026-08-04T12:00:00.000Z"
  },
  user: {
    id: "user-1",
    role: "client",
    name: "Cliente Teste",
    email: "cliente@example.com",
    cpf: "",
    phone: "",
    address: "",
    createdAt: "2026-08-04T12:00:00.000Z"
  }
};

function createRepository(): AuthRepository {
  return {
    restoreSession: vi.fn().mockResolvedValue({ ok: true, data: null }),
    login: vi.fn().mockResolvedValue({ ok: true, data: AUTHENTICATED_USER }),
    signUp: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    logout: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    subscribe: vi.fn(() => () => {})
  };
}

describe("createLazySupabaseAuthRepository", () => {
  it("carrega o adaptador somente na primeira operação e reutiliza a instância", async () => {
    const repository = createRepository();
    const loader = vi.fn().mockResolvedValue(repository);
    const lazyRepository = createLazySupabaseAuthRepository(loader);

    expect(loader).not.toHaveBeenCalled();

    await expect(lazyRepository.restoreSession()).resolves.toEqual({ ok: true, data: null });
    await expect(lazyRepository.login("CLIENTE@EXAMPLE.COM", "senha-segura")).resolves.toEqual({
      ok: true,
      data: AUTHENTICATED_USER
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(repository.login).toHaveBeenCalledWith("CLIENTE@EXAMPLE.COM", "senha-segura");
  });

  it("traduz falha de configuração durante o carregamento", async () => {
    const lazyRepository = createLazySupabaseAuthRepository(() =>
      Promise.reject(new Error("configuração ausente"))
    );

    await expect(lazyRepository.restoreSession()).resolves.toEqual({
      ok: false,
      error: "configuration_error"
    });
  });
});
