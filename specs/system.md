# Sistema implementado

**Última verificação:** 2026-09-30  
**Referência:** `working-tree` (branch `claude/project-documentation-context-760c46`)

## Finalidade e unidade executável

SPA React servida pelo Netlify (`frontend/dist`) e um schema Postgres/Supabase versionado em `supabase/`. As duas partes ainda não se comunicam.

## Stack e entrypoints

- Node 22 (`.nvmrc`), npm workspaces (só `frontend`), lockfile único na raiz.
- `frontend/src/main.tsx` → `app/RootApp.tsx` (rotas, guards, chunks lazy de login, cliente e admin; landing no carregamento inicial).
- Camadas em `frontend/src`: `domain` (tipos, catálogo, selectors puros) → `infrastructure/demo` (seed, validação, persistência local) → `features/portal-data` (fachada única usada pelas páginas) → `pages`; `shared` sem dependência das demais. ESLint impõe as fronteiras.
- `config/` guarda ESLint e Prettier compartilhados; `netlify.toml` + `frontend/public/_redirects` dão o fallback SPA.
- CI: `.github/workflows/ci.yml` roda `npm ci` e `npm run check` (Node 22).
- Supabase: `supabase/config.toml` e 8 migrations em `supabase/migrations/`; CLI `supabase` é devDependency.

## Fronteiras e fluxo

Páginas → `PortalDataProvider` → repositório demo (localStorage). Autenticação também é demonstrativa (contas fixas no bundle). Os 7 estados de processo e 5 de documento vivem em `domain/types.ts`; a UI agrupa os processos em 5 macrofases.

## Estado, persistência e integrações

- Persistência atual: `localStorage["rv.demo.state.v1"]`, `["rv.demo.session.v1"]`, `sessionStorage["rv.demo.pending-service"]`; estado inválido cai no seed.
- Banco (não conectado): 20 tabelas em `public` (identidade e papéis, catálogo, imóveis, processos, documentos e versões, revisões, mensagens, histórico, auditoria, notificações), storage privado de documentos e RLS.
- Sem API própria, IA, filas ou upload real.

## Restrições e lacunas

- `README.md` ainda descreve `backend/` Laravel/PHP 8.4, inexistente no repositório; ver `open-decisions.md` P-001.
- `docs/backend.md` tem a seção "Executar localmente" sem conteúdo.
- O design `docs/superpowers/specs/2026-07-29-supabase-auth-owasp-design.md` não está implementado: `@supabase/supabase-js` não está em `frontend/package.json` e não há rotas `/cadastro`, `/recuperar-senha`, `/redefinir-senha`.
- Netlify ainda não vinculado/validado (ver `docs/state.md`).
