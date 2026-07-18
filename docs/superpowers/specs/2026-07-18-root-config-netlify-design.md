# Organização das configurações da raiz e fluxo Netlify

## Contexto

O workspace npm precisa manter na raiz os arquivos que coordenam o repositório, mas as
configurações compartilhadas de qualidade podem ocupar uma pasta dedicada. A mudança deve
reduzir o ruído visual sem quebrar a descoberta das ferramentas nem versionar artefatos de
build.

## Objetivos

- criar `config/` com uma responsabilidade concreta: configurações compartilhadas de ESLint e
  Prettier;
- preservar na raiz os arquivos exigidos ou naturalmente descobertos por Git, npm, Node e
  Netlify;
- ignorar metadados locais do Netlify, logs, caches e arquivos de sistema ou IDE;
- manter `frontend/dist` como artefato reproduzível e não versionado;
- preservar o comportamento de lint, formatação, testes, build e deploy.

Não fazem parte desta mudança a publicação no Netlify, a alteração do site remoto ou a mudança
da arquitetura interna do frontend.

## Estrutura

```text
.
├── config/
│   ├── eslint.config.mjs
│   ├── prettier.json
│   └── prettierignore
├── frontend/
├── netlify.toml
├── package.json
├── package-lock.json
├── .gitignore
├── .gitattributes
└── .nvmrc
```

`eslint.config.mjs`, `.prettierrc.json` e `.prettierignore` serão movidos para `config/`.
Os scripts da raiz passarão os caminhos explicitamente, evitando depender de descoberta
automática. `netlify.toml` continuará na raiz porque descreve o build do repositório e é
descoberto pelo Netlify nesse local.

## Ignorados

O `.gitignore` receberá padrões para `.netlify/`, logs dos gerenciadores JavaScript,
`.eslintcache`, `.idea/`, `.DS_Store` e `Thumbs.db`. A configuração compartilhada existente em
`.vscode/settings.json` continuará versionada.

## Fluxo do Netlify

No deploy contínuo, o Netlify acompanha a branch de produção no GitHub, instala dependências na
raiz, executa `npm run build` e publica somente `frontend/dist`, conforme `netlify.toml`. O
diretório `dist` não será enviado ao Git: cada deploy deve recriá-lo a partir do código-fonte e
do lockfile.

Em um deploy manual, a sequência segura é instalar dependências, executar o build, validar o
resultado e então enviar `frontend/dist` com o Netlify CLI. A publicação manual ou em produção
exige autorização separada e um site localmente vinculado.

## Compatibilidade e validação

- `npm run lint`, `npm run format`, `npm run format:check` e `npm run check` continuarão sendo
  executados pela raiz;
- os padrões de arquivos do ESLint continuarão relativos à raiz do repositório;
- o build deverá manter `frontend/dist/_redirects` para refresh direto das rotas SPA;
- `npm run check` será executado depois dos movimentos;
- o diff final deve conter apenas a organização aprovada, o `.gitignore`, os scripts e o handoff.

Se uma ferramenta interpretar os caminhos em relação a `config/`, seus padrões serão ajustados
explicitamente e o check completo será repetido antes da entrega.
