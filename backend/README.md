# Backend da Vértice Consultoria

Este diretório reserva a fronteira do backend sem antecipar uma tecnologia antes de existirem requisitos de integração reais. Nesta etapa ele é apenas documental: não há servidor, banco de dados, endpoint ou contrato de API implementado.

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

- linguagem, framework e modelo de implantação;
- banco de dados, migrações e estratégia de backup;
- provedor de identidade e modelo de permissões;
- armazenamento, limites e varredura de documentos enviados;
- filas, tarefas agendadas e processamento de IA;
- observabilidade, ambientes e política de retenção de dados.

## Como adicionar o backend no futuro

1. Registre em `docs/state.md` as decisões de stack e os motivos que não forem óbvios no código.
2. Crie o projeto dentro de `backend/`, mantendo seus comandos executáveis pela raiz do repositório.
3. Defina o primeiro endpoint e documente autenticação, entrada, saída e erros antes de integrar o frontend.
4. Extraia `packages/contracts` apenas se houver tipos ou esquemas realmente compartilhados entre os dois lados.
5. Adicione validações, testes, variáveis de ambiente exemplificadas e etapas de CI sem versionar segredos.
6. Substitua gradualmente o repositório demonstrativo do frontend por uma implementação HTTP, preservando a fachada consumida pelas páginas.
