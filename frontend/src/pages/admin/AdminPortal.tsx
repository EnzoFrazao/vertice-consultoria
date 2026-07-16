import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import {
  CaseFolio,
  PageHeader,
  PortalShell,
  StatusBadge,
  type PortalNavigationItem,
  type PortalNotification
} from "@/shared/ui/portal";
import { createWhatsAppUrl } from "@/shared/config/contact";
import { getServiceById } from "@/domain/catalog";
import { buildAdminPauta, type PautaGroup } from "@/domain/selectors";
import type { Case } from "@/domain/types";
import { AdminClientsPage } from "@/pages/admin/AdminClientsPage";
import { AdminDocumentsPage } from "@/pages/admin/AdminDocumentsPage";
import { AdminProcessDetailPage, AdminProcessesPage } from "@/pages/admin/AdminProcessPages";

const ADMIN_NAVIGATION: PortalNavigationItem[] = [
  { label: "Início", href: "/admin" },
  { label: "Processos", href: "/admin/processos" },
  { label: "Documentos", href: "/admin/documentos" },
  { label: "Clientes", href: "/admin/clientes" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function propertyLabel(item: Case) {
  const complement = item.property.complement ? ` · ${item.property.complement}` : "";
  return `${item.property.type} · ${item.property.address}, ${item.property.number}${complement} · ${item.property.city}/${item.property.state}`;
}

const pautaGroups: Array<{ id: PautaGroup; label: string; description: string }> = [
  { id: "decide", label: "Decidir agora", description: "Triagens e documentos prontos para despacho." },
  { id: "client", label: "Depende do cliente", description: "Aguardando informação ou documento." },
  { id: "progress", label: "Em andamento", description: "Processos que seguem sem decisão imediata." }
];

function AdminDashboard() {
  const {
    state,
    currentUser,
    startDocumentReview,
    reviewDocument,
    recordWhatsAppStarted
  } = usePortalData();
  const groups = buildAdminPauta(state);
  const allItems = pautaGroups.flatMap((group) => groups[group.id]);
  const [selectedId, setSelectedId] = useState(() => allItems[0]?.id ?? "");
  const [announcement, setAnnouncement] = useState("");
  const [mobileDossierOpen, setMobileDossierOpen] = useState(false);
  const [isMobilePauta, setIsMobilePauta] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 1023px)").matches
      : true
  );
  const dispatchHeadingRef = useRef<HTMLHeadingElement>(null);
  const mobileDossierRef = useRef<HTMLDivElement>(null);
  const mobileBackRef = useRef<HTMLButtonElement>(null);
  const pautaTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pautaButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const selectedItem = allItems.find((item) => item.id === selectedId) ?? allItems[0];
  const activeCase = selectedItem
    ? state.cases.find((item) => item.id === selectedItem.caseId)
    : undefined;
  const activeDocument =
    activeCase && selectedItem?.documentId
      ? activeCase.documents.find((document) => document.id === selectedItem.documentId)
      : undefined;
  const activeClient = activeCase
    ? state.users.find((user) => user.id === activeCase.clientId)
    : undefined;
  const activeService = activeCase ? getServiceById(activeCase.serviceId) : undefined;
  const activeCases = state.cases.filter((item) => item.status !== "Concluído").length;
  const completedCases = state.cases.length - activeCases;
  const decisionCount = groups.decide.length;
  const clientCount = groups.client.length;

  useEffect(() => {
    if (!mobileDossierOpen || !isMobilePauta) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => mobileBackRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobilePauta, mobileDossierOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const updateMode = () => {
      setIsMobilePauta(mobileQuery.matches);
      if (!mobileQuery.matches) setMobileDossierOpen(false);
    };
    updateMode();
    mobileQuery.addEventListener?.("change", updateMode);
    return () => mobileQuery.removeEventListener?.("change", updateMode);
  }, []);

  const closeMobileDossier = () => {
    setMobileDossierOpen(false);
    const nextTrigger = selectedItem
      ? pautaButtonsRef.current.get(selectedItem.id)
      : undefined;
    window.setTimeout(() => (nextTrigger ?? pautaTriggerRef.current)?.focus(), 0);
  };

  const handleMobileDossierKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMobilePauta || !mobileDossierOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileDossier();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!currentUser) return null;

  const focusDispatch = () => {
    window.requestAnimationFrame(() => dispatchHeadingRef.current?.focus({ preventScroll: true }));
  };

  const selectNextAfter = (itemId: string) => {
    const index = allItems.findIndex((item) => item.id === itemId);
    const next = allItems[index + 1] ?? allItems[index - 1];
    setSelectedId(next?.id ?? "");
  };

  const handleStartReview = () => {
    if (!activeCase || !activeDocument || !selectedItem) return;
    startDocumentReview(activeCase.id, activeDocument.id, currentUser.id);
    setAnnouncement(`${activeDocument.label} entrou em análise.`);
    focusDispatch();
  };

  const handleApprove = () => {
    if (!activeCase || !activeDocument || !selectedItem) return;
    reviewDocument(activeCase.id, activeDocument.id, { decision: "approve" }, currentUser.id);
    setAnnouncement(`${activeDocument.label} aprovado. Próximo item selecionado.`);
    selectNextAfter(selectedItem.id);
    focusDispatch();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Central de decisão"
        title="Mesa de Operações"
        description="Uma pauta viva conecta cada item ao fólio do imóvel e mostra somente o próximo despacho válido."
      />

      <section
        aria-label="Pulso operacional"
        className="grid overflow-hidden border-y border-espresso/15 bg-ivory/60 sm:grid-cols-4"
      >
        {[
          ["Ativos", activeCases],
          ["Para decidir", decisionCount],
          ["Dependem do cliente", clientCount],
          ["Concluídos", completedCases]
        ].map(([label, value], index) => (
          <div key={label} className={`px-4 py-4 sm:px-5 ${index ? "border-t border-espresso/10 sm:border-l sm:border-t-0" : ""}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-espresso">{value}</p>
          </div>
        ))}
      </section>

      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <section aria-labelledby="pauta-heading" className="folio-sheet overflow-hidden lg:sticky lg:top-28">
          <header className="border-b border-espresso/15 bg-espresso px-4 py-5 text-ivory">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-champagne">Índice operacional</p>
            <h2 id="pauta-heading" className="mt-1 font-display text-2xl font-semibold">Pauta</h2>
          </header>

          <div className="divide-y divide-espresso/15">
            {pautaGroups.map((group) => (
              <section key={group.id} aria-labelledby={`pauta-${group.id}`}>
                <div className="bg-champagne/25 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id={`pauta-${group.id}`} className="text-sm font-bold text-espresso">{group.label}</h3>
                    <span className="text-xs font-bold text-tealTech">{groups[group.id].length}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-cacao/70">{group.description}</p>
                </div>
                {groups[group.id].length ? (
                  <ol className="divide-y divide-espresso/10">
                    {groups[group.id].map((entry) => {
                      const item = state.cases.find((candidate) => candidate.id === entry.caseId);
                      const isSelected = entry.id === selectedItem?.id;
                      return (
                        <li key={entry.id}>
                          <button
                            ref={(node) => {
                              if (node) pautaButtonsRef.current.set(entry.id, node);
                              else pautaButtonsRef.current.delete(entry.id);
                            }}
                            type="button"
                            aria-current={isSelected ? "true" : undefined}
                            onClick={(event) => {
                              pautaTriggerRef.current = event.currentTarget;
                              setSelectedId(entry.id);
                              if (isMobilePauta) setMobileDossierOpen(true);
                              else focusDispatch();
                            }}
                            className={`w-full min-h-20 border-l-4 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech ${
                              isSelected
                                ? "border-tealTech bg-tealTech/[0.07]"
                                : "border-transparent hover:border-bronze/50 hover:bg-champagne/20"
                            }`}
                          >
                            <span className="block text-xs font-bold text-tealTech">{item?.protocol}</span>
                            <span className="mt-1 block text-sm font-semibold leading-5 text-espresso">{entry.label}</span>
                            <span className="mt-1 block text-xs text-cacao/65">{entry.detail}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="px-4 py-4 text-xs leading-5 text-cacao/65">Nenhum item neste grupo.</p>
                )}
              </section>
            ))}
          </div>
        </section>

        {activeCase && selectedItem ? (
          <div
            ref={mobileDossierRef}
            role={mobileDossierOpen && isMobilePauta ? "dialog" : undefined}
            aria-modal={mobileDossierOpen && isMobilePauta ? "true" : undefined}
            aria-label={mobileDossierOpen && isMobilePauta ? `Dossiê operacional ${activeCase.protocol}` : undefined}
            onKeyDown={handleMobileDossierKeyDown}
            className={
              mobileDossierOpen
                ? "fixed inset-0 z-50 overflow-y-auto bg-mist px-4 pb-8 lg:static lg:z-auto lg:block lg:overflow-visible lg:bg-transparent lg:p-0"
                : "hidden lg:block"
            }
          >
            <header className="sticky top-0 z-20 -mx-4 mb-4 flex min-h-16 items-center justify-between gap-3 border-b border-espresso/15 bg-ivory/95 px-4 backdrop-blur lg:hidden">
              <button
                ref={mobileBackRef}
                type="button"
                onClick={closeMobileDossier}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-tealTech focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
              >
                Voltar à pauta
              </button>
              <div className="min-w-0 text-right">
                <p className="truncate text-xs font-bold text-espresso">{activeCase.protocol}</p>
                <p className="truncate text-[11px] text-cacao/70">{activeCase.status}</p>
              </div>
            </header>
            <CaseFolio
            protocol={activeCase.protocol}
            serviceName={activeService?.name ?? "Serviço imobiliário"}
            propertyLabel={propertyLabel(activeCase)}
            objective={activeCase.objective}
            status={activeCase.status}
            priority={
              <section className="border-t-4 border-t-tealTech p-5" aria-labelledby="dispatch-heading">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Despachar e seguir</p>
                <h2
                  id="dispatch-heading"
                  ref={dispatchHeadingRef}
                  tabIndex={-1}
                  className="mt-2 font-display text-2xl font-semibold text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
                >
                  Despacho contextual
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-espresso">{selectedItem.label}</p>
                <p className="mt-1 text-xs leading-5 text-cacao/70">{selectedItem.detail}</p>

                {activeDocument?.status === "Enviado" ? (
                  <button
                    type="button"
                    onClick={handleStartReview}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2"
                  >
                    Iniciar análise
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}

                {activeDocument?.status === "Em análise" ? (
                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2"
                    >
                      Aprovar e seguir
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/admin/documentos#documento-${activeDocument.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-700 px-3 py-2 text-sm font-bold text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    >
                      Rejeitar com motivo
                    </Link>
                  </div>
                ) : null}

                {!activeDocument && selectedItem.group !== "client" ? (
                  <Link
                    to={`/admin/processos/${activeCase.id}`}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2"
                  >
                    Abrir operação
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                ) : null}

                {selectedItem.group === "client" && activeClient ? (
                  <a
                    href={createWhatsAppUrl(`Olá, ${activeClient.name}. Quero falar sobre o protocolo ${activeCase.protocol}, serviço ${activeService?.name ?? "imobiliário"}.`)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordWhatsAppStarted(activeCase.id, currentUser.id)}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-tealTech px-3 py-2 text-center text-sm font-bold text-tealTech hover:bg-tealTech/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    Contatar {activeClient.name.split(" ")[0]}
                  </a>
                ) : null}
              </section>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">Parte interessada</p>
                <p className="mt-2 text-sm font-semibold text-espresso">{activeClient?.name ?? "Cliente"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">Último movimento</p>
                <p className="mt-2 text-sm font-semibold text-espresso">{formatDate(activeCase.updatedAt)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">Registro atual</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={activeCase.status} />
                  <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-tealTech hover:bg-tealTech/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech" to={`/admin/processos/${activeCase.id}`}>
                    Ver fólio completo
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
            </CaseFolio>
          </div>
        ) : (
          <section className="folio-sheet flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-tealTech" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-espresso">Mesa livre</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-cacao/70">Nenhum processo aberto precisa de decisão neste momento.</p>
          </section>
        )}
      </div>
    </div>
  );
}

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
