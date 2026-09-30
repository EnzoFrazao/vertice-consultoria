---
id: acesso
contract_status: confirmed
implementation_status: partial
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Acesso, sessão e papéis

## Finalidade e limites

Identificar o usuário e encaminhá-lo ao portal do seu papel (`client` ou `admin`). Hoje é apenas demonstrativo; o contrato definitivo é Supabase Auth.

## Atores, permissões, entradas e resultados

Ver contrato abaixo; atores: cliente, administrador e sistema conforme o caso.

## Contrato comportamental e critérios de aceite

- Rotas protegidas redirecionam sessão ausente ou de outro papel.
- Supabase Auth será a única fonte de autenticação, sem fallback demo: login, cadastro público com confirmação de e-mail, recuperação e redefinição de senha nas rotas `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`.
- Papéis vêm de `public.user_roles`/`public.roles`, nunca de `user_metadata`; com `admin` e `client`, `admin` tem prioridade.
- O navegador só recebe `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`; nunca `service_role`, chave secreta ou senha do banco.
- Guards do React são só experiência; a autorização efetiva é RLS.
- MFA fora do corte (P-003).
- Detalhes: `docs/superpowers/specs/2026-07-29-supabase-auth-owasp-design.md`.

## Invariantes e regras de negócio

- Autorização nunca depende de dados editáveis pelo usuário (`user_metadata`).
- Nenhum segredo chega ao navegador.

## Estado atual e lacunas

- Implementado: login demo com contas fixas no bundle (`cliente@demo.com`, `admin@demo.com`), sessão em `localStorage["rv.demo.session.v1"]`, restauração da demo na tela de login.
- Não implementado: nenhum item do contrato Supabase Auth acima (sem `@supabase/supabase-js`, sem as três rotas novas).

## Evidências de implementação e teste

- Implementação: `frontend/src/features/auth/auth.ts`, `frontend/src/app/RootApp.tsx`, `frontend/src/features/portal-data/`.
- Testes: `frontend/src/features/auth/auth.test.ts`, `frontend/src/app/RootApp.test.tsx`.

## Relações

- Decisão aberta: `P-003`. Depende de `backend-supabase`.
