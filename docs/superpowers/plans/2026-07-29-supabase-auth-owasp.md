# Supabase Auth and OWASP Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a autenticação demonstrativa por Supabase Auth com cadastro confirmado, recuperação de senha, autorização por papéis do banco e hardening OWASP do frontend.

**Architecture:** `SupabaseAuthRepository` será o único adaptador do SDK e implementará um contrato de autenticação independente do fornecedor. `PortalDataProvider` continuará como fachada da aplicação, recebendo o repositório de autenticação por injeção e mantendo o repositório demo apenas para os processos ainda não migrados. RLS continuará sendo a autoridade de acesso; rotas React controlarão somente navegação e apresentação.

**Tech Stack:** React 18.3, React Router 6.30, TypeScript 5.7, Vite 6.4, Vitest 3.2, Supabase JS 2.111.0, PostgreSQL 17, pgTAP, Netlify e npm workspaces.

## Global Constraints

- Trabalhar somente na branch `backend`.
- Não adicionar IA, leitura automática de arquivos ou automações.
- Supabase Auth é a única autenticação; não manter fallback, credenciais ou sessão demo.
- Usar somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no navegador.
- Nunca expor `service_role`, secret key, senha do banco, JWT secret ou tokens em logs.
- Nunca usar `user_metadata` para autorização; papéis vêm de `public.user_roles` e `public.roles`.
- Quando o usuário tiver `admin` e `client`, `admin` tem prioridade.
- Confirmação de e-mail é obrigatória.
- Senha tem no mínimo 8 caracteres e exige confirmação no cadastro e na redefinição.
- Recuperação responde de forma idêntica exista ou não uma conta.
- Redirecionamentos usam rotas fixas; não aceitar `returnTo` ou URL arbitrária.
- MFA, CAPTCHA, SMTP próprio e antimalware ficam fora deste corte.
- Toda mudança de comportamento começa com teste falhando.
- Fixar dependências no `package-lock.json` e preservar mudanças não relacionadas.

---

## File Map

### Novos arquivos

- `frontend/.env.example`: contrato das duas variáveis públicas.
- `frontend/src/vite-env.d.ts`: tipagem das variáveis Vite.
- `frontend/src/infrastructure/supabase/client.ts`: valida configuração e cria o cliente único.
- `frontend/src/infrastructure/supabase/client.test.ts`: cobre configuração ausente e válida.
- `frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts`: implementa o contrato de autenticação.
- `frontend/src/infrastructure/supabase/SupabaseAuthRepository.test.ts`: testa chamadas ao SDK, hidratação e tradução de falhas.
- `frontend/src/test/FakeAuthRepository.ts`: fake controlável para providers, rotas e páginas.
- `frontend/src/pages/auth/AuthLayout.tsx`: moldura visual compartilhada das telas de autenticação.
- `frontend/src/pages/auth/PasswordField.tsx`: campo de senha acessível com alternância de visibilidade.
- `frontend/src/pages/auth/validation.ts`: validações puras de e-mail e senha.
- `frontend/src/pages/auth/validation.test.ts`: testes das validações.
- `frontend/src/pages/signup/SignupPage.tsx`: cadastro e aviso de confirmação.
- `frontend/src/pages/signup/SignupPage.test.tsx`: testes da tela de cadastro.
- `frontend/src/pages/recover-password/RecoverPasswordPage.tsx`: solicitação de recuperação com resposta não enumerável.
- `frontend/src/pages/recover-password/RecoverPasswordPage.test.tsx`: testes da solicitação.
- `frontend/src/pages/reset-password/ResetPasswordPage.tsx`: nova senha condicionada à sessão de recuperação.
- `frontend/src/pages/reset-password/ResetPasswordPage.test.tsx`: testes da redefinição.
- `frontend/scripts/check-security-bundle.mjs`: impede segredos conhecidos na saída de produção.
- `frontend/scripts/check-security-bundle.node-test.mjs`: testes do scanner de bundle.
- `supabase/tests/database/auth_rls.test.sql`: regressão de grants, RLS e elevação de papel.

### Arquivos alterados

