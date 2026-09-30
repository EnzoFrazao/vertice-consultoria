---
id: landing-catalogo
contract_status: confirmed
implementation_status: implemented
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Landing pública e catálogo de serviços

## Finalidade e limites

Apresentar a Vértice Consultoria ao público e permitir escolher um serviço antes de entrar. Não faz atendimento real: CTAs e WhatsApp são valores provisórios (P-002).

## Atores, permissões, entradas e resultados

Visitante anônimo navega por hero, serviços, "como funciona" e rodapé; ao escolher um serviço, ele é guardado em `sessionStorage["rv.demo.pending-service"]` e segue para o login/nova solicitação.

## Contrato comportamental e critérios de aceite

- O catálogo tem 9 serviços em 5 categorias (orientação geral, regularização de registro, posse e sucessão, terrenos, avaliação), definidos em `domain/catalog.ts`.
- Explorador por categoria (índice + serviço em foco; acordeões no mobile), uma ação principal por serviço.
- Marca "Vértice Consultoria" exibida com o PNG fornecido, sem redesenho.
- Hero inativo fica `inert` e `aria-hidden` até ser revelado.

## Invariantes e regras de negócio

- O catálogo do frontend e o seed do banco listam os mesmos 9 serviços.
- A marca nunca é redesenhada.

## Estado atual e lacunas

Implementado. Número de WhatsApp é `5500000000000` e destinos dos CTAs não estão definidos. O catálogo do banco (`seed_service_catalog`) foi alinhado ao do frontend, mas não é consumido por ele.

## Evidências de implementação e teste

- Implementação: `frontend/src/pages/landing/`, `frontend/src/domain/catalog.ts`.
- Testes: `frontend/src/pages/landing/*.test.tsx`, `frontend/src/domain/catalog.test.ts`.
- Origem: `docs/superpowers/specs/2026-07-11-folio-vivo-portais-design.md`.

## Relações

- Decisão aberta: `P-002` em `../open-decisions.md`.
