import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { SupabasePortalRepository } from "@/infrastructure/supabase/SupabasePortalRepository";

interface ClientOptions {
  profile?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
  } | null;
  roles?: string[];
}

function createClient({
  profile = {
    id: "user-1",
    name: "Cliente Teste",
    email: "cliente@example.com",
    phone: "91999999999",
    created_at: "2026-07-01T10:00:00.000Z",
  },
  roles = ["client"],
}: ClientOptions = {}): SupabaseClient {
  const profileResult = { data: profile, error: null };
  const rolesResult = {
    data: roles.map((code) => ({ roles: { code } })),
    error: null,
  };

  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          table === "profiles"
            ? { maybeSingle: vi.fn().mockResolvedValue(profileResult) }
            : Promise.resolve(rolesResult),
        ),
      })),
    })),
  };

  return client as unknown as SupabaseClient;
}

describe("SupabasePortalRepository", () => {
  it("carrega o usuário com papel administrativo prioritário", async () => {
    const repository = new SupabasePortalRepository(
      createClient({ roles: ["client", "admin"] }),
    );

    await expect(repository.getCurrentUser("user-1")).resolves.toEqual({
      id: "user-1",
      role: "admin",
      name: "Cliente Teste",
      email: "cliente@example.com",
      cpf: "",
      phone: "91999999999",
      address: "",
      createdAt: "2026-07-01T10:00:00.000Z",
    });
  });

  it("retorna null quando o perfil não existe", async () => {
    const repository = new SupabasePortalRepository(
      createClient({ profile: null }),
    );

    await expect(repository.getCurrentUser("user-1")).resolves.toBeNull();
  });

  it("retorna null quando o usuário não possui papel válido", async () => {
    const repository = new SupabasePortalRepository(
      createClient({ roles: [] }),
    );

    await expect(repository.getCurrentUser("user-1")).resolves.toBeNull();
  });
});