- `package.json` e `package-lock.json`: dependência fixa e comandos de segurança.
- `frontend/package.json`: Supabase JS e scripts do scanner.
- `frontend/src/features/auth/auth.ts`: contratos, resultados tipados e mapeamento do usuário.
- `frontend/src/features/auth/auth.test.ts`: substitui testes das credenciais demo por testes dos contratos e mapeadores.
- `frontend/src/domain/types.ts`: mantém `AuthSession` e explicita os campos compatíveis com o perfil real.
- `frontend/src/features/portal-data/PortalDataProvider.tsx`: sessão assíncrona real e injeção de `AuthRepository`.
- `frontend/src/features/portal-data/PortalDataProvider.test.tsx`: restauração, login, logout e falha fechada.
- `frontend/src/pages/login/LoginPage.tsx`: remove conteúdo demo e usa resultado assíncrono.
- `frontend/src/pages/login/LoginPage.test.tsx`: login real, estados de envio e links públicos.
- `frontend/src/app/RootApp.tsx`: novas rotas, loading inicial e redirecionamento por papel.
- `frontend/src/app/RootApp.test.tsx`: rotas públicas/protegidas e recuperação.
- `frontend/vite.config.ts`: chunks das novas páginas.
- `supabase/config.toml`: URLs locais exatas do Vite e Auth.
- `netlify.toml`: CSP e demais cabeçalhos.
- `README.md`: configuração local e checklist operacional do Supabase Auth.
- `docs/state.md`: estado entregue e backlog de segurança.

---

### Task 1: Contratos de autenticação e configuração pública

**Files:**

- Create: `frontend/.env.example`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/src/infrastructure/supabase/client.ts`
- Test: `frontend/src/infrastructure/supabase/client.test.ts`
- Modify: `frontend/src/features/auth/auth.ts`
- Test: `frontend/src/features/auth/auth.test.ts`
- Modify: `frontend/package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Produces: `AuthRepository`, `AuthResult<T>`, `AuthenticatedUser`, `AuthErrorCode`, `SignUpInput`, `AuthEvent`, `readSupabaseConfig()` e `supabase`.
- Consumes: `AuthSession`, `User` e `UserRole` de `@/domain/types`.

- [ ] **Step 1: Consultar mudanças e documentação atual**

Leia `https://supabase.com/changelog.md` e procure breaking changes de Auth ou `supabase-js`. Confirme nas referências JavaScript as assinaturas de `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `signOut({ scope: "local" })` e `onAuthStateChange`.

Expected: nenhuma assinatura será implementada por memória quando a documentação atual divergir.

- [ ] **Step 2: Substituir o teste de credenciais demo por testes do contrato**

Em `frontend/src/features/auth/auth.test.ts`, remova casos de `DEMO_CREDENTIALS` e cubra:

```ts
import { describe, expect, it } from "vitest";
import { selectPrimaryRole, toDomainUser } from "@/features/auth/auth";

describe("auth domain mapping", () => {
  it("prioritizes admin when the user has both roles", () => {
    expect(selectPrimaryRole(["client", "admin"])).toBe("admin");
  });

  it("fails closed when no supported role exists", () => {
    expect(selectPrimaryRole([])).toBeNull();
  });

  it("maps a profile and primary address without auth metadata authorization", () => {
    expect(
      toDomainUser({
        profile: {
          id: "user-1",
          name: "Daniel Mathias",
          email: "daniel@example.com",
          phone: null,
          created_at: "2026-07-29T12:00:00Z"
        },
        roles: ["client"],
        address: null
      })
    ).toMatchObject({
      id: "user-1",
      role: "client",
      name: "Daniel Mathias",
      email: "daniel@example.com",
      phone: "",
      address: ""
    });
  });
});
```

- [ ] **Step 3: Executar o teste e confirmar a falha**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/features/auth/auth.test.ts
```

Expected: FAIL porque `selectPrimaryRole` e `toDomainUser` ainda não existem.

- [ ] **Step 4: Definir contratos e mapeadores mínimos**

Em `frontend/src/features/auth/auth.ts`, remover credenciais e autenticação demo e definir:

```ts
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_already_registered"
  | "invalid_recovery_session"
  | "weak_password"
  | "network_error"
  | "profile_unavailable"
  | "configuration_error"
  | "unexpected_error";

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: AuthErrorCode };

export interface AuthenticatedUser {
  session: AuthSession;
  user: User;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  emailRedirectTo: string;
}

export type AuthEvent = "signed-in" | "signed-out" | "password-recovery" | "token-refreshed";

export interface AuthRepository {
  restoreSession(): Promise<AuthResult<AuthenticatedUser | null>>;
  login(email: string, password: string): Promise<AuthResult<AuthenticatedUser>>;
  signUp(input: SignUpInput): Promise<AuthResult<void>>;
  requestPasswordReset(email: string, redirectTo: string): Promise<AuthResult<void>>;
  updatePassword(password: string): Promise<AuthResult<void>>;
  logout(): Promise<AuthResult<void>>;
  subscribe(listener: (event: AuthEvent) => void): () => void;
}
```

