import type { AuthSession, User } from "@/domain/types";

/** @deprecated Compatibilidade temporária até a migração dos consumidores. */
export const DEMO_CREDENTIALS = [
  { email: "cliente@demo.com", password: "cliente123" },
  { email: "admin@demo.com", password: "admin123" }
] as const;

/** @deprecated Compatibilidade temporária até a migração dos consumidores. */
export function authenticateDemoUser(
  email: string,
  password: string,
  users: ReadonlyArray<User>,
  now: () => Date = () => new Date()
): AuthSession | null {
  const normalizedEmail = email.trim().toLocaleLowerCase("pt-BR");
  const hasValidCredential = DEMO_CREDENTIALS.some(
    (credential) => credential.email === normalizedEmail && credential.password === password
  );

  if (!hasValidCredential) {
    return null;
  }

  const user = users.find(
    (candidate) => candidate.email.toLocaleLowerCase("pt-BR") === normalizedEmail
  );

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    signedInAt: now().toISOString()
  };
}

export type UserRole = "client" | "admin";

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_already_registered"
  | "weak_password"
  | "network_error"
  | "profile_unavailable"
  | "configuration_error"
  | "unexpected_error";

export type AuthResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: AuthErrorCode;
    };

export interface AuthenticatedUser {
  session: AuthSession;
  user: User;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export type AuthEvent = "signed-in" | "signed-out" | "token-refreshed";

export interface AuthRepository {
  restoreSession(): Promise<AuthResult<AuthenticatedUser | null>>;

  login(email: string, password: string): Promise<AuthResult<AuthenticatedUser>>;

  signUp(input: SignUpInput): Promise<AuthResult<AuthenticatedUser | null>>;

  logout(): Promise<AuthResult<void>>;

  subscribe(listener: (event: AuthEvent) => void): () => void;
}

export function selectPrimaryRole(roles: readonly string[]): UserRole | null {
  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("client")) {
    return "client";
  }

  return null;
}
