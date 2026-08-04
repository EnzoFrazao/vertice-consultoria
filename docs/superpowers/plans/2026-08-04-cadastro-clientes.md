# Cadastro público de clientes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover os atalhos de preenchimento de contas demo do login e criar um cadastro público de clientes com entrada automática quando o Supabase retornar uma sessão.

**Architecture:** A página de cadastro dependerá somente do contrato de autenticação exposto por `PortalDataProvider`. O adaptador Supabase retornará `AuthenticatedUser | null` no cadastro para representar, sem uma segunda requisição de login, os fluxos com sessão imediata e com confirmação de e-mail. `RootApp` coordenará rota, sessão e redirecionamento, preservando a seleção de serviço.

**Tech Stack:** React 18, TypeScript 5.7, React Router 6, Supabase JS 2.111, Vitest, Testing Library, Vite e Tailwind CSS.

## Global Constraints

- O cadastro público cria somente usuários com papel `client`; a interface não recebe seletor de papel.
- O nome é enviado em `options.data.name`; autorização continua baseada em `public.user_roles`, nunca em `user_metadata`.
- O formulário contém nome, e-mail, senha e confirmação de senha; a senha exige no mínimo 8 caracteres.
- Com sessão retornada pelo Supabase, abrir `/cliente` ou `/cliente/nova-solicitacao` quando houver serviço pendente.
- Sem sessão, orientar a confirmação do e-mail e oferecer link para `/login`.
- Remover somente cartões e lógica de preenchimento demo; manter “Reiniciar demonstração”.
- Não adicionar dependências, chaves privilegiadas, persistência ou logs de senha.
- Preservar mudanças preexistentes em `frontend/src/features/portal-data/PortalDataProvider.tsx` e `package.json` que não pertençam a esta implementação.
- Usar TDD: cada alteração de produção deve ser precedida pelo teste correspondente falhando pelo motivo esperado.

---

## Estrutura de arquivos

- `frontend/src/features/auth/auth.ts`: contratos e códigos de erro de autenticação.
- `frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts`: tradução do retorno de `auth.signUp` para o domínio.
- `frontend/src/features/portal-data/PortalDataProvider.tsx`: sincronização do estado React após cadastro com sessão.
- `frontend/src/pages/register/RegisterPage.tsx`: formulário, validações e estados de apresentação do cadastro.
- `frontend/src/app/RootApp.tsx`: rota lazy `/cadastro` e redirecionamentos.
- `frontend/src/pages/login/LoginPage.tsx`: login sem preenchimento demo e com link de cadastro.
- `frontend/vite.config.ts` e `frontend/scripts/bundle-checker.mjs`: chunk lazy independente do cadastro.
- Os arquivos `*.test.*` adjacentes validam cada unidade sem acessar a rede.

### Task 1: Semântica de cadastro no contrato e no Supabase

**Files:**

- Modify: `frontend/src/features/auth/auth.ts`
- Modify: `frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts`
- Modify: `frontend/src/infrastructure/supabase/SupabaseAuthRepository.test.ts`

**Interfaces:**

- Consumes: `SupabaseClient.auth.signUp(credentials)` e `hydrateAuthenticatedUser(session)`.
- Produces: `AuthRepository.signUp(input: SignUpInput): Promise<AuthResult<AuthenticatedUser | null>>` e `AuthErrorCode` com `weak_password`.

- [ ] **Step 1: Escrever testes falhando para cadastro sem sessão, com sessão e senha fraca**

Adicionar fábricas de cliente que exponham `signUp` e, no caso autenticado, as consultas de perfil/papel. Os testes devem fazer estas asserções exatas:

```ts
expect(client.auth.signUp).toHaveBeenCalledWith({
  email: "cliente@example.com",
  password: "senha-segura",
  options: { data: { name: "Cliente Teste" } }
});
expect(
  await repository.signUp({
    name: "  Cliente Teste  ",
    email: "  CLIENTE@EXAMPLE.COM  ",
    password: "senha-segura"
  })
).toEqual({ ok: true, data: null });
```

Para `signUp` com `data.session: SESSION`, esperar `ok: true` e o mesmo `AuthenticatedUser` já validado por `restoreSession`. Para `{ code: "weak_password" }`, esperar `{ ok: false, error: "weak_password" }`.

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/infrastructure/supabase/SupabaseAuthRepository.test.ts`

Expected: FAIL porque `signUp` ainda retorna `void`, não hidrata a sessão e não mapeia `weak_password`.

- [ ] **Step 3: Implementar o contrato e o adaptador mínimos**

Alterar o contrato para:

```ts
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_already_registered"
  | "weak_password"
  | "network_error"
  | "profile_unavailable"
  | "configuration_error"
  | "unexpected_error";

