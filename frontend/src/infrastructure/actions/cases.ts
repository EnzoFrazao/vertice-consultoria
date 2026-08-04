import { getServiceById } from "@/domain/catalog";
import { CASE_STATUSES } from "@/domain/types";
import type { Case, CaseDocument, CaseStatus } from "@/domain/types";
import type { CreateCaseInput } from "@/infrastructure/contracts";
import type { DemoActionContext } from "@/infrastructure/actions/context";

export function createCaseActions(context: DemoActionContext) {
  function updateUserProfile(userId: string, updates: { phone: string; address: string }) {
    const state = context.getState();
    const user = state.users.find((item) => item.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");

    return context.commit({
      ...state,
      users: state.users.map((item) =>
        item.id === userId ? { ...item, phone: updates.phone, address: updates.address } : item
      ),
      updatedAt: context.now().toISOString()
    });
  }

  function createCase(input: CreateCaseInput) {
    const state = context.getState();
    const client = context.requireRole(input.clientId, "client");
    const service = getServiceById(input.serviceId);
    if (!service) throw new Error("Serviço não encontrado.");
    if (!input.objective.trim()) {
      throw new Error("Informe o objetivo da solicitação.");
    }

    const createdAt = context.now().toISOString();
    const year = context.now().getFullYear();
    const sequence =
      state.cases.reduce((largest, item) => {
        const match = item.protocol.match(new RegExp(`^RV-${year}-(\\d{4})$`));
        return match ? Math.max(largest, Number(match[1])) : largest;
      }, 0) + 1;
    const protocol = `RV-${year}-${String(sequence).padStart(4, "0")}`;
    const caseId = context.nextId("case");
    const submittedAssetIds = new Set(input.submittedAssetIds ?? []);

    for (const assetId of submittedAssetIds) {
      if (!state.mockDocumentAssets.some((asset) => asset.id === assetId)) {
        throw new Error("Documento fictício não encontrado.");
      }
    }

    const documents: CaseDocument[] = state.mockDocumentAssets.map((asset) => {
      const submitted = submittedAssetIds.has(asset.id);
      return {
        id: `${caseId}-doc-${asset.kind}`,
        kind: asset.kind,
        label: asset.name,
        required: asset.kind !== "fotos-imovel",
        status: submitted ? "Enviado" : "Pendente",
        versions: submitted
          ? [
              {
                id: context.nextId("version"),
                assetId: asset.id,
                fileName: asset.fileName,
                sizeLabel: asset.sizeLabel,
                submittedAt: createdAt,
                submittedBy: client.id
              }
            ]
          : [],
        updatedAt: createdAt
      };
    });
    const allRequiredSubmitted = documents
      .filter((document) => document.required)
      .every((document) => document.status === "Enviado");
    const status: CaseStatus = allRequiredSubmitted
      ? "Documentos em análise"
      : "Documentos pendentes";
    const createdEvent = context.createTimelineEvent({
      caseId,
      type: "case-created",
      title: "Solicitação criada",
      actorId: client.id,
      description: `Protocolo ${protocol} criado para ${service.name}.`
    });
    const documentEvents = documents
      .filter((document) => document.status === "Enviado")
      .map((document) =>
        context.createTimelineEvent({
          caseId,
          type: "document-added",
          title: `${document.label} adicionado`,
          actorId: client.id
        })
      );
    const createdCase: Case = {
      id: caseId,
      protocol,
      clientId: client.id,
      serviceId: service.id,
      objective: input.objective.trim(),
      status,
      property: { ...input.property, id: context.nextId("property") },
      documents,
      timeline: [createdEvent, ...documentEvents],
      createdAt,
      updatedAt: createdAt
    };
    const adminNotifications = state.users
      .filter((user) => user.role === "admin")
      .flatMap((admin) => {
        const notifications = [
          context.createNotification({
            userId: admin.id,
            type: "new-case",
            title: "Nova solicitação recebida",
            message: `${client.name} criou o protocolo ${protocol}.`,
            caseId
          })
        ];
        if (documentEvents.length > 0) {
          notifications.push(
            context.createNotification({
              userId: admin.id,
              type: "document-submitted",
              title: "Novos documentos enviados",
              message: `${documentEvents.length} documento(s) foram adicionados ao protocolo ${protocol}.`,
              caseId
            })
          );
        }
        return notifications;
      });

    context.commit({
      ...state,
      cases: [...state.cases, createdCase],
      notifications: [...state.notifications, ...adminNotifications],
      updatedAt: createdAt
    });
    return createdCase;
  }

  function updateCaseStatus(caseId: string, status: CaseStatus, actorId: string) {
    context.requireRole(actorId, "admin");
    const item = context.getCase(caseId);
    if (item.status === "Concluído") {
      throw new Error("O processo concluído é somente leitura.");
    }
    if (!CASE_STATUSES.includes(status)) throw new Error("Status inválido.");
    if (item.status === status) return item;

    const updatedAt = context.now().toISOString();
    const event = context.createTimelineEvent({
      caseId,
      type: "status-changed",
      title: `Status atualizado para ${status}`,
      actorId,
      description: `O processo avançou de ${item.status} para ${status}.`
    });
    const updatedCase: Case = {
      ...item,
      status,
      timeline: [...item.timeline, event],
      updatedAt,
      completedAt: status === "Concluído" ? updatedAt : undefined
    };
    const notification = context.createNotification({
      userId: item.clientId,
      type: "status-changed",
      title: `Processo ${status.toLocaleLowerCase("pt-BR")}`,
      message: `O protocolo ${item.protocol} foi atualizado para ${status}.`,
      caseId
    });
    context.replaceCase(updatedCase, [notification]);
    return updatedCase;
  }

  function recordWhatsAppStarted(caseId: string, actorId: string) {
    const actor = context.getUser(actorId);
    const item = context.getCase(caseId);
    if (actor.role === "client" && item.clientId !== actor.id) {
      throw new Error("Ação não permitida para este processo.");
    }
    const event = context.createTimelineEvent({
      caseId,
      type: "whatsapp-started",
      title: "Contato por WhatsApp iniciado",
      actorId
    });
    const updatedCase: Case = {
      ...item,
      timeline: [...item.timeline, event],
      updatedAt: event.createdAt
    };
    context.replaceCase(updatedCase);
    return event;
  }

  return {
    updateUserProfile,
    createCase,
    updateCaseStatus,
    recordWhatsAppStarted
  };
}
