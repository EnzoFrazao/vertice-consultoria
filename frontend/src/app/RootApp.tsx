import { lazy, Suspense, useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LandingPage from "@/pages/landing/LandingPage";
import { getServiceById } from "@/domain/catalog";
import { PortalDataProvider, usePortalData } from "@/features/portal-data/PortalDataProvider";
import { LazyRouteErrorBoundary } from "@/app/LazyRouteErrorBoundary";

const LoginPage = lazy(() =>
  import("@/pages/login/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/pages/register/RegisterPage").then((module) => ({ default: module.RegisterPage }))
);
const ClientPortal = lazy(() =>
  import("@/pages/client/ClientPortal").then((module) => ({ default: module.ClientPortal }))
);
const AdminPortal = lazy(() =>
  import("@/pages/admin/AdminPortal").then((module) => ({ default: module.AdminPortal }))
);

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

function ProtectedRoute({ role, children }: { role: "client" | "admin"; children: ReactElement }) {
  const { authStatus, session } = usePortalData();

  if (authStatus === "loading") {
    return <p role="status">Carregando sessão…</p>;
  }

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === "admin" ? "/admin" : "/cliente"} replace />;
  }

  return children;
}

function LazyRoute({ children }: { children: ReactElement }) {
  return (
    <LazyRouteErrorBoundary>
      <Suspense
        fallback={
          <div
            role="status"
            aria-label="Carregando área segura"
            className="flex min-h-screen items-center justify-center bg-mist px-6 text-sm font-medium text-cacao/70"
          >
            Carregando área segura…
          </div>
        }
      >
        {children}
      </Suspense>
    </LazyRouteErrorBoundary>
  );
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
  const { authStatus, session, pendingServiceId, login, resetDemo } = usePortalData();
  const navigate = useNavigate();

  const destination =
    session?.role === "admin"
      ? "/admin"
      : pendingServiceId
        ? "/cliente/nova-solicitacao"
        : "/cliente";

  if (authStatus === "loading") {
    return <p role="status">Carregando sessão…</p>;
  }

  if (session) return <Navigate to={destination} replace />;

  return (
    <LoginPage
      pendingServiceName={pendingServiceId ? getServiceById(pendingServiceId)?.name : undefined}
      onLogin={async (email, password) => {
        const result = await login(email, password);
        if (!result.ok) return result;

        if (result.data.user.role === "admin") navigate("/admin", { replace: true });
        else if (pendingServiceId) {
          navigate("/cliente/nova-solicitacao", { replace: true });
        } else navigate("/cliente", { replace: true });

        return result;
      }}
      onResetDemo={resetDemo}
    />
  );
}

function RegisterRoute() {
  const { authStatus, session, pendingServiceId, signUp } = usePortalData();
  const navigate = useNavigate();
  const clientDestination = pendingServiceId ? "/cliente/nova-solicitacao" : "/cliente";

  if (authStatus === "loading") {
    return <p role="status">Carregando sessão…</p>;
  }

  if (session) {
    return <Navigate to={session.role === "admin" ? "/admin" : clientDestination} replace />;
  }

  return (
    <RegisterPage
      pendingServiceName={pendingServiceId ? getServiceById(pendingServiceId)?.name : undefined}
      onSignUp={async (input) => {
        const result = await signUp(input);

        if (result.ok && result.data) {
          navigate(clientDestination, { replace: true });
        }

        return result;
      }}
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
        <Route
          path="/login"
          element={
            <LazyRoute>
              <LoginRoute />
            </LazyRoute>
          }
        />
        <Route
          path="/cadastro"
          element={
            <LazyRoute>
              <RegisterRoute />
            </LazyRoute>
          }
        />
        <Route
          path="/cliente/*"
          element={
            <LazyRoute>
              <ProtectedRoute role="client">
                <ClientPortal />
              </ProtectedRoute>
            </LazyRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <LazyRoute>
              <ProtectedRoute role="admin">
                <AdminPortal />
              </ProtectedRoute>
            </LazyRoute>
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