signUp(
  input: SignUpInput,
): Promise<AuthResult<AuthenticatedUser | null>>;
```

No adaptador, capturar `data.session` e retornar:

```ts
const {
  data: { session },
  error
} = await this.client.auth.signUp({
  email: input.email.trim().toLowerCase(),
  password: input.password,
  options: { data: { name: input.name.trim() } }
});

if (error) return failure(mapAuthError(error));
if (!session) return success(null);
return this.hydrateAuthenticatedUser(session);
```

Adicionar `case "weak_password": return "weak_password";` em `mapAuthError`.

- [ ] **Step 4: Executar o teste e confirmar GREEN**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/infrastructure/supabase/SupabaseAuthRepository.test.ts`

Expected: todos os testes do arquivo PASS.

- [ ] **Step 5: Commitar a unidade**

```bash
rtk git add frontend/src/features/auth/auth.ts frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts frontend/src/infrastructure/supabase/SupabaseAuthRepository.test.ts
rtk git commit -m "feat(auth): representar sessão criada no cadastro"
```

### Task 2: Atualização reativa da autenticação após cadastro

**Files:**

- Modify: `frontend/src/features/portal-data/PortalDataProvider.tsx`
- Modify: `frontend/src/features/portal-data/PortalDataProvider.test.tsx`

**Interfaces:**

- Consumes: `AuthRepository.signUp(input): Promise<AuthResult<AuthenticatedUser | null>>` da Task 1.
- Produces: `PortalDataContextValue.signUp` com a mesma assinatura e atualização imediata de `session`, `currentUser` e `authStatus` quando `result.data` existir.

- [ ] **Step 1: Escrever um teste falhando para o estado após cadastro autenticado**

Criar um `AuthRepository` falso explícito, injetá-lo no provider e adicionar ao `Probe` um botão que chame:

```ts
void app.signUp({
  name: "Nova Cliente",
  email: "nova@example.com",
  password: "senha-segura"
});
```

Fazer o falso retornar `{ ok: true, data: AUTHENTICATED_CLIENT }` e usar `findByText`/`waitFor` para esperar `session-role` igual a `client` e `user-name` igual a `Nova Cliente`. Adicionar um segundo teste com `{ ok: true, data: null }` esperando estado anônimo.

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/features/portal-data/PortalDataProvider.test.tsx`

Expected: FAIL porque `signUp` apenas encaminha o resultado sem atualizar o estado.

- [ ] **Step 3: Implementar `signUp` reativo sem tocar no cleanup preexistente**

Substituir somente o callback atual de cadastro por:

```ts
const signUp = useCallback(
  async (input: SignUpInput): Promise<AuthResult<AuthenticatedUser | null>> => {
    const result = await authRepository.signUp(input);

    if (!result.ok || !result.data) return result;

    setSession(result.data.session);
    setCurrentUser(result.data.user);
    setAuthStatus("authenticated");
    return result;
  },
  [authRepository]
);
```

- [ ] **Step 4: Executar o teste e confirmar GREEN**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/features/portal-data/PortalDataProvider.test.tsx`

Expected: todos os testes do arquivo PASS.

- [ ] **Step 5: Commitar apenas os trechos desta tarefa**

Como `PortalDataProvider.tsx` já possui uma mudança não relacionada, revisar `rtk git diff` e usar staging interativo/por patch para não incluí-la. Commit esperado:

```bash
rtk git commit -m "feat(auth): refletir sessão após cadastro"
```

### Task 3: Página de cadastro acessível e validada

**Files:**

- Create: `frontend/src/pages/register/RegisterPage.tsx`
- Create: `frontend/src/pages/register/RegisterPage.test.tsx`

**Interfaces:**

- Consumes: `onSignUp(input: SignUpInput): Promise<AuthResult<AuthenticatedUser | null>>` e `pendingServiceName?: string`.
- Produces: `RegisterPage`, mensagem de confirmação sem sessão e formulário acessível.

- [ ] **Step 1: Escrever testes falhando de apresentação e validação**

Cobrir em testes separados:

```ts
expect(screen.getByRole("heading", { name: /crie sua conta/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /já tenho uma conta/i })).toHaveAttribute("href", "/login");
expect(screen.getByText(/escritura/i)).toBeInTheDocument();
```

Submeter campos vazios e esperar `Preencha todos os campos para continuar.`; usar e-mail `invalido` e esperar `Informe um e-mail válido.`; senha `1234567` e esperar `A senha deve ter pelo menos 8 caracteres.`; confirmações divergentes e esperar `As senhas não coincidem.`. Em todos esses casos, `onSignUp` deve permanecer sem chamadas.

- [ ] **Step 2: Escrever testes falhando dos estados assíncronos**

Com dados válidos, esperar a chamada normalizada:

```ts
expect(onSignUp).toHaveBeenCalledWith({
  name: "Cliente Teste",
  email: "cliente@example.com",
  password: "senha-segura"
});
```

