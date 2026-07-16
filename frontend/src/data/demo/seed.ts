import type {
  Case,
  CaseDocument,
  CaseStatus,
  DemoState,
  DocumentStatus,
  MockDocumentAsset,
  Property,
  TimelineEvent,
  User,
} from '@/data/demo/types';

export const DEMO_STATE_VERSION = 1;
export const DEMO_CLIENT_ID = 'user-client-demo';
export const DEMO_ADMIN_ID = 'user-admin-demo';
export const DEMO_SECOND_CLIENT_ID = 'user-client-fernanda';

export const DEMO_USERS: ReadonlyArray<User> = [
  {
    id: DEMO_CLIENT_ID,
    role: 'client',
    name: 'Marina Oliveira',
    email: 'cliente@demo.com',
    cpf: '123.456.789-00',
    phone: '(85) 99999-1001',
    address: 'Rua das Palmeiras, 120 · Fortaleza, CE',
    createdAt: '2026-05-10T14:00:00.000Z',
  },
  {
    id: DEMO_ADMIN_ID,
    role: 'admin',
    name: 'Wesdrino Administrador',
    email: 'admin@demo.com',
    cpf: '000.000.000-00',
    phone: '(85) 99999-2002',
    address: 'Fortaleza, CE',
    createdAt: '2026-05-01T12:00:00.000Z',
  },
  {
    id: DEMO_SECOND_CLIENT_ID,
    role: 'client',
    name: 'Fernanda Alves',
    email: 'fernanda@demo.com',
    cpf: '987.654.321-00',
    phone: '(85) 99999-3003',
    address: 'Av. Beira Mar, 880 · Fortaleza, CE',
    createdAt: '2026-06-02T11:00:00.000Z',
  },
] as const;

export const MOCK_DOCUMENT_ASSETS: ReadonlyArray<MockDocumentAsset> = [
  {
    id: 'asset-rg-cpf',
    kind: 'rg-cpf',
    name: 'RG/CPF',
    fileName: 'rg-cpf-exemplo.pdf',
    sizeLabel: '1,2 MB',
    description: 'Documento de identificação com CPF do titular.',
  },
  {
    id: 'asset-comprovante-residencia',
    kind: 'comprovante-residencia',
    name: 'Comprovante de residência',
    fileName: 'comprovante-residencia-exemplo.pdf',
    sizeLabel: '680 KB',
    description: 'Conta recente usada apenas como exemplo nesta demonstração.',
  },
  {
    id: 'asset-matricula-imovel',
    kind: 'matricula-imovel',
    name: 'Matrícula do imóvel',
    fileName: 'matricula-imovel-exemplo.pdf',
    sizeLabel: '2,4 MB',
    description: 'Certidão de matrícula fictícia do imóvel.',
  },
  {
    id: 'asset-iptu',
    kind: 'iptu',
    name: 'IPTU',
    fileName: 'iptu-exemplo.pdf',
    sizeLabel: '920 KB',
    description: 'Espelho cadastral ou carnê de IPTU fictício.',
  },
  {
    id: 'asset-contrato-compra-venda',
    kind: 'contrato-compra-venda',
    name: 'Contrato de compra e venda',
    fileName: 'contrato-compra-venda-exemplo.pdf',
    sizeLabel: '3,1 MB',
    description: 'Contrato particular fictício para simular o envio.',
  },
  {
    id: 'asset-fotos-imovel',
    kind: 'fotos-imovel',
    name: 'Fotos do imóvel',
    fileName: 'fotos-imovel-exemplo.zip',
    sizeLabel: '8,6 MB',
    description: 'Conjunto fictício de imagens externas e internas.',
  },
] as const;

function createUsers(): User[] {
  return DEMO_USERS.map((user) => ({ ...user }));
}

function createAssets(): MockDocumentAsset[] {
  return MOCK_DOCUMENT_ASSETS.map((asset) => ({ ...asset }));
}

function createProperty(id: string, overrides: Partial<Property> = {}): Property {
  return {
    id,
    type: 'Casa',
    address: 'Rua das Acácias',
    number: '245',
    neighborhood: 'Aldeota',
    city: 'Fortaleza',
    state: 'CE',
    postalCode: '60150-000',
    registrationNumber: '12.345 · 2º Ofício',
    iptuNumber: 'IPTU-2026-001245',
    ...overrides,
  };
}

function createDocument(
  caseId: string,
  asset: MockDocumentAsset,
  status: DocumentStatus,
  updatedAt: string,
  options: { required?: boolean; rejectionReason?: string } = {},
): CaseDocument {
  const hasVersion = status !== 'Pendente';

  return {
    id: `${caseId}-doc-${asset.kind}`,
    kind: asset.kind,
    label: asset.name,
    required: options.required ?? asset.kind !== 'fotos-imovel',
    status,
    versions: hasVersion
      ? [
          {
            id: `${caseId}-version-${asset.kind}-1`,
            assetId: asset.id,
            fileName: asset.fileName,
            sizeLabel: asset.sizeLabel,
            submittedAt: updatedAt,
            submittedBy: caseId === 'case-0003' ? DEMO_SECOND_CLIENT_ID : DEMO_CLIENT_ID,
          },
        ]
      : [],
    rejectionReason: options.rejectionReason,
    reviewedAt: status === 'Aprovado' || status === 'Rejeitado' ? updatedAt : undefined,
    reviewedBy: status === 'Aprovado' || status === 'Rejeitado' ? DEMO_ADMIN_ID : undefined,
    updatedAt,
  };
}