`selectPrimaryRole()` aceita somente `client` e `admin`, prioriza `admin` e retorna `null` sem papel válido. `toDomainUser()` retorna `null` quando `selectPrimaryRole()` falhar; mantém `cpf`, `phone` e `address` como strings vazias quando ainda não existirem dados reais.

- [ ] **Step 5: Testar configuração antes de criar o cliente**

Criar `frontend/src/infrastructure/supabase/client.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readSupabaseConfig } from "@/infrastructure/supabase/client";

describe("readSupabaseConfig", () => {
  it("rejects missing public configuration without printing values", () => {
    expect(() => readSupabaseConfig({})).toThrow("Configuração pública do Supabase ausente.");
  });

  it("accepts the project URL and publishable key", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://project.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test"
      })
    ).toEqual({
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_test"
    });
  });
});
```

- [ ] **Step 6: Instalar a versão fixada e implementar o cliente**

Run:

```bash
npm install --workspace @vertice/frontend --save-exact @supabase/supabase-js@2.111.0
```

Criar `frontend/.env.example`:

```dotenv
VITE_SUPABASE_URL=https://mxwwvuwhkmhfggldconn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_substitua_pela_chave_publica
```

Criar `frontend/src/vite-env.d.ts` com `ImportMetaEnv` somente para essas duas chaves. `readSupabaseConfig()` deve aceitar `Record<string, string | undefined>` para teste e validar URL HTTPS ou `http://127.0.0.1` local. O cliente exportado usa:

```ts
createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
```

- [ ] **Step 7: Rodar os testes e commit**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/features/auth/auth.test.ts src/infrastructure/supabase/client.test.ts
npm run typecheck --workspace @vertice/frontend
git add frontend/.env.example frontend/src/vite-env.d.ts frontend/src/features/auth frontend/src/infrastructure/supabase/client.ts frontend/src/infrastructure/supabase/client.test.ts frontend/package.json package-lock.json
git commit -m "feat: add Supabase auth contracts"
```

Expected: testes e typecheck passam; o commit não contém valor real de chave.

---

### Task 2: Adaptador Supabase Auth

**Files:**

- Create: `frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts`
- Test: `frontend/src/infrastructure/supabase/SupabaseAuthRepository.test.ts`

**Interfaces:**

- Consumes: `AuthRepository`, `AuthResult<T>`, `AuthenticatedUser`, `SignUpInput`, `toDomainUser()` e um `SupabaseClient`.
- Produces: `SupabaseAuthRepository` e `createSupabaseAuthRepository(client)`.

- [ ] **Step 1: Escrever testes do login e hidratação**

Use um client mockado com `auth.signInWithPassword` e builders de `from()` controláveis. Os testes devem afirmar:

```ts
expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
  email: "daniel@example.com",
  password: "senha-segura"
});
expect(result).toMatchObject({
  ok: true,
  data: {
    session: { userId: "user-1", role: "admin" },
    user: { id: "user-1", role: "admin", name: "Daniel Mathias" }
  }
});
```

O fixture deve devolver perfil próprio, papéis `["client", "admin"]` e endereço primário. Adicione casos `profile_unavailable` para perfil ausente e papel vazio.

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/infrastructure/supabase/SupabaseAuthRepository.test.ts
```

Expected: FAIL porque o adaptador não existe.

- [ ] **Step 3: Implementar login e restauração**

Implementar:

```ts
export function createSupabaseAuthRepository(client: SupabaseClient): AuthRepository;
```

`restoreSession()` chama `client.auth.getSession()`. Se não houver sessão, retorna `{ ok: true, data: null }`. Com sessão, consulta separadamente:

```ts
client.from("profiles").select("id,name,email,phone,created_at").eq("id", userId).single();

client.from("user_roles").select("roles!inner(code)").eq("user_id", userId);

client
  .from("user_addresses")
  .select("street,number,complement,neighborhood,city,state,postal_code")
  .eq("user_id", userId)
  .eq("is_primary", true)
  .limit(1)
  .maybeSingle();
```

Não usar `raw_user_meta_data` ou JWT como fonte de papel. Formatar o endereço apenas para o `User` legado.

- [ ] **Step 4: Testar erros, cadastro e recuperação**

Adicionar testes que comprovem:

- `invalid_credentials` para `AuthApiError.code === "invalid_credentials"`;
- `email_not_confirmed` para o código equivalente retornado pelo SDK;
- `email_already_registered` para cadastro já existente;
- `network_error` para `TypeError`;
- `unexpected_error` como fallback;
- `signUp()` envia somente `{ data: { name }, emailRedirectTo }`;
- `requestPasswordReset()` chama `resetPasswordForEmail(email, { redirectTo })`;
- `updatePassword()` chama `updateUser({ password })`;
- `logout()` chama `signOut({ scope: "local" })`.

