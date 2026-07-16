# Estado do projeto

## Visão atual
Frontend React + Vite + TypeScript + Tailwind com landing, login e portais demonstrativos da Vértice Consultoria. O redesign “Fólio Vivo” está implementado: Dossiê Vivo para o cliente e Mesa de Operações para o administrador.

## Pendências
- [ ] Publicar o conteúdo atualizado de `dist/` no Netlify e validar as rotas no domínio real.
- [ ] Trocar o WhatsApp placeholder (`5500000000000`) pelo número real.
- [ ] Definir os destinos operacionais dos CTAs quando houver atendimento/backend reais.
- [ ] Substituir autenticação, uploads e persistência demonstrativos por integrações reais, caso o protótipo avance para produção.
- [ ] Revisar vulnerabilidades transitivas indicadas por `npm audit` antes de uma produção real.

## Decisões importantes
- A interface usa a metáfora “Fólio Vivo”: dossiê contínuo do imóvel para o cliente e pauta conectada ao fólio para o administrador, evitando dashboards genéricos de cards e KPIs.
- A marca oficial é “Vértice Consultoria”; a logo fornecida é usada como imagem sem reinterpretar seu desenho ou lettering.
- Os sete estados persistidos são apresentados em cinco macrofases; `Aguardando cliente` é uma condição sobre a fase atual.
- Não são inventados prazo, percentual, responsável, fotografia, mapa, coordenadas ou prioridade sem suporte no modelo de dados.
- A aplicação continua frontend-only nesta etapa, com dados locais de demonstração e sem assinatura digital ou upload real.
- O Netlify usa fallback SPA via `public/_redirects`, copiado pelo build como `dist/_redirects`.

## Última sessão (2026-07-12, Codex)
- Implementados o Dossiê Vivo, a Mesa de Operações, os índices editoriais, os fluxos mobile acessíveis e a correção dos espaços/cortes responsivos entre 375 e 1600 px.
- Integradas a logo Vértice, a nova experiência de login e o catálogo interativo com 5 categorias e 9 serviços; corrigidos ciclo de rotas, foco, contraste e fallback do Netlify.
- Verificação final aprovada: 15 arquivos de teste, 111/111 testes e build de produção concluído; `dist/` contém a marca e `/* /index.html 200`.
- Fechada a auditoria AA da área pública: navegação interna sem reload, contraste de campos/textos aprovado, seleção não dependente apenas de cor e cobertura mobile/reduced-motion; código legado do wizard removido.
