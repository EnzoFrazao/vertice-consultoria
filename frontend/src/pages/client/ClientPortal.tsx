import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { PortalShell, type PortalNotification } from "@/shared/ui/portal";
import { ClientDashboard } from "@/pages/client/ClientDashboard";
import { ClientProcessDetailPage } from "@/pages/client/ClientProcessDetailPage";
import { ClientProcessesPage } from "@/pages/client/ClientProcessesPage";
import { ClientProfilePage } from "@/pages/client/ClientProfilePage";
import { NewRequestPage } from "@/pages/client/NewRequestPage";
import { formatDate } from "@/shared/lib/formatters";

const clientNavigation = [
  { label: "Início", href: "/cliente" },
  { label: "Meus processos", href: "/cliente/processos" },
  { label: "Nova solicitação", href: "/cliente/nova-solicitacao" },
  { label: "Perfil", href: "/cliente/perfil" }
];

export function ClientPortal() {
  const { authStatus, currentUser, state, logout, markNotificationRead, markAllNotificationsRead } =
    usePortalData();
  const location = useLocation();
  const navigate = useNavigate();

  if (authStatus === "loading") {
    return <p role="status">Carregando sessão…</p>;
  }

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
      onMarkNotification={(notificationId) => markNotificationRead(notificationId, currentUser.id)}
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
