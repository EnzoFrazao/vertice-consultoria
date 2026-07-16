import {
  createContext,
  ReactNode,
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
} from "../data/demo/repository";
import type { AuthSession, DemoState, User } from "../data/demo/types";
import { authenticateDemoUser } from "../features/auth/auth";

type ProfileUpdates = Pick<User, "phone" | "address">;

export interface DemoAppContextValue {
  repository: DemoRepository;
  state: DemoState;
  session: AuthSession | null;
  currentUser: User | null;
  pendingServiceId: string | null;
  warnings: RepositoryWarning[];
  login: (email: string, password: string) => AuthSession | null;
  logout: () => void;
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

const DemoAppContext = createContext<DemoAppContextValue | null>(null);

export function DemoAppProvider({
  children,
  repository: providedRepository
}: {
  children: ReactNode;
  repository?: DemoRepository;
}) {
  const [repository] = useState(
    () => providedRepository ?? createDemoRepository()
  );
  const [state, setState] = useState(() => repository.getState());
  const [session, setSession] = useState<AuthSession | null>(() =>
    repository.getSession()
  );
  const [pendingServiceId, setPendingServiceState] = useState<string | null>(
    () => repository.getPendingServiceId()
  );

  useEffect(() => {
    const unsubscribe = repository.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, [repository]);

  const refreshState = useCallback(() => {
    const nextState = repository.getState();
    setState(nextState);
    return nextState;
  }, [repository]);

  const login = useCallback(
    (email: string, password: string) => {
      const nextSession = authenticateDemoUser(email, password, repository.getState().users);
      if (!nextSession) return null;
      repository.setSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    [repository]
  );

  const logout = useCallback(() => {
    repository.clearSession();
    setSession(null);
  }, [repository]);

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
    },
    [refreshState, repository]
  );

  const resetDemo = useCallback(() => {
    repository.resetDemo();
    setState(repository.getState());
    setSession(null);
    setPendingServiceState(null);
  }, [repository]);

  const currentUser = session
    ? state.users.find((user) => user.id === session.userId) ?? null
    : null;

  const value = useMemo<DemoAppContextValue>(() => ({
    repository,
    state,
    session,
    currentUser,
    pendingServiceId,
    warnings: repository.getWarnings(),
    login,
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
  }), [
    consumePendingServiceId,
    currentUser,
    login,
    logout,
    pendingServiceId,
    repository,
    resetDemo,
    session,
    setPendingServiceId,
    state,
    updateUserProfile
  ]);

  return <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>;
}

export function useDemoApp() {
  const context = useContext(DemoAppContext);
  if (!context) throw new Error("useDemoApp deve ser usado dentro de DemoAppProvider.");
  return context;
}
