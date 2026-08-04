import { describe, expect, it } from "vitest";

import type { DemoState } from "@/domain/types";
import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  DEMO_STATE_VERSION,
  createDemoSeed
} from "@/infrastructure/seed";
import {
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  createDemoRepository,
  type StorageLike
} from "@/infrastructure/repository";
import { isAuthSession, isDemoState } from "@/infrastructure/validation";

function cloneSeed(): DemoState {
  return JSON.parse(JSON.stringify(createDemoSeed())) as DemoState;
}

function createStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

const invalidStateMutations: Array<[string, (state: DemoState) => void]> = [
  ["versão", (state) => void ((state as { version: unknown }).version = DEMO_STATE_VERSION + 1)],
  [
    "papel aninhado do usuário",
    (state) => void ((state.users[0] as { role: unknown }).role = "owner")
  ],
  [
    "status do processo",
    (state) => void ((state.cases[0] as { status: unknown }).status = "Finalizado")
  ],
  ["propriedade", (state) => void ((state.cases[0].property as { city: unknown }).city = 42)],
  [
    "status do documento",
    (state) => void ((state.cases[0].documents[0] as { status: unknown }).status = "Infectado")
  ],
  [
    "versão do documento",
    (state) =>
      void ((state.cases[0].documents[0].versions[0] as { submittedBy: unknown }).submittedBy =
        false)
  ],
  [
    "evento da timeline",
    (state) => void ((state.cases[0].timeline[0] as { type: unknown }).type = "desconhecido")
  ],
  ["notificação", (state) => void ((state.notifications[0] as { readAt: unknown }).readAt = 123)],
  [
    "asset de documento",
    (state) => void ((state.mockDocumentAssets[0] as { description: unknown }).description = null)
  ]
];

const invalidDateMutations: Array<[string, (state: DemoState) => void]> = [
  ["atualização do estado", (state) => void (state.updatedAt = "nunca")],
  ["criação do usuário", (state) => void (state.users[0].createdAt = "nunca")],
  ["criação do processo", (state) => void (state.cases[0].createdAt = "nunca")],
  ["atualização do processo", (state) => void (state.cases[0].updatedAt = "nunca")],
  ["conclusão opcional do processo", (state) => void (state.cases[0].completedAt = "nunca")],
  ["atualização do documento", (state) => void (state.cases[0].documents[0].updatedAt = "nunca")],
  [
    "revisão opcional do documento",
    (state) => void (state.cases[0].documents[0].reviewedAt = "nunca")
  ],
  [
    "envio da versão",
    (state) => void (state.cases[0].documents[0].versions[0].submittedAt = "nunca")
  ],
  ["evento da timeline", (state) => void (state.cases[0].timeline[0].createdAt = "nunca")],
  ["criação da notificação", (state) => void (state.notifications[0].createdAt = "nunca")],
  ["leitura opcional da notificação", (state) => void (state.notifications[0].readAt = "nunca")]
];

const invalidIntegrityMutations: Array<[string, (state: DemoState) => void]> = [
  ["id de usuário duplicado", (state) => void (state.users[1].id = state.users[0].id)],
  ["id de processo duplicado", (state) => void (state.cases[1].id = state.cases[0].id)],
  [
    "id de propriedade duplicado",
    (state) => void (state.cases[1].property.id = state.cases[0].property.id)
  ],
  [
    "id de documento duplicado",
    (state) => void (state.cases[1].documents[0].id = state.cases[0].documents[0].id)
  ],
  [
    "id de versão duplicado",
    (state) =>
      void (state.cases[0].documents[1].versions[0].id = state.cases[0].documents[0].versions[0].id)
  ],
  [
    "id de evento duplicado",
    (state) => void (state.cases[0].timeline[1].id = state.cases[0].timeline[0].id)
  ],
  [
    "id de notificação duplicado",
    (state) => void (state.notifications[1].id = state.notifications[0].id)
  ],
  [
    "id de asset duplicado",
    (state) => void (state.mockDocumentAssets[1].id = state.mockDocumentAssets[0].id)
  ],
  ["cliente inexistente", (state) => void (state.cases[0].clientId = "user-ausente")],
  ["cliente com papel administrativo", (state) => void (state.cases[0].clientId = DEMO_ADMIN_ID)],
  ["serviço fora do catálogo", (state) => void (state.cases[0].serviceId = "servico-ausente")],
  [
    "caseId incoerente na timeline",
    (state) => void (state.cases[0].timeline[0].caseId = "case-0002")
  ],
  [
    "ator inexistente na timeline",
    (state) => void (state.cases[0].timeline[0].actorId = "user-ausente")
  ],
  [
    "papel incoerente do ator na timeline",
    (state) => void (state.cases[0].timeline[0].actorRole = "admin")
  ],
  [
    "asset inexistente na versão",
    (state) => void (state.cases[0].documents[0].versions[0].assetId = "asset-ausente")
  ],
  [
    "asset incompatível com o tipo do documento",
    (state) => void (state.cases[0].documents[0].versions[0].assetId = "asset-iptu")
  ],
  [
    "autor inexistente na versão",
    (state) => void (state.cases[0].documents[0].versions[0].submittedBy = "user-ausente")
  ],
  [
    "revisor inexistente",
    (state) => void (state.cases[0].documents[0].reviewedBy = "user-ausente")
  ],
  [
    "usuário inexistente na notificação",
    (state) => void (state.notifications[0].userId = "user-ausente")
  ],
  [
    "processo inexistente na notificação",
    (state) => void (state.notifications[0].caseId = "case-ausente")
  ],
  [
    "documento inexistente na notificação",
    (state) => {
      state.notifications[0].caseId = "case-0002";
      state.notifications[0].documentId = "documento-ausente";
    }
  ]
];

