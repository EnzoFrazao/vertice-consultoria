# Fólio Vivo — design dos portais Vértice Consultoria

## Objetivo

Substituir os dashboards genéricos de cliente e administrador por uma experiência própria do domínio imobiliário: cada processo será tratado como um fólio digital do imóvel, com próxima ação, marcos, documentos e histórico. A identidade Vértice Consultoria será aplicada sem alterar o desenho da marca e sem introduzir dados fictícios que o modelo atual não possui.

## Princípios aprovados

- O imóvel e o processo são os objetos principais; métricas de conta são secundárias.
- A próxima decisão ou ação deve dominar cada tela.
- Evitar mosaico de cards, sidebar SaaS com pill branca, kanban genérico, mapas falsos, 3D e glassmorphism excessivo.
- Manter a identidade premium atual: marfim, espresso, bronze, teal profundo, tipografia editorial nos títulos e sans-serif na operação.
- Reaproveitar o repositório demo, autenticação, rotas, notificações, ações documentais, histórico e WhatsApp contextual.
- Não criar prazo, percentual real, responsável, prioridade, fotografia do imóvel ou coordenadas quando esses dados não existirem.

## Marca Vértice

- Usar o símbolo e os textos “VÉRTICE CONSULTORIA” exatamente como fornecidos.
- Preparar uma versão PNG com fundo transparente, preservando proporção, cores, desenho e texto.
- Exibir a marca completa em login, landing e rodapé; usar uma variação compacta do mesmo arquivo por recorte CSS apenas onde a largura não comportar o conjunto.
- O fundo será responsabilidade do layout: `ivory` em superfícies claras e `espresso` em superfícies escuras. Não embutir retângulo branco no asset.
- Não redesenhar, reinterpretar ou vetorizar automaticamente a marca nesta fase.

## Linguagem visual — Fólio Vivo

### Cores

- `paper`: `#FFF9EF`
- `field`: mist atual
- `ink`: `#20130D`
- `body`: `#3A2419`
- `seal`: bronze atual, apenas ornamental ou sobre fundo escuro
- `action`: `#0F766E`, substituindo o teal claro em texto e botões
- `selection`: champagne atual

Textos normais devem atingir contraste 4,5:1; limites de campos e controles, 3:1. Opacidades abaixo disso serão substituídas por tokens explícitos.

### Forma e movimento

- Folhas editoriais com borda fina, pouca sombra e assimetria discreta; controles com raio de 8–10 px.
- Status como marca de registro: ícone, rótulo e régua lateral; cor nunca será o único indicador.
- Linhas cadastrais abstratas podem aparecer como detalhe em SVG/CSS, sem simular mapa real.
- Animações de entrada e troca entre 180–300 ms, apenas com `opacity` e `transform`.
- `prefers-reduced-motion` remove transições não essenciais.

## Estrutura compartilhada

- Desktop: índice vertical estreito, com destinos numerados e estado ativo indicado por régua, não por card branco.
- Mobile: cabeçalho compacto e navegação inferior plana com até quatro destinos, respeitando `safe-area`.
- Cabeçalho contextual mostra seção e, quando houver, processo ou imóvel em foco.
- O componente conceitual `CaseFolio` organiza protocolo, serviço, imóvel, fase, próxima ação, documentos, histórico e um slot operacional por perfil.
- Os sete estados persistidos continuam inalterados, mas a leitura visual usa cinco macrofases:
  1. Entrada;
  2. Documentação;
  3. Análise técnica;
  4. Órgãos;
  5. Conclusão.
- “Aguardando cliente” aparece como condição de atenção sobre a fase atual, não como uma fase adicional.

## Portal do cliente — Dossiê Vivo do Imóvel

### Início e processos

- Selecionar por padrão o processo mais recentemente atualizado que tenha ação do cliente; na ausência de ação, selecionar o mais recente.
- Abrir com tipo, endereço, objetivo, serviço, protocolo e fase atual.
- Substituir os três KPIs por uma faixa-resumo discreta.
- Exibir uma única área “Agora” com a primeira ação disponível e, quando necessário, o texto “mais N ações”.
- Oferecer um índice estreito dos processos, sem agrupá-los por imóvel enquanto o modelo não possuir relacionamento confiável para isso.

### Detalhe

