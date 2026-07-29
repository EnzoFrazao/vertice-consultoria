# Supabase Auth e hardening OWASP

**Data:** 2026-07-29  
**Branch:** `backend`  
**Escopo:** autenticação real no frontend, autorização apoiada pelo banco e hardening de segurança do MVP

## Objetivo

Substituir completamente a autenticação demonstrativa por Supabase Auth, mantendo o Supabase como backend principal. O corte entrega login, cadastro com confirmação de e-mail, recuperação e redefinição de senha em telas separadas.

O trabalho também trata os riscos OWASP aplicáveis a esse corte. MFA não será implementado agora: a arquitetura ficará compatível e a exigência de TOTP para administradores será registrada como backlog prioritário.

Não fazem parte deste corte:

- IA, leitura automática de arquivos ou automações;
- migração dos processos e documentos demonstrativos para consultas reais;
- MFA, CAPTCHA ou provedor SMTP próprio;
- antivírus ou análise de conteúdo dos uploads;
- refatorações sem relação direta com autenticação e segurança.

## Decisões aprovadas

- Supabase Auth será a única fonte de autenticação, sem fallback demonstrativo.
- O cadastro será público e exigirá confirmação de e-mail.
- As rotas serão `/login`, `/cadastro`, `/recuperar-senha` e `/redefinir-senha`.
- O frontend usará somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `service_role`, chave secreta, senha do banco e tokens nunca serão enviados ao navegador.
- Os papéis serão lidos de `public.user_roles` e `public.roles`; `user_metadata` não será usado para autorização.
- Quando o usuário possuir os papéis `admin` e `client`, `admin` terá prioridade no roteamento inicial.
- Proteções de rota no React serão uma barreira de experiência. A autorização efetiva continuará nas policies RLS.
- Processos e documentos continuarão usando os dados demonstrativos durante este corte, sem substituir silenciosamente o usuário autenticado por um usuário demo.

## Arquitetura

### Cliente Supabase

Um módulo único criará e exportará o cliente de `@supabase/supabase-js`. A inicialização validará as variáveis públicas obrigatórias e falhará com mensagem de configuração segura, sem revelar valores.

O pacote será instalado com versão fixada pelo lockfile. Nenhum script de CDN será adicionado.

### Repositório de autenticação

`SupabaseAuthRepository` será o único adaptador que conhece a API do Supabase. Ele oferecerá operações assíncronas para:

- restaurar a sessão;
- observar mudanças de autenticação;
- autenticar com e-mail e senha;
- cadastrar nome, e-mail e senha;
- solicitar recuperação de senha;
- redefinir a senha durante uma sessão de recuperação válida;
- encerrar a sessão;
- carregar o perfil, os papéis e o endereço principal.

As telas e o restante da aplicação não dependerão diretamente de tipos ou erros internos do Supabase. Isso preserva uma fronteira testável e impede que detalhes do fornecedor se espalhem pelo frontend.

### PortalDataProvider

`PortalDataProvider` continuará sendo a fachada consumida pelas páginas existentes, mas as operações de autenticação passarão a ser assíncronas.

O provider terá três estados explícitos:

- `loading`: restauração da sessão e carregamento do perfil em andamento;
- `authenticated`: sessão e usuário de domínio carregados;
- `anonymous`: nenhuma sessão válida.

Durante `loading`, as rotas protegidas exibirão uma tela neutra de carregamento. Não haverá redirecionamento antecipado nem flash de conteúdo administrativo.

O provider continuará expondo os dados demonstrativos dos demais módulos temporariamente, mas removerá credenciais, login e reset demonstrativos.

### Modelo do usuário autenticado

Após receber uma sessão válida, o repositório consultará:

- `profiles`, usando `auth.uid()` como identidade;
- `user_roles` com `roles`, para autorização e destino inicial;
- `user_addresses`, somente o endereço principal quando necessário ao modelo atual.

Se a sessão existir, mas o perfil ou o papel esperado não puder ser carregado, a aplicação falhará fechada: não exibirá portais, encerrará ou invalidará o estado local e mostrará uma mensagem segura para tentar novamente.

## Fluxos e rotas

### Login

1. O usuário informa e-mail e senha em `/login`.
2. A página chama a fachada de autenticação.
3. O repositório autentica no Supabase e carrega o usuário de domínio.
4. Administradores seguem para `/admin`.
5. Clientes seguem para `/cliente` ou `/cliente/nova-solicitacao` quando houver um serviço pendente selecionado na landing page.

