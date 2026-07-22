# Backend da Vértice Consultoria

O backend é gerida por um backend Supabase localizado em `supabase/`. Ele é independente do frontend atual, que continua no modo demonstrativo até que um endpoint de domínio seja integrado pela fachada `features/portal-data`.

## Base instalada

- Supabase;
- Postgres;

## Executar localmente

registrar aqui*

## Responsabilidades futuras

O backend será responsável por:

- autenticação, autorização e gestão segura de sessões;
- persistência definitiva de usuários, casos, documentos e notificações;
- validação de entrada e aplicação das regras de negócio no limite confiável do sistema;
- integrações com serviços externos, incluindo armazenamento de arquivos e eventuais recursos de IA;
- proteção de segredos, auditoria, observabilidade e tarefas assíncronas.

O frontend continuará responsável pela experiência de uso, navegação e estado transitório de interface. Enquanto não houver uma API, a implementação demonstrativa local permanece inteiramente no workspace `frontend`.

## Fronteiras

- O frontend não deve acessar banco de dados, chaves privadas ou SDKs administrativos diretamente.
- Recursos de IA e integrações externas devem ser mediados pelo backend.
- Contratos compartilhados só devem ser extraídos quando existir o primeiro endpoint real; até lá, não será criado um pacote especulativo.
- A forma persistida do modo demonstrativo não é, por si só, um contrato de API.

## Decisões ainda abertas

Devem ser decididos com base nos requisitos do produto e da equipe:

- banco de produção, migrações e estratégia de backup;
- provedor de identidade e modelo de permissões;
- armazenamento, limites e varredura de documentos enviados;
- filas, tarefas agendadas e processamento de IA;
- observabilidade, ambientes e política de retenção de dados.

## Próximas etapas

1. Registre em `docs/state.md` decisões de produção, especialmente banco e Redis.
2. Defina o primeiro endpoint e documente autenticação, entrada, saída e erros antes de integrar o frontend.
3. Extraia `packages/contracts` apenas se houver tipos ou esquemas realmente compartilhados entre os dois lados.
4. Adicione validações, testes, variáveis de ambiente exemplificadas e etapas de CI sem versionar segredos.
5. Substitua gradualmente o repositório demonstrativo do frontend por uma implementação HTTP, preservando a fachada consumida pelas páginas.