Enquanto a promessa estiver pendente, o botão `Criando conta...` deve estar desabilitado e uma segunda submissão não deve chamar `onSignUp` novamente. Para `{ ok: true, data: null }`, esperar status `Cadastro realizado. Verifique seu e-mail para confirmar a conta.`. Para `email_already_registered`, `weak_password` e `network_error`, esperar respectivamente mensagens claras em português.

- [ ] **Step 3: Executar os testes e confirmar RED**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/pages/register/RegisterPage.test.tsx`

Expected: FAIL porque `RegisterPage.tsx` ainda não existe.

- [ ] **Step 4: Implementar o formulário mínimo**

Criar `RegisterPageProps` com as interfaces acima. Usar estados controlados, `FormEvent`, `trim()` para nome/e-mail e a validação na ordem: obrigatórios, formato do e-mail, mínimo de 8 caracteres, confirmação. Usar `autoComplete="name"`, `email`, `new-password` e `new-password`; associar todos os labels por `htmlFor`; alternar visibilidade de senha com botões de nomes acessíveis; renderizar erro com `role="alert"` e sucesso com `role="status"`.

Reutilizar o mesmo fundo, logo, cores, largura e foco visível do login, alterando a cópia para cadastro de cliente. Não importar o cliente Supabase ou hooks do provider dentro da página.

- [ ] **Step 5: Executar os testes e confirmar GREEN**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/pages/register/RegisterPage.test.tsx`

Expected: todos os testes do arquivo PASS.

- [ ] **Step 6: Commitar a página**

```bash
rtk git add frontend/src/pages/register/RegisterPage.tsx frontend/src/pages/register/RegisterPage.test.tsx
rtk git commit -m "feat(auth): criar página de cadastro de clientes"
```

### Task 4: Rota de cadastro, redirecionamento e login sem preenchimento demo

**Files:**

- Modify: `frontend/src/app/RootApp.tsx`
- Modify: `frontend/src/app/RootApp.test.tsx`
- Modify: `frontend/src/pages/login/LoginPage.tsx`
- Modify: `frontend/src/pages/login/LoginPage.test.tsx`

**Interfaces:**

- Consumes: `RegisterPage` e `usePortalData().signUp` das Tasks 2 e 3.
- Produces: rota pública `/cadastro`, navegação pós-cadastro e link de cadastro no login.

- [ ] **Step 1: Escrever o teste falhando do login simplificado**

Substituir os testes dos cartões demo pelas asserções:

```ts
expect(screen.queryByText(/preencher uma conta demo/i)).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: /usar conta/i })).not.toBeInTheDocument();
expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute("href", "/cadastro");
expect(screen.getByRole("button", { name: /reiniciar demonstração/i })).toBeInTheDocument();
```

Manter o teste de `onResetDemo`; remover expectativas ligadas a descrições e credenciais dos cartões.

- [ ] **Step 2: Escrever testes falhando da rota e dos destinos**

Em `RootApp.test.tsx`, injetar um `AuthRepository` falso no helper `renderApplication`. Cobrir:

- `/cadastro` renderiza o heading `Crie sua conta` sob lazy loading;
- sessão já existente em `/cadastro` redireciona para `/cliente`;
- cadastro com `AuthenticatedUser` abre `/cliente`;
- cadastro autenticado com `pendingServiceId="escritura"` abre `/cliente/nova-solicitacao` e preserva a seleção;
- cadastro com `{ ok: true, data: null }` permanece em `/cadastro` e mostra a confirmação.

- [ ] **Step 3: Executar os testes e confirmar RED**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/pages/login/LoginPage.test.tsx src/app/RootApp.test.tsx`

Expected: FAIL pela presença dos cartões e ausência da rota `/cadastro`.

- [ ] **Step 4: Remover preenchimento demo e adicionar o link**

Em `LoginPage.tsx`, remover `demoAccounts`, `fillDemoAccount`, os cartões, imports não usados e estado/cópia exclusivos do preenchimento. Manter `onResetDemo`, o botão de reinício e as mensagens do login. Adicionar após o formulário:

```tsx
<p className="mt-5 text-center text-sm text-cacao/75">
  Ainda não tem uma conta?{" "}
  <Link to="/cadastro" className="font-semibold text-tealTech ...">
    Criar conta
  </Link>
</p>
```

Trocar a introdução por uma instrução neutra de acesso com e-mail e senha.

- [ ] **Step 5: Implementar `RegisterRoute` e a rota lazy**

Adicionar import dinâmico para `RegisterPage`. `RegisterRoute` usa `session`, `pendingServiceId` e `signUp`; se já autenticado, reutiliza o destino do cliente. No callback:

```ts
const result = await signUp(input);
if (!result.ok || !result.data) return result;

