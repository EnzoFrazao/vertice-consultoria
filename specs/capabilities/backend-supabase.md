---
id: backend-supabase
contract_status: confirmed
implementation_status: partial
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Backend Supabase

## Finalidade e limites

Persistência, identidade, autorização (RLS), armazenamento privado e auditoria definitivos. IA e integrações externas devem ser mediadas pelo backend, nunca pelo frontend. Contratos compartilhados (`packages/contracts`) só surgem com o primeiro endpoint real.

## Atores, permissões, entradas e resultados

Ver contrato abaixo; atores: cliente, administrador e sistema conforme o caso.

## Contrato comportamental e critérios de aceite

- Frontend nunca acessa banco com chaves privadas nem SDKs administrativos.
- Autorização efetiva por RLS; papéis `client` e `admin` em `public.roles`.
- Documentos em bucket privado, com `malware_scan_status` (`pending`, `clean`, `infected`, `failed`) por versão.
- A forma persistida do modo demo não é contrato de API.

## Invariantes e regras de negócio

- Toda tabela em `public` tem RLS ativa.
- Documentos nunca ficam em bucket público.

## Estado atual e lacunas

- Implementado (schema): 8 migrations em `supabase/migrations/` cobrindo identidade e papéis, domínio de consultoria (serviços, imóveis, processos), documentos e mensagens, histórico/auditoria/notificações, storage privado, otimização de FKs/RLS e seed do catálogo alinhado ao frontend.
- Não implementado: integração do frontend, varredura de malware, entrega de notificações, testes de RLS.
- `docs/backend.md` não documenta como executar localmente; README cita Laravel (P-001).

## Evidências de implementação e teste

- Implementação: `supabase/migrations/*.sql`, `supabase/config.toml`.
- Teste reproduzível: nenhum ainda.

## Relações

- Decisão aberta: `P-001`, `P-003`. Consumido por `acesso`, `portal-cliente`, `portal-admin`.
