import { describe, expect, it, vi } from 'vitest';

import { DEMO_ADMIN_ID, DEMO_CLIENT_ID } from './seed';
import { createDemoRepository, derivePendingActions } from './repository';
import type { StorageLike } from './repository';

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

const NOW = new Date('2026-07-11T12:00:00.000Z');

function createRepository() {
  return createDemoRepository({
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    now: () => NOW,
  });
}

const property = {
  type: 'Casa térrea',
  address: 'Rua Nova',
  number: '42',
  neighborhood: 'Centro',
  city: 'Fortaleza',
  state: 'CE',
  postalCode: '60000-000',
  registrationNumber: '90.123 · 1º Ofício',
  iptuNumber: 'IPTU-9001',
};

describe('ações do repositório demonstrativo', () => {
  it('cria processo com protocolo, documentos pendentes, histórico e avisos administrativos', () => {
    const repository = createRepository();

    const created = repository.createCase({
      clientId: DEMO_CLIENT_ID,
      serviceId: 'usucapiao',
      objective: 'Regularizar a posse antiga da família.',
      property,
      submittedAssetIds: ['asset-rg-cpf'],
    });

    expect(created.protocol).toBe('RV-2026-0004');
    expect(created.status).toBe('Documentos pendentes');
    expect(created.documents.find((document) => document.kind === 'rg-cpf')?.status).toBe('Enviado');
    expect(created.documents.find((document) => document.kind === 'matricula-imovel')?.status).toBe('Pendente');
    expect(created.timeline.map((event) => event.type)).toEqual(
      expect.arrayContaining(['case-created', 'document-added']),
    );
    expect(
      repository
        .getState()
        .notifications.filter((notification) => notification.userId === DEMO_ADMIN_ID)
        .map((notification) => notification.type),
    ).toEqual(expect.arrayContaining(['new-case', 'document-submitted']));
  });

  it('inicia em documentos em análise quando todos os documentos obrigatórios são adicionados', () => {
    const repository = createRepository();
    const created = repository.createCase({
      clientId: DEMO_CLIENT_ID,
      serviceId: 'escritura',
      objective: 'Preparar a escritura do imóvel.',
      property,
      submittedAssetIds: [
        'asset-rg-cpf',
        'asset-comprovante-residencia',
        'asset-matricula-imovel',
        'asset-iptu',
        'asset-contrato-compra-venda',
      ],
    });

    expect(created.status).toBe('Documentos em análise');
  });

  it('produz novos objetos, preserva snapshots antigos e notifica assinantes', () => {
    const repository = createRepository();
    const before = repository.getState();
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    repository.updateUserProfile(DEMO_CLIENT_ID, {
      phone: '(85) 97777-0000',
      address: 'Rua Atualizada, 1',
    });

    expect(repository.getState()).not.toBe(before);
    expect(before.users.find((user) => user.id === DEMO_CLIENT_ID)?.phone).toBe('(85) 99999-1001');
    expect(listener).toHaveBeenCalledWith(repository.getState());

    unsubscribe();
    repository.updateUserProfile(DEMO_CLIENT_ID, {
      phone: '(85) 96666-0000',
      address: 'Rua Atualizada, 2',
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('atualiza status, registra histórico, notifica o cliente e congela concluídos', () => {
    const repository = createRepository();
    const updated = repository.updateCaseStatus(
      'case-0001',
      'Aguardando cliente',
      DEMO_ADMIN_ID,
    );

    expect(updated.status).toBe('Aguardando cliente');
    expect(updated.timeline.at(-1)).toEqual(
      expect.objectContaining({ type: 'status-changed', actorRole: 'admin' }),
    );
    expect(
      repository
        .getState()
        .notifications.some(
          (notification) =>
            notification.userId === DEMO_CLIENT_ID &&
            notification.type === 'status-changed' &&
            notification.caseId === 'case-0001',
        ),
    ).toBe(true);

    repository.updateCaseStatus('case-0001', 'Concluído', DEMO_ADMIN_ID);
    expect(() =>
      repository.updateCaseStatus('case-0001', 'Análise técnica', DEMO_ADMIN_ID),
    ).toThrow(/concluído/i);
  });

  it('inicia e aprova a análise de um documento enviado', () => {
    const repository = createRepository();
    const documentId = 'case-0001-doc-comprovante-residencia';

    const inReview = repository.startDocumentReview('case-0001', documentId, DEMO_ADMIN_ID);
    const approved = repository.reviewDocument(
      'case-0001',
      documentId,
      { decision: 'approve' },
      DEMO_ADMIN_ID,
    );

    expect(inReview.status).toBe('Em análise');
    expect(approved.status).toBe('Aprovado');
    expect(
      repository
        .getState()
        .cases.find((item) => item.id === 'case-0001')
        ?.timeline.map((event) => event.type),
    ).toEqual(expect.arrayContaining(['document-review-started', 'document-approved']));
  });

  it('exige motivo para rejeitar e envia a pendência ao cliente', () => {
    const repository = createRepository();
    const documentId = 'case-0001-doc-iptu';
    repository.startDocumentReview('case-0001', documentId, DEMO_ADMIN_ID);

    expect(() =>
      repository.reviewDocument(
        'case-0001',
        documentId,
        { decision: 'reject', reason: '   ' },
        DEMO_ADMIN_ID,
      ),
    ).toThrow(/motivo/i);

    const rejected = repository.reviewDocument(
      'case-0001',
      documentId,
      { decision: 'reject', reason: 'Documento sem todas as páginas.' },
      DEMO_ADMIN_ID,
    );

    expect(rejected).toEqual(
      expect.objectContaining({
        status: 'Rejeitado',
        rejectionReason: 'Documento sem todas as páginas.',
      }),
    );
    expect(
      repository
        .getState()
        .notifications.some(
          (notification) =>
            notification.userId === DEMO_CLIENT_ID &&
            notification.type === 'document-rejected' &&
            notification.documentId === documentId,
        ),
    ).toBe(true);
  });

  it('adiciona nova versão fictícia após rejeição e avisa a fila administrativa', () => {
    const repository = createRepository();
    const documentId = 'case-0001-doc-iptu';
    repository.startDocumentReview('case-0001', documentId, DEMO_ADMIN_ID);
    const rejected = repository.reviewDocument(
      'case-0001',
      documentId,
      { decision: 'reject', reason: 'Documento ilegível.' },
      DEMO_ADMIN_ID,
    );

    const resubmitted = repository.addMockDocumentVersion(
      'case-0001',
      documentId,
      'asset-iptu',
      DEMO_CLIENT_ID,
    );

    expect(resubmitted.status).toBe('Enviado');
    expect(resubmitted.versions).toHaveLength(rejected.versions.length + 1);
    expect(resubmitted.rejectionReason).toBeUndefined();
    expect(
      repository
        .getState()
        .cases.find((item) => item.id === 'case-0001')
        ?.timeline.at(-1)?.type,
    ).toBe('document-resubmitted');
    expect(
      repository
        .getState()
        .notifications.at(-1),
    ).toEqual(expect.objectContaining({ userId: DEMO_ADMIN_ID, type: 'document-submitted' }));
  });

  it('marca uma ou todas as notificações do usuário como lidas', () => {
    const repository = createRepository();
    const notification = repository
      .getState()
      .notifications.find((item) => item.userId === DEMO_CLIENT_ID);
    expect(notification).toBeDefined();

    repository.markNotificationRead(notification!.id, DEMO_CLIENT_ID);
    expect(
      repository.getState().notifications.find((item) => item.id === notification!.id)?.readAt,
    ).toBe(NOW.toISOString());

    repository.updateCaseStatus('case-0001', 'Aguardando cliente', DEMO_ADMIN_ID);
    repository.markAllNotificationsRead(DEMO_CLIENT_ID);
    expect(
      repository
        .getState()
        .notifications.filter((item) => item.userId === DEMO_CLIENT_ID)
        .every((item) => item.readAt === NOW.toISOString()),
    ).toBe(true);
  });

  it('registra o início do contato por WhatsApp no histórico do processo, inclusive concluído', () => {
    const repository = createRepository();
    repository.updateCaseStatus('case-0001', 'Concluído', DEMO_ADMIN_ID);

    const event = repository.recordWhatsAppStarted('case-0001', DEMO_CLIENT_ID);

    expect(event).toEqual(
      expect.objectContaining({
        caseId: 'case-0001',
        type: 'whatsapp-started',
        actorId: DEMO_CLIENT_ID,
      }),
    );
    expect(
      repository
        .getState()
        .cases.find((item) => item.id === 'case-0002')
        ?.timeline.some((item) => item.id === event.id),
    ).toBe(false);
  });

  it('deriva pendências diferentes para cliente e administrador sem gravá-las no estado', () => {
    const repository = createRepository();
    const state = repository.getState();

    const clientActions = derivePendingActions(state, {
      id: DEMO_CLIENT_ID,
      role: 'client',
    });
    const adminActions = derivePendingActions(state, {
      id: DEMO_ADMIN_ID,
      role: 'admin',
    });

    expect(clientActions.some((action) => action.kind === 'client-document')).toBe(true);
    expect(adminActions.some((action) => action.kind === 'admin-document-review')).toBe(true);
    expect('pendingActions' in state).toBe(false);
  });
});
