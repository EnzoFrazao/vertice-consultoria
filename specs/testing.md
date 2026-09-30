# Estratégia e mapa de testes

**Última verificação:** 2026-09-30 (mapa derivado dos arquivos; gates não reexecutados nesta sessão)

## Gates

| Comando         | Evidência                                                                         |
| --------------- | --------------------------------------------------------------------------------- |
| `npm run check` | lint (0 warnings), Prettier, typecheck, Vitest e build com verificação de bundles |
| `npm test`      | Vitest (jsdom, `frontend/src/test/setup.ts`)                                      |

O CI executa `npm run check` a cada push e PR. O verificador de bundles tem teste próprio em `frontend/scripts/bundle-checker.node-test.mjs`.

## Responsabilidade por camada

| Comportamento                       | Local                                        |
| ----------------------------------- | -------------------------------------------- |
| Domínio puro                        | `frontend/src/domain/*.test.ts`              |
| Persistência, validação e seed demo | `frontend/src/infrastructure/demo/*.test.ts` |
| Fachada e auth demo                 | `frontend/src/features/**/*.test.ts(x)`      |
| Rotas e guards                      | `frontend/src/app/*.test.tsx`                |
| Páginas                             | `frontend/src/pages/**/*.test.tsx`           |

## Mapa por capacidade

| Capability                | Arquivos ou globs                                                                 | Situação                        |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| `landing-catalogo`        | `pages/landing/*.test.tsx`, `domain/catalog.test.ts`                              | Coberta                         |
| `acesso`                  | `features/auth/auth.test.ts`, `app/RootApp.test.tsx`                              | Coberta (só demo)               |
| `portal-cliente`          | `pages/client/ClientPortal.test.tsx`                                              | Coberta                         |
| `portal-admin`            | `pages/admin/AdminPortal.test.tsx`                                                | Coberta                         |
| `notificacoes-automacoes` | `infrastructure/demo/repository.actions.test.ts`, `shared/config/contact.test.ts` | Só a parte demo                 |
| `backend-supabase`        | —                                                                                 | Sem testes de RLS ou migrations |

## Lacunas

- Nenhum teste de políticas RLS nem das migrations.
- Sem E2E; smoke visual admin em 375/768/1440 px pendente (`docs/state.md`).