- [ ] **Step 5: Implementar operações e mapeamento seguro de erros**

Criar um mapeador privado por `error.code`, sem devolver `error.message`. Para cadastro, sucesso significa requisição aceita e confirmação pendente. Para recuperação, retornar sucesso sempre que o Supabase aceitar a requisição; a página não diferencia conta existente.

`subscribe()` deve registrar callback síncrono em `onAuthStateChange` e apenas traduzir eventos:

```ts
SIGNED_IN -> "signed-in"
SIGNED_OUT -> "signed-out"
PASSWORD_RECOVERY -> "password-recovery"
TOKEN_REFRESHED -> "token-refreshed"
```

Não executar chamada assíncrona do Supabase dentro do callback; isso evita o deadlock documentado do SDK. A hidratação posterior será agendada pelo provider.

- [ ] **Step 6: Rodar testes e commit**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/infrastructure/supabase/SupabaseAuthRepository.test.ts
npm run typecheck --workspace @vertice/frontend
git add frontend/src/infrastructure/supabase/SupabaseAuthRepository.ts frontend/src/infrastructure/supabase/SupabaseAuthRepository.test.ts
git commit -m "feat: implement Supabase auth repository"
```

---

### Task 3: Sessão real no PortalDataProvider

**Files:**

- Create: `frontend/src/test/FakeAuthRepository.ts`
- Modify: `frontend/src/features/portal-data/PortalDataProvider.tsx`
- Test: `frontend/src/features/portal-data/PortalDataProvider.test.tsx`
- Modify: `frontend/src/infrastructure/demo/repository.ts`
- Modify: `frontend/src/infrastructure/demo/validation.ts`
- Test: `frontend/src/infrastructure/demo/repository.persistence.test.ts`
- Test: `frontend/src/infrastructure/demo/validation.test.ts`

**Interfaces:**

- Consumes: `AuthRepository` e `createSupabaseAuthRepository(supabase)`.
- Produces no contexto: `authStatus`, `session`, `currentUser`, `login`, `signUp`, `requestPasswordReset`, `updatePassword`, `logout` e `isRecoverySession`.

- [ ] **Step 1: Criar fake e testes assíncronos do provider**

`FakeAuthRepository` terá resultados configuráveis e contadores de chamadas:

```ts
const auth = new FakeAuthRepository();
auth.restoreResult = { ok: true, data: authenticatedClient };

render(
  <PortalDataProvider repository={demoRepository} authRepository={auth}>
    <Probe />
  </PortalDataProvider>
);

expect(screen.getByTestId("auth-status")).toHaveTextContent("loading");
expect(await screen.findByTestId("auth-status")).toHaveTextContent("authenticated");
expect(screen.getByTestId("user-name")).toHaveTextContent("Daniel Mathias");
```

Cobrir:

- restauração anônima;
- restauração autenticada;
- `profile_unavailable` resulta em `anonymous`, nunca conteúdo protegido;
- login atualiza sessão e usuário;
- logout limpa a interface mesmo se a chamada remota falhar;
- evento `signed-out` limpa estado;
- evento `password-recovery` ativa `isRecoverySession`;
- evento `signed-in` agenda restauração fora do callback.

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/features/portal-data/PortalDataProvider.test.tsx
```

Expected: FAIL porque o provider ainda usa autenticação demo síncrona.

- [ ] **Step 3: Remover persistência demo da sessão**

Retirar `getSession`, `setSession` e `clearSession` do contrato de `DemoRepository` e remover a chave de sessão da validação/persistência demo. Atualizar os testes do repositório para confirmar que ele persiste apenas estado de demonstração e serviço pendente.

Não remover o repositório demo inteiro: casos, documentos e ações permanecem temporariamente.

- [ ] **Step 4: Implementar o estado assíncrono**

Atualizar `PortalDataContextValue`:

```ts
authStatus: "loading" | "authenticated" | "anonymous";
isRecoverySession: boolean;
login: (email: string, password: string) => Promise<AuthResult<AuthenticatedUser>>;
signUp: (input: SignUpInput) => Promise<AuthResult<void>>;
requestPasswordReset: (email: string) => Promise<AuthResult<void>>;
updatePassword: (password: string) => Promise<AuthResult<void>>;
logout: () => Promise<void>;
```

O provider recebe `authRepository?: AuthRepository`; em produção cria o adaptador Supabase. Use refs/cancelamento para impedir `setState` após unmount. Para eventos que exigem hidratação, use `queueMicrotask` ou `setTimeout(..., 0)` e então `restoreSession()`, nunca `await` dentro do callback do SDK.

URLs fixas:

