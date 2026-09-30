# Decisões abertas

## P-001 — Backend: Supabase ou API Laravel

- **Problema:** `README.md` cita `backend/` Laravel (PHP 8.4, filas); `docs/backend.md`, as migrations e o design de Auth adotam Supabase como backend principal. A pasta `backend/` não existe.
- **Pergunta:** o Laravel foi abandonado? O README deve passar a citar apenas Supabase?
- **Responsável esperado:** responsável técnico do projeto.
- **Impacto:** requisitos de ambiente (PHP/Composer) e arquitetura de integração.
- **Regra provisória:** tratar Supabase como fonte única; não criar `backend/`.
- **Capability:** `backend-supabase`.

## P-002 — Operação real

- **Problema:** WhatsApp usa o valor provisório `5500000000000`; CTAs sem destino operacional; deploy Netlify não validado.
- **Pergunta:** qual o número real, os destinos dos CTAs e o domínio de produção?
- **Regra provisória:** manter valores provisórios e WhatsApp secundário.
- **Capability:** `landing-catalogo`.

## P-003 — Segurança pós-MVP

- **Problema:** MFA/TOTP para administradores, CAPTCHA, SMTP próprio e antivírus/varredura de uploads foram adiados no design de 2026-07-29.
- **Pergunta:** prioridade e provedores.
- **Regra provisória:** arquitetura compatível; nada implementado.
- **Capability:** `acesso`, `backend-supabase`.

## P-004 — Mecanismo das automações

- **Problema:** não há definição de quem envia notificações externas e executa tarefas assíncronas; a migration de identidade só cita uma Edge Function futura.
- **Pergunta:** Edge Functions do Supabase, n8n ou outro serviço? Qual provedor de e-mail e de WhatsApp?
- **Responsável esperado:** responsável técnico e dono do produto.
- **Impacto:** bloqueia entrega externa, lembretes e varredura de uploads.
- **Regra provisória:** manter notificações apenas internas; não criar integrações.
- **Capability:** `notificacoes-automacoes`.

## P-005 — Escopo das automações e IA

- **Problema:** não foi decidido quais automações entram (lembretes, IA sobre documentos, assinatura digital, chat) nem em que ordem.
- **Pergunta:** quais funcionalidades planejadas em `notificacoes-automacoes` entram no primeiro corte de produção?
- **Regra provisória:** só a ordem sugerida na capability; nada implementado.
- **Capability:** `notificacoes-automacoes`.
