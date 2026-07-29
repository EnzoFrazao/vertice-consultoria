# Vértice Consultoria

Landing page e portais demonstrativos para uma consultoria imobiliária. O projeto apresenta os serviços ao público e simula jornadas separadas para clientes e administradores, com processos, documentos, notificações e acompanhamento de status.

O frontend ainda opera em modo demonstrativo, mas o repositório já contém a fundação de uma API Laravel. A integração entre os dois lados ainda não foi iniciada.

## Arquitetura

O repositório usa npm workspaces e mantém um único lockfile na raiz.

```text
.
├── config/                     # ESLint e Prettier compartilhados
├── frontend/
│   ├── src/
│   │   ├── app/                  # composição, rotas e guards
│   │   ├── pages/                # landing, login, cliente e administração
│   │   ├── features/             # autenticação demo e fachada portal-data
│   │   ├── domain/               # tipos, catálogo, regras e selectors puros
│   │   ├── infrastructure/demo/  # seed, validação e persistência local
│   │   ├── shared/               # UI, configurações e utilitários compartilhados
│   │   └── test/
│   ├── public/
│   └── package.json
├── backend/                    # API Laravel, autenticação e filas
├── docs/
├── .github/workflows/
├── netlify.toml
├── package.json
└── package-lock.json
```

As dependências entre camadas seguem estas regras:

- `domain` não depende de React, navegador, armazenamento ou outras camadas;
- `infrastructure/demo` depende apenas do domínio e de seus próprios módulos;
- páginas acessam dados e persistência pela fachada `features/portal-data`, nunca diretamente pela infraestrutura;
- `shared` não depende de `app`, `pages`, `features` ou `infrastructure`;
- componentes exclusivos de uma jornada permanecem próximos da página; `shared/ui` abriga somente elementos compartilhados;
- banco, segredos, serviços externos e futuros recursos de IA pertencem ao backend.

O ESLint verifica essas fronteiras, incluindo imports relativos, e o alias `@/` aponta para `frontend/src`.

## Requisitos e instalação

- Node.js 22, também registrado em `.nvmrc`;
- npm compatível com o Node 22.
- PHP 8.4 e Composer 2 para o backend.

Na raiz do repositório:

```bash
nvm use
npm ci
npm run dev
```

O Vite inicia por padrão em `http://127.0.0.1:5173`.

## Comandos da raiz

| Comando                | Finalidade                                                 |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Inicia o frontend em desenvolvimento.                      |
| `npm test`             | Executa a suíte Vitest.                                    |
| `npm run lint`         | Executa ESLint com zero warnings permitidos.               |
| `npm run format`       | Formata arquivos suportados com Prettier.                  |
| `npm run format:check` | Verifica formatação sem alterar arquivos.                  |
| `npm run typecheck`    | Valida tipos da aplicação, configurações e testes.         |
| `npm run build`        | Gera `frontend/dist` e verifica a divisão dos bundles.     |
| `npm run check`        | Executa lint, formato, tipos, testes e build em sequência. |

Os scripts npm da raiz são a interface canônica para ESLint e Prettier. O `.vscode/settings.json` direciona as extensões para os arquivos em `config/`; invocações diretas dos binários devem passar os mesmos caminhos com `--config` e, no Prettier, os dois `--ignore-path` usados pelos scripts.

Antes de enviar uma alteração, execute:

```bash
npm run check
```

## Rotas

| Rota                        | Área                                |
| --------------------------- | ----------------------------------- |
| `/`                         | Landing pública.                    |
| `/login`                    | Entrada nas contas demonstrativas.  |
| `/cliente`                  | Início do portal do cliente.        |
| `/cliente/processos`        | Lista de processos do cliente.      |
| `/cliente/processos/:id`    | Detalhe de um processo do cliente.  |
| `/cliente/nova-solicitacao` | Fluxo de nova solicitação.          |
| `/cliente/perfil`           | Perfil demonstrativo do cliente.    |
| `/admin`                    | Início do portal administrativo.    |
| `/admin/processos`          | Lista de processos administrativos. |
| `/admin/processos/:id`      | Detalhe e despacho de um processo.  |
| `/admin/documentos`         | Fila de análise documental.         |
| `/admin/clientes`           | Lista de clientes demonstrativos.   |

Login, cliente e administração são carregados sob demanda. As rotas protegidas redirecionam sessões ausentes ou de outro perfil.

## Contas demonstrativas

| Perfil        | E-mail             | Senha        |
| ------------- | ------------------ | ------------ |
| Cliente       | `cliente@demo.com` | `cliente123` |
| Administrador | `admin@demo.com`   | `admin123`   |

As credenciais existem apenas no bundle do frontend e não oferecem segurança real. Todos os nomes, documentos, protocolos e arquivos exibidos são fictícios.

## Persistência demonstrativa

O repositório local salva dados no navegador e preserva o formato existente:

- `localStorage["rv.demo.state.v1"]`: estado completo da demonstração;
- `localStorage["rv.demo.session.v1"]`: sessão demonstrativa atual;
- `sessionStorage["rv.demo.pending-service"]`: serviço escolhido na landing antes do login.

O estado persistido passa por validação profunda. Dados ausentes ou incompatíveis são substituídos pelo seed seguro, e indisponibilidade do armazenamento usa fallback em memória com aviso na interface. A tela de login também permite restaurar a demonstração.

## CI e deploy

O GitHub Actions executa `npm ci` e `npm run check` com Node 22 em todos os pushes e pull requests.

O deploy contínuo ocorre quando o código-fonte é enviado à branch de produção: o Netlify instala as dependências e executa o build a partir da raiz, depois publica `frontend/dist`. Esse diretório é um artefato gerado e não deve ser versionado. O arquivo `frontend/public/_redirects` é copiado pelo Vite para o build e mantém o fallback da SPA ao atualizar diretamente qualquer rota.

Para um deploy manual, com o Netlify CLI instalado, autenticado e o site vinculado, execute a instalação, o build e a validação antes de enviar o artefato:

```bash
npm ci
npm run check
netlify deploy --dir frontend/dist
```

A publicação manual em produção requer autorização explícita separada, como o uso deliberado da opção `--prod`; os comandos acima não publicam em produção.

Para validar uma compilação localmente:

```bash
npm ci
npm run build
npm run preview --workspace @vertice/frontend
```

## Backend

O diretório [`backend/`](backend/) contém a API Laravel. A configuração inicial usa SQLite, UUID para usuários, Laravel Sanctum para autenticação de API, Policies e tabelas de filas. O Horizon está instalado, mas requer Redis antes de ser executado. Consulte [`docs/backend.md`](docs/backend.md) para os comandos e limites desta etapa.

Quando surgir o primeiro endpoint de domínio, a implementação deve substituir gradualmente o repositório demo por um adaptador HTTP sem fazer as páginas dependerem de detalhes de transporte. Um pacote compartilhado de contratos só deve ser criado quando houver um contrato efetivamente consumido por frontend e backend.
