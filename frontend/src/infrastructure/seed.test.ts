import { describe, expect, it } from "vitest";

import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  DEMO_STATE_VERSION,
  createDemoSeed
} from "@/infrastructure/seed";

describe("estado inicial da demonstração", () => {
  it("inclui os usuários cliente e administrador e múltiplos processos", () => {
    const state = createDemoSeed();

    expect(state.version).toBe(DEMO_STATE_VERSION);
    expect(state.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: DEMO_CLIENT_ID,
          role: "client",
          email: "cliente@demo.com"
        }),
        expect.objectContaining({
          id: DEMO_ADMIN_ID,
          role: "admin",
          email: "admin@demo.com"
        })
      ])
    );
    expect(state.cases.filter((item) => item.clientId === DEMO_CLIENT_ID).length).toBeGreaterThan(
      1
    );
  });

  it("oferece biblioteca fictícia de documentos e histórico em cada processo", () => {
    const state = createDemoSeed();

    expect(state.mockDocumentAssets.map((asset) => asset.name)).toEqual([
      "RG/CPF",
      "Comprovante de residência",
      "Matrícula do imóvel",
      "IPTU",
      "Contrato de compra e venda",
      "Fotos do imóvel"
    ]);
    expect(
      state.cases.every((item) => item.timeline.some((event) => event.type === "case-created"))
    ).toBe(true);
    expect(state.cases.every((item) => item.documents.length > 0)).toBe(true);
  });

  it("cria cópias independentes para que o reset nunca reutilize objetos mutados", () => {
    const first = createDemoSeed();
    first.users[0].name = "Nome alterado";
    first.cases[0].timeline.push({ ...first.cases[0].timeline[0], id: "extra" });

    const second = createDemoSeed();

    expect(second.users[0].name).not.toBe("Nome alterado");
    expect(second.cases[0].timeline.some((event) => event.id === "extra")).toBe(false);
  });
});
