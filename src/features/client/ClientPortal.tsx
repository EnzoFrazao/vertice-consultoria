import {
  CircleUserRound,
  FilePlus2,
  FolderOpen,
  LayoutDashboard
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useDemoApp } from "../../app/DemoAppProvider";
import { PortalShell, type PortalNotification } from "../../components/portal";
import { ClientDashboard } from "./ClientDashboard";
import { ClientProcessDetailPage } from "./ClientProcessDetailPage";
import { ClientProcessesPage } from "./ClientProcessesPage";
import { ClientProfilePage } from "./ClientProfilePage";
import { NewRequestPage } from "./NewRequestPage";
import { formatDate } from "./clientUtils";

const clientNavigation = [
  { label: "Início", href: "/cliente", icon: LayoutDashboard },
  { label: "Meus processos", href: "/cliente/processos", icon: FolderOpen },
  { label: "Nova solicitação", href: "/cliente/nova-solicitacao", icon: FilePlus2 },
  { label: "Perfil", href: "/cliente/perfil", icon: CircleUserRound }
];

export function ClientPortal() {
  const {
    currentUser,
    state,
    logout,
    markNotificationRead,
    markAllNotificationsRead
  } = useDemoApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== "client") {
    return <Navigate to="/login" replace />;
  }

  const notifications = state.notifications
    .filter((item) => item.userId === currentUser.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const shellNotifications: PortalNotification[] = notifications.map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    createdAtLabel: formatDate(item.createdAt, true),
    isRead: Boolean(item.readAt),
    href: item.caseId ? `/cliente/processos/${item.caseId}` : undefined
  }));

  return (
    <PortalShell
      role="client"
      userName={currentUser.name}
      navigation={clientNavigation}
      currentPath={location.pathname}
      notifications={shellNotifications}
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
        <Route index element={<ClientDashboard />} />
        <Route path="processos" element={<ClientProcessesPage />} />
        <Route path="processos/:id" element={<ClientProcessDetailPage />} />
        <Route path="nova-solicitacao" element={<NewRequestPage />} />
        <Route path="perfil" element={<ClientProfilePage />} />
        <Route path="*" element={<Navigate to="/cliente" replace />} />
      </Routes>
    </PortalShell>
  );
}

