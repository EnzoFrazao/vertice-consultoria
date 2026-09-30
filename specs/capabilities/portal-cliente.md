---
id: portal-cliente
contract_status: confirmed
implementation_status: partial
last_verified: 2026-09-30
last_verified_ref: working-tree
---

# Portal do cliente (Dossiê Vivo do Imóvel)

## Finalidade e limites

O cliente acompanha seus processos, envia documentos e cria novas solicitações. Dados são demonstrativos (localStorage); sem upload real nem assinatura digital.

## Atores, permissões, entradas e resultados

Cliente autenticado: `/cliente`, `/cliente/processos`, `/cliente/processos/:id`, `/cliente/nova-solicitacao`, `/cliente/perfil`.

## Contrato comportamental e critérios de aceite

- Cada processo é um "fólio": protocolo, serviço, imóvel, fase, próxima ação, documentos e histórico.
- A área "Agora" mostra a primeira ação do cliente (e "mais N ações"); sem ação, informa que nada depende do cliente.
- Os 7 estados (`Novo`, `Documentos pendentes`, `Documentos em análise`, `Análise técnica`, `Prefeitura/cartório`, `Aguardando cliente`, `Concluído`) aparecem em 5 macrofases (Entrada, Documentação, Análise técnica, Órgãos, Conclusão); "Aguardando cliente" é condição sobre a fase atual.
- Documentos: estados `Pendente`, `Enviado`, `Em análise`, `Aprovado`, `Rejeitado`, com versão e motivo de rejeição; envio/reenvio atualiza "Agora" e anuncia em `aria-live`.
- Processo concluído é somente leitura.
- Não inventar prazo, percentual, responsável, prioridade, foto ou coordenadas.
- Acessibilidade: teclado, contraste AA, alvos de 44 px, `prefers-reduced-motion`.

## Invariantes e regras de negócio

- Nenhum dado sem suporte no modelo é exibido (prazo, percentual, responsável).
- Processo concluído não aceita alterações.

## Estado atual e lacunas

Implementado sobre o repositório demo. Não conectado ao Supabase. Smoke visual em 320–1920 px não repetido nesta sessão.

## Evidências de implementação e teste

- Implementação: `frontend/src/pages/client/`.
- Testes: `frontend/src/pages/client/ClientPortal.test.tsx`; domínio em `frontend/src/domain/`.
- Origem: `docs/superpowers/specs/2026-07-11-folio-vivo-portais-design.md`.

## Relações

- Depende de `acesso`; persistência futura em `backend-supabase`.
