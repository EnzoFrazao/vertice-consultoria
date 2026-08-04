import type { Case, CaseDocument, CaseStatus, Notification, User, UserRole } from "@/domain/types";

export type ProfileUpdates = Pick<User, "phone" | "address">;

export interface CreateCaseInput {
  clientId: string;
  serviceId: string;
  objective: string;
  property: {
    type: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    registrationNumber?: string;
    iptuNumber?: string;
    notes?: string;
  };
}

export interface PortalRepository {
  getCurrentUser(userId: string): Promise<User | null>;
  listCases(userId: string, role: UserRole): Promise<Case[]>;
  getCaseById(caseId: string): Promise<Case | null>;
  createCase(input: CreateCaseInput): Promise<Case>;
  updateCaseStatus(caseId: string, status: CaseStatus): Promise<void>;
  listDocuments(caseId: string): Promise<CaseDocument[]>;
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  updateUserProfile(userId: string, updates: ProfileUpdates): Promise<User>;
}
