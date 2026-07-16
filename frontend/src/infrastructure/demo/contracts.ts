import type { Property } from "@/domain/types";

export interface CreateCaseInput {
  clientId: string;
  serviceId: string;
  objective: string;
  property: Omit<Property, "id">;
  submittedAssetIds?: string[];
}

export type DocumentReview =
  | { decision: "approve" }
  | { decision: "reject"; reason: string };
