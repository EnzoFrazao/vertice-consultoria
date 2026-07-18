# Estado do projeto

## Visão atual

Monorepo npm da Vértice Consultoria com frontend React + Vite + TypeScript + Tailwind e um espaço documental para o backend. Landing, login, Dossiê Vivo do cliente e Mesa de Operações administrativa seguem demonstrativos, agora separados por páginas, domínio, infraestrutura local e módulos compartilhados.

## Pendências

- [ ] Conectar o repositório ao Netlify, validar a prévia e testar refresh direto nas rotas protegidas no domínio publicado.
- [ ] Trocar o WhatsApp placeholder (`5500000000000`) pelo número real.
- [ ] Definir os destinos operacionais dos CTAs quando houver atendimento/backend reais.
- [ ] Substituir autenticação, uploads e persistência demonstrativos por integrações reais, caso o protótipo avance para produção.
- [ ] Repetir o smoke visual manual da área administrativa em 375, 768 e 1440 px; a reconexão ao localhost foi bloqueada pelo navegador interno nesta sessão.

## Decisões importantes

- A interface usa a metáfora “Fólio Vivo”: dossiê contínuo do imóvel para o cliente e pauta conectada ao fólio para o administrador, evitando dashboards genéricos de cards e KPIs.
- A marca oficial é “Vértice Consultoria”; a logo fornecida é usada como imagem sem reinterpretar seu desenho ou lettering.
- Os sete estados persistidos são apresentados em cinco macrofases; `Aguardando cliente` é uma condição sobre a fase atual.
- Não são inventados prazo, percentual, responsável, fotografia, mapa, coordenadas ou prioridade sem suporte no modelo de dados.
- A aplicação continua frontend-only nesta etapa, com dados locais de demonstração e sem assinatura digital ou upload real.
- O Netlify usa fallback SPA via `public/_redirects`, copiado pelo build como `dist/_redirects`.
- O domínio não conhece React ou navegador; páginas acessam persistência somente pela fachada `features/portal-data`, com fronteiras verificadas pelo ESLint.
- IA, banco, segredos e serviços externos pertencerão ao backend; `packages/contracts` só deve surgir com o primeiro endpoint real.
- Login, cliente e administração usam chunks lazy separados; a landing permanece no carregamento inicial.

## Última sessão (2026-07-18, Codex)

- Convertido o projeto para workspace `frontend`, com backend documental e arquitetura híbrida por páginas, domínio, infraestrutura demo e compartilhados.
- Extraídas regras puras e persistência validada, decompostas landing/portais/administração e separados os chunks de login, cliente e admin; o JavaScript inicial ficou abaixo do baseline.
- Adicionados ESLint/Prettier/typecheck de testes, CI, Netlify e documentação; `npm run check` (168/168 testes) e `npm audit` passaram localmente, e os checks do PR [#1](https://github.com/EnzoFrazao/vertice_consultoria/pull/1) ficaram verdes.
