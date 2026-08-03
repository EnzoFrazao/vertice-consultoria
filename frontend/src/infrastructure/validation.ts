import { getServiceById } from "@/domain/catalog";
import {
  CASE_STATUSES,
  DOCUMENT_STATUSES,
  NOTIFICATION_TYPES,
  TIMELINE_EVENT_TYPES,
  USER_ROLES,
  type AuthSession,
  type DemoState
} from "@/domain/types";
import { DEMO_STATE_VERSION } from "@/infrastructure/seed";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isDateString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function isOptionalDateString(value: unknown): value is string | undefined {
  return value === undefined || isDateString(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return isString(value) && allowed.includes(value as T);
}

function isUser(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isOneOf(value.role, USER_ROLES) &&
    isString(value.name) &&
    isString(value.email) &&
    isString(value.cpf) &&
    isString(value.phone) &&
    isString(value.address) &&
    isDateString(value.createdAt)
  );
}

function isProperty(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.type) &&
    isString(value.address) &&
    isString(value.number) &&
    isOptionalString(value.complement) &&
    isString(value.neighborhood) &&
    isString(value.city) &&
    isString(value.state) &&
    isString(value.postalCode) &&
    isOptionalString(value.registrationNumber) &&
    isOptionalString(value.iptuNumber) &&
    isOptionalString(value.notes)
  );
}

function isDocumentVersion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.assetId) &&
    isString(value.fileName) &&
    isString(value.sizeLabel) &&
    isDateString(value.submittedAt) &&
    isString(value.submittedBy)
  );
}

function isCaseDocument(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.kind) &&
    isString(value.label) &&
    typeof value.required === "boolean" &&
    isOneOf(value.status, DOCUMENT_STATUSES) &&
    Array.isArray(value.versions) &&
    value.versions.every(isDocumentVersion) &&
    isOptionalString(value.rejectionReason) &&
    isOptionalDateString(value.reviewedAt) &&
    isOptionalString(value.reviewedBy) &&
    isDateString(value.updatedAt)
  );
}

function isTimelineEvent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.caseId) &&
    isOneOf(value.type, TIMELINE_EVENT_TYPES) &&
    isString(value.title) &&
    isOptionalString(value.description) &&
    isString(value.actorId) &&
    isOneOf(value.actorRole, USER_ROLES) &&
    isDateString(value.createdAt)
  );
}

function isCase(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.protocol) &&
    isString(value.clientId) &&
    isString(value.serviceId) &&
    isString(value.objective) &&
    isOneOf(value.status, CASE_STATUSES) &&
    isProperty(value.property) &&
    Array.isArray(value.documents) &&
    value.documents.every(isCaseDocument) &&
    Array.isArray(value.timeline) &&
    value.timeline.every(isTimelineEvent) &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt) &&
    isOptionalDateString(value.completedAt)
  );
}

function isNotification(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.userId) &&
    isOneOf(value.type, NOTIFICATION_TYPES) &&
    isString(value.title) &&
    isString(value.message) &&
    isOptionalString(value.caseId) &&
    isOptionalString(value.documentId) &&
    isDateString(value.createdAt) &&
    isOptionalDateString(value.readAt)
  );
}

function isMockDocumentAsset(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.kind) &&
    isString(value.name) &&
    isString(value.fileName) &&
    isString(value.sizeLabel) &&
    isString(value.description)
  );
}

function hasUniqueIds(items: ReadonlyArray<{ id: string }>): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function hasValidIntegrity(state: DemoState): boolean {
  const documents = state.cases.flatMap((item) => item.documents);
  const versions = documents.flatMap((document) => document.versions);
  const timeline = state.cases.flatMap((item) => item.timeline);
  const properties = state.cases.map((item) => item.property);

  if (
    !hasUniqueIds(state.users) ||
    !hasUniqueIds(state.cases) ||
    !hasUniqueIds(properties) ||
    !hasUniqueIds(documents) ||
    !hasUniqueIds(versions) ||
    !hasUniqueIds(timeline) ||
    !hasUniqueIds(state.notifications) ||
    !hasUniqueIds(state.mockDocumentAssets)
  ) {
    return false;
  }

  const usersById = new Map(state.users.map((user) => [user.id, user]));
  const casesById = new Map(state.cases.map((item) => [item.id, item]));
  const assetsById = new Map(state.mockDocumentAssets.map((asset) => [asset.id, asset]));

  for (const item of state.cases) {
    const client = usersById.get(item.clientId);
    if (!client || client.role !== "client" || !getServiceById(item.serviceId)) {
      return false;
    }

    for (const event of item.timeline) {
      const actor = usersById.get(event.actorId);
      if (event.caseId !== item.id || !actor || actor.role !== event.actorRole) {
        return false;
      }
    }

    for (const document of item.documents) {
      if (document.reviewedBy && !usersById.has(document.reviewedBy)) {
        return false;
      }

      for (const version of document.versions) {
        const asset = assetsById.get(version.assetId);
        if (!asset || asset.kind !== document.kind || !usersById.has(version.submittedBy)) {
          return false;
        }
      }
    }
  }

  for (const notification of state.notifications) {
    if (!usersById.has(notification.userId)) return false;

    const relatedCase = notification.caseId ? casesById.get(notification.caseId) : undefined;
    if (notification.caseId && !relatedCase) return false;
    if (
      notification.documentId &&
      (!relatedCase ||
        !relatedCase.documents.some((document) => document.id === notification.documentId))
    ) {
      return false;
    }
  }

  return true;
}

export function isDemoState(value: unknown): value is DemoState {
  if (!isRecord(value)) return false;
  const hasValidShape =
    value.version === DEMO_STATE_VERSION &&
    Array.isArray(value.users) &&
    value.users.every(isUser) &&
    Array.isArray(value.cases) &&
    value.cases.every(isCase) &&
    Array.isArray(value.notifications) &&
    value.notifications.every(isNotification) &&
    Array.isArray(value.mockDocumentAssets) &&
    value.mockDocumentAssets.every(isMockDocumentAsset) &&
    isDateString(value.updatedAt);

  return hasValidShape && hasValidIntegrity(value as unknown as DemoState);
}

export function isAuthSession(value: unknown, state: DemoState): value is AuthSession {
  if (!isRecord(value)) return false;
  if (
    !isString(value.userId) ||
    !isOneOf(value.role, USER_ROLES) ||
    !isDateString(value.signedInAt)
  ) {
    return false;
  }

  const user = state.users.find((item) => item.id === value.userId);
  return Boolean(user && user.role === value.role);
}
