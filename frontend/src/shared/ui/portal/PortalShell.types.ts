import type { ReactNode } from "react";

export type PortalRole = "client" | "admin";

export interface PortalNavigationItem {
  label: string;
  href: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  message?: string;
  createdAtLabel?: string;
  isRead: boolean;
  href?: string;
}

export interface PortalShellProps {
  role: PortalRole;
  userName: string;
  navigation: PortalNavigationItem[];
  currentPath: string;
  notifications: PortalNotification[];
  unreadCount?: number;
  onLogout: () => void;
  onMarkNotification?: (notificationId: string) => void;
  onMarkAllNotifications?: () => void;
  children: ReactNode;
}
