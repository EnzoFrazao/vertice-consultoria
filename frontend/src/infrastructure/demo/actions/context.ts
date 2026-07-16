import type {
  Case,
  CaseDocument,
  DemoState,
  Notification,
  TimelineEvent,
  User,
  UserRole
} from "@/domain/types";

export interface DemoActionContext {
  getState: () => DemoState;
  now: () => Date;
  nextId: (prefix: string) => string;
  commit: (nextState: DemoState) => DemoState;
  getUser: (userId: string) => User;
  requireRole: (userId: string, role: UserRole) => User;
  getCase: (caseId: string) => Case;
  getDocument: (item: Case, documentId: string) => CaseDocument;
  createTimelineEvent: (input: {
    caseId: string;
    type: TimelineEvent["type"];
    title: string;
    actorId: string;
    description?: string;
  }) => TimelineEvent;
  createNotification: (
    input: Omit<Notification, "id" | "createdAt">
  ) => Notification;
  replaceCase: (
    updatedCase: Case,
    notifications?: Notification[]
  ) => DemoState;
}