describe("validação profunda dos dados demonstrativos", () => {
  it("aceita o seed completo", () => {
    expect(isDemoState(createDemoSeed())).toBe(true);
  });

  it.each(invalidStateMutations)("rejeita estado com %s inválido", (_label, mutate) => {
    const state = cloneSeed();
    mutate(state);

    expect(isDemoState(state)).toBe(false);
  });

  it.each(invalidDateMutations)("rejeita data não parseável em %s", (_label, mutate) => {
    const state = cloneSeed();
    mutate(state);

    expect(isDemoState(state)).toBe(false);
  });

  it.each(invalidIntegrityMutations)("rejeita integridade inválida: %s", (_label, mutate) => {
    const state = cloneSeed();
    mutate(state);

    expect(isDemoState(state)).toBe(false);
  });

  it("restaura e persiste o seed quando um campo aninhado armazenado é inválido", () => {
    const invalidState = cloneSeed();
    (invalidState.users[0] as { role: unknown }).role = "owner";
    const localStorage = createStorage({
      [DEMO_STATE_STORAGE_KEY]: JSON.stringify(invalidState)
    });

    const repository = createDemoRepository({
      localStorage,
      sessionStorage: createStorage()
    });

    expect(repository.getState()).toEqual(createDemoSeed());
    expect(repository.getWarnings()).toEqual([expect.objectContaining({ code: "state-reset" })]);
    expect(isDemoState(JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null"))).toBe(
      true
    );
  });

  it("restaura o seed quando o estado persistido tem referência inválida", () => {
    const invalidState = cloneSeed();
    invalidState.cases[0].serviceId = "servico-ausente";
    const localStorage = createStorage({
      [DEMO_STATE_STORAGE_KEY]: JSON.stringify(invalidState)
    });

    const repository = createDemoRepository({
      localStorage,
      sessionStorage: createStorage()
    });

    expect(repository.getWarnings()).toEqual([expect.objectContaining({ code: "state-reset" })]);
    expect(repository.getState()).toEqual(createDemoSeed());
    expect(JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null")).toEqual(
      createDemoSeed()
    );
  });

  it("rejeita sessões malformadas e remove a sessão persistida", () => {
    const state = createDemoSeed();
    expect(
      isAuthSession({ userId: DEMO_CLIENT_ID, role: "owner", signedInAt: "agora" }, state)
    ).toBe(false);

    const localStorage = createStorage({
      [DEMO_SESSION_STORAGE_KEY]: JSON.stringify({
        userId: DEMO_CLIENT_ID,
        role: "client",
        signedInAt: 123
      })
    });
    const repository = createDemoRepository({
      localStorage,
      sessionStorage: createStorage()
    });

    expect(repository.getSession()).toBeNull();
    expect(localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("rejeita sessão com data não parseável", () => {
    expect(
      isAuthSession(
        { userId: DEMO_CLIENT_ID, role: "client", signedInAt: "agora" },
        createDemoSeed()
      )
    ).toBe(false);
  });
});
