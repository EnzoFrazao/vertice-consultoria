# Root Config and Netlify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organizar as configurações compartilhadas em `config/`, ampliar os ignorados locais e comprovar que o Netlify continua construindo pela raiz e publicando apenas `frontend/dist`.

**Architecture:** A raiz continuará responsável pela orquestração do workspace npm e pelo deploy. ESLint e Prettier serão chamados com caminhos explícitos para arquivos em `config/`; Git, npm, Node e Netlify manterão seus arquivos convencionais na raiz. O artefato `frontend/dist` continuará reproduzível, ignorado e validado pelo build.

O Prettier receberá `.gitignore` e `config/prettierignore` como ignore paths explícitos, preservando tanto os ignorados locais do repositório quanto os padrões próprios da ferramenta.

**Tech Stack:** npm workspaces, ESLint flat config, Prettier, Vite, Vitest, TypeScript, Netlify e GitHub Actions.

---

### Task 1: Registrar o baseline das ferramentas

**Files:**

- Read: `package.json`
- Read: `eslint.config.mjs`
- Read: `.prettierrc.json`
- Read: `.prettierignore`
- Read: `netlify.toml`

- [ ] **Step 1: Confirmar que o worktree contém apenas os documentos aprovados**

Run:

```powershell
git status --short --branch
```

Expected: branch `chore/config-organization`, com no máximo este plano ainda não commitado.

- [ ] **Step 2: Executar o baseline das ferramentas que serão movidas**

Run:

```powershell
npm run lint
npm run format:check
```

Expected: ambos terminam com código 0; o Prettier informa que os arquivos verificados usam o estilo configurado.

### Task 2: Ampliar os ignorados locais

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Adicionar padrões locais sem ignorar código ou documentação**

Aplicar ao final de `.gitignore`:

```gitignore

# Local deployment metadata
.netlify/

# Logs and tool caches
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.eslintcache

# Local operating system and IDE files
.DS_Store
Thumbs.db
.idea/
```

- [ ] **Step 2: Verificar os padrões com probes que não criam arquivos**

Run:

```powershell
git check-ignore -v -- .netlify/state.json npm-debug.log Thumbs.db .idea/workspace.xml .eslintcache
```

Expected: cada probe corresponde a uma linha nova de `.gitignore`.

### Task 3: Criar `config/` e mover ESLint e Prettier

**Files:**

- Create: `config/eslint.config.mjs` from `eslint.config.mjs`, sem alterar conteúdo
- Create: `config/prettier.json` from `.prettierrc.json`
- Create: `config/prettierignore` from `.prettierignore`
- Delete: `eslint.config.mjs`
- Delete: `.prettierrc.json`
- Delete: `.prettierignore`
- Modify: `package.json`

- [ ] **Step 1: Mover os três arquivos com `apply_patch`**

Preservar integralmente o conteúdo de `eslint.config.mjs`. Criar `config/prettier.json` com:

