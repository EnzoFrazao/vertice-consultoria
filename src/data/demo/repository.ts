import { getServiceById } from './catalog';
import { DEMO_STATE_VERSION, createDemoSeed } from './seed';
import { CASE_STATUSES } from './types';
import type {
  AuthSession,
  Case,
  CaseDocument,
  CaseStatus,
  DemoState,
  Notification,
  PendingAction,
  Property,
  TimelineEvent,
  UserRole,
} from './types';

export const DEMO_STATE_STORAGE_KEY = 'rv.demo.state.v1';
export const DEMO_SESSION_STORAGE_KEY = 'rv.demo.session.v1';
export const DEMO_PENDING_SERVICE_STORAGE_KEY = 'rv.demo.pending-service';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RepositoryWarning {
  code: 'state-reset' | 'storage-unavailable';
  message: string;
}

export interface DemoRepositoryOptions {
  localStorage?: StorageLike | null;
  sessionStorage?: StorageLike | null;
  now?: () => Date;
}

export interface CreateCaseInput {
  clientId: string;
  serviceId: string;
  objective: string;
  property: Omit<Property, 'id'>;
  submittedAssetIds?: string[];
}

export type DocumentReview =
  | { decision: 'approve' }
  | { decision: 'reject'; reason: string };

export function derivePendingActions(
  state: DemoState,
  viewer: { id: string; role: UserRole },
): PendingAction[] {
  const visibleCases =
    viewer.role === 'client'
      ? state.cases.filter((item) => item.clientId === viewer.id)
      : state.cases;
  const actions: PendingAction[] = [];

  for (const item of visibleCases) {
    if (viewer.role === 'client') {
      for (const document of item.documents.filter((candidate) =>
        ['Pendente', 'Rejeitado'].includes(candidate.status),
      )) {
        actions.push({
          id: `pending-client-${document.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: 'client-document',
          title:
            document.status === 'Rejeitado'
              ? `Reenviar ${document.label}`
              : `Adicionar ${document.label}`,
          documentId: document.id,
          createdAt: document.updatedAt,
        });
      }

      if (item.status === 'Aguardando cliente') {
        actions.push({
          id: `pending-client-response-${item.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: 'client-response',
          title: 'Responder à orientação recebida',
          createdAt: item.updatedAt,
        });
      }
    } else {
      for (const document of item.documents.filter(
        (candidate) => candidate.status === 'Enviado',
      )) {
        actions.push({
          id: `pending-admin-${document.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: 'admin-document-review',
          title: `Analisar ${document.label}`,
          documentId: document.id,
          createdAt: document.updatedAt,
        });
      }
    }
  }

  return actions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

function getBrowserStorage(name: 'localStorage' | 'sessionStorage'): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    return window[name];
  } catch {
    return null;
  }
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DemoState>;
  return (
    candidate.version === DEMO_STATE_VERSION &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.cases) &&
    Array.isArray(candidate.notifications) &&
    Array.isArray(candidate.mockDocumentAssets) &&
    typeof candidate.updatedAt === 'string'
  );
}

function isAuthSession(value: unknown, state: DemoState): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthSession>;
  const user = state.users.find((item) => item.id === candidate.userId);
  return Boolean(
    user &&
      user.role === candidate.role &&
      typeof candidate.signedInAt === 'string',
  );
}

export function createDemoRepository(options: DemoRepositoryOptions = {}) {
  const warnings: RepositoryWarning[] = [];
  const localMemory = createMemoryStorage();
  const sessionMemory = createMemoryStorage();
  let activeLocalStorage =
    options.localStorage === undefined
      ? getBrowserStorage('localStorage')
      : options.localStorage;
  let activeSessionStorage =
    options.sessionStorage === undefined
      ? getBrowserStorage('sessionStorage')
      : options.sessionStorage;
  const now = options.now ?? (() => new Date());
  const listeners = new Set<(state: DemoState) => void>();
  let idSequence = 0;

  function nextId(prefix: string) {
    idSequence += 1;
    return `${prefix}-${now().getTime()}-${idSequence}`;
  }

  function addWarning(warning: RepositoryWarning) {
    if (!warnings.some((item) => item.code === warning.code)) warnings.push(warning);
  }

  if (!activeLocalStorage) {
    activeLocalStorage = localMemory;
    addWarning({
      code: 'storage-unavailable',
      message: 'O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão.',
    });
  }
  if (!activeSessionStorage) {
    activeSessionStorage = sessionMemory;
    addWarning({
      code: 'storage-unavailable',
      message: 'O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão.',
    });
  }

  function useLocalStorage<T>(operation: (storage: StorageLike) => T): T {
    try {
      return operation(activeLocalStorage as StorageLike);
    } catch {
      activeLocalStorage = localMemory;
      addWarning({
        code: 'storage-unavailable',
        message: 'O armazenamento do navegador está indisponível. Os dados serão mantidos apenas nesta sessão.',
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
        code: 'storage-unavailable',
        message: 'O armazenamento da aba está indisponível. A seleção atual será mantida apenas em memória.',
      });
      return operation(sessionMemory);
    }
  }

  function persistState(nextState: DemoState) {
    useLocalStorage((storage) =>
      storage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(nextState)),
    );
  }

  let state: DemoState;
  const storedState = useLocalStorage((storage) => storage.getItem(DEMO_STATE_STORAGE_KEY));

  if (storedState === null) {
    state = createDemoSeed();
    persistState(state);
  } else {
    try {
      const parsed: unknown = JSON.parse(storedState);
      if (!isDemoState(parsed)) throw new Error('invalid-state');
      state = parsed;
    } catch {
      state = createDemoSeed();
      addWarning({
        code: 'state-reset',
        message: 'Os dados locais eram incompatíveis e a demonstração foi restaurada.',
      });
      persistState(state);
    }
  }

  function commit(nextState: DemoState) {
    state = nextState;
    persistState(state);
    listeners.forEach((listener) => listener(state));
    return state;
  }

  function subscribe(listener: (nextState: DemoState) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getUser(userId: string) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');
    return user;
  }

  function requireRole(userId: string, role: UserRole) {
    const user = getUser(userId);
    if (user.role !== role) throw new Error('Ação não permitida para este usuário.');
    return user;
  }

  function getCase(caseId: string) {
    const item = state.cases.find((candidate) => candidate.id === caseId);
    if (!item) throw new Error('Processo não encontrado.');
    return item;
  }

  function getDocument(item: Case, documentId: string) {
    const document = item.documents.find((candidate) => candidate.id === documentId);
    if (!document) throw new Error('Documento não encontrado.');
    return document;
  }

  function createTimelineEvent(input: {
    caseId: string;
    type: TimelineEvent['type'];
    title: string;
    actorId: string;
    description?: string;
  }): TimelineEvent {
    const actor = getUser(input.actorId);
    return {
      id: nextId('event'),
      caseId: input.caseId,
      type: input.type,
      title: input.title,
      description: input.description,
      actorId: actor.id,
      actorRole: actor.role,
      createdAt: now().toISOString(),
    };
  }

  function createNotification(input: Omit<Notification, 'id' | 'createdAt'>): Notification {
    return {
      ...input,
      id: nextId('notification'),
      createdAt: now().toISOString(),
    };
  }

  function replaceCase(updatedCase: Case, notifications: Notification[] = []) {
    return commit({
      ...state,
      cases: state.cases.map((item) =>
        item.id === updatedCase.id ? updatedCase : item,
      ),
      notifications: [...state.notifications, ...notifications],
      updatedAt: now().toISOString(),
    });
  }

  function updateUserProfile(
    userId: string,
    updates: { phone: string; address: string },
  ) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');

    return commit({
      ...state,
      users: state.users.map((item) =>
        item.id === userId ? { ...item, phone: updates.phone, address: updates.address } : item,
      ),
      updatedAt: now().toISOString(),
    });
  }

  function createCase(input: CreateCaseInput) {
    const client = requireRole(input.clientId, 'client');
    const service = getServiceById(input.serviceId);
    if (!service) throw new Error('Serviço não encontrado.');
    if (!input.objective.trim()) throw new Error('Informe o objetivo da solicitação.');

    const createdAt = now().toISOString();
    const year = now().getFullYear();
    const sequence = state.cases.reduce((largest, item) => {
      const match = item.protocol.match(new RegExp(`^RV-${year}-(\\d{4})$`));
      return match ? Math.max(largest, Number(match[1])) : largest;
    }, 0) + 1;
    const protocol = `RV-${year}-${String(sequence).padStart(4, '0')}`;
    const caseId = nextId('case');
    const submittedAssetIds = new Set(input.submittedAssetIds ?? []);

    for (const assetId of submittedAssetIds) {
      if (!state.mockDocumentAssets.some((asset) => asset.id === assetId)) {
        throw new Error('Documento fictício não encontrado.');
      }
    }

    const documents: CaseDocument[] = state.mockDocumentAssets.map((asset) => {
      const submitted = submittedAssetIds.has(asset.id);
      return {
        id: `${caseId}-doc-${asset.kind}`,
        kind: asset.kind,
        label: asset.name,
        required: asset.kind !== 'fotos-imovel',
        status: submitted ? 'Enviado' : 'Pendente',
        versions: submitted
          ? [
              {
                id: nextId('version'),
                assetId: asset.id,
                fileName: asset.fileName,
                sizeLabel: asset.sizeLabel,
                submittedAt: createdAt,
                submittedBy: client.id,
              },
            ]
          : [],
        updatedAt: createdAt,
      };
    });
    const allRequiredSubmitted = documents
      .filter((document) => document.required)
      .every((document) => document.status === 'Enviado');
    const status: CaseStatus = allRequiredSubmitted
      ? 'Documentos em análise'
      : 'Documentos pendentes';
    const createdEvent = createTimelineEvent({
      caseId,
      type: 'case-created',
      title: 'Solicitação criada',
      actorId: client.id,
      description: `Protocolo ${protocol} criado para ${service.name}.`,
    });
    const documentEvents = documents
      .filter((document) => document.status === 'Enviado')
      .map((document) =>
        createTimelineEvent({
          caseId,
          type: 'document-added',
          title: `${document.label} adicionado`,
          actorId: client.id,
        }),
      );
    const createdCase: Case = {
      id: caseId,
      protocol,
      clientId: client.id,
      serviceId: service.id,
      objective: input.objective.trim(),
      status,
      property: { ...input.property, id: nextId('property') },
      documents,
      timeline: [createdEvent, ...documentEvents],
      createdAt,
      updatedAt: createdAt,
    };
    const adminNotifications = state.users
      .filter((user) => user.role === 'admin')
      .flatMap((admin) => {
        const notifications = [
          createNotification({
            userId: admin.id,
            type: 'new-case',
            title: 'Nova solicitação recebida',
            message: `${client.name} criou o protocolo ${protocol}.`,
            caseId,
          }),
        ];
        if (documentEvents.length > 0) {
          notifications.push(
            createNotification({
              userId: admin.id,
              type: 'document-submitted',
              title: 'Novos documentos enviados',
              message: `${documentEvents.length} documento(s) foram adicionados ao protocolo ${protocol}.`,
              caseId,
            }),
          );
        }
        return notifications;
      });

    commit({
      ...state,
      cases: [...state.cases, createdCase],
      notifications: [...state.notifications, ...adminNotifications],
      updatedAt: createdAt,
    });
    return createdCase;
  }

  function updateCaseStatus(caseId: string, status: CaseStatus, actorId: string) {
    requireRole(actorId, 'admin');
    const item = getCase(caseId);
    if (item.status === 'Concluído') {
      throw new Error('O processo concluído é somente leitura.');
    }
    if (!CASE_STATUSES.includes(status)) throw new Error('Status inválido.');
    if (item.status === status) return item;

    const updatedAt = now().toISOString();
    const event = createTimelineEvent({
      caseId,
      type: 'status-changed',
      title: `Status atualizado para ${status}`,
      actorId,
      description: `O processo avançou de ${item.status} para ${status}.`,
    });
    const updatedCase: Case = {
      ...item,
      status,
      timeline: [...item.timeline, event],
      updatedAt,
      completedAt: status === 'Concluído' ? updatedAt : undefined,
    };
    const notification = createNotification({
      userId: item.clientId,
      type: 'status-changed',
      title: `Processo ${status.toLocaleLowerCase('pt-BR')}`,
      message: `O protocolo ${item.protocol} foi atualizado para ${status}.`,
      caseId,
    });
    replaceCase(updatedCase, [notification]);
    return updatedCase;
  }

  function startDocumentReview(caseId: string, documentId: string, actorId: string) {
    requireRole(actorId, 'admin');
    const item = getCase(caseId);
    if (item.status === 'Concluído') {
      throw new Error('O processo concluído é somente leitura.');
    }
    const document = getDocument(item, documentId);
    if (document.status !== 'Enviado') {
      throw new Error('Apenas documentos enviados podem entrar em análise.');
    }

    const updatedAt = now().toISOString();
    const updatedDocument: CaseDocument = {
      ...document,
      status: 'Em análise',
      updatedAt,
    };
    const event = createTimelineEvent({
      caseId,
      type: 'document-review-started',
      title: `Análise de ${document.label} iniciada`,
      actorId,
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate,
      ),
      timeline: [...item.timeline, event],
      updatedAt,
    };
    replaceCase(updatedCase);
    return updatedDocument;
  }

  function reviewDocument(
    caseId: string,
    documentId: string,
    review: DocumentReview,
    actorId: string,
  ) {
    requireRole(actorId, 'admin');
    const item = getCase(caseId);
    if (item.status === 'Concluído') {
      throw new Error('O processo concluído é somente leitura.');
    }
    const document = getDocument(item, documentId);
    if (document.status !== 'Em análise') {
      throw new Error('Inicie a análise antes de revisar o documento.');
    }
    const reason = review.decision === 'reject' ? review.reason.trim() : undefined;
    if (review.decision === 'reject' && !reason) {
      throw new Error('Informe o motivo da rejeição.');
    }

    const approved = review.decision === 'approve';
    const updatedAt = now().toISOString();
    const updatedDocument: CaseDocument = {
      ...document,
      status: approved ? 'Aprovado' : 'Rejeitado',
      rejectionReason: approved ? undefined : reason,
      reviewedAt: updatedAt,
      reviewedBy: actorId,
      updatedAt,
    };
    const event = createTimelineEvent({
      caseId,
      type: approved ? 'document-approved' : 'document-rejected',
      title: `${document.label} ${approved ? 'aprovado' : 'rejeitado'}`,
      actorId,
      description: reason,
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate,
      ),
      timeline: [...item.timeline, event],
      updatedAt,
    };
    const notification = createNotification({
      userId: item.clientId,
      type: approved ? 'document-approved' : 'document-rejected',
      title: `${document.label} ${approved ? 'aprovado' : 'precisa de ajuste'}`,
      message: approved
        ? `O documento do protocolo ${item.protocol} foi aprovado.`
        : `${reason} Protocolo ${item.protocol}.`,
      caseId,
      documentId,
    });
    replaceCase(updatedCase, [notification]);
    return updatedDocument;
  }

  function addMockDocumentVersion(
    caseId: string,
    documentId: string,
    assetId: string,
    actorId: string,
  ) {
    requireRole(actorId, 'client');
    const item = getCase(caseId);
    if (item.status === 'Concluído') {
      throw new Error('O processo concluído é somente leitura.');
    }
    if (item.clientId !== actorId) throw new Error('Ação não permitida para este processo.');
    const document = getDocument(item, documentId);
    if (!['Pendente', 'Rejeitado'].includes(document.status)) {
      throw new Error('Este documento não está disponível para envio.');
    }
    const asset = state.mockDocumentAssets.find((candidate) => candidate.id === assetId);
    if (!asset || asset.kind !== document.kind) {
      throw new Error('Documento fictício incompatível.');
    }

    const updatedAt = now().toISOString();
    const isResubmission = document.versions.length > 0;
    const updatedDocument: CaseDocument = {
      ...document,
      status: 'Enviado',
      versions: [
        ...document.versions,
        {
          id: nextId('version'),
          assetId: asset.id,
          fileName: asset.fileName,
          sizeLabel: asset.sizeLabel,
          submittedAt: updatedAt,
          submittedBy: actorId,
        },
      ],
      rejectionReason: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
      updatedAt,
    };
    const event = createTimelineEvent({
      caseId,
      type: isResubmission ? 'document-resubmitted' : 'document-added',
      title: `${document.label} ${isResubmission ? 'reenviado' : 'adicionado'}`,
      actorId,
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate,
      ),
      timeline: [...item.timeline, event],
      updatedAt,
    };
    const notifications = state.users
      .filter((user) => user.role === 'admin')
      .map((admin) =>
        createNotification({
          userId: admin.id,
          type: 'document-submitted',
          title: isResubmission ? 'Documento reenviado' : 'Novo documento enviado',
          message: `${document.label} foi adicionado ao protocolo ${item.protocol}.`,
          caseId,
          documentId,
        }),
      );
    replaceCase(updatedCase, notifications);
    return updatedDocument;
  }

  function markNotificationRead(notificationId: string, userId: string) {
    const notification = state.notifications.find((item) => item.id === notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notificação não encontrada.');
    }
    if (notification.readAt) return state;

    return commit({
      ...state,
      notifications: state.notifications.map((item) =>
        item.id === notificationId ? { ...item, readAt: now().toISOString() } : item,
      ),
      updatedAt: now().toISOString(),
    });
  }

  function markAllNotificationsRead(userId: string) {
    getUser(userId);
    const readAt = now().toISOString();
    return commit({
      ...state,
      notifications: state.notifications.map((item) =>
        item.userId === userId && !item.readAt ? { ...item, readAt } : item,
      ),
      updatedAt: readAt,
    });
  }

  function recordWhatsAppStarted(caseId: string, actorId: string) {
    const actor = getUser(actorId);
    const item = getCase(caseId);
    if (actor.role === 'client' && item.clientId !== actor.id) {
      throw new Error('Ação não permitida para este processo.');
    }
    const event = createTimelineEvent({
      caseId,
      type: 'whatsapp-started',
      title: 'Contato por WhatsApp iniciado',
      actorId,
    });
    const updatedCase: Case = {
      ...item,
      timeline: [...item.timeline, event],
      updatedAt: event.createdAt,
    };
    replaceCase(updatedCase);
    return event;
  }

  function setSession(session: AuthSession) {
    if (!isAuthSession(session, state)) throw new Error('Sessão inválida.');
    useLocalStorage((storage) =>
      storage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session)),
    );
  }

  function getSession(): AuthSession | null {
    const raw = useLocalStorage((storage) => storage.getItem(DEMO_SESSION_STORAGE_KEY));
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isAuthSession(parsed, state)) throw new Error('invalid-session');
      return parsed;
    } catch {
      useLocalStorage((storage) => storage.removeItem(DEMO_SESSION_STORAGE_KEY));
      return null;
    }
  }

  function clearSession() {
    useLocalStorage((storage) => storage.removeItem(DEMO_SESSION_STORAGE_KEY));
  }

  function setPendingServiceId(serviceId: string) {
    if (!getServiceById(serviceId)) throw new Error('Serviço não encontrado.');
    useSessionStorage((storage) =>
      storage.setItem(DEMO_PENDING_SERVICE_STORAGE_KEY, serviceId),
    );
  }

  function getPendingServiceId(): string | null {
    const serviceId = useSessionStorage((storage) =>
      storage.getItem(DEMO_PENDING_SERVICE_STORAGE_KEY),
    );
    return serviceId && getServiceById(serviceId) ? serviceId : null;
  }

  function consumePendingServiceId() {
    const serviceId = getPendingServiceId();
    useSessionStorage((storage) =>
      storage.removeItem(DEMO_PENDING_SERVICE_STORAGE_KEY),
    );
    return serviceId;
  }

  function resetDemo() {
    state = createDemoSeed();
    persistState(state);
    clearSession();
    useSessionStorage((storage) =>
      storage.removeItem(DEMO_PENDING_SERVICE_STORAGE_KEY),
    );
    return state;
  }

  return {
    getState: (): DemoState => state,
    getWarnings: (): RepositoryWarning[] => [...warnings],
    subscribe,
    updateUserProfile,
    createCase,
    updateCaseStatus,
    startDocumentReview,
    reviewDocument,
    addMockDocumentVersion,
    markNotificationRead,
    markAllNotificationsRead,
    recordWhatsAppStarted,
    setSession,
    getSession,
    clearSession,
    setPendingServiceId,
    getPendingServiceId,
    consumePendingServiceId,
    resetDemo,
  };
}

export type DemoRepository = ReturnType<typeof createDemoRepository>;