```ts
const confirmationUrl = new URL("/login?confirmed=1", window.location.origin).toString();
const recoveryUrl = new URL("/redefinir-senha", window.location.origin).toString();
```

O provider não aceita URLs externas como parâmetro das páginas.

- [ ] **Step 5: Rodar regressões e commit**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/features/portal-data/PortalDataProvider.test.tsx src/infrastructure/demo/repository.persistence.test.ts src/infrastructure/demo/validation.test.ts
npm run typecheck --workspace @vertice/frontend
git add frontend/src/test/FakeAuthRepository.ts frontend/src/features/portal-data/PortalDataProvider.tsx frontend/src/features/portal-data/PortalDataProvider.test.tsx frontend/src/infrastructure/demo/repository.ts frontend/src/infrastructure/demo/validation.ts frontend/src/infrastructure/demo/repository.persistence.test.ts frontend/src/infrastructure/demo/validation.test.ts
git commit -m "feat: restore Supabase sessions in portal provider"
```

---

### Task 4: Login real e componentes compartilhados

**Files:**

- Create: `frontend/src/pages/auth/AuthLayout.tsx`
- Create: `frontend/src/pages/auth/PasswordField.tsx`
- Create: `frontend/src/pages/auth/validation.ts`
- Test: `frontend/src/pages/auth/validation.test.ts`
- Modify: `frontend/src/pages/login/LoginPage.tsx`
- Test: `frontend/src/pages/login/LoginPage.test.tsx`

**Interfaces:**

- Consumes: `AuthResult<AuthenticatedUser>` e `AuthErrorCode`.
- Produces: `LoginPageProps.onLogin(email, password): Promise<AuthResult<AuthenticatedUser>>`, `validatePassword()` e layout reutilizável.

- [ ] **Step 1: Escrever testes de validação e login**

Testar:

```ts
expect(validatePassword("1234567")).toBe("A senha deve ter pelo menos 8 caracteres.");
expect(validatePasswordConfirmation("12345678", "87654321")).toBe("As senhas não coincidem.");
```

Na página, cobrir:

- não existem `cliente@demo.com`, `admin@demo.com` ou “reiniciar demonstração”;
- formulário aguarda `onLogin`;
- botão “Entrando…” fica desabilitado durante a Promise;
- `invalid_credentials` e `email_not_confirmed` exibem textos próprios;
- há links para `/cadastro` e `/recuperar-senha`;
- `confirmed=1` produz aviso de confirmação concluída.

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/pages/auth/validation.test.ts src/pages/login/LoginPage.test.tsx
```

- [ ] **Step 3: Extrair layout e campo de senha**

Mover apenas a moldura visual repetível de `LoginPage` para `AuthLayout`. Remover todo texto de “ambiente demonstrativo”, contas fictícias e reset. `PasswordField` recebe:

```ts
interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}
```

Preservar labels, foco visível, contraste e `aria-live`.

- [ ] **Step 4: Implementar login assíncrono**

`LoginPage` controla `submitting`, converte códigos em mensagens estáveis e nunca exibe texto bruto. Mensagens mínimas:

```ts
invalid_credentials: "E-mail ou senha inválidos."
email_not_confirmed: "Confirme seu e-mail antes de entrar."
network_error: "Não foi possível conectar. Tente novamente."
default: "Não foi possível entrar. Tente novamente."
```

O redirecionamento após sucesso continua responsabilidade da rota, não da página.

- [ ] **Step 5: Rodar testes e commit**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/pages/auth/validation.test.ts src/pages/login/LoginPage.test.tsx
npm run typecheck --workspace @vertice/frontend
git add frontend/src/pages/auth frontend/src/pages/login
git commit -m "feat: replace demo login with async auth"
```

---

### Task 5: Cadastro, recuperação e redefinição

**Files:**

- Create: `frontend/src/pages/signup/SignupPage.tsx`
- Test: `frontend/src/pages/signup/SignupPage.test.tsx`
- Create: `frontend/src/pages/recover-password/RecoverPasswordPage.tsx`
- Test: `frontend/src/pages/recover-password/RecoverPasswordPage.test.tsx`
- Create: `frontend/src/pages/reset-password/ResetPasswordPage.tsx`
- Test: `frontend/src/pages/reset-password/ResetPasswordPage.test.tsx`

**Interfaces:**

- Consumes: `AuthLayout`, `PasswordField`, validações e callbacks assíncronos do provider.
- Produces: páginas públicas sem conhecimento direto do Supabase.

- [ ] **Step 1: Escrever testes do cadastro**

Cobrir nome obrigatório, e-mail válido, senha mínima, confirmação igual, botão bloqueado durante envio e aviso:

```text
Cadastro recebido. Verifique seu e-mail para confirmar a conta.
```

Mesmo quando o código interno for `email_already_registered`, use texto que não confirme inequivocamente a existência da conta:

```text
Se o endereço puder ser cadastrado, enviaremos as instruções por e-mail.
```

- [ ] **Step 2: Escrever testes da recuperação**

Para sucesso e `email_already_registered`/resposta equivalente, a página deve mostrar exatamente:

```text
Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação.
```

Testar botão desabilitado e link de volta para `/login`.

- [ ] **Step 3: Escrever testes da redefinição**

Quando `isRecoverySession === false`, mostrar “Link de recuperação inválido ou expirado” e não renderizar formulário. Quando verdadeiro, validar duas senhas, aguardar atualização, exibir sucesso e chamar `onCompleted()` para logout e navegação.

- [ ] **Step 4: Executar e confirmar falhas**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/pages/signup/SignupPage.test.tsx src/pages/recover-password/RecoverPasswordPage.test.tsx src/pages/reset-password/ResetPasswordPage.test.tsx
```

