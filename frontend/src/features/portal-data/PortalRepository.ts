import type {
  Case,
  CaseDocument,
  Notification,
  User,
} from "@/domain/types";

export interface PortalRepository {
  getCurrentUser(userId: string): Promise<User | null>;

  listCases(userId: string): Promise<Case[]>;

  createCase(input: unknown): Promise<Case>;

  updateCaseStatus(
    caseId: string,
    status: string,
  ): Promise<void>;

  listDocuments(caseId: string): Promise<
  CaseDocument[]>;

  listNotifications(
    userId: string,
  ): Promise<Notification[]>;

  markNotificationRead(
    notificationId: string,
  ): Promise<void>;

  markAllNotificationsRead(
    userId: string,
  ): Promise<void>;

  updateUserProfile(
    userId: string,
    updates: {
      phone: string;
      address: string;
    },
  ): Promise<User>;
}