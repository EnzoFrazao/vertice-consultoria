# Convenções para agentes

Monorepo npm (`frontend/` React + Vite + TypeScript + Tailwind; `supabase/` migrations). Comandos e arquitetura de camadas: `README.md`. Gate único: `npm run check`.

## Memória técnica

1. Leia `specs/README.md`.
2. Abra somente as capabilities relacionadas à tarefa.
3. Consulte `specs/system.md` para confirmar o implementado.
4. Consulte `specs/testing.md` antes de alterar cobertura.
5. Use `docs/state.md` somente para handoff local.

Mudança funcional atualiza a capability; decisão duradoura cria ou substitui ADR; alteração de
evidência atualiza `testing.md`; marco relevante atualiza `history.md`.

## Regras do projeto

- `domain` não importa React, navegador ou outras camadas; páginas acessam dados só por `features/portal-data` (ESLint verifica).
- Segredos, `service_role` e integrações externas nunca vão ao frontend.
- Marca "Vértice Consultoria": usar o PNG fornecido sem redesenhar.
- Commit, push e deploy só com autorização explícita.
