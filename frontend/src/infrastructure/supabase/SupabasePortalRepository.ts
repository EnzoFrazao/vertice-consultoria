import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Case,
  CaseDocument,
  CaseStatus,
  Notification,
  User,
  UserRole,
} from "@/domain/types";
import type {
  CreateCaseInput,
  PortalRepository,
  ProfileUpdates,
} from "@/features/portal-data/PortalRepository";

export class SupabasePortalRepository implements PortalRepository {
  constructor(private readonly client: SupabaseClient) {}

  getCurrentUser(userId: string): Promise<User | null> {
    throw new Error("Not implemented");
  }

  listCases(userId: string, role: UserRole): Promise<Case[]> {
    throw new Error("Not implemented");
  }

  getCaseById(caseId: string): Promise<Case | null> {
    throw new Error("Not implemented");
  }

  createCase(input: CreateCaseInput): Promise<Case> {
    throw new Error("Not implemented");
  }

  updateCaseStatus(caseId: string, status: CaseStatus): Promise<void> {
    throw new Error("Not implemented");
  }

  listDocuments(caseId: string): Promise<CaseDocument[]> {
    throw new Error("Not implemented");
  }

  listNotifications(userId: string): Promise<Notification[]> {
    throw new Error("Not implemented");
  }

  markNotificationRead(notificationId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  markAllNotificationsRead(userId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  updateUserProfile(
    userId: string,
    updates: ProfileUpdates,
  ): Promise<User> {
    throw new Error("Not implemented");
  }
}

export function createSupabasePortalRepository(
  client: SupabaseClient,
): PortalRepository {
  return new SupabasePortalRepository(client);
}