```json
{
  "endOfLine": "lf",
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

Criar `config/prettierignore` com:

```text
**/node_modules
**/dist
**/coverage
**/.vite
**/.tmp
**/*.tsbuildinfo
.git
.agents
tmp
package-lock.json
*.ico
*.jpeg
*.jpg
*.png
*.svg
*.webp
```

Depois de criar os destinos, remover os três arquivos antigos no mesmo patch para que não existam configurações duplicadas.

- [ ] **Step 2: Apontar os scripts da raiz para os novos caminhos**

Substituir somente estes scripts em `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --config config/eslint.config.mjs --max-warnings 0",
    "format": "prettier . --config config/prettier.json --ignore-path .gitignore --ignore-path config/prettierignore --write",
    "format:check": "prettier . --config config/prettier.json --ignore-path .gitignore --ignore-path config/prettierignore --check"
  }
}
```

Os dois `--ignore-path` são necessários porque informar um ignore path explícito substitui a descoberta padrão do Prettier; `.gitignore` preserva os ignorados locais e `config/prettierignore` mantém os padrões específicos de formatação.

Manter todos os demais scripts e campos sem alteração.

- [ ] **Step 3: Verificar que não restaram configurações duplicadas**

Run:

```powershell
$oldFiles = @('eslint.config.mjs', '.prettierrc.json', '.prettierignore')
$oldFiles | ForEach-Object { "$_=$(Test-Path -LiteralPath $_)" }
Get-ChildItem -LiteralPath config -File | Select-Object -ExpandProperty Name
```

Expected: os três caminhos antigos retornam `False`; `config/` contém exatamente `eslint.config.mjs`, `prettier.json` e `prettierignore`.

- [ ] **Step 4: Executar os checks focados após o movimento**

Run:

```powershell
npm run lint
npm run format:check
```

Expected: ambos terminam com código 0 usando os caminhos explícitos de `config/`. Se os globs do ESLint forem interpretados em relação ao arquivo movido, prefixá-los com `../` apenas onde necessário e repetir os dois comandos.

- [ ] **Step 5: Commitar a organização mecânica**

Run:

```powershell
git add -- .gitignore config package.json eslint.config.mjs .prettierrc.json .prettierignore
git commit -m "chore: organize shared tooling config"
```

Expected: commit criado sem adicionar `dist`, `node_modules`, `.netlify` ou arquivos alheios.

### Task 4: Documentar a raiz e validar o fluxo do Netlify

**Files:**

- Modify: `README.md`
- Read: `netlify.toml`
- Read: `frontend/public/_redirects`
- Generated and ignored: `frontend/dist/`

- [ ] **Step 1: Atualizar a árvore do README**

Adicionar antes de `frontend/`:

```text
├── config/                     # ESLint e Prettier compartilhados
```

Não mover `netlify.toml`: ele deve continuar na raiz e manter:

```toml
[build]
  base = "."
  command = "npm run build"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "22"
```

- [ ] **Step 2: Executar o gate canônico completo**

Run:

```powershell
npm run check
```

Expected: lint, formato, typecheck de produção e testes, 168 testes Vitest, nove testes do bundle e build Vite passam; o orçamento do JavaScript inicial permanece abaixo do limite configurado.

- [ ] **Step 3: Validar o artefato que seria publicado**

Run:

```powershell
if (-not (Test-Path -LiteralPath 'frontend/dist/index.html')) { throw 'index.html ausente' }
if (-not (Test-Path -LiteralPath 'frontend/dist/_redirects')) { throw '_redirects ausente' }
Get-Content -Raw -Encoding utf8 frontend/dist/_redirects
git check-ignore -v -- frontend/dist/index.html
```

Expected: `_redirects` contém `/* /index.html 200`, e `frontend/dist/index.html` corresponde à regra `dist/` do `.gitignore`.

- [ ] **Step 4: Registrar a conclusão local sem declarar deploy remoto**

Documentar que o deploy contínuo correto é: push do código-fonte para a branch de produção, build `npm run build` na raiz e publicação de `frontend/dist`. Registrar também que deploy manual exige build local seguido de `netlify deploy --dir frontend/dist`, vínculo/autenticação do site e autorização explícita para produção.

### Task 5: Atualizar handoff e concluir a branch

**Files:**

- Modify: `docs/state.md`
- Modify: `docs/superpowers/plans/2026-07-18-root-config-netlify.md` somente para marcar checkboxes executados

- [ ] **Step 1: Atualizar `docs/state.md`**

Na seção `Última sessão`, registrar com data `2026-07-18` e agente `Codex`:

```markdown
## Última sessão (2026-07-18, Codex)

- Movidas as configurações compartilhadas de ESLint e Prettier para `config/`, com caminhos explícitos nos scripts da raiz.
- Ampliados os ignorados locais e confirmado que `frontend/dist` continua reproduzível, ignorado e contém o fallback SPA.
- `npm run check` passou localmente; o Netlify continua pendente de vínculo/validação do ambiente publicado.
```

Preservar as pendências externas ainda abertas, especialmente a conexão e o smoke do Netlify.

- [ ] **Step 2: Fazer a verificação final do escopo**

Run:

```powershell
git diff --check origin/main...HEAD
git status --short
git diff --stat origin/main...HEAD
git log --oneline --decorate origin/main..HEAD
```

Expected: sem erros de whitespace; somente documentos, `.gitignore`, `config/`, `package.json`, `README.md` e `docs/state.md` aparecem no escopo.

- [ ] **Step 3: Commitar documentação e handoff**

Run:

```powershell
git add -- README.md docs/state.md docs/superpowers/plans/2026-07-18-root-config-netlify.md
git commit -m "docs: explain config and Netlify workflow"
```

Expected: branch limpa e commits locais à frente de `origin/main`. Não fazer push, abrir PR ou publicar no Netlify sem uma solicitação específica.
