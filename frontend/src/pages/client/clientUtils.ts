import type {
  CaseStatus,
  DocumentStatus,
  PendingAction,
  Property,
  TimelineEventType
} from "@/domain/types";

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(new Date(value));
}

export function getCaseStatusStep(status: CaseStatus) {
  const steps: CaseStatus[] = [
    "Novo",
    "Documentos pendentes",
    "Documentos em análise",
    "Análise técnica",
    "Prefeitura/cartório",
    "Aguardando cliente",
    "Concluído"
  ];
  return steps.indexOf(status);
}

export function getDocumentActionLabel(status: DocumentStatus) {
  return status === "Rejeitado" ? "Nova versão" : "Adicionar exemplo";
}

export function getTimelineIconLabel(type: TimelineEventType) {
  if (type.startsWith("document")) return "Documento";
  if (type === "status-changed") return "Status";
  if (type === "whatsapp-started") return "WhatsApp";
  return "Solicitação";
}

export function formatPropertyAddress(property: Property) {
  const street = `${property.address}, ${property.number}`;
  const complement = property.complement ? ` · ${property.complement}` : "";
  return `${street}${complement} · ${property.neighborhood} · ${property.city}/${property.state}`;
}

export function formatPropertyLabel(property: Property) {
  return `${property.type} · ${formatPropertyAddress(property)}`;
}

export function getPendingActionHref(action: PendingAction) {
  const target = action.documentId
    ? `documento-${action.documentId}`
    : "contato-processo";
  return `/cliente/processos/${action.caseId}#${target}`;
}