Credenciais inválidas e conta ainda não confirmada terão mensagens em português, sem expor respostas brutas do provedor.

### Cadastro

1. `/cadastro` solicita nome, e-mail, senha e confirmação da senha.
2. O frontend exige senha com pelo menos oito caracteres e igualdade entre os campos.
3. O cadastro envia o nome como dado necessário à criação do perfil, mas não usa esse metadado para autorização.
4. A tela informa que o e-mail de confirmação foi enviado.
5. O link de confirmação usa somente URL previamente permitida no Supabase e retorna para `/login?confirmed=1`.

O novo usuário recebe o papel padrão `client` pela lógica já existente no banco. O frontend não pode escolher nem elevar papéis.

### Recuperação

1. `/recuperar-senha` aceita o e-mail.
2. A resposta visual será a mesma exista ou não uma conta, reduzindo enumeração de usuários.
3. O e-mail aponta para `/redefinir-senha`, usando uma URL fixa permitida.
4. A redefinição só é apresentada quando o Supabase estabelecer uma sessão de recuperação válida.
5. A nova senha exige confirmação e mínimo de oito caracteres.
6. Após a atualização, a sessão será encerrada e o usuário voltará ao login.

Não será aceito `returnTo`, domínio ou destino arbitrário vindo da URL.

### Logout

O logout invalida a sessão através do Supabase, limpa o estado autenticado em memória e redireciona para `/login`. Falhas de rede não manterão a interface aparentando acesso válido.

## Contrato de erros

As operações retornarão resultados tipados, em vez de lançar mensagens do Supabase para as páginas. Os códigos mínimos serão:

- `invalid_credentials`;
- `email_not_confirmed`;
- `email_already_registered`;
- `invalid_recovery_session`;
- `weak_password`;
- `network_error`;
- `profile_unavailable`;
- `configuration_error`;
- `unexpected_error`.

As mensagens exibidas serão curtas, em português e sem e-mail completo, identificador interno, SQL, token, stack trace ou texto bruto do provedor. Botões ficarão desabilitados durante cada requisição para impedir submissões duplicadas.

## Controles OWASP

O baseline será OWASP Top 10:2025, com requisitos verificáveis neste corte.

### A01 — Broken Access Control

- RLS permanece como autoridade para banco e Storage.
- Guardas de rota não serão consideradas controles de autorização.
- Papéis vêm de tabelas protegidas; nunca de `localStorage`, query string ou `user_metadata`.
- O frontend não utilizará `service_role`.
- Testes validarão que cliente não acessa dados administrativos nem dados de outro cliente, e que usuário anônimo acessa somente o catálogo público previsto.

### A02 — Security Misconfiguration

- Validação explícita das variáveis públicas do frontend.
- Cabeçalhos no `netlify.toml`: Content Security Policy, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e proteção contra framing.
- A CSP permitirá apenas as origens necessárias para o próprio site e para o projeto Supabase. Não serão liberados curingas genéricos.
- HSTS será enviado no ambiente HTTPS publicado.
- As URLs de confirmação e recuperação deverão ser cadastradas explicitamente na configuração de Auth.
- O Security Advisor e o linter do Supabase deverão continuar sem erros relevantes.

### A03 e A08 — Supply Chain e integridade

- Dependências instaladas pelo npm e registradas no `package-lock.json`.
- Auditoria de dependências fará parte da verificação; achados serão classificados por explorabilidade e impacto, sem atualizações destrutivas automáticas.
- Não haverá scripts remotos de terceiros ou dependências adicionadas sem necessidade.

### A04 — Cryptographic Failures

- Senhas serão tratadas exclusivamente pelo Supabase Auth.
- O aplicativo não armazenará senha, hash próprio, refresh token customizado ou credencial em tabelas públicas.
- Produção usará HTTPS; segredos não serão incluídos no bundle, logs ou repositório.

### A05 — Injection

- Consultas usarão a API parametrizada do cliente Supabase.
- Dados do usuário serão renderizados pela codificação padrão do React.
- Não será introduzido `dangerouslySetInnerHTML`, construção manual de SQL ou execução de conteúdo fornecido pelo usuário.
- Campos terão limites e validação coerentes com o banco.

### A06 — Insecure Design

- Fluxos sensíveis terão estados explícitos e falharão fechados.
- Recuperação não revelará se a conta existe.
- Destinos de redirecionamento serão construídos a partir de rotas fixas da aplicação.
- Rate limits nativos do Supabase serão mantidos; CAPTCHA será backlog caso abuso real ou exposição pública justifique o custo.