function createTimelineEvent(
  caseId: string,
  id: string,
  type: TimelineEvent['type'],
  title: string,
  createdAt: string,
  actorId: string,
  actorRole: TimelineEvent['actorRole'],
  description?: string,
): TimelineEvent {
  return { id, caseId, type, title, description, actorId, actorRole, createdAt };
}

function createSeedCase(input: {
  id: string;
  protocol: string;
  clientId: string;
  serviceId: string;
  objective: string;
  status: CaseStatus;
  property: Property;
  documentStatuses: DocumentStatus[];
  createdAt: string;
  updatedAt: string;
}): Case {
  const documents = MOCK_DOCUMENT_ASSETS.map((asset, index) =>
    createDocument(input.id, asset, input.documentStatuses[index] ?? 'Pendente', input.updatedAt),
  );

  return {
    id: input.id,
    protocol: input.protocol,
    clientId: input.clientId,
    serviceId: input.serviceId,
    objective: input.objective,
    status: input.status,
    property: { ...input.property },
    documents,
    timeline: [
      createTimelineEvent(
        input.id,
        `${input.id}-event-created`,
        'case-created',
        'Solicitação criada',
        input.createdAt,
        input.clientId,
        'client',
        `Protocolo ${input.protocol} criado na demonstração.`,
      ),
      createTimelineEvent(
        input.id,
        `${input.id}-event-status`,
        'status-changed',
        `Status atualizado para ${input.status}`,
        input.updatedAt,
        input.status === 'Novo' ? input.clientId : DEMO_ADMIN_ID,
        input.status === 'Novo' ? 'client' : 'admin',
      ),
    ],
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

function createCases(): Case[] {
  return [
    createSeedCase({
      id: 'case-0001',
      protocol: 'RV-2026-0001',
      clientId: DEMO_CLIENT_ID,
      serviceId: 'regularizacao-imoveis',
      objective: 'Organizar a documentação para regularizar a casa da família.',
      status: 'Documentos pendentes',
      property: createProperty('property-0001'),
      documentStatuses: ['Aprovado', 'Enviado', 'Pendente', 'Enviado', 'Pendente', 'Enviado'],
      createdAt: '2026-06-12T13:00:00.000Z',
      updatedAt: '2026-07-08T16:30:00.000Z',
    }),
    createSeedCase({
      id: 'case-0002',
      protocol: 'RV-2026-0002',
      clientId: DEMO_CLIENT_ID,
      serviceId: 'analise-valor-mercado',
      objective: 'Compreender o valor de mercado antes de negociar o imóvel.',
      status: 'Análise técnica',
      property: createProperty('property-0002', {
        type: 'Apartamento',
        address: 'Av. Santos Dumont',
        number: '3100',
        complement: 'Apto 902',
        registrationNumber: '45.678 · 1º Ofício',
      }),
      documentStatuses: ['Aprovado', 'Aprovado', 'Aprovado', 'Aprovado', 'Pendente', 'Aprovado'],
      createdAt: '2026-05-22T10:00:00.000Z',
      updatedAt: '2026-07-07T14:15:00.000Z',
    }),
    createSeedCase({
      id: 'case-0003',
      protocol: 'RV-2026-0003',
      clientId: DEMO_SECOND_CLIENT_ID,
      serviceId: 'escritura',
      objective: 'Preparar os documentos para formalizar a aquisição do imóvel.',
      status: 'Documentos em análise',
      property: createProperty('property-0003', {
        type: 'Terreno',
        address: 'Rua do Sol',
        number: 'S/N',
        neighborhood: 'Meireles',
        registrationNumber: '78.901 · 3º Ofício',
      }),
      documentStatuses: ['Em análise', 'Aprovado', 'Em análise', 'Enviado', 'Enviado', 'Pendente'],
      createdAt: '2026-07-02T15:00:00.000Z',
      updatedAt: '2026-07-10T11:40:00.000Z',
    }),
  ];
}

export function createDemoSeed(): DemoState {
  return {
    version: DEMO_STATE_VERSION,
    users: createUsers(),
    cases: createCases(),
    notifications: [
      {
        id: 'notification-client-0001',
        userId: DEMO_CLIENT_ID,
        type: 'status-changed',
        title: 'Processo em análise técnica',
        message: 'O protocolo RV-2026-0002 avançou para análise técnica.',
        caseId: 'case-0002',
        createdAt: '2026-07-07T14:15:00.000Z',
      },
      {
        id: 'notification-admin-0001',
        userId: DEMO_ADMIN_ID,
        type: 'document-submitted',
        title: 'Documentos aguardam análise',
        message: 'O protocolo RV-2026-0003 tem documentos enviados.',
        caseId: 'case-0003',
        createdAt: '2026-07-10T11:40:00.000Z',
      },
    ],
    mockDocumentAssets: createAssets(),
    updatedAt: '2026-07-10T11:40:00.000Z',
  };
}
