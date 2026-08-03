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
import { selectPrimaryRole } from "@/features/auth/auth";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface RoleRow {
  roles:
    | { code: string }
    | Array<{ code: string }>
    | null;
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

export class SupabasePortalRepository implements PortalRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUser(userId: string): Promise<User | null> {
    const [profileResult, rolesResult] = await Promise.all([
      this.client
        .from("profiles")
        .select("id,name,email,phone,created_at")
        .eq("id", userId)
        .maybeSingle(),
      this.client
        .from("user_roles")
        .select("roles(code)")
        .eq("user_id", userId),
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

    const role = selectPrimaryRole(
      extractRoleCodes(rolesResult.data as RoleRow[]),
    );
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
      createdAt: profile.created_at,
    };
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
