import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { AdminClientsPage } from "@/pages/admin/AdminClientsPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminDocumentsPage } from "@/pages/admin/AdminDocumentsPage";
import { AdminProcessDetailPage } from "@/pages/admin/AdminProcessDetailPage";
import { AdminProcessesPage } from "@/pages/admin/AdminProcessesPage";
import { formatDate } from "@/shared/lib/formatters";
import {
  PortalShell,
  type PortalNavigationItem,
  type PortalNotification
} from "@/shared/ui/portal";

const ADMIN_NAVIGATION: PortalNavigationItem[] = [
  { label: "Início", href: "/admin" },
  { label: "Processos", href: "/admin/processos" },
  { label: "Documentos", href: "/admin/documentos" },
  { label: "Clientes", href: "/admin/clientes" }
];

export function AdminPortal() {
  const {
    currentUser,
    state,
    logout,
    markNotificationRead,
    markAllNotificationsRead
  } = usePortalData();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "admin") return <Navigate to="/cliente" replace />;

  const notifications: PortalNotification[] = state.notifications
    .filter((notification) => notification.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      createdAtLabel: formatDate(notification.createdAt),
      isRead: Boolean(notification.readAt),
      href: notification.caseId ? `/admin/processos/${notification.caseId}` : undefined
    }));

  return (
    <PortalShell
      role="admin"
      userName={currentUser.name}
      navigation={ADMIN_NAVIGATION}
      currentPath={location.pathname}
      notifications={notifications}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
      onMarkNotification={(notificationId) =>
        markNotificationRead(notificationId, currentUser.id)
      }
      onMarkAllNotifications={() => markAllNotificationsRead(currentUser.id)}
    >
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="processos" element={<AdminProcessesPage />} />
        <Route path="processos/:id" element={<AdminProcessDetailPage />} />
        <Route path="documentos" element={<AdminDocumentsPage />} />
        <Route path="clientes" element={<AdminClientsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </PortalShell>
  );
}
