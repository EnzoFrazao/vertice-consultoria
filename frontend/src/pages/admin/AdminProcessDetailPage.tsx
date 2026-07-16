import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  LockKeyhole,
  MapPin,
  MessageCircle,
  SearchX,
  UserRound
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getServiceById } from "@/domain/catalog";
import { CASE_STATUSES, type CaseStatus } from "@/domain/types";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { getClient } from "@/pages/admin/adminProcessUtils";
import {
  adminFieldClass as fieldClass,
  adminFocusRing as focusRing
} from "@/pages/admin/adminStyles";
import { AdminCompletionDialog } from "@/pages/admin/components/AdminCompletionDialog";
import { AdminStatusConfirmationDialog } from "@/pages/admin/components/AdminStatusConfirmationDialog";
import { useAdminDialogFocusTrap } from "@/pages/admin/useAdminDialogFocusTrap";
import { createWhatsAppUrl } from "@/shared/config/contact";
import { formatDate, formatPropertyAddressCompact } from "@/shared/lib/formatters";
import { CaseFolio, EmptyState, PageHeader, StatusBadge } from "@/shared/ui/portal";

const STATUS_DIALOG_FOCUSABLE_SELECTOR =
  'button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const COMPLETION_DIALOG_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AdminProcessDetailPage() {
  const { id } = useParams();
  const {
    state,
    currentUser,
    updateCaseStatus,
    recordWhatsAppStarted
  } = usePortalData();
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

  useAdminDialogFocusTrap({
    isOpen: showStatusConfirmation,
    dialogRef: statusDialogRef,
    initialFocusRef: statusCancelRef,
    focusableSelector: STATUS_DIALOG_FOCUSABLE_SELECTOR,
    onEscape: () => setShowStatusConfirmation(false),
    onRestoreFocus: () => statusTriggerRef.current?.focus()
  });

  useAdminDialogFocusTrap({
    isOpen: showCompletionConfirmation,
    dialogRef: completionDialogRef,
    initialFocusRef: completionCancelRef,
    focusableSelector: COMPLETION_DIALOG_FOCUSABLE_SELECTOR,
    onEscape: () => setShowCompletionConfirmation(false),
    onRestoreFocus: () => {
      if (!completionConfirmedRef.current) completionTriggerRef.current?.focus();
    }
  });

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
        <AdminStatusConfirmationDialog
          currentStatus={item.status}
          selectedStatus={selectedStatus}
          dialogRef={statusDialogRef}
          cancelRef={statusCancelRef}
          onClose={() => setShowStatusConfirmation(false)}
          onConfirm={confirmStatusChange}
        />
      ) : null}

      {showCompletionConfirmation ? (
        <AdminCompletionDialog
          dialogRef={completionDialogRef}
          cancelRef={completionCancelRef}
          onClose={() => setShowCompletionConfirmation(false)}
          onConfirm={confirmCompletion}
        />
      ) : null}

      <CaseFolio
        protocol={item.protocol}
        serviceName={service?.name ?? "Serviço imobiliário"}
        propertyLabel={`${item.property.type} · ${formatPropertyAddressCompact(item.property)}`}
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
                <dd className="mt-2 leading-6 text-cacao/75">{formatPropertyAddressCompact(item.property)}</dd>
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
