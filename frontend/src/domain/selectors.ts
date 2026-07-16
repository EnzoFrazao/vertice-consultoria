import type {
  Case,
  CaseDocument,
  DemoState,
  PendingAction,
  User,
  UserRole
} from "@/domain/types";

export function derivePendingActions(
  state: DemoState,
  viewer: { id: string; role: UserRole }
): PendingAction[] {
  const visibleCases =
    viewer.role === "client"
      ? state.cases.filter((item) => item.clientId === viewer.id)
      : state.cases;
  const actions: PendingAction[] = [];

  for (const item of visibleCases) {
    if (viewer.role === "client") {
      for (const document of item.documents.filter((candidate) =>
        ["Pendente", "Rejeitado"].includes(candidate.status)
      )) {
        actions.push({
          id: `pending-client-${document.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: "client-document",
          title:
            document.status === "Rejeitado"
              ? `Reenviar ${document.label}`
              : `Adicionar ${document.label}`,
          documentId: document.id,
          createdAt: document.updatedAt
        });
      }

      if (item.status === "Aguardando cliente") {
        actions.push({
          id: `pending-client-response-${item.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: "client-response",
          title: "Responder à orientação recebida",
          createdAt: item.updatedAt
        });
      }
    } else {
      for (const document of item.documents.filter(
        (candidate) => candidate.status === "Enviado"
      )) {
        actions.push({
          id: `pending-admin-${document.id}`,
          caseId: item.id,
          protocol: item.protocol,
          kind: "admin-document-review",
          title: `Analisar ${document.label}`,
          documentId: document.id,
          createdAt: document.updatedAt
        });
      }
    }
  }

  return actions.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

export type PautaGroup = "decide" | "client" | "progress";

export interface PautaItem {
  id: string;
  group: PautaGroup;
  caseId: string;
  documentId?: string;
  label: string;
  detail: string;
  rank: number;
  updatedAt: string;
}

export type AdminPauta = Record<PautaGroup, PautaItem[]>;

export function buildAdminPauta(state: DemoState): AdminPauta {
  const groups: AdminPauta = { decide: [], client: [], progress: [] };
  const casesWithDecision = new Set<string>();

  for (const item of state.cases) {
    if (item.status === "Concluído") continue;
    const documents = item.documents.filter((document) =>
      ["Em análise", "Enviado"].includes(document.status)
    );

    for (const document of documents) {
      casesWithDecision.add(item.id);
      groups.decide.push({
        id: `document-${document.id}`,
        group: "decide",
        caseId: item.id,
        documentId: document.id,
        label:
          document.status === "Em análise"
            ? `Decidir ${document.label}`
            : `Iniciar ${document.label}`,
        detail: document.status,
        rank: document.status === "Em análise" ? 0 : 1,
        updatedAt: document.updatedAt
      });
    }

    if (item.status === "Novo" && documents.length === 0) {
      casesWithDecision.add(item.id);
      groups.decide.push({
        id: `case-${item.id}`,
        group: "decide",
        caseId: item.id,
        label: "Fazer primeira triagem",
        detail: "Novo processo",
        rank: 2,
        updatedAt: item.updatedAt
      });
    }
  }

  for (const item of state.cases) {
    if (item.status === "Concluído" || casesWithDecision.has(item.id)) continue;
    const needsClient =
      item.status === "Aguardando cliente" ||
      item.documents.some(
        (document) =>
          document.required &&
          ["Pendente", "Rejeitado"].includes(document.status)
      );
    const group: PautaGroup = needsClient ? "client" : "progress";
    groups[group].push({
      id: `case-${item.id}`,
      group,
      caseId: item.id,
      label: needsClient
        ? "Aguardar retorno documental"
        : "Acompanhar andamento",
      detail: item.status,
      rank: needsClient ? 3 : 4,
      updatedAt: item.updatedAt
    });
  }

  for (const group of Object.values(groups)) {
    group.sort(
      (left, right) =>
        left.rank - right.rank ||
        right.updatedAt.localeCompare(left.updatedAt)
    );
  }

  return groups;
}

export interface AdminDocumentQueueEntry {
  item: Case;
  document: CaseDocument;
  client?: User;
}

export function buildAdminDocumentQueue(
  state: DemoState
): AdminDocumentQueueEntry[] {
  return state.cases
    .filter((item) => item.status !== "Concluído")
    .flatMap((item) =>
      item.documents
        .filter((document) =>
          ["Enviado", "Em análise"].includes(document.status)
        )
        .map((document) => ({
          item,
          document,
          client: state.users.find((user) => user.id === item.clientId)
        }))
    )
    .sort((left, right) =>
      right.document.updatedAt.localeCompare(left.document.updatedAt)
    );
}
