import { ReactElement, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import LandingPage from "@/pages/landing/LandingPage";
import { getServiceById } from "@/domain/catalog";
import { AdminPortal } from "@/pages/admin/AdminPortal";
import { LoginPage } from "@/pages/login/LoginPage";
import { ClientPortal } from "@/pages/client/ClientPortal";
import { PortalDataProvider, usePortalData } from "@/features/portal-data/PortalDataProvider";

export function RouteLifecycle() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      let targetId: string | null = null;

      try {
        targetId = decodeURIComponent(hash.slice(1));
      } catch {
        // Hashes malformados seguem o fallback seguro de rolagem abaixo.
      }

      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ block: "start" });
          return;
        }
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [hash, pathname]);

  return null;
}

function DemoWarnings() {
  const { warnings } = usePortalData();
  if (warnings.length === 0) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[70] mx-auto max-w-2xl space-y-2" aria-live="polite">
      {warnings.map((warning) => (
        <p
          key={warning.code}
          role="status"
          className="rounded-xl border border-bronze/[0.35] bg-espresso px-4 py-3 text-sm font-medium text-champagne shadow-glass"
        >
          {warning.message}
        </p>
      ))}
    </div>
  );
}

function ProtectedRoute({
  role,
  children
}: {
  role: "client" | "admin";
  children: ReactElement;
}) {
  const { session } = usePortalData();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === "admin" ? "/admin" : "/cliente"} replace />;
  }

  return children;
}

function PublicLandingRoute() {
  const { setPendingServiceId } = usePortalData();
  const navigate = useNavigate();

  return (
    <LandingPage
      onStartService={(serviceId) => {
        setPendingServiceId(serviceId);
        navigate("/login");
      }}
    />
  );
}

function LoginRoute() {
  const {
    session,
    pendingServiceId,
    login,
    resetDemo
  } = usePortalData();
  const navigate = useNavigate();

  const destination = session?.role === "admin"
    ? "/admin"
    : pendingServiceId
      ? "/cliente/nova-solicitacao"
      : "/cliente";

  if (session) return <Navigate to={destination} replace />;

  return (
    <LoginPage
      pendingServiceName={
        pendingServiceId ? getServiceById(pendingServiceId)?.name : undefined
      }
      onLogin={(email, password) => {
        const nextSession = login(email, password);
        if (!nextSession) return false;

        if (nextSession.role === "admin") navigate("/admin", { replace: true });
        else if (pendingServiceId) {
          navigate("/cliente/nova-solicitacao", { replace: true });
        } else navigate("/cliente", { replace: true });

        return true;
      }}
      onResetDemo={resetDemo}
    />
  );
}

export function ApplicationRoutes() {
  return (
    <>
      <RouteLifecycle />
      <DemoWarnings />
      <Routes>
        <Route path="/" element={<PublicLandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/cliente/*"
          element={
            <ProtectedRoute role="client">
              <ClientPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="admin">
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function RootApp() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return (
    <BrowserRouter>
      <PortalDataProvider>
        <ApplicationRoutes />
      </PortalDataProvider>
    </BrowserRouter>
  );
}
