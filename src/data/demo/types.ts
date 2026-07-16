export const CASE_STATUSES = [
  'Novo',
  'Documentos pendentes',
  'Documentos em análise',
  'Análise técnica',
  'Prefeitura/cartório',
  'Aguardando cliente',
  'Concluído',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  'Pendente',
  'Enviado',
  'Em análise',
  'Aprovado',
  'Rejeitado',
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  signedInAt: string;
}

export interface Property {
  id: string;
  type: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  registrationNumber?: string;
  iptuNumber?: string;
  notes?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  services: Service[];
}

export interface DocumentVersion {
  id: string;
  assetId: string;
  fileName: string;
  sizeLabel: string;
  submittedAt: string;
  submittedBy: string;
}

export interface CaseDocument {
  id: string;
  kind: string;
  label: string;
  required: boolean;
  status: DocumentStatus;
  versions: DocumentVersion[];
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  updatedAt: string;
}

export type TimelineEventType =
  | 'case-created'
  | 'document-added'
  | 'document-resubmitted'
  | 'document-review-started'
  | 'document-approved'
  | 'document-rejected'
  | 'status-changed'
  | 'whatsapp-started';

export interface TimelineEvent {
  id: string;
  caseId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  actorId: string;
  actorRole: UserRole;
  createdAt: string;
}

export type NotificationType =
  | 'new-case'
  | 'document-submitted'
  | 'document-approved'
  | 'document-rejected'
  | 'status-changed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  caseId?: string;
  documentId?: string;
  createdAt: string;
  readAt?: string;
}

export interface MockDocumentAsset {
  id: string;
  kind: string;
  name: string;
  fileName: string;
  sizeLabel: string;
  description: string;
}

export interface Case {
  id: string;
  protocol: string;
  clientId: string;
  serviceId: string;
  objective: string;
  status: CaseStatus;
  property: Property;
  documents: CaseDocument[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type PendingActionKind =
  | 'client-document'
  | 'admin-document-review'
  | 'client-response';

export interface PendingAction {
  id: string;
  caseId: string;
  protocol: string;
  kind: PendingActionKind;
  title: string;
  documentId?: string;
  createdAt: string;
}

export interface DemoState {
  version: number;
  users: User[];
  cases: Case[];
  notifications: Notification[];
  mockDocumentAssets: MockDocumentAsset[];
  updatedAt: string;
}

