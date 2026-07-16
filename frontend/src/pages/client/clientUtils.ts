import type {
  CaseStatus,
  DocumentStatus,
  PendingAction,
  TimelineEventType
} from "@/domain/types";

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

export function getPendingActionHref(action: PendingAction) {
  const target = action.documentId
    ? `documento-${action.documentId}`
    : "contato-processo";
  return `/cliente/processos/${action.caseId}#${target}`;
}
