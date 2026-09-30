---
id: portal-admin
contract_status: confirmed
implementation_status: partial
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Portal administrativo (Mesa de Operações)

## Finalidade e limites

O administrador decide sobre processos e documentos. Dados demonstrativos; sem backend.

## Atores, permissões, entradas e resultados

Administrador: `/admin`, `/admin/processos`, `/admin/processos/:id`, `/admin/documentos`, `/admin/clientes`.

## Contrato comportamental e critérios de aceite

- Início em master-detail: a "Pauta" agrupa "Decidir agora", "Depende do cliente" e "Em andamento", ordenada só por tipo de ação e `updatedAt` (sem SLA ou urgência).
- Despacho contextual só oferece ações válidas: iniciar análise, aprovar, rejeitar com motivo, alterar status, concluir, contatar cliente.
- "Despachar e seguir": após decidir, oferece o próximo documento ou item da pauta.
- Mudança de status mostra "estado atual → novo estado"; conclusão é confirmação separada.
- Diálogos (rejeição, status, conclusão) com foco inicial, Escape, trap e restauração de foco.
- Fila de documentos mostra apenas metadados reais (documento, versão, tamanho, processo, cliente, estado, atualização).
- WhatsApp permanece secundário enquanto o telefone for valor provisório.

## Invariantes e regras de negócio

- Só ações válidas para o estado atual são oferecidas.
- Nenhum dado sem suporte no modelo é exibido (prazo, prioridade, responsável).

## Estado atual e lacunas

Implementado sobre o repositório demo. Smoke visual manual em 375, 768 e 1440 px pendente (`docs/state.md`).

## Evidências de implementação e teste

- Implementação: `frontend/src/pages/admin/`.
- Testes: `frontend/src/pages/admin/AdminPortal.test.tsx`.
- Origem: `docs/superpowers/specs/2026-07-11-folio-vivo-portais-design.md`.

## Relações

- Depende de `acesso`; persistência futura em `backend-supabase`. Decisão aberta: `P-002`.
