import { describe, expect, it } from "vitest";

import {
  buildAdminDocumentQueue,
  buildAdminPauta,
  derivePendingActions
} from "@/domain/selectors";
import type {
  Case,
  CaseDocument,
  CaseStatus,
  DemoState,
  DocumentStatus,
  User
} from "@/domain/types";

const CLIENT_ID = "user-client-demo";
const ADMIN_ID = "user-admin-demo";
const SECOND_CLIENT_ID = "user-client-fernanda";

function createUser(id: string, role: User["role"], name: string): User {
  return {
    id,
    role,
    name,
    email: `${id}@example.com`,
    cpf: "000.000.000-00",
    phone: "(85) 99999-0000",
    address: "Fortaleza, CE",
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

function createDocument(
  id: string,
  label: string,
  status: DocumentStatus,
  updatedAt: string,
  required = true
): CaseDocument {
  return {
    id,
    kind: id.slice(id.indexOf("-doc-") + 5),
    label,
    required,
    status,
    versions: [],
    updatedAt
  };
}

function createCase(input: {
  id: string;
  protocol: string;
  clientId: string;
  status: CaseStatus;
  updatedAt: string;
  documents: CaseDocument[];
}): Case {
  return {
    ...input,
    serviceId: "regularizacao-imoveis",
    objective: "Organizar a documentação.",
    property: {
      id: `property-${input.id}`,
      type: "Casa",
      address: "Rua das Flores",
      number: "10",
      neighborhood: "Centro",
      city: "Fortaleza",
      state: "CE",
      postalCode: "60000-000"
    },
    timeline: [],
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

function createDomainFixture(): DemoState {
  const older = "2026-07-08T16:30:00.000Z";
  const newer = "2026-07-10T11:40:00.000Z";
  return {
    version: 1,
    users: [
      createUser(CLIENT_ID, "client", "Marina"),
      createUser(ADMIN_ID, "admin", "Administrador"),
      createUser(SECOND_CLIENT_ID, "client", "Fernanda")
    ],
    cases: [
      createCase({
        id: "case-0001",
        protocol: "RV-2026-0001",
        clientId: CLIENT_ID,
        status: "Documentos pendentes",
        updatedAt: older,
        documents: [
          createDocument(
            "case-0001-doc-comprovante-residencia",
            "Comprovante de residência",
            "Enviado",
            older
          ),
          createDocument("case-0001-doc-iptu", "IPTU", "Enviado", older),
          createDocument(
            "case-0001-doc-fotos-imovel",
            "Fotos do imóvel",
            "Enviado",
            older,
            false
          ),
          createDocument(
            "case-0001-doc-matricula-imovel",
            "Matrícula do imóvel",
            "Pendente",
            older
          )
        ]
      }),
      createCase({
        id: "case-0002",
        protocol: "RV-2026-0002",
        clientId: CLIENT_ID,
        status: "Análise técnica",
        updatedAt: older,
        documents: [
          createDocument(
            "case-0002-doc-contrato-compra-venda",
            "Contrato de compra e venda",
            "Pendente",
            older
          )
        ]
      }),
      createCase({
        id: "case-0003",
        protocol: "RV-2026-0003",
        clientId: SECOND_CLIENT_ID,
        status: "Documentos em análise",
        updatedAt: newer,
        documents: [
          createDocument(
            "case-0003-doc-rg-cpf",
            "RG/CPF",
            "Em análise",
            newer
          ),
          createDocument(
            "case-0003-doc-matricula-imovel",
            "Matrícula do imóvel",
            "Em análise",
            newer
          ),
          createDocument("case-0003-doc-iptu", "IPTU", "Enviado", newer),
          createDocument(
            "case-0003-doc-contrato-compra-venda",
            "Contrato de compra e venda",
            "Enviado",
            newer
          )
        ]
      })
    ],
    notifications: [],
    mockDocumentAssets: [],
    updatedAt: newer
  };
}

describe("selectors do domínio", () => {
  it("deriva pendências por papel, em ordem decrescente, sem alterar o estado", () => {
    const state = createDomainFixture();
    const snapshot = JSON.stringify(state);

    const clientActions = derivePendingActions(state, {
      id: CLIENT_ID,
      role: "client"
    });
    const adminActions = derivePendingActions(state, {
      id: ADMIN_ID,
      role: "admin"
    });

    expect(clientActions.some((action) => action.kind === "client-document")).toBe(true);
    expect(adminActions.map((action) => action.caseId)).toEqual([
      "case-0003",
      "case-0003",
      "case-0001",
      "case-0001",
      "case-0001"
    ]);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("organiza a pauta administrativa mantendo prioridade, recência e ordem estável", () => {
    const groups = buildAdminPauta(createDomainFixture());

    expect(groups.decide.map((item) => item.id)).toEqual([
      "document-case-0003-doc-rg-cpf",
      "document-case-0003-doc-matricula-imovel",
      "document-case-0003-doc-iptu",
      "document-case-0003-doc-contrato-compra-venda",
      "document-case-0001-doc-comprovante-residencia",
      "document-case-0001-doc-iptu",
      "document-case-0001-doc-fotos-imovel"
    ]);
    expect(groups.client.map((item) => item.id)).toEqual(["case-case-0002"]);
    expect(groups.progress).toEqual([]);
  });

  it("constrói a fila documental com processo e cliente, da atualização mais recente para a mais antiga", () => {
    const entries = buildAdminDocumentQueue(createDomainFixture());

    expect(entries.map(({ document }) => document.id)).toEqual([
      "case-0003-doc-rg-cpf",
      "case-0003-doc-matricula-imovel",
      "case-0003-doc-iptu",
      "case-0003-doc-contrato-compra-venda",
      "case-0001-doc-comprovante-residencia",
      "case-0001-doc-iptu",
      "case-0001-doc-fotos-imovel"
    ]);
    expect(entries[0]?.client?.id).toBe(SECOND_CLIENT_ID);
  });
});
