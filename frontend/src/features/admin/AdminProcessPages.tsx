import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Search,
  SearchX,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDemoApp } from "../../app/DemoAppProvider";
import { CaseFolio, EmptyState, PageHeader, StatusBadge } from "../../components/portal";
import { createWhatsAppUrl } from "../../config/contact";
import { getServiceById, services } from "../../data/demo/catalog";
import { CASE_STATUSES, type Case, type CaseStatus, type User } from "../../data/demo/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2";
const fieldClass = `${focusRing} min-h-11 w-full rounded-xl border border-espresso/[0.15] bg-ivory px-3.5 text-sm text-espresso shadow-sm transition hover:border-espresso/25`;

function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(new Date(value));
}

function getClient(users: User[], item: Case) {
  return users.find((user) => user.id === item.clientId);
}

function propertyAddress(item: Case) {
  const complement = item.property.complement ? `, ${item.property.complement}` : "";
  return `${item.property.address}, ${item.property.number}${complement} · ${item.property.city}/${item.property.state}`;
}

export function AdminProcessesPage() {
  const { state } = useDemoApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [clientFilter, setClientFilter] = useState(() => searchParams.get("cliente") ?? "");
  const clients = state.users
    .filter((user) => user.role === "client")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const filteredCases = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return [...state.cases]
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => !serviceFilter || item.serviceId === serviceFilter)
      .filter((item) => !clientFilter || item.clientId === clientFilter)
      .filter((item) => {
        if (!query) return true;
        const client = getClient(state.users, item);
        const service = getServiceById(item.serviceId);
        return [
          item.protocol,
          client?.name,
          client?.email,
          service?.name,
          item.property.address,
          item.property.neighborhood,
          item.property.city,
          item.property.registrationNumber
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(query);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [clientFilter, search, serviceFilter, state.cases, state.users, statusFilter]);

  const hasFilters = Boolean(search || statusFilter || serviceFilter || clientFilter);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestão"
        title="Processos"
        description="Localize solicitações por protocolo, cliente, serviço ou situação atual."
      />

      <section aria-label="Filtros de processos" className="rounded-2xl border border-espresso/10 bg-ivory p-4 shadow-[0_12px_36px_rgba(32,19,13,0.05)] sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(10rem,1fr))]">
          <label className="block text-sm font-semibold text-espresso">
            Buscar processos
            <span className="relative mt-2 block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cacao/60" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Protocolo, cliente ou imóvel"
                className={`${fieldClass} pl-10`}
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os status</option>
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por serviço
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os serviços</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por cliente
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-4">
          <p className="text-sm text-cacao/70">
            <strong className="text-espresso">{filteredCases.length}</strong>{" "}
            {filteredCases.length === 1 ? "processo encontrado" : "processos encontrados"}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setServiceFilter("");
                setClientFilter("");
              }}
              className={`${focusRing} min-h-11 rounded-xl px-4 text-sm font-bold text-tealTech transition hover:bg-tealTech/10`}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </section>

      {filteredCases.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum processo encontrado"
          description="Ajuste os filtros ou limpe a busca para visualizar outras solicitações."
        />
      ) : (
        <section aria-label="Lista de processos" className="overflow-hidden border-y border-espresso/15 bg-ivory">
          <div
            aria-hidden="true"
            className="hidden min-h-11 grid-cols-[minmax(10rem,0.8fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)_8.5rem_7rem] items-center gap-4 border-b border-espresso/15 bg-champagne/30 px-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cacao/65 lg:grid"
          >
            <span>Registro</span>
            <span>Imóvel e serviço</span>
            <span>Parte interessada</span>
            <span>Estado</span>
            <span className="text-right">Movimento</span>
          </div>
          {filteredCases.map((item) => {
            const client = getClient(state.users, item);
            const service = getServiceById(item.serviceId);
            const pendingDocuments = item.documents.filter((document) =>
              ["Pendente", "Rejeitado"].includes(document.status)
            ).length;
            return (
              <Link
                key={item.id}
                to={`/admin/processos/${item.id}`}
                className={`${focusRing} group grid min-h-24 gap-4 border-b border-espresso/10 px-5 py-4 transition last:border-b-0 hover:bg-tealTech/[0.045] lg:grid-cols-[minmax(10rem,0.8fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)_8.5rem_7rem] lg:items-center`}
                aria-label={`${item.protocol}, ${service?.name ?? "serviço"}, ${client?.name ?? "cliente"}`}
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-espresso group-hover:text-tealTech">{item.protocol}</span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-cacao/60">
                    {pendingDocuments === 0 ? "Documentação em dia" : `${pendingDocuments} ${pendingDocuments === 1 ? "pendência" : "pendências"}`}
                  </span>
                </span>
                <span className="min-w-0 border-l-2 border-bronze/50 pl-3">
                  <span className="block truncate text-sm font-semibold text-espresso">{item.property.address}, {item.property.number}</span>
                  <span className="mt-1 block truncate text-xs text-cacao/70">{service?.name ?? "Serviço imobiliário"} · {item.property.city}/{item.property.state}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2 text-sm text-cacao/75">
                  <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-tealTech" />
                  <span className="truncate">{client?.name ?? "Cliente não encontrado"}</span>
                </span>
                <StatusBadge status={item.status} />
                <span className="text-sm text-cacao/65 lg:text-right">
                  <span className="mr-2 font-bold uppercase tracking-wide text-cacao/50 lg:hidden">Atualizado</span>
                  {formatDate(item.updatedAt)}
                </span>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

export function AdminProcessDetailPage() {
  const { id } = useParams();
  const {
    state,
    currentUser,
    updateCaseStatus,
    recordWhatsAppStarted
  } = useDemoApp();
  const item = state.cases.find((candidate) => candidate.id === id);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>(item?.status ?? "Novo");
  const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [isMobileStatusFlow, setIsMobileStatusFlow] = useState(false);
  const [actionError, setActionError] = useState("");
  const completionDialogRef = useRef<HTMLDivElement>(null);
  const completionCancelRef = useRef<HTMLButtonElement>(null);
  const completionTriggerRef = useRef<HTMLElement | null>(null);
  const completionConfirmedRef = useRef(false);
  const completedNoticeRef = useRef<HTMLElement>(null);
  const statusDialogRef = useRef<HTMLDivElement>(null);
  const statusCancelRef = useRef<HTMLButtonElement>(null);
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (item) setSelectedStatus(item.status);
  }, [item?.status]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const updateFlow = () => setIsMobileStatusFlow(mobileQuery.matches);
    updateFlow();
    mobileQuery.addEventListener?.("change", updateFlow);
    return () => mobileQuery.removeEventListener?.("change", updateFlow);
  }, []);

  useEffect(() => {
    if (!showStatusConfirmation) return;
    const dialog = statusDialogRef.current;
    statusCancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowStatusConfirmation(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      statusTriggerRef.current?.focus();
    };
  }, [showStatusConfirmation]);

  useEffect(() => {
    if (!showCompletionConfirmation) return;

    const dialog = completionDialogRef.current;
    completionCancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowCompletionConfirmation(false);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!completionConfirmedRef.current) completionTriggerRef.current?.focus();
    };
  }, [showCompletionConfirmation]);

  useEffect(() => {
    if (item?.status === "Concluído" && completionConfirmedRef.current) {
      completionConfirmedRef.current = false;
      completedNoticeRef.current?.focus();
    }
  }, [item?.status]);

  if (!item || !currentUser) {
    return (
      <EmptyState
        icon={SearchX}
        title="Processo não encontrado"
        description="Confira o endereço ou volte para a lista de processos."
        action={
          <Link to="/admin/processos" className={`${focusRing} inline-flex min-h-11 items-center rounded-xl bg-espresso px-5 text-sm font-bold text-ivory`}>
            Voltar aos processos
          </Link>
        }
      />
    );
  }

  const client = getClient(state.users, item);
  const service = getServiceById(item.serviceId);
  const isCompleted = item.status === "Concluído";
  const whatsappText = `Olá! Sou da equipe Vértice Consultoria e quero falar sobre o serviço ${service?.name ?? "imobiliário"}, protocolo ${item.protocol}.`;
  const whatsappHref = createWhatsAppUrl(whatsappText);

  const openCompletionDialog = (trigger: HTMLElement) => {
    completionTriggerRef.current = trigger;
    setSelectedStatus("Concluído");
    setActionError("");
    setShowCompletionConfirmation(true);
  };

  const commitSelectedStatus = () => {
    setActionError("");
    if (selectedStatus === item.status) return;
    try {
      updateCaseStatus(item.id, selectedStatus, currentUser.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    }
  };

  const applyStatus = (trigger: HTMLButtonElement) => {
    setActionError("");
    if (selectedStatus === item.status) return;
    if (selectedStatus === "Concluído") {
      openCompletionDialog(trigger);
      return;
    }
    if (isMobileStatusFlow) {
      statusTriggerRef.current = trigger;
      setShowStatusConfirmation(true);
      return;
    }
    commitSelectedStatus();
  };

  const confirmStatusChange = () => {
    commitSelectedStatus();
    setShowStatusConfirmation(false);
  };

  const confirmCompletion = () => {
    try {
      completionConfirmedRef.current = true;
      updateCaseStatus(item.id, "Concluído", currentUser.id);
      setShowCompletionConfirmation(false);
    } catch (error) {
      completionConfirmedRef.current = false;
      setActionError(error instanceof Error ? error.message : "Não foi possível concluir o processo.");
    }
  };

  return (
    <div className={`space-y-8 ${isCompleted ? "" : "pb-20 sm:pb-0"}`}>
      <Link
        to="/admin/processos"
        className={`${focusRing} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-tealTech transition hover:bg-tealTech/10`}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Voltar aos processos
      </Link>

      <PageHeader
        eyebrow="Detalhe do processo"
        title={item.protocol}
        description={`Dossiê operacional · criado em ${formatDate(item.createdAt)}`}
        actions={<StatusBadge status={item.status} className="px-3 py-2 text-sm" />}
        className="sticky top-[4.5rem] z-20 -mx-4 border-b border-espresso/10 bg-mist/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
      />

      {showStatusConfirmation ? (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-espresso/70 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowStatusConfirmation(false);
          }}
        >
          <section
            ref={statusDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirmation-title"
            className="w-full rounded-t-2xl border border-bronze/40 bg-ivory p-5 shadow-[0_28px_90px_rgba(32,19,13,0.32)] sm:max-w-lg sm:rounded-lg sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tealTech">Confirmar movimento</p>
            <h2 id="status-confirmation-title" className="mt-2 font-display text-2xl font-semibold text-espresso">
              Alterar estado do processo?
            </h2>
            <p className="mt-4 flex min-h-12 items-center gap-3 border-y border-espresso/15 py-3 text-sm">
              <strong>{item.status}</strong>
              <span aria-hidden="true" className="text-bronze">→</span>
              <strong className="text-tealTech">{selectedStatus}</strong>
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                ref={statusCancelRef}
                type="button"
                onClick={() => setShowStatusConfirmation(false)}
                className={`${focusRing} min-h-11 rounded-lg border border-espresso/20 px-4 text-sm font-bold text-espresso`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className={`${focusRing} min-h-11 rounded-lg bg-tealTech px-4 text-sm font-bold text-white`}
              >
                Confirmar novo estado
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showCompletionConfirmation ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-espresso/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCompletionConfirmation(false);
          }}
        >
          <section
            ref={completionDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="completion-title"
            aria-describedby="completion-description"
            className="relative w-full max-w-xl border border-bronze/50 bg-ivory p-6 shadow-[0_28px_90px_rgba(32,19,13,0.32)] sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShowCompletionConfirmation(false)}
              className={`${focusRing} absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-lg text-cacao transition hover:bg-espresso/5`}
              aria-label="Fechar confirmação"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">Decisão irreversível</p>
            <h2 id="completion-title" className="mt-3 pr-10 font-display text-3xl font-semibold text-espresso">Concluir processo?</h2>
            <p id="completion-description" className="mt-3 text-sm leading-6 text-cacao/75">Depois da confirmação, o processo não poderá mais ser alterado nesta demonstração. Documentos e histórico continuarão disponíveis em modo de leitura.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={completionCancelRef}
                type="button"
                onClick={() => setShowCompletionConfirmation(false)}
                className={`${focusRing} min-h-11 rounded-lg border border-espresso/20 px-5 text-sm font-bold text-espresso transition hover:bg-espresso/5`}
              >
                Cancelar
              </button>
              <button type="button" onClick={confirmCompletion} className={`${focusRing} min-h-11 rounded-lg bg-tealTech px-5 text-sm font-bold text-white transition hover:bg-tealTech/90`}>
                Confirmar conclusão
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <CaseFolio
        protocol={item.protocol}
        serviceName={service?.name ?? "Serviço imobiliário"}
        propertyLabel={`${item.property.type} · ${propertyAddress(item)}`}
        objective={item.objective}
        status={item.status}
      >
        {isCompleted ? (
          <section
            ref={completedNoticeRef}
            tabIndex={-1}
            className="flex items-start gap-3 border-l-4 border-tealTech bg-tealTech/[0.08] p-5 outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
            role="status"
          >
            <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-tealTech" />
            <div>
              <h3 className="font-semibold text-espresso">Processo concluído e somente leitura</h3>
              <p className="mt-1 text-sm leading-6 text-cacao/75">O histórico permanece disponível, mas status e documentos não podem mais ser alterados.</p>
            </div>
          </section>
        ) : (
          <section aria-labelledby="status-management-title" className="border-y border-espresso/15 bg-champagne/20 px-4 py-5 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-tealTech">Despacho operacional</p>
                <h3 id="status-management-title" className="mt-2 font-display text-2xl font-semibold text-espresso">Defina o próximo movimento</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-cacao/75">Cada mudança fica registrada no histórico e é comunicada ao cliente.</p>
              </div>
              <img src="/brand/vertice-consultoria.png" alt="" aria-hidden="true" className="h-14 w-auto max-w-32 object-contain opacity-75" />
            </div>

            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(15rem,1fr)_minmax(15rem,1fr)_auto] 2xl:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cacao/60">Régua de estado</p>
                <p className="mt-2 flex min-h-11 flex-wrap items-center gap-3 border-l-2 border-bronze pl-3 text-sm" aria-label={`Estado atual ${item.status}; novo estado ${selectedStatus}`}>
                  <strong className="text-espresso">{item.status}</strong>
                  <span aria-hidden="true" className="text-bronze">→</span>
                  <strong className="text-tealTech">{selectedStatus}</strong>
                </p>
              </div>
              <label className="text-sm font-semibold text-espresso">
                Novo status do processo
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value as CaseStatus)}
                  className={`${fieldClass} mt-2`}
                >
                  {CASE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 2xl:justify-end">
                <button
                  type="button"
                  onClick={(event) => applyStatus(event.currentTarget)}
                  disabled={selectedStatus === item.status}
                  className={`${focusRing} fixed bottom-4 left-4 right-4 z-30 min-h-12 rounded-lg bg-tealTech px-5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(15,118,110,0.3)] transition hover:bg-tealTech/90 disabled:cursor-not-allowed disabled:opacity-45 sm:static sm:z-auto sm:min-h-11 sm:shadow-none`}
                >
                  Atualizar status
                </button>
                <button
                  type="button"
                  onClick={(event) => openCompletionDialog(event.currentTarget)}
                  className={`${focusRing} min-h-11 rounded-lg border border-espresso/20 px-5 text-sm font-bold text-espresso transition hover:bg-espresso/5`}
                >
                  Concluir processo
                </button>
              </div>
            </div>
            {actionError ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{actionError}</p> : null}
          </section>
        )}

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
          <section aria-labelledby="documents-title">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-espresso/15 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-tealTech">Livro de documentos</p>
                <h3 id="documents-title" className="mt-2 font-display text-2xl font-semibold text-espresso">Documentos vinculados</h3>
              </div>
              {!isCompleted ? <Link to="/admin/documentos" className={`${focusRing} inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-bold text-tealTech hover:bg-tealTech/10`}>Abrir fila de análise</Link> : null}
            </div>
            {item.documents.length === 0 ? (
              <p className="border-b border-espresso/10 py-6 text-sm text-cacao/70">Nenhum documento está vinculado a este processo.</p>
            ) : (
              <ul className="divide-y divide-espresso/10">
                {item.documents.map((document) => {
                  const latestVersion = document.versions[document.versions.length - 1];
                  return (
                    <li key={document.id} className="grid min-h-20 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <span className="flex min-w-0 items-start gap-3">
                        <FileText aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-tealTech" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-espresso">{document.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-cacao/65">
                            {document.required ? "Obrigatório" : "Complementar"} · {document.versions.length} {document.versions.length === 1 ? "versão" : "versões"}
                            {latestVersion ? ` · ${latestVersion.sizeLabel}` : ""}
                          </span>
                          {document.rejectionReason ? <span className="mt-1 block text-xs font-semibold text-red-700">Motivo: {document.rejectionReason}</span> : null}
                        </span>
                      </span>
                      <StatusBadge status={document.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside aria-labelledby="context-title" className="border-l border-espresso/15 pl-5 sm:pl-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">Contexto cadastral</p>
            <h3 id="context-title" className="mt-2 font-display text-2xl font-semibold text-espresso">Parte e imóvel</h3>
            <dl className="mt-5 divide-y divide-espresso/10 border-y border-espresso/10 text-sm">
              <div className="py-4">
                <dt className="flex items-center gap-2 font-bold text-cacao"><UserRound aria-hidden="true" className="h-4 w-4 text-tealTech" /> Cliente</dt>
                <dd className="mt-2 text-espresso">{client?.name ?? "Cliente não encontrado"}</dd>
                <dd className="mt-1 break-all text-cacao/70">{client?.email}</dd>
              </div>
              <div className="py-4">
                <dt className="flex items-center gap-2 font-bold text-cacao"><MapPin aria-hidden="true" className="h-4 w-4 text-tealTech" /> Endereço</dt>
                <dd className="mt-2 leading-6 text-cacao/75">{propertyAddress(item)}</dd>
              </div>
              <div className="py-4">
                <dt className="flex items-center gap-2 font-bold text-cacao"><CalendarDays aria-hidden="true" className="h-4 w-4 text-tealTech" /> Referências</dt>
                <dd className="mt-2 text-cacao/75">Matrícula: {item.property.registrationNumber ?? "Não informada"}</dd>
                <dd className="mt-1 text-cacao/75">IPTU: {item.property.iptuNumber ?? "Não informado"}</dd>
              </div>
            </dl>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (!isCompleted) recordWhatsAppStarted(item.id, currentUser.id);
              }}
              className={`${focusRing} mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-tealTech/35 px-5 text-sm font-bold text-tealTech transition hover:bg-tealTech/10`}
              aria-label={`Conversar com ${client?.name ?? "cliente"} no WhatsApp`}
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
              Contatar por WhatsApp
            </a>
            <p className="mt-2 text-xs leading-5 text-cacao/60">Canal secundário; abre uma conversa externa com serviço e protocolo preenchidos.</p>
          </aside>
        </div>

        <section aria-labelledby="timeline-title" className="mt-10 border-t border-espresso/15 pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tealTech">Diário do processo</p>
          <h3 id="timeline-title" className="mt-2 font-display text-2xl font-semibold text-espresso">Histórico de movimentos</h3>
          {item.timeline.length === 0 ? (
            <p className="mt-5 border-l-2 border-bronze pl-4 text-sm text-cacao/70">O primeiro movimento aparecerá aqui.</p>
          ) : (
            <ol className="mt-6 space-y-0">
              {[...item.timeline].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((event, index, events) => (
                <li key={event.id} className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-6 last:pb-0">
                  {index < events.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-[0.69rem] top-6 w-px bg-espresso/15" /> : null}
                  <span className="relative mt-1 grid h-6 w-6 place-items-center rounded-full border-4 border-ivory bg-tealTech text-white ring-1 ring-tealTech/25">
                    <Clock3 aria-hidden="true" className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-espresso">{event.title}</h4>
                      <time className="text-xs text-cacao/60" dateTime={event.createdAt}>{formatDate(event.createdAt, true)}</time>
                    </div>
                    {event.description ? <p className="mt-1 text-sm leading-6 text-cacao/70">{event.description}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </CaseFolio>
    </div>
  );
}
