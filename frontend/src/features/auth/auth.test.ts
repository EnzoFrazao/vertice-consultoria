import { describe, expect, it } from 'vitest';

import { DEMO_ADMIN_ID, DEMO_CLIENT_ID, DEMO_USERS } from "@/infrastructure/demo/seed";
import { authenticateDemoUser } from '@/features/auth/auth';

const NOW = new Date('2026-07-11T12:00:00.000Z');

describe('autenticação demonstrativa', () => {
  it('autentica a conta cliente aprovada e cria sua sessão', () => {
    expect(
      authenticateDemoUser('cliente@demo.com', 'cliente123', DEMO_USERS, () => NOW),
    ).toEqual({
      userId: DEMO_CLIENT_ID,
      role: 'client',
      signedInAt: NOW.toISOString(),
    });
  });

  it('autentica a conta administrativa aprovada', () => {
    expect(
      authenticateDemoUser('admin@demo.com', 'admin123', DEMO_USERS, () => NOW),
    ).toEqual({
      userId: DEMO_ADMIN_ID,
      role: 'admin',
      signedInAt: NOW.toISOString(),
    });
  });

  it('normaliza apenas espaços e caixa do e-mail', () => {
    expect(
      authenticateDemoUser('  CLIENTE@DEMO.COM ', 'cliente123', DEMO_USERS, () => NOW)?.userId,
    ).toBe(DEMO_CLIENT_ID);
  });

  it('recusa senha incorreta, conta não demonstrativa e senha com espaços extras', () => {
    expect(authenticateDemoUser('cliente@demo.com', 'errada', DEMO_USERS, () => NOW)).toBeNull();
    expect(authenticateDemoUser('fernanda@demo.com', 'cliente123', DEMO_USERS, () => NOW)).toBeNull();
    expect(authenticateDemoUser('cliente@demo.com', ' cliente123 ', DEMO_USERS, () => NOW)).toBeNull();
  });
});