- [ ] **Step 5: Implementar as três páginas**

Reutilizar o layout e o campo de senha. Não aceitar `redirectTo` em props públicas. Não registrar e-mail, senha ou resultado no console. Todos os formulários usam `aria-live`, `role="alert"` para falha e `role="status"` para sucesso.

- [ ] **Step 6: Rodar testes e commit**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/pages/signup/SignupPage.test.tsx src/pages/recover-password/RecoverPasswordPage.test.tsx src/pages/reset-password/ResetPasswordPage.test.tsx
npm run typecheck --workspace @vertice/frontend
git add frontend/src/pages/signup frontend/src/pages/recover-password frontend/src/pages/reset-password
git commit -m "feat: add account recovery flows"
```

---

### Task 6: Rotas, papéis e transições seguras

**Files:**

- Modify: `frontend/src/app/RootApp.tsx`
- Test: `frontend/src/app/RootApp.test.tsx`
- Modify: `frontend/vite.config.ts`

**Interfaces:**

- Consumes: `authStatus`, `isRecoverySession`, `session.role` e as quatro páginas.
- Produces: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/cliente/*` e `/admin/*`.

- [ ] **Step 1: Atualizar testes de navegação**

Usar `FakeAuthRepository`, nunca credenciais demo. Cobrir:

