import type { AuthRepository, AuthResult, AuthenticatedUser } from "@/features/auth/auth";
import { authenticateDemoUser } from "@/features/auth/auth";
import type { DemoRepository } from "@/infrastructure/repository";

export function createDemoAuthRepository(repository: DemoRepository): AuthRepository {
  function authenticatedUser(): AuthenticatedUser | null {
    const session = repository.getSession();
    if (!session) return null;

    const user = repository.getState().users.find((candidate) => candidate.id === session.userId);
    return user ? { session, user } : null;
  }

  return {
    async restoreSession(): Promise<AuthResult<AuthenticatedUser | null>> {
      return { ok: true, data: authenticatedUser() };
    },

    async login(email: string, password: string): Promise<AuthResult<AuthenticatedUser>> {
      const session = authenticateDemoUser(email, password, repository.getState().users);
      if (!session) return { ok: false, error: "invalid_credentials" };

      repository.setSession(session);
      const data = authenticatedUser();
      return data ? { ok: true, data } : { ok: false, error: "profile_unavailable" };
    },

    async signUp(): Promise<AuthResult<AuthenticatedUser | null>> {
      return { ok: false, error: "unexpected_error" };
    },

    async logout(): Promise<AuthResult<void>> {
      repository.clearSession();
      return { ok: true, data: undefined };
    },

    subscribe(): () => void {
      return () => {};
    }
  };
}
