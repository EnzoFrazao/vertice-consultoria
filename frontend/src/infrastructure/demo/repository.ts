import { getServiceById } from "@/domain/catalog";
import type {
  AuthSession,
  Case,
  CaseDocument,
  DemoState,
  Notification,
  TimelineEvent,
  UserRole
} from "@/domain/types";
import { createCaseActions } from "@/infrastructure/demo/actions/cases";
import type { DemoActionContext } from "@/infrastructure/demo/actions/context";
import { createDocumentActions } from "@/infrastructure/demo/actions/documents";
import { createNotificationActions } from "@/infrastructure/demo/actions/notifications";
import { createDemoSeed } from "@/infrastructure/demo/seed";
import { cloneSerializable } from "@/infrastructure/demo/serialization";
import {
  createMemoryStorage,
  getBrowserStorage,
  type StorageLike
} from "@/infrastructure/demo/storage";
import {
  isAuthSession,
  isDemoState
} from "@/infrastructure/demo/validation";

export type { CreateCaseInput, DocumentReview } from "@/infrastructure/demo/contracts";
export type { StorageLike } from "@/infrastructure/demo/storage";

export const DEMO_STATE_STORAGE_KEY = "rv.demo.state.v1";
export const DEMO_SESSION_STORAGE_KEY = "rv.demo.session.v1";
export const DEMO_PENDING_SERVICE_STORAGE_KEY = "rv.demo.pending-service";

export interface RepositoryWarning {
  code: "state-reset" | "storage-unavailable";
  message: string;
}

export interface DemoRepositoryOptions {
  localStorage?: StorageLike | null;
  sessionStorage?: StorageLike | null;
  now?: () => Date;
}

