---
id: notificacoes-automacoes
contract_status: draft
implementation_status: partial
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Notificações e automações

## Finalidade e limites

Avisar as pessoas certas quando algo muda em um processo e, no futuro, automatizar tarefas repetitivas. Só a parte interna (sino e histórico) existe, em modo demonstrativo. O contrato abaixo é rascunho: o mecanismo de entrega e o escopo das automações dependem de `P-004` e `P-005`.

## Atores, permissões, entradas e resultados

- Cliente: recebe avisos do seu processo.
- Administrador: recebe avisos de novas solicitações e documentos.
- Sistema: gera notificações, eventos de histórico e, quando existirem, entregas externas.

## Contrato comportamental e critérios de aceite

### Confirmado (existe na demonstração e deve ser preservado)

| Evento                          | Destinatário          | Tipo                                      |
| ------------------------------- | --------------------- | ----------------------------------------- |
| Solicitação criada              | Todos os admins       | `new-case`                                |
| Documento enviado ou reenviado  | Todos os admins       | `document-submitted`                      |
| Documento aprovado ou rejeitado | Cliente do processo   | `document-approved` / `document-rejected` |
| Status do processo alterado     | Cliente do processo   | `status-changed`                          |
| Clique em WhatsApp              | Histórico do processo | `whatsapp-started`                        |

- Cada ação relevante gera também um evento no histórico do processo.
- Notificação pode ser marcada como lida, individualmente ou em massa.

### Planejado (rascunho, ainda sem decisão de produto)

Ordem sugerida de execução:

1. Persistir notificações no Supabase (`notifications`) no lugar do localStorage.
2. Entrega externa registrada em `notification_deliveries` (`queued`, `sent`, `delivered`, `failed`) com repetição de falhas.
3. E-mail transacional para cliente (mudança de status, documento aprovado/rejeitado) e admin (nova solicitação, documento enviado).
4. WhatsApp real: número oficial e, se aprovado, envio automático além do link `wa.me`.
5. Lembrete de documento pendente ao cliente (regra de frequência a definir).
6. Varredura automática de uploads (`malware_scan_status`).
7. Leitura de documentos por IA, mediada pelo backend.
8. Assinatura digital e chat interno (fora do escopo até nova decisão).

## Invariantes e regras de negócio

- Não inventar prazo, SLA ou urgência em lembretes.
- Segredos de provedores e IA ficam no backend, nunca no frontend.
- Falha de entrega não deve impedir a ação de negócio que a originou.

## Estado atual e lacunas

- Implementado (demo): notificações internas, histórico e link de WhatsApp com número provisório (`shared/config/contact.ts`).
- Schema pronto, sem uso: `notifications`, `notification_deliveries`, `malware_scan_status`.
- Não implementado: qualquer entrega externa, lembrete, varredura, IA, assinatura e chat.

## Evidências de implementação e teste

- Implementação: `frontend/src/infrastructure/demo/actions/{cases,documents,notifications}.ts`, `frontend/src/shared/ui/portal/PortalNotificationsPanel.tsx`, `frontend/src/shared/config/contact.ts`, `supabase/migrations/20260725182253_create_history_audit_and_notifications.sql`.
- Testes: `frontend/src/infrastructure/demo/repository.actions.test.ts`, `frontend/src/shared/config/contact.test.ts`.

## Relações

- Decisões abertas: `P-002`, `P-004`, `P-005` em `../open-decisions.md`.
- Depende de `backend-supabase`; consumida por `portal-cliente` e `portal-admin`.