navigate(pendingServiceId ? "/cliente/nova-solicitacao" : "/cliente", { replace: true });
return result;
```

Registrar `<Route path="/cadastro" element={<LazyRoute><RegisterRoute /></LazyRoute>} />`.

- [ ] **Step 6: Executar os testes e confirmar GREEN**

Run: `rtk npm test --workspace @vertice/frontend -- --run src/pages/login/LoginPage.test.tsx src/app/RootApp.test.tsx`

Expected: todos os testes dos dois arquivos PASS.

- [ ] **Step 7: Commitar o fluxo**

```bash
rtk git add frontend/src/app/RootApp.tsx frontend/src/app/RootApp.test.tsx frontend/src/pages/login/LoginPage.tsx frontend/src/pages/login/LoginPage.test.tsx
rtk git commit -m "feat(auth): integrar cadastro ao fluxo público"
```

### Task 5: Garantia do chunk lazy e documentação

**Files:**

- Modify: `frontend/vite.config.ts`
- Modify: `frontend/scripts/bundle-checker.mjs`
- Modify: `frontend/scripts/bundle-checker.node-test.mjs`
- Modify: `README.md`

**Interfaces:**

- Consumes: entry `src/pages/register/RegisterPage.tsx` criada na Task 3.
- Produces: chunk `register` lazy e documentação da rota `/cadastro`.

- [ ] **Step 1: Escrever o teste falhando do quinto chunk**

Estender `createValidManifest()` com `src/pages/register/RegisterPage.tsx`, nome `register`, `isDynamicEntry: true`, e adicioná-lo a `dynamicImports`. Alterar o teste principal para esperar:

```js
assert.deepEqual(result.areaFiles, {
  landing: "assets/landing-fixture.js",
  login: "assets/login-fixture.js",
  register: "assets/register-fixture.js",
  client: "assets/client-fixture.js",
  admin: "assets/admin-fixture.js"
});
```

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `rtk npm run bundle:test --workspace @vertice/frontend`

Expected: FAIL porque o verificador ainda conhece somente quatro áreas.

- [ ] **Step 3: Implementar a regra de bundle mínima**

Adicionar `register` a `PRIVATE_ROUTE_SPECS`, retornar `"register"` para `/src/pages/register/` no `manualChunks` e exigir cinco arquivos distintos. Atualizar a mensagem para “Landing, login, cadastro, cliente e administrador precisam apontar para cinco chunks distintos.”

- [ ] **Step 4: Executar o teste e confirmar GREEN**

Run: `rtk npm run bundle:test --workspace @vertice/frontend`

Expected: todos os testes Node PASS.

- [ ] **Step 5: Atualizar a documentação pública**

Adicionar `/cadastro` à tabela de rotas como “Cadastro público de clientes”. Atualizar a descrição de `/login` para “Entrada de clientes e administradores”. Manter a seção de contas demonstrativas porque as contas continuam existindo, mas remover qualquer instrução que afirme haver preenchimento automático.

- [ ] **Step 6: Rodar verificação completa e inspecionar o diff**

Run: `rtk npm run check`

Expected: lint, Prettier, typecheck, Vitest, build e bundle check encerram com código 0 e sem warnings. Depois executar `rtk git diff --check` e `rtk git status --short` para confirmar que alterações preexistentes não foram incorporadas por engano.

- [ ] **Step 7: Commitar bundle e documentação**

```bash
rtk git add frontend/vite.config.ts frontend/scripts/bundle-checker.mjs frontend/scripts/bundle-checker.node-test.mjs README.md
rtk git commit -m "chore(auth): validar bundle do cadastro"
```

### Task 6: Revisão final contra a especificação

**Files:**

- Review: `docs/superpowers/specs/2026-08-04-cadastro-clientes-design.md`
- Review: todos os arquivos alterados nas Tasks 1–5.

**Interfaces:**

- Consumes: entregas testadas das Tasks 1–5.
- Produces: evidência final de requisitos, testes e build.

- [ ] **Step 1: Conferir requisito por requisito**

Confirmar no diff: ausência de seletor de papel; metadado limitado a `name`; ausência de credenciais demo no JSX do login; botão de reinício preservado; confirmação por e-mail; redirecionamentos com e sem serviço pendente; mensagens de erro; controles acessíveis; rota e chunk lazy.

- [ ] **Step 2: Executar novamente a verificação canônica**

Run: `rtk npm run check`

Expected: código 0 em todas as etapas.

- [ ] **Step 3: Registrar somente ajustes finais necessários**

Se a verificação exigir ajustes nos arquivos já versionados, corrigi-los com teste reproduzindo a falha quando houver mudança de comportamento, executar novamente `rtk npm run check` e criar um commit focado:

```bash
rtk git commit -m "fix(auth): concluir validação do cadastro"
```

Não criar esse commit quando não houver ajuste final.