- Organizar o conteúdo como página contínua: capa, macrofases, próxima ação, documentos e diário do processo.
- Documentos são linhas editoriais com obrigatoriedade, estado, versão, motivo de rejeição e ação.
- A interação assinatura conecta ação e destino: selecionar uma pendência rola até o documento, abre seus detalhes e move o foco ao título.
- Após envio ou reenvio, atualizar “Agora” e anunciar o resultado em `aria-live` sem perder o contexto.

### Mobile e estados

- “Agora” aparece antes do andamento; documentos usam acordeões; histórico fica recolhido.
- CTA inferior fixo apenas quando existir ação e com espaço reservado no conteúdo.
- Sem processos: “Este espaço começa com o seu imóvel” e CTA para nova solicitação.
- Sem pendências: informar que nada depende do cliente, sem coluna vazia.
- Concluído: fólio somente leitura, preservando documentos e histórico.
- Erros aparecem junto ao documento ou campo responsável, sem limpar dados preenchidos.

## Portal administrativo — Mesa de Operações

### Início

- Substituir quatro filas em cards e quatro KPIs por uma composição master-detail.
- A “Pauta” agrupa linhas compactas por “Decidir agora”, “Depende do cliente” e “Em andamento”. A ordenação usa apenas tipo de ação e `updatedAt`, sem chamar isso de urgência ou SLA.
- O “Pulso operacional” é uma faixa compacta de números, não uma grade de cards.
- Selecionar uma linha abre o dossiê no centro e as ações válidas no despacho contextual à direita.

### Operação

- Documentos usam tabela editorial no desktop e lista no mobile, mostrando metadados reais: documento, versão, tamanho, processo, cliente, estado e atualização.
- O despacho contextual oferece somente ações válidas: iniciar análise, aprovar, rejeitar com motivo, alterar status, concluir ou contatar cliente.
- A interação assinatura “Despachar e seguir” mantém o contexto e oferece o próximo documento ou próximo item da pauta após uma decisão.
- Mudança de status usa uma régua “estado atual → novo estado”; conclusão permanece uma confirmação separada.
- WhatsApp permanece secundário enquanto o telefone global estiver como placeholder.

### Mobile

- Pauta na primeira tela; dossiê abre em tela cheia.
- Voltar preserva filtro e posição da pauta.
- Cabeçalho sticky mostra protocolo e estado; ação principal fica na barra inferior.
- Rejeição, mudança de status e conclusão usam dialogs ou bottom sheets com foco inicial, Escape, trap e restauração.

## Landing, catálogo e login

- O catálogo público possui nove serviços. Transformá-lo em explorador por categorias: índice à esquerda e serviço em foco à direita; mobile em acordeões.
- Remover as células vazias causadas pelo grid atual e manter uma única ação principal por serviço.
- Aplicar a marca Vértice completa ao hero/login/rodapé, preservando legibilidade sobre fundo claro ou escuro.
- Corrigir o hero invisível para ficar `inert` e `aria-hidden` até ser revelado.

## Correções estruturais e deploy

- Corrigir o breakpoint que corta filtros entre 1024 e 1119 px.
- Remover esticamento involuntário de grids e padronizar alinhamento de header/main.
- Trocar navegação interna por `Link`/`NavLink` e implementar rolagem/foco por mudança de rota.
- Corrigir o diálogo de conclusão e o foco após ações que removem o botão acionado.
- Corrigir os três erros TypeScript de `currentUser` e a asserção ambígua do teste do cliente.
- Adicionar `public/_redirects` com `/* /index.html 200`, gerar uma nova `dist` e republicá-la no Netlify.

## Critérios de aceite

- Cliente e admin não apresentam parede de cards ou sidebar SaaS com pill ativa.
- Sempre existe uma ação dominante ou uma mensagem explícita de que nada depende do usuário.
- Nenhum conteúdo é cortado em 320, 375, 390, 768, 1024, 1280, 1440 e 1920 px.
- Navegação, troca de processo, documentos, dialogs e notificações funcionam por teclado e leitor de tela.
- Contraste AA, alvos mínimos de 44 px e redução de movimento são verificados.
- `npm test` e `npm run build` terminam com código 0.
- A nova `dist` contém a marca e as rotas de login, cliente e administrador.
- Refresh direto nas rotas públicas e protegidas retorna a aplicação, não 404 do Netlify.

## Fora de escopo

- Backend, armazenamento real de arquivos, assinatura digital, mapa, geocodificação, IA, chat interno, prazos/SLA e novos dados de domínio.
- Alteração do desenho ou do nome da marca fornecida.