- `loading` exibe “Verificando acesso…” sem renderizar login nem portal;
- anônimo em `/cliente` ou `/admin` vai para `/login`;
- cliente não abre `/admin`;
- administrador com dois papéis chega a `/admin`;
- login de cliente com serviço pendente vai a `/cliente/nova-solicitacao`;
- login de administrador preserva o serviço pendente sem consumi-lo;
- cadastro e recuperação são públicas;
- redefinição sem evento de recovery falha fechada;
- logout leva a `/login`.

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/app/RootApp.test.tsx
```

- [ ] **Step 3: Implementar rotas e loading**

Lazy-load das novas páginas. `ProtectedRoute` deve primeiro tratar `authStatus === "loading"`, depois ausência de sessão e finalmente papel divergente. `LoginRoute` aguarda `login()` e navega somente quando `result.ok`.

Adicionar chunks:

```ts
if (normalizedId.includes("/src/pages/signup/")) return "signup";
if (normalizedId.includes("/src/pages/recover-password/")) return "recover-password";
if (normalizedId.includes("/src/pages/reset-password/")) return "reset-password";
```

- [ ] **Step 4: Rodar testes de rotas e portais**

Run:

```bash
npm run test --workspace @vertice/frontend -- --run src/app/RootApp.test.tsx src/pages/client/ClientPortal.test.tsx src/pages/admin/AdminPortal.test.tsx
npm run typecheck --workspace @vertice/frontend
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/RootApp.tsx frontend/src/app/RootApp.test.tsx frontend/vite.config.ts
git commit -m "feat: protect portal routes with Supabase sessions"
```

---

### Task 7: Regressão de autorização no PostgreSQL

**Files:**

- Create: `supabase/tests/database/auth_rls.test.sql`
- Modify: `supabase/config.toml`

**Interfaces:**

- Consumes: migrations existentes de identidade, catálogo e domínio.
- Produces: teste pgTAP repetível de grants e RLS.

- [ ] **Step 1: Confirmar comandos disponíveis**

Run:

```bash
npx supabase test db --help
npx supabase db lint --help
npx supabase db advisors --help
```

Expected: usar somente flags apresentadas pela CLI 2.109.1 do projeto.

- [ ] **Step 2: Criar teste pgTAP que falha em qualquer elevação**

O teste abre transação, cria três usuários em `auth.users` com UUIDs fixos e depende do trigger existente para criar perfis/papel `client`. Antes de assumir os papéis JWT, atribui `admin` somente ao fixture administrativo.

Asserções mínimas:

```sql
select plan(10);
select ok(has_table_privilege('authenticated', 'public.profiles', 'SELECT'), 'authenticated reads profiles through RLS');
select ok(not has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anon cannot read profiles');
select ok(not has_table_privilege('authenticated', 'public.user_roles', 'INSERT'), 'clients have no direct role insert grant');
select ok(not has_table_privilege('authenticated', 'public.user_roles', 'DELETE'), 'clients have no direct role delete grant');
```

Trocar para `authenticated`, definir `request.jwt.claim.sub` para o cliente A e provar:

- enxerga o próprio perfil;
- não enxerga o cliente B;
- não consegue inserir papel `admin`;
- não consegue alterar `email`, `cpf_hash`, `disabled_at` ou outro campo fora de `name` e `phone`;
- catálogo ativo é legível por `anon`;
- tabela administrativa não é legível por `anon`.

Encerrar com `select * from finish(); rollback;`.

- [ ] **Step 3: Rodar teste e corrigir a menor superfície**

Run:

```bash
npx supabase test db
```

Expected: se o teste provar que `authenticated` ainda tem `INSERT`/`DELETE` em `user_roles`, ele falhará apesar da RLS.

Criar uma nova migration com:

```bash
npx supabase migration new harden_identity_grants
```

Somente se o teste exigir, revogar privilégios de tabela redundantes e conceder apenas o necessário. Não editar migrations já aplicadas. A RLS administrativa continua, mas o grant amplo deixa de existir como defesa em profundidade.

- [ ] **Step 4: Ajustar URLs locais do Auth**

Em `supabase/config.toml`:

```toml
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = [
  "http://127.0.0.1:5173/login",
  "http://127.0.0.1:5173/redefinir-senha"
]
```

Não inventar a URL Netlify: registrar o passo manual até o domínio ser confirmado.

- [ ] **Step 5: Reset, teste, lint e advisors**

Run:

```bash
npx supabase db reset
npx supabase test db
npx supabase db lint --local --schema public,private
npx supabase db advisors --local
```

Expected: reset aplica todas as migrations; 10 testes pgTAP passam; lint e advisors sem issues de segurança.

- [ ] **Step 6: Commit**

```bash
git add supabase/config.toml supabase/tests/database/auth_rls.test.sql supabase/migrations
git commit -m "test: enforce identity authorization boundaries"
```

Adicionar ao commit somente a migration criada por esta tarefa, caso ela realmente tenha sido necessária.

---

### Task 8: Cabeçalhos Netlify e inspeção do bundle

**Files:**

- Modify: `netlify.toml`
- Create: `frontend/scripts/check-security-bundle.mjs`
- Test: `frontend/scripts/check-security-bundle.node-test.mjs`
- Modify: `frontend/package.json`
- Modify: `package.json`

**Interfaces:**

- Produces: `npm run security:bundle` e headers aplicados a `/*`.

- [ ] **Step 1: Escrever teste do scanner**

Exportar `findForbiddenArtifacts(files)` e testar:

```js
assert.deepEqual(
  findForbiddenArtifacts([
    { path: "dist/assets/app.js", content: 'const key="sb_publishable_ok"' }
  ]),
  []
);

assert.deepEqual(
  findForbiddenArtifacts([{ path: "dist/assets/app.js", content: 'const key="service_role"' }]),
  ["dist/assets/app.js:service_role"]
);
```

Padrões proibidos:

- `service_role`;
- `SUPABASE_DB_PASSWORD`;
- `JWT_SECRET`;
- `sb_secret_`;
- chaves PEM privadas.

Não proibir `sb_publishable_`, pois ela é deliberadamente pública.

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
npm run bundle:security:test --workspace @vertice/frontend
```

- [ ] **Step 3: Implementar scanner e scripts**

O scanner percorre somente `frontend/dist`, lê arquivos texto `.html`, `.js`, `.css`, `.json` e encerra com código 1 listando caminho e nome do padrão, nunca o valor encontrado.

Scripts:

```json
"bundle:security:test": "node --test ./scripts/check-security-bundle.node-test.mjs",
"security:bundle": "node ./scripts/check-security-bundle.mjs"
```

Na raiz, adicionar `"security:bundle"` direcionado ao workspace e executá-lo em `check` depois de `build`.

- [ ] **Step 4: Configurar CSP e cabeçalhos**

Adicionar em `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://mxwwvuwhkmhfggldconn.supabase.co wss://mxwwvuwhkmhfggldconn.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
```

Não incluir `'unsafe-eval'`, wildcard em `connect-src` ou origem externa não utilizada.

- [ ] **Step 5: Testar scripts, build e bundle**

Com um `frontend/.env.local` não versionado contendo a publishable key de desenvolvimento:

```bash
npm run bundle:security:test --workspace @vertice/frontend
npm run build
npm run security:bundle
git check-ignore -v frontend/.env.local
```

Expected: testes passam, build sai em `frontend/dist`, scanner não encontra segredos e o env local está ignorado.

- [ ] **Step 6: Commit**

```bash
git add netlify.toml frontend/scripts/check-security-bundle.mjs frontend/scripts/check-security-bundle.node-test.mjs frontend/package.json package.json
git commit -m "security: harden frontend delivery"
```

---

### Task 9: Documentação operacional e verificação completa

**Files:**

- Modify: `README.md`
- Modify: `docs/state.md`

**Interfaces:**

- Consumes: todos os fluxos e comandos entregues.
- Produces: instruções reproduzíveis de desenvolvimento e checklist do Dashboard.

- [ ] **Step 1: Atualizar documentação**

Documentar:

- copiar `frontend/.env.example` para `frontend/.env.local`;
- obter URL e publishable key em Supabase Project Settings;
- nunca usar secret key ou `service_role` no frontend;
- configurar confirmação de e-mail;
- Site URL e redirects exatos local/publicado;
- OTP com expiração máxima de uma hora;
- revisar Auth Rate Limits;
- executar `npx supabase db reset`, `npx supabase test db` e `npm run check`;
- SMTP próprio, CAPTCHA e MFA TOTP de admin como backlog anterior à abertura pública relevante;
- processos/documentos ainda demonstrativos e IA fora do corte.

- [ ] **Step 2: Rodar auditoria de dependências**

Run:

```bash
npm audit --omit=dev
npm audit
```

Expected: registrar severidade, pacote, caminho explorável e correção disponível. Não executar `npm audit fix --force`. Corrigir atualização compatível somente se os testes continuarem passando.

- [ ] **Step 3: Rodar a suíte completa**

Run:

```bash
npm run check
npx supabase test db
npx supabase db lint --local --schema public,private
npx supabase db advisors --local
git diff --check
git status --short
```

Expected: todos retornam sucesso; apenas arquivos deliberados aparecem antes do commit.

- [ ] **Step 4: Testar os quatro fluxos localmente**

Com Supabase local iniciado:

1. cadastrar usuário;
2. abrir o e-mail no Mailpit;
3. confirmar e entrar;
4. verificar redirecionamento de cliente;
5. solicitar recuperação com e-mail existente e inexistente e comparar as mensagens;
6. abrir link de recuperação, trocar senha e confirmar logout;
7. entrar como administrador real e verificar prioridade do papel;
8. tentar abrir `/admin` como cliente e confirmar redirecionamento.

Não usar conta ou credencial demo.

- [ ] **Step 5: Checklist remoto sem inventar configuração**

No Dashboard remoto, verificar e registrar:

- confirmação de e-mail habilitada;
- URL publicada real cadastrada;
- `/login` e `/redefinir-senha` permitidas;
- SSL obrigatório e Security Advisor;
- rate limits;
- publishable key usada no Netlify;
- nenhuma secret key em variável iniciada por `VITE_`.

Se o domínio Netlify ainda não existir, marcar somente esse smoke como bloqueado e não substituir por URL fictícia.

- [ ] **Step 6: Commit final de documentação**

```bash
git add README.md docs/state.md
git commit -m "docs: explain Supabase auth operations"
git status --short
git log --oneline --decorate -10
```

Expected: working tree limpo e histórico dividido por entregáveis revisáveis.

---

## Completion Review

Antes de declarar conclusão:

- confirmar que `rg -n "DEMO_CREDENTIALS|authenticateDemoUser|cliente@demo.com|admin@demo.com|resetDemo" frontend/src` não retorna código ativo de autenticação;
- confirmar que `rg -n "service_role|sb_secret_|SUPABASE_DB_PASSWORD|JWT_SECRET" frontend/dist frontend/src` não revela segredo;
- confirmar que nenhum papel é derivado de `user_metadata`, `localStorage` ou query string;
- confirmar que recuperação usa mensagem genérica;
- confirmar que o callback de `onAuthStateChange` não executa chamada assíncrona do SDK;
- confirmar que RLS e grants foram ambos testados;
- confirmar que a CSP permite somente o endpoint Supabase real;
- confirmar que MFA não possui implementação parcial e permanece no backlog documentado.