### A07 — Authentication Failures

- Confirmação de e-mail obrigatória.
- Senha mínima validada no cliente e sujeita à política configurada no Supabase.
- Recuperação será feita pelo fluxo de uso único do Supabase, sem token criado pela aplicação.
- A sessão será restaurada pelo SDK e observada por eventos de autenticação.
- MFA TOTP obrigatório para administradores será o primeiro item do backlog pós-MVP.

### A09 — Logging and Alerting Failures

- O navegador não registrará senha, token, CPF, e-mail completo ou respostas sensíveis.
- Erros visíveis serão sanitizados.
- Eventos administrativos e de domínio continuarão usando as estruturas de auditoria do banco; observabilidade ampliada de autenticação ficará como etapa operacional antes da produção.

### A10 — Mishandling of Exceptional Conditions

- Erros de rede, sessão expirada, perfil ausente e callback inválido terão caminhos definidos.
- Conteúdo protegido não aparecerá durante estados indeterminados.
- Rejeições assíncronas serão capturadas e traduzidas para o contrato de erros.
- A aplicação não seguirá com um usuário demonstrativo quando a autenticação real falhar.

## Cabeçalhos e CSP

O `netlify.toml` será atualizado com uma política compatível com a aplicação Vite e o endpoint HTTPS do projeto Supabase. A política inicial será restritiva:

- `default-src 'self'`;
- scripts somente da própria aplicação;
- estilos próprios e o mínimo atualmente necessário;
- imagens próprias, `data:` e origens realmente utilizadas;
- `connect-src` limitado ao próprio site e ao projeto Supabase;
- `object-src 'none'`;
- `base-uri 'self'`;
- `form-action 'self'`;
- `frame-ancestors 'none'`;
- `upgrade-insecure-requests` na publicação.

O build e os recursos existentes serão verificados após a aplicação da CSP para evitar bloqueios acidentais.

## Testes

### Unidade

- mapeamento de perfil e papéis, incluindo prioridade de `admin`;
- tradução dos erros do Supabase para códigos internos;
- validação de cadastro, senha e confirmação;
- recuperação com resposta genérica;
- rejeição de sessão de recuperação inválida;
- restauração e logout.

### Componentes e rotas

- carregamento inicial sem flash de rota protegida;
- usuário anônimo redirecionado ao login;
- cliente impedido de abrir rota administrativa;
- administrador redirecionado ao portal administrativo;
- navegação entre login, cadastro e recuperação;
- formulários desabilitados durante requisições e mensagens acessíveis.

### Segurança e banco

- usuário anônimo limitado ao catálogo permitido;
- cliente limitado às próprias linhas;
- cliente impedido de atribuir a si mesmo o papel administrativo;
- administrador com acesso administrativo previsto;
- policies e grants revisados em conjunto, pois RLS não substitui permissões da Data API.

### Verificação final

- `npm run check`;
- build de produção;
- inspeção do bundle para ausência de segredos;
- `npm audit` com análise dos achados;
- lint e advisors do Supabase;
- teste manual dos quatro fluxos com URLs local e publicada;
- validação dos cabeçalhos na resposta publicada.

## Configuração operacional

Antes do teste publicado, será necessário configurar no Dashboard:

- confirmação de e-mail habilitada;
- Site URL da aplicação;
- URLs adicionais para ambiente local e publicação;
- política de senha adequada ao MVP;
- expiração de OTP em até uma hora;
- rate limits revisados;
- SMTP próprio, CAPTCHA e MFA avaliados antes de uma abertura pública relevante.

Alterações que dependam de credenciais externas ou decisões de domínio serão documentadas, não simuladas no código.

## Critérios de aceite

- Não existem credenciais demonstrativas nem fallback de login.
- Os quatro fluxos funcionam com Supabase Auth.
- Uma sessão é restaurada sem expor conteúdo de outro papel.
- O usuário autenticado é formado a partir de Auth, perfil e papéis reais.
- Clientes não conseguem promover o próprio papel.
- Nenhum segredo é enviado no bundle.
- Recuperação não enumera contas e não aceita redirecionamento aberto.
- Cabeçalhos de segurança não quebram a aplicação.
- Testes automatizados e verificações do projeto passam.
- MFA está explicitamente registrado como backlog prioritário, sem implementação parcial enganosa.

## Referências

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