export function createDemoRepository(options: DemoRepositoryOptions = {}) {
  const warnings: RepositoryWarning[] = [];
  const localMemory = createMemoryStorage();
  const sessionMemory = createMemoryStorage();
  let activeLocalStorage =
    options.localStorage === undefined
      ? getBrowserStorage("localStorage")
      : options.localStorage;
  let activeSessionStorage =
    options.sessionStorage === undefined
      ? getBrowserStorage("sessionStorage")
      : options.sessionStorage;
  const now = options.now ?? (() => new Date());
  const listeners = new Set<(state: DemoState) => void>();
  let idSequence = 0;

  function nextId(prefix: string) {
    idSequence += 1;
    return `${prefix}-${now().getTime()}-${idSequence}`;
  }

  function addWarning(warning: RepositoryWarning) {
    if (!warnings.some((item) => item.code === warning.code)) {
      warnings.push(warning);
    }
  }

  if (!activeLocalStorage) {
    activeLocalStorage = localMemory;
    addWarning({
      code: "storage-unavailable",
      message:
        "O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão."
    });
  }
  if (!activeSessionStorage) {
    activeSessionStorage = sessionMemory;
    addWarning({
      code: "storage-unavailable",
      message:
        "O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão."
    });
  }

  function useLocalStorage<T>(operation: (storage: StorageLike) => T): T {
    try {
      return operation(activeLocalStorage as StorageLike);
    } catch {
      activeLocalStorage = localMemory;
      addWarning({
        code: "storage-unavailable",
        message:
          "O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão."
      });
      return operation(localMemory);
    }
  }

  function useSessionStorage<T>(operation: (storage: StorageLike) => T): T {
    try {
      return operation(activeSessionStorage as StorageLike);
    } catch {
      activeSessionStorage = sessionMemory;
      addWarning({
        code: "storage-unavailable",
        message:
          "O armazenamento da aba está indisponível. A seleção atual será mantida apenas em memória."
      });
      return operation(sessionMemory);
    }
  }

  function persistState(nextState: DemoState) {
    useLocalStorage((storage) =>
      storage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(nextState))
    );
  }

  let state: DemoState;
  const storedState = useLocalStorage((storage) =>
    storage.getItem(DEMO_STATE_STORAGE_KEY)
  );

  if (storedState === null) {
    state = createDemoSeed();
    persistState(state);
  } else {
    try {
      const parsed: unknown = JSON.parse(storedState);
      if (!isDemoState(parsed)) throw new Error("invalid-state");
      state = parsed;
    } catch {
      state = createDemoSeed();
      addWarning({
        code: "state-reset",
        message:
          "Os dados locais eram incompatíveis e a demonstração foi restaurada."
      });
      persistState(state);
    }
  }

  function commit(nextState: DemoState) {
    state = nextState;
    persistState(state);
    listeners.forEach((listener) => listener(cloneSerializable(state)));
    return state;
  }

  function subscribe(listener: (nextState: DemoState) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getUser(userId: string) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    return user;
  }

  function requireRole(userId: string, role: UserRole) {
    const user = getUser(userId);
    if (user.role !== role) {
      throw new Error("Ação não permitida para este usuário.");
    }
    return user;
  }

  function getCase(caseId: string) {
    const item = state.cases.find((candidate) => candidate.id === caseId);
    if (!item) throw new Error("Processo não encontrado.");
    return item;
  }

  function getDocument(item: Case, documentId: string) {
    const document = item.documents.find(
      (candidate) => candidate.id === documentId
    );
    if (!document) throw new Error("Documento não encontrado.");
    return document;
  }

  function createTimelineEvent(input: {
    caseId: string;
    type: TimelineEvent["type"];
    title: string;
    actorId: string;
    description?: string;
  }): TimelineEvent {
    const actor = getUser(input.actorId);
    return {
      id: nextId("event"),
      caseId: input.caseId,
      type: input.type,
      title: input.title,
      description: input.description,
      actorId: actor.id,
      actorRole: actor.role,
      createdAt: now().toISOString()
    };
  }

  function createNotification(
    input: Omit<Notification, "id" | "createdAt">
  ): Notification {
    return {
      ...input,
      id: nextId("notification"),
      createdAt: now().toISOString()
    };
  }

  function replaceCase(
    updatedCase: Case,
    notifications: Notification[] = []
  ) {
    return commit({
      ...state,
      cases: state.cases.map((item) =>
        item.id === updatedCase.id ? updatedCase : item
      ),
      notifications: [...state.notifications, ...notifications],
      updatedAt: now().toISOString()
    });
  }

  const actionContext: DemoActionContext = {
    getState: () => state,
    now,
    nextId,
    commit,
    getUser,
    requireRole,
    getCase,
    getDocument: (item: Case, documentId: string): CaseDocument =>
      getDocument(item, documentId),
    createTimelineEvent,
    createNotification,
    replaceCase
  };
  const caseActions = createCaseActions(actionContext);
  const documentActions = createDocumentActions(actionContext);
  const notificationActions = createNotificationActions(actionContext);

  function setSession(session: AuthSession) {
    if (!isAuthSession(session, state)) throw new Error("Sessão inválida.");
    useLocalStorage((storage) =>
      storage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session))
    );
  }

  function getSession(): AuthSession | null {
    const raw = useLocalStorage((storage) =>
      storage.getItem(DEMO_SESSION_STORAGE_KEY)
    );
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isAuthSession(parsed, state)) throw new Error("invalid-session");
      return parsed;
    } catch {
      useLocalStorage((storage) =>
        storage.removeItem(DEMO_SESSION_STORAGE_KEY)
      );
      return null;
    }
  }

  function clearSession() {
    useLocalStorage((storage) =>
      storage.removeItem(DEMO_SESSION_STORAGE_KEY)
    );
  }

  function setPendingServiceId(serviceId: string) {
    if (!getServiceById(serviceId)) throw new Error("Serviço não encontrado.");
    useSessionStorage((storage) =>
      storage.setItem(DEMO_PENDING_SERVICE_STORAGE_KEY, serviceId)
    );
  }

  function getPendingServiceId(): string | null {
    const serviceId = useSessionStorage((storage) =>
      storage.getItem(DEMO_PENDING_SERVICE_STORAGE_KEY)
    );
    return serviceId && getServiceById(serviceId) ? serviceId : null;
  }

  function consumePendingServiceId() {
    const serviceId = getPendingServiceId();
    useSessionStorage((storage) =>
      storage.removeItem(DEMO_PENDING_SERVICE_STORAGE_KEY)
    );
    return serviceId;
  }

  function resetDemo() {
    const resetState = commit(createDemoSeed());
    clearSession();
    useSessionStorage((storage) =>
      storage.removeItem(DEMO_PENDING_SERVICE_STORAGE_KEY)
    );
    return resetState;
  }

  function isolateResult<Arguments extends unknown[], Result>(
    action: (...args: Arguments) => Result
  ) {
    return (...args: Arguments): Result =>
      cloneSerializable(action(...args));
  }

  return {
    getState: (): DemoState => cloneSerializable(state),
    getWarnings: (): RepositoryWarning[] => cloneSerializable(warnings),
    subscribe,
    updateUserProfile: isolateResult(caseActions.updateUserProfile),
    createCase: isolateResult(caseActions.createCase),
    updateCaseStatus: isolateResult(caseActions.updateCaseStatus),
    recordWhatsAppStarted: isolateResult(caseActions.recordWhatsAppStarted),
    startDocumentReview: isolateResult(documentActions.startDocumentReview),
    reviewDocument: isolateResult(documentActions.reviewDocument),
    addMockDocumentVersion: isolateResult(documentActions.addMockDocumentVersion),
    markNotificationRead: isolateResult(
      notificationActions.markNotificationRead
    ),
    markAllNotificationsRead: isolateResult(
      notificationActions.markAllNotificationsRead
    ),
    setSession,
    getSession,
    clearSession,
    setPendingServiceId,
    getPendingServiceId,
    consumePendingServiceId,
    resetDemo: isolateResult(resetDemo)
  };
}

export type DemoRepository = ReturnType<typeof createDemoRepository>;
