# Estado do projeto

## Visão atual

Monorepo npm da Vértice Consultoria com frontend React + Vite + TypeScript + Tailwind e um espaço documental para o backend. Landing, login, Dossiê Vivo do cliente e Mesa de Operações administrativa seguem demonstrativos, agora separados por páginas, domínio, infraestrutura local e módulos compartilhados.

## Pendências

- [ ] Conectar o repositório ao Netlify, validar a prévia e testar refresh direto nas rotas protegidas no domínio publicado.
- [ ] Trocar o WhatsApp placeholder (`5500000000000`) pelo número real.
- [ ] Definir os destinos operacionais dos CTAs quando houver atendimento/backend reais.
- [ ] Implementar a migração do restante do portal para os dados reais do Supabase, removendo o mock data (conforme demo-removal-map.md).

## Decisões importantes

- A interface usa a metáfora “Fólio Vivo”: dossiê contínuo do imóvel para o cliente e pauta conectada ao fólio para o administrador, evitando dashboards genéricos de cards e KPIs.
- A marca oficial é “Vértice Consultoria”; a logo fornecida é usada como imagem sem reinterpretar seu desenho ou lettering.
- O Netlify usa fallback SPA via `public/_redirects`, copiado pelo build como `dist/_redirects`.
- O domínio não conhece React ou navegador; páginas acessam persistência somente pela fachada `features/portal-data`, com fronteiras verificadas pelo ESLint.
- **Notificações em Tempo Real (Thin Slice)**: O sino de notificações na UI do portal foi implementado usando uma abordagem "Híbrida", que lê do repositório local e, se houver sessão do Supabase ativa, sincroniza e mescla via Supabase Realtime a tabela `public.notifications`. O restante da tela continua usando os dados de demonstração.
- **Database Outbox (Emails)**: As entregas de email são registradas em `notification_deliveries` dentro da mesma transação da notificação. Um trigger e o Vault disparam de forma segura, via `pg_net` (Database Webhook), a Edge Function `dispatch-notifications`, que consome os emails em lote usando `FOR UPDATE SKIP LOCKED` (via RPC) para garantir concorrência segura.
- Devido à falta de Docker no ambiente de desenvolvimento do usuário, as migrations e deploy da edge function são aplicadas diretamente no remote `npx supabase db push` e `npx supabase functions deploy --use-api`.

## Última sessão (2026-10-05, Antigravity)

- Implementada uma fatia fina de ponta a ponta (Thin Slice) do sistema de notificações (Sino UI + Email Outbox).
- O backend de e-mails foi estruturado com o padrão de outbox (`notification_deliveries`), um trigger utilizando `pg_net` em conjunto com o Vault para chamar de forma segura a Edge Function de despacho (`dispatch-notifications` em Deno). A função integra a API do Resend.
- Resolvidos os problemas de concorrência com o uso da RPC `claim_notification_deliveries` utilizando cursores `FOR UPDATE SKIP LOCKED` e cabeçalhos de `Idempotency-Key` no provedor.
- O hook `useRemoteNotifications` foi conectado de modo seguro (híbrido) ao Portal (Client e Admin), respeitando o RLS. O linting (`npm run typecheck` e `npm run lint`) passou e nenhuma quebra de tipagem ocorreu na UI.
