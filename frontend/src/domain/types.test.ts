import { describe, expect, it } from "vitest";

import { NOTIFICATION_TYPES, TIMELINE_EVENT_TYPES, USER_ROLES } from "@/domain/types";

describe("enums canônicos do domínio", () => {
  it("expõe os valores usados pelos tipos e pela validação", () => {
    expect(USER_ROLES).toEqual(["client", "admin"]);
    expect(TIMELINE_EVENT_TYPES).toEqual([
      "case-created",
      "document-added",
      "document-resubmitted",
      "document-review-started",
      "document-approved",
      "document-rejected",
      "status-changed",
      "whatsapp-started"
    ]);
    expect(NOTIFICATION_TYPES).toEqual([
      "new-case",
      "document-submitted",
      "document-approved",
      "document-rejected",
      "status-changed"
    ]);
  });
});
