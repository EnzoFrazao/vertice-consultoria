import { describe, expect, it } from 'vitest';

import { DEMO_CLIENT_ID, DEMO_STATE_VERSION, createDemoSeed } from './seed';
import {
  DEMO_PENDING_SERVICE_STORAGE_KEY,
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  createDemoRepository,
} from './repository';
import type { StorageLike } from './repository';

function createStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

const NOW = new Date('2026-07-11T12:00:00.000Z');

describe('persistência do repositório demonstrativo', () => {
  it('inicializa e persiste o seed versionado quando o navegador ainda não tem dados', () => {
    const localStorage = createStorage();
    const repository = createDemoRepository({ localStorage, sessionStorage: createStorage() });

    expect(repository.getState().version).toBe(DEMO_STATE_VERSION);
    expect(JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY) ?? '{}').cases.length).toBeGreaterThan(1);
    expect(repository.getWarnings()).toEqual([]);
  });

  it.each([
    ['JSON corrompido', '{não é JSON'],
    [
      'versão incompatível',
      JSON.stringify({ ...createDemoSeed(), version: DEMO_STATE_VERSION + 1 }),
    ],
  ])('restaura o seed quando encontra %s e expõe um aviso', (_label, storedValue) => {
    const localStorage = createStorage({ [DEMO_STATE_STORAGE_KEY]: storedValue });
    const repository = createDemoRepository({ localStorage, sessionStorage: createStorage() });

    expect(repository.getState().version).toBe(DEMO_STATE_VERSION);
    expect(repository.getState().users.some((user) => user.id === DEMO_CLIENT_ID)).toBe(true);
    expect(repository.getWarnings()).toEqual([
      expect.objectContaining({ code: 'state-reset' }),
    ]);
    expect(JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY) ?? '{}').version).toBe(
      DEMO_STATE_VERSION,
    );
  });

  it('continua funcional em memória quando o localStorage está indisponível', () => {
    const unavailable: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const repository = createDemoRepository({
      localStorage: unavailable,
      sessionStorage: createStorage(),
      now: () => NOW,
    });

    repository.updateUserProfile(DEMO_CLIENT_ID, {
      phone: '(85) 98888-0000',
      address: 'Novo endereço',
    });

    expect(repository.getState().users.find((user) => user.id === DEMO_CLIENT_ID)?.phone).toBe(
      '(85) 98888-0000',
    );
    expect(repository.getWarnings()).toEqual([
      expect.objectContaining({ code: 'storage-unavailable' }),
    ]);
  });

  it('persiste sessão no armazenamento local e serviço pendente no armazenamento da aba', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    const repository = createDemoRepository({ localStorage, sessionStorage });
    const session = {
      userId: DEMO_CLIENT_ID,
      role: 'client' as const,
      signedInAt: NOW.toISOString(),
    };

    repository.setSession(session);
    repository.setPendingServiceId('escritura');

    expect(repository.getSession()).toEqual(session);
    expect(JSON.parse(localStorage.getItem(DEMO_SESSION_STORAGE_KEY) ?? '{}')).toEqual(session);
    expect(sessionStorage.getItem(DEMO_PENDING_SERVICE_STORAGE_KEY)).toBe('escritura');
    expect(repository.consumePendingServiceId()).toBe('escritura');
    expect(repository.getPendingServiceId()).toBeNull();
  });

  it('limpa dados, sessão e seleção pendente ao restaurar a demonstração', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    const repository = createDemoRepository({ localStorage, sessionStorage, now: () => NOW });
    repository.setSession({
      userId: DEMO_CLIENT_ID,
      role: 'client',
      signedInAt: NOW.toISOString(),
    });
    repository.setPendingServiceId('escritura');
    repository.updateUserProfile(DEMO_CLIENT_ID, {
      phone: 'alterado',
      address: 'alterado',
    });

    const resetState = repository.resetDemo();

    expect(resetState.users.find((user) => user.id === DEMO_CLIENT_ID)?.phone).not.toBe('alterado');
    expect(repository.getSession()).toBeNull();
    expect(repository.getPendingServiceId()).toBeNull();
  });
});
