import type { Case, CaseDocument } from "@/domain/types";
import type { DemoActionContext } from "@/infrastructure/actions/context";
import type { DocumentReview } from "@/infrastructure/contracts";

export function createDocumentActions(context: DemoActionContext) {
  function startDocumentReview(caseId: string, documentId: string, actorId: string) {
    context.requireRole(actorId, "admin");
    const item = context.getCase(caseId);
    if (item.status === "Concluído") {
      throw new Error("O processo concluído é somente leitura.");
    }
    const document = context.getDocument(item, documentId);
    if (document.status !== "Enviado") {
      throw new Error("Apenas documentos enviados podem entrar em análise.");
    }

    const updatedAt = context.now().toISOString();
    const updatedDocument: CaseDocument = {
      ...document,
      status: "Em análise",
      updatedAt
    };
    const event = context.createTimelineEvent({
      caseId,
      type: "document-review-started",
      title: `Análise de ${document.label} iniciada`,
      actorId
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate
      ),
      timeline: [...item.timeline, event],
      updatedAt
    };
    context.replaceCase(updatedCase);
    return updatedDocument;
  }

  function reviewDocument(
    caseId: string,
    documentId: string,
    review: DocumentReview,
    actorId: string
  ) {
    context.requireRole(actorId, "admin");
    const item = context.getCase(caseId);
    if (item.status === "Concluído") {
      throw new Error("O processo concluído é somente leitura.");
    }
    const document = context.getDocument(item, documentId);
    if (document.status !== "Em análise") {
      throw new Error("Inicie a análise antes de revisar o documento.");
    }
    const reason = review.decision === "reject" ? review.reason.trim() : undefined;
    if (review.decision === "reject" && !reason) {
      throw new Error("Informe o motivo da rejeição.");
    }

    const approved = review.decision === "approve";
    const updatedAt = context.now().toISOString();
    const updatedDocument: CaseDocument = {
      ...document,
      status: approved ? "Aprovado" : "Rejeitado",
      rejectionReason: approved ? undefined : reason,
      reviewedAt: updatedAt,
      reviewedBy: actorId,
      updatedAt
    };
    const event = context.createTimelineEvent({
      caseId,
      type: approved ? "document-approved" : "document-rejected",
      title: `${document.label} ${approved ? "aprovado" : "rejeitado"}`,
      actorId,
      description: reason
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate
      ),
      timeline: [...item.timeline, event],
      updatedAt
    };
    const notification = context.createNotification({
      userId: item.clientId,
      type: approved ? "document-approved" : "document-rejected",
      title: `${document.label} ${approved ? "aprovado" : "precisa de ajuste"}`,
      message: approved
        ? `O documento do protocolo ${item.protocol} foi aprovado.`
        : `${reason} Protocolo ${item.protocol}.`,
      caseId,
      documentId
    });
    context.replaceCase(updatedCase, [notification]);
    return updatedDocument;
  }

  function addMockDocumentVersion(
    caseId: string,
    documentId: string,
    assetId: string,
    actorId: string
  ) {
    context.requireRole(actorId, "client");
    const state = context.getState();
    const item = context.getCase(caseId);
    if (item.status === "Concluído") {
      throw new Error("O processo concluído é somente leitura.");
    }
    if (item.clientId !== actorId) {
      throw new Error("Ação não permitida para este processo.");
    }
    const document = context.getDocument(item, documentId);
    if (!["Pendente", "Rejeitado"].includes(document.status)) {
      throw new Error("Este documento não está disponível para envio.");
    }
    const asset = state.mockDocumentAssets.find((candidate) => candidate.id === assetId);
    if (!asset || asset.kind !== document.kind) {
      throw new Error("Documento fictício incompatível.");
    }

    const updatedAt = context.now().toISOString();
    const isResubmission = document.versions.length > 0;
    const updatedDocument: CaseDocument = {
      ...document,
      status: "Enviado",
      versions: [
        ...document.versions,
        {
          id: context.nextId("version"),
          assetId: asset.id,
          fileName: asset.fileName,
          sizeLabel: asset.sizeLabel,
          submittedAt: updatedAt,
          submittedBy: actorId
        }
      ],
      rejectionReason: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
      updatedAt
    };
    const event = context.createTimelineEvent({
      caseId,
      type: isResubmission ? "document-resubmitted" : "document-added",
      title: `${document.label} ${isResubmission ? "reenviado" : "adicionado"}`,
      actorId
    });
    const updatedCase: Case = {
      ...item,
      documents: item.documents.map((candidate) =>
        candidate.id === documentId ? updatedDocument : candidate
      ),
      timeline: [...item.timeline, event],
      updatedAt
    };
    const notifications = state.users
      .filter((user) => user.role === "admin")
      .map((admin) =>
        context.createNotification({
          userId: admin.id,
          type: "document-submitted",
          title: isResubmission ? "Documento reenviado" : "Novo documento enviado",
          message: `${document.label} foi adicionado ao protocolo ${item.protocol}.`,
          caseId,
          documentId
        })
      );
    context.replaceCase(updatedCase, notifications);
    return updatedDocument;
  }

  return {
    startDocumentReview,
    reviewDocument,
    addMockDocumentVersion
  };
}
