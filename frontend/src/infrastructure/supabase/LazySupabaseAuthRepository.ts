import type {
  AuthEvent,
  AuthRepository,
  AuthResult,
  SignUpInput
} from "@/features/auth/auth";

export type AuthRepositoryLoader = () => Promise<AuthRepository>;

async function loadSupabaseAuthRepository(): Promise<AuthRepository> {
  const [{ supabase }, { createSupabaseAuthRepository }] = await Promise.all([
    import("@/infrastructure/supabase/client"),
    import("@/infrastructure/supabase/SupabaseAuthRepository")
  ]);

  return createSupabaseAuthRepository(supabase);
}

export function createLazySupabaseAuthRepository(
  loader: AuthRepositoryLoader = loadSupabaseAuthRepository
): AuthRepository {
  let repositoryPromise: Promise<AuthRepository> | null = null;

  const getRepository = () => {
    repositoryPromise ??= loader();
    return repositoryPromise;
  };

  async function execute<T>(
    operation: (repository: AuthRepository) => Promise<AuthResult<T>>
  ): Promise<AuthResult<T>> {
    try {
      return await operation(await getRepository());
    } catch {
      return { ok: false, error: "configuration_error" };
    }
  }

  return {
    restoreSession: () => execute((repository) => repository.restoreSession()),
    login: (email: string, password: string) =>
      execute((repository) => repository.login(email, password)),
    signUp: (input: SignUpInput) => execute((repository) => repository.signUp(input)),
    logout: () => execute((repository) => repository.logout()),
    subscribe(listener: (event: AuthEvent) => void): () => void {
      let active = true;
      let unsubscribe = () => {};

      void getRepository()
        .then((repository) => {
          if (active) unsubscribe = repository.subscribe(listener);
        })
        .catch(() => {});

      return () => {
        active = false;
        unsubscribe();
      };
    }
  };
}
