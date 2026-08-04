import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createDemoRepository,
  type DemoRepository,
  type RepositoryWarning
} from "@/infrastructure/repository";

import type { AuthSession, DemoState, User } from "@/domain/types";

import type {
  AuthenticatedUser,
  AuthRepository,
  AuthResult,
  SignUpInput
} from "@/features/auth/auth";

import { createLazySupabaseAuthRepository } from "@/infrastructure/supabase/LazySupabaseAuthRepository";

type ProfileUpdates = Pick<User, "phone" | "address">;

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface PortalDataContextValue {
  state: DemoState;

  authStatus: AuthStatus;
  session: AuthSession | null;
  currentUser: User | null;

  pendingServiceId: string | null;
  warnings: RepositoryWarning[];

  login: (email: string, password: string) => Promise<AuthResult<AuthenticatedUser>>;

  signUp: (input: SignUpInput) => Promise<AuthResult<AuthenticatedUser | null>>;

  logout: () => Promise<void>;

  setPendingServiceId: (serviceId: string) => void;
  consumePendingServiceId: () => string | null;

  updateUserProfile: (userId: string, updates: ProfileUpdates) => void;

  resetDemo: () => void;

  createCase: DemoRepository["createCase"];
  updateCaseStatus: DemoRepository["updateCaseStatus"];
  startDocumentReview: DemoRepository["startDocumentReview"];
  reviewDocument: DemoRepository["reviewDocument"];
  addMockDocumentVersion: DemoRepository["addMockDocumentVersion"];
  markNotificationRead: DemoRepository["markNotificationRead"];
  markAllNotificationsRead: DemoRepository["markAllNotificationsRead"];
  recordWhatsAppStarted: DemoRepository["recordWhatsAppStarted"];
}

interface PortalDataProviderProps {
  children: ReactNode;
  repository?: DemoRepository;
  authRepository?: AuthRepository;
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

export function PortalDataProvider({
  children,
  repository: providedRepository,
  authRepository: providedAuthRepository
}: PortalDataProviderProps) {
  const [repository] = useState(() => providedRepository ?? createDemoRepository());

  const [authRepository] = useState(
    () => providedAuthRepository ?? createLazySupabaseAuthRepository()
  );

  const [state, setState] = useState<DemoState>(() => repository.getState());

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  const [session, setSession] = useState<AuthSession | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [pendingServiceId, setPendingServiceState] = useState<string | null>(() =>
    repository.getPendingServiceId()
  );

  const clearAuthentication = useCallback(() => {
    setSession(null);
    setCurrentUser(null);
    setAuthStatus("anonymous");
  }, []);

  useEffect(() => {
    const unsubscribeRepository = repository.subscribe(setState);

    return () => {
      unsubscribeRepository();
    };
  }, [repository]);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const result = await authRepository.restoreSession();

      if (!active) {
        return;
      }

      if (!result.ok || !result.data) {
        setSession(null);
        setCurrentUser(null);
        setAuthStatus("anonymous");
        return;
      }

      setSession(result.data.session);
      setCurrentUser(result.data.user);
      setAuthStatus("authenticated");
    };

    void restore();

    const unsubscribeAuth = authRepository.subscribe((event) => {
      if (!active) {
        return;
      }

      if (event === "signed-out") {
        setSession(null);
        setCurrentUser(null);
        setAuthStatus("anonymous");
        return;
      }

      if (event === "signed-in" || event === "token-refreshed") {
        /*
         * Não executamos operações assíncronas diretamente
         * dentro do callback do Supabase Auth.
         */
        queueMicrotask(() => {
          if (active) {
            void restore();
          }
        });
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
    };
  }, [authRepository]);

  const refreshState = useCallback(() => {
    const nextState = repository.getState();
    setState(nextState);

    return nextState;
  }, [repository]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult<AuthenticatedUser>> => {
      const result = await authRepository.login(email, password);

      if (!result.ok) {
        return result;
      }

      setSession(result.data.session);
      setCurrentUser(result.data.user);
      setAuthStatus("authenticated");

      return result;
    },
    [authRepository]
  );

  const signUp = useCallback(
    async (input: SignUpInput): Promise<AuthResult<AuthenticatedUser | null>> => {
      const result = await authRepository.signUp(input);

      if (!result.ok || !result.data) return result;

      setSession(result.data.session);
      setCurrentUser(result.data.user);
      setAuthStatus("authenticated");
      return result;
    },
    [authRepository]
  );

  const logout = useCallback(async () => {
    /*
     * Limpa a interface mesmo se a requisição remota falhar.
     * O usuário não deve continuar vendo conteúdo protegido.
     */
    clearAuthentication();

    await authRepository.logout();
  }, [authRepository, clearAuthentication]);

  const setPendingServiceId = useCallback(
    (serviceId: string) => {
      repository.setPendingServiceId(serviceId);
      setPendingServiceState(serviceId);
    },
    [repository]
  );

  const consumePendingServiceId = useCallback(() => {
    const serviceId = repository.consumePendingServiceId();

    setPendingServiceState(null);

    return serviceId;
  }, [repository]);

  const updateUserProfile = useCallback(
    (userId: string, updates: ProfileUpdates) => {
      repository.updateUserProfile(userId, updates);
      refreshState();

      setCurrentUser((user) => {
        if (!user || user.id !== userId) {
          return user;
        }

        return {
          ...user,
          ...updates
        };
      });
    },
    [refreshState, repository]
  );

  const resetDemo = useCallback(() => {
    repository.resetDemo();
    setState(repository.getState());
    setPendingServiceState(null);
  }, [repository]);

  const value = useMemo<PortalDataContextValue>(
    () => ({
      state,

      authStatus,
      session,
      currentUser,

      pendingServiceId,
      warnings: repository.getWarnings(),

      login,
      signUp,
      logout,

      setPendingServiceId,
      consumePendingServiceId,
      updateUserProfile,
      resetDemo,

      createCase: repository.createCase,
      updateCaseStatus: repository.updateCaseStatus,
      startDocumentReview: repository.startDocumentReview,
      reviewDocument: repository.reviewDocument,
      addMockDocumentVersion: repository.addMockDocumentVersion,
      markNotificationRead: repository.markNotificationRead,
      markAllNotificationsRead: repository.markAllNotificationsRead,
      recordWhatsAppStarted: repository.recordWhatsAppStarted
    }),
    [
      authStatus,
      consumePendingServiceId,
      currentUser,
      login,
      logout,
      pendingServiceId,
      repository,
      resetDemo,
      session,
      setPendingServiceId,
      signUp,
      state,
      updateUserProfile
    ]
  );

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData(): PortalDataContextValue {
  const context = useContext(PortalDataContext);

  if (!context) {
    throw new Error("usePortalData deve ser usado dentro de PortalDataProvider.");
  }

  return context;
}
