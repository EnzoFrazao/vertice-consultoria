import type { AuthChangeEvent, Session, SupabaseClient } from "@supabase/supabase-js";

import type {
  AuthenticatedUser,
  AuthErrorCode,
  AuthEvent,
  AuthRepository,
  AuthResult,
  SignUpInput
} from "@/features/auth/auth";

import { selectPrimaryRole } from "@/features/auth/auth";
import type { User } from "@/domain/types";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface RoleRow {
  roles:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
}

function success<T>(data: T): AuthResult<T> {
  return {
    ok: true,
    data
  };
}

function failure<T>(error: AuthErrorCode): AuthResult<T> {
  return {
    ok: false,
    error
  };
}

function mapAuthError(error: unknown): AuthErrorCode {
  if (error instanceof TypeError) {
    return "network_error";
  }

  if (!error || typeof error !== "object") {
    return "unexpected_error";
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : null;

  switch (code) {
    case "invalid_credentials":
      return "invalid_credentials";

    case "email_not_confirmed":
      return "email_not_confirmed";

    case "user_already_exists":
    case "email_exists":
      return "email_already_registered";

    default:
      return "unexpected_error";
  }
}

function extractRoleCodes(rows: RoleRow[]): string[] {
  return rows.flatMap((row) => {
    if (!row.roles) {
      return [];
    }

    if (Array.isArray(row.roles)) {
      return row.roles.map((role) => role.code);
    }

    return [row.roles.code];
  });
}

function createDomainUser(profile: ProfileRow, roles: string[]): User | null {
  const primaryRole = selectPrimaryRole(roles);

  if (!primaryRole) {
    return null;
  }

  return {
    id: profile.id,
    role: primaryRole,
    name: profile.name,
    email: profile.email,
    cpf: "",
    phone: profile.phone ?? "",
    address: "",
    createdAt: profile.created_at
  };
}

function createAuthenticatedUser(authSession: Session, user: User): AuthenticatedUser {
  return {
    session: {
      userId: authSession.user.id,
      role: user.role,
      signedInAt: new Date().toISOString()
    },
    user
  };
}

function translateAuthEvent(event: AuthChangeEvent): AuthEvent | null {
  switch (event) {
    case "SIGNED_IN":
      return "signed-in";

    case "SIGNED_OUT":
      return "signed-out";

    case "TOKEN_REFRESHED":
      return "token-refreshed";

    default:
      return null;
  }
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async restoreSession(): Promise<AuthResult<AuthenticatedUser | null>> {
    try {
      const {
        data: { session },
        error
      } = await this.client.auth.getSession();

      if (error) {
        return failure(mapAuthError(error));
      }

      if (!session) {
        return success(null);
      }

      return this.hydrateAuthenticatedUser(session);
    } catch (error) {
      return failure(mapAuthError(error));
    }
  }

  async login(email: string, password: string): Promise<AuthResult<AuthenticatedUser>> {
    try {
      const {
        data: { session },
        error
      } = await this.client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        return failure(mapAuthError(error));
      }

      if (!session) {
        return failure("unexpected_error");
      }

      return this.hydrateAuthenticatedUser(session);
    } catch (error) {
      return failure(mapAuthError(error));
    }
  }

  async signUp(input: SignUpInput): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.signUp({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        options: {
          data: {
            name: input.name.trim()
          }
        }
      });

      if (error) {
        return failure(mapAuthError(error));
      }

      return success(undefined);
    } catch (error) {
      return failure(mapAuthError(error));
    }
  }

  async logout(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.signOut({
        scope: "local"
      });

      if (error) {
        return failure(mapAuthError(error));
      }

      return success(undefined);
    } catch (error) {
      return failure(mapAuthError(error));
    }
  }

  subscribe(listener: (event: AuthEvent) => void): () => void {
    const {
      data: { subscription }
    } = this.client.auth.onAuthStateChange((event) => {
      const translatedEvent = translateAuthEvent(event);

      if (translatedEvent) {
        listener(translatedEvent);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  private async hydrateAuthenticatedUser(session: Session): Promise<AuthResult<AuthenticatedUser>> {
    const userId = session.user.id;

    const [profileResult, rolesResult] = await Promise.all([
      this.client
        .from("profiles")
        .select("id,name,email,phone,created_at")
        .eq("id", userId)
        .single(),

      this.client.from("user_roles").select("roles(code)").eq("user_id", userId)
    ]);

    if (profileResult.error || rolesResult.error || !profileResult.data) {
      return failure("profile_unavailable");
    }

    const profile = profileResult.data as ProfileRow;
    const roleRows = rolesResult.data as RoleRow[];
    const roles = extractRoleCodes(roleRows);

    const user = createDomainUser(profile, roles);

    if (!user) {
      return failure("profile_unavailable");
    }

    return success(createAuthenticatedUser(session, user));
  }
}

export function createSupabaseAuthRepository(client: SupabaseClient): AuthRepository {
  return new SupabaseAuthRepository(client);
}
