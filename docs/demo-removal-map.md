# Mapa de remoção do modo demo

Levantamento feito na branch `backend` com os termos definidos no plano de
migração. O estado de trabalho já continha uma reorganização não commitada da
infraestrutura demo; por isso, há consumidores em `infrastructure/` que ainda
importam caminhos antigos de `infrastructure/demo/`.

## Autenticação

- `frontend/src/features/auth/auth.ts`: contratos reais e compatibilidade
  temporária de autenticação demo.
- `frontend/src/features/auth/auth.test.ts`: testes de credenciais demo.
- `frontend/src/app/RootApp.tsx`: consome login e reset do modo demo.
- `frontend/src/app/RootApp.test.tsx`: cria repositório demo e manipula sessão.
- `frontend/src/pages/login/LoginPage.tsx`: contas, preenchimento e reset demo.
- `frontend/src/pages/login/LoginPage.test.tsx`: expectativas e credenciais demo.
- `frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts`: ocorrência de
  `getSession` pertence à autenticação real do Supabase, não ao modo demo.

## Provider

- `frontend/src/features/portal-data/PortalDataProvider.tsx`: depende de
  `DemoRepository`, `DemoState`, factory, sessão persistida e ações demo.
- `frontend/src/features/portal-data/PortalDataProvider.test.tsx`: injeta o
  repositório demo e usa credenciais demo.

## Páginas

- `frontend/src/pages/client/NewRequestPage.tsx`: consome assets de documentos
  mockados.
- `frontend/src/pages/client/ClientProcessDetailPage.tsx`: resolve documentos a
  partir de `mockDocumentAssets`.
- `frontend/src/pages/client/ClientPortal.test.tsx`: cria repositório demo e
  manipula a sessão persistida.
- `frontend/src/pages/admin/AdminPortal.test.tsx`: cria repositório demo e
  manipula a sessão persistida.

## Testes

- `frontend/src/domain/selectors.test.ts`
- `frontend/src/infrastructure/seed.test.ts`
- `frontend/src/infrastructure/repository.actions.test.ts`
- `frontend/src/infrastructure/repository.persistence.test.ts`
- `frontend/src/infrastructure/validation.test.ts`
- Os testes de app, autenticação, provider, login, portal do cliente e portal
  administrativo listados nas seções anteriores também dependem do demo.

## Persistência

- `frontend/src/infrastructure/repository.ts`: implementa
  `createDemoRepository`, leitura/escrita/limpeza de sessão e `resetDemo`.
- `frontend/src/infrastructure/validation.ts`: valida `DemoState` e sessão demo.
- `frontend/src/infrastructure/repository.persistence.test.ts`: cobre
  `localStorage`, `sessionStorage`, sessão e reset do demo.
- `frontend/src/infrastructure/validation.test.ts`: cobre persistência e
  integridade do estado demo.

## Dados mockados e domínio

- `frontend/src/domain/types.ts`: declara `DemoState` e `MockDocumentAsset`.
- `frontend/src/domain/selectors.ts`: seletores recebem `DemoState`.
- `frontend/src/infrastructure/seed.ts`: contas, casos e assets demonstrativos.
- `frontend/src/infrastructure/actions/context.ts`: contexto de mutação baseado
  em `DemoState`.
- `frontend/src/infrastructure/actions/cases.ts`: monta documentos a partir de
  assets mockados.
- `frontend/src/infrastructure/actions/documents.ts`: cria e atualiza versões
  fictícias de documentos.

## Observação sobre a reorganização em andamento

Os arquivos atuais em `frontend/src/infrastructure/` ainda referenciam módulos
removidos de `frontend/src/infrastructure/demo/`. Isso explica parte dos erros do
typecheck inicial e deve ser preservado até que a autoria dessas alterações seja
confirmada ou que as tarefas posteriores substituam os consumidores.
