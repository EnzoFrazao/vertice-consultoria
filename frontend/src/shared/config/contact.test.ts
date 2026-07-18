import { describe, expect, it } from "vitest";
import { WHATSAPP_NUMBER, createWhatsAppUrl } from "@/shared/config/contact";

describe("WhatsApp contact configuration", () => {
  it("keeps the placeholder centralized and safely encodes contextual messages", () => {
    expect(WHATSAPP_NUMBER).toBe("5500000000000");
    expect(createWhatsAppUrl("Olá! Protocolo RV-2026-0001 · Escritura")).toBe(
      "https://wa.me/5500000000000?text=Ol%C3%A1!%20Protocolo%20RV-2026-0001%20%C2%B7%20Escritura"
    );
  });
});
