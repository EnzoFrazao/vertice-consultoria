import type { SupabaseClient } from "@supabase/supabase-js";

import type { Case, CaseDocument, Notification, NotificationType, User } from "@/domain/types";
import type { PortalRepository } from "@/features/portal-data/PortalRepository";
import { selectPrimaryRole } from "@/features/auth/auth";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface RoleRow {
  roles: { code: string } | Array<{ code: string }> | null;
}

function extractRoleCodes(rows: RoleRow[]): string[] {
  return rows.flatMap((row) => {
    if (!row.roles) {
      return [];
    }

    if (Array.isArray(row.roles)) {
      return row.roles.map((role) => role.code);
    }

    return [row.roles.code];
  });
}

interface NotificationRow {
  id: string;
  user_id: string;
  case_id: string | null;
  case_document_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

function mapNotificationType(row: NotificationRow): NotificationType {
  switch (row.type) {
    case "document_submitted":
      return "document-submitted";
    case "document_reviewed":
      return row.data?.decision === "approved" ? "document-approved" : "document-rejected";
    default:
      return "status-changed";
  }
}

export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: mapNotificationType(row),
    title: row.title,
    message: row.message,
    caseId: row.case_id ?? undefined,
    documentId: row.case_document_id ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined
  };
}

export class SupabasePortalRepository implements PortalRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUser(userId: string): Promise<User | null> {
    const [profileResult, rolesResult] = await Promise.all([
      this.client
        .from("profiles")
        .select("id,name,email,phone,created_at")
        .eq("id", userId)
        .maybeSingle(),
      this.client.from("user_roles").select("roles(code)").eq("user_id", userId)
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (rolesResult.error) {
      throw rolesResult.error;
    }

    const profile = profileResult.data as ProfileRow | null;
    if (!profile) {
      return null;
    }

    const role = selectPrimaryRole(extractRoleCodes(rolesResult.data as RoleRow[]));
    if (!role) {
      return null;
    }

    return {
      id: profile.id,
      role,
      name: profile.name,
      email: profile.email,
      cpf: "",
      phone: profile.phone ?? "",
      address: "",
      createdAt: profile.created_at
    };
  }

  listCases(): Promise<Case[]> {
    throw new Error("Not implemented");
  }

  getCaseById(): Promise<Case | null> {
    throw new Error("Not implemented");
  }

  createCase(): Promise<Case> {
    throw new Error("Not implemented");
  }

  updateCaseStatus(): Promise<void> {
    throw new Error("Not implemented");
  }

  listDocuments(): Promise<CaseDocument[]> {
    throw new Error("Not implemented");
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.client
      .from("notifications")
      .select("id,user_id,case_id,case_document_id,type,title,message,data,created_at,read_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return (data as NotificationRow[]).map(mapNotificationRow);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .is("read_at", null);

    if (error) {
      throw error;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await this.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      throw error;
    }
  }

  updateUserProfile(): Promise<User> {
    throw new Error("Not implemented");
  }
}

export function createSupabasePortalRepository(client: SupabaseClient): PortalRepository {
  return new SupabasePortalRepository(client);
}
