# Memória técnica do projeto

Vértice Consultoria: landing pública e portais (cliente e administrador) para uma consultoria imobiliária. Hoje o frontend é demonstrativo (dados locais); o Supabase existe como schema versionado, ainda sem integração.

## Ordem de leitura

1. Leia este índice.
2. Abra somente a capability relacionada.
3. Consulte `system.md` para confirmar o implementado.
4. Consulte `testing.md` antes de alterar cobertura.
5. Leia ADRs e decisões abertas citados.
6. Consulte `docs/state.md` para o handoff local.

## Autoridade

| Documento | Autoridade |
|---|---|
| `capabilities/*.md` | Contrato e estado de entrega |
| `system.md` | Arquitetura realmente implementada |
| `testing.md` | Estratégia e mapa de evidências |
| `open-decisions.md` | Questões que não podem ser inventadas |
| `history.md` | Marcos; Git preserva o detalhe |
| `docs/superpowers/specs/*` | Designs datados que originaram as capabilities (contexto, não autoridade viva) |

## Roteamento por tarefa

| Tema | Ler |
|---|---|
| Landing, catálogo de serviços, CTA | `capabilities/landing-catalogo.md` |
| Login, sessão, papéis, Supabase Auth | `capabilities/acesso.md` |
| Portal do cliente (Dossiê Vivo) | `capabilities/portal-cliente.md` |
| Portal administrativo (Mesa de Operações) | `capabilities/portal-admin.md` |
| Notificações, WhatsApp, lembretes, IA e demais automações | `capabilities/notificacoes-automacoes.md` |
| Banco, RLS, storage | `capabilities/backend-supabase.md` |
| Arquitetura, build, deploy | `system.md` |
| Testes | `testing.md` |

## Manutenção

- Mudança funcional atualiza a capability.
- Mudança de evidência atualiza `testing.md`.
- Decisão duradoura cria ou substitui ADR.
- Marco relevante atualiza `history.md`.
