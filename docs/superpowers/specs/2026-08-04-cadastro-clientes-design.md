# Cadastro público de clientes

## Objetivo

Remover da página de login os atalhos que preenchem credenciais demonstrativas e oferecer um cadastro público de clientes integrado ao Supabase Auth. O cadastro administrativo permanece fora da interface pública.

## Escopo

- Criar a rota pública `/cadastro`, carregada sob demanda.
- Adicionar um formulário com nome, e-mail, senha e confirmação de senha.
- Validar campos obrigatórios, formato do e-mail, senha com no mínimo 8 caracteres e igualdade entre senha e confirmação.
- Criar novas contas exclusivamente com o papel `client`, usando o gatilho de banco já existente.
- Entrar automaticamente no portal quando o Supabase retornar uma sessão no cadastro.
- Quando a confirmação de e-mail estiver habilitada e nenhuma sessão for criada, orientar o usuário a verificar a caixa de entrada e oferecer acesso ao login.
- Preservar o serviço escolhido na landing page e, após autenticação automática, abrir `/cliente/nova-solicitacao`.
- Remover os cartões e a lógica de “Preencher uma conta demo” da página de login.
- Adicionar ao login um link para `/cadastro`.
- Manter o botão “Reiniciar demonstração”, pois ele restaura dados locais e não preenche credenciais.

## Arquitetura e componentes

`RegisterPage` será uma página independente em `src/pages/register/`, seguindo a composição visual e os padrões de acessibilidade de `LoginPage`. A página receberá uma função `onSignUp` por propriedade e não importará a infraestrutura Supabase diretamente.

O contrato `AuthRepository.signUp` passará a retornar `AuthenticatedUser | null`: um usuário autenticado quando o Supabase criar uma sessão e `null` quando a conta depender de confirmação de e-mail. `SupabaseAuthRepository` continuará enviando apenas `name` como metadado de perfil; o gatilho existente em `auth.users` criará `public.profiles` e atribuirá o papel `client`.

`PortalDataProvider` refletirá imediatamente uma sessão retornada pelo cadastro em `session`, `currentUser` e `authStatus`. `RootApp` coordenará os redirecionamentos e manterá a página desacoplada do roteador e do Supabase.

## Fluxos

### Cadastro com sessão imediata

1. O visitante abre `/cadastro` pelo link do login.
2. Preenche e envia dados válidos.
3. O Supabase cria a conta, o gatilho cria o perfil e atribui o papel `client`.
4. O repositório hidrata o perfil e retorna o usuário autenticado.
5. A aplicação abre `/cliente` ou `/cliente/nova-solicitacao` quando houver um serviço pendente.

### Cadastro sujeito a confirmação de e-mail

1. O Supabase cria a conta sem sessão.
2. A página informa que um e-mail de confirmação foi enviado.
3. O usuário pode voltar ao login após confirmar o endereço.

### Falha

Erros conhecidos serão apresentados em português: e-mail já cadastrado, senha fraca, indisponibilidade de rede, configuração inválida e erro inesperado. O envio ficará bloqueado enquanto a requisição estiver em andamento, e os dados digitados serão preservados após falha.

## Segurança

- A interface não permitirá escolher papel; todo cadastro público recebe `client` no banco.
- Autorização continuará baseada em `public.user_roles`, nunca em metadados editáveis pelo usuário.
- Nenhuma chave privilegiada será adicionada ao frontend.
- Senhas não serão persistidas nem registradas.
- O comportamento de enumeração de e-mails seguirá o retorno do Supabase, que pode ocultar a existência de contas quando a confirmação de e-mail está habilitada.

## Testes

- Testes de `RegisterPage` cobrirão validação, bloqueio durante envio, mensagens de erro e os resultados com e sem sessão.
- Testes de rotas cobrirão `/cadastro`, o link no login, o redirecionamento autenticado e a preservação do serviço pendente.
- Testes do repositório Supabase cobrirão normalização dos dados, envio do metadado `name` e hidratação condicional da sessão retornada.
- Os testes do login passarão a garantir a ausência dos atalhos de preenchimento demo e a presença do link de cadastro.
- A validação final executará lint, formatação, tipos, testes e build pelo comando canônico `npm run check`.

## Fora do escopo

- Cadastro público de administradores.
- Recuperação ou redefinição de senha.
- Alterações nas políticas de autorização ou no esquema do banco, pois o gatilho e o papel padrão já existem.
- Remoção global dos dados demonstrativos ou do botão de reinicialização.
