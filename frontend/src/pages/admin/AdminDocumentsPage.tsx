import {
  Check,
  FileCheck2,
  FileClock,
  SearchX,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { EmptyState, PageHeader, StatusBadge } from "@/shared/ui/portal";
import { getServiceById } from "@/domain/catalog";
import {
  buildAdminDocumentQueue,
  type AdminDocumentQueueEntry
} from "@/domain/selectors";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

type QueueEntry = AdminDocumentQueueEntry;

type FocusRequest = {
  documentId?: string;
  action?: "start" | "approve";
  empty?: boolean;
};

function nextEntryAfter(entries: QueueEntry[], documentId: string) {
  const index = entries.findIndex((entry) => entry.document.id === documentId);
  if (index < 0) return undefined;
  return entries[index + 1] ?? entries[index - 1];
}

function actionFor(entry: QueueEntry): FocusRequest["action"] {
  return entry.document.status === "Enviado" ? "start" : "approve";
}

function formatUpdatedAt(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function AdminDocumentsPage() {
  const location = useLocation();
  const {
    state,
    currentUser,
    startDocumentReview,
    reviewDocument
  } = usePortalData();
  const [rejectingDocumentId, setRejectingDocumentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [actionError, setActionError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const rejectionTriggers = useRef(new Map<string, HTMLButtonElement>());
  const openedHashRef = useRef("");

  const entries = useMemo<QueueEntry[]>(
    () => buildAdminDocumentQueue(state),
    [state]
  );

  const rejectingEntry = entries.find(
    (entry) => entry.document.id === rejectingDocumentId
  );

  const restoreRejectionTrigger = (documentId: string | null) => {
    if (!documentId) return;
    window.setTimeout(() => rejectionTriggers.current.get(documentId)?.focus(), 0);
  };

  const closeRejection = (restoreFocus = true) => {
    const documentId = rejectingDocumentId;
    setRejectingDocumentId(null);
    setRejectionReason("");
    setValidationError("");
    if (restoreFocus) restoreRejectionTrigger(documentId);
  };

  function beginRejection(documentId: string) {
    setRejectingDocumentId(documentId);
    setRejectionReason("");
    setValidationError("");
    setActionError("");
  }

  useEffect(() => {
    if (!rejectingDocumentId) return;

    const dialog = dialogRef.current;
    window.setTimeout(() => reasonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRejection(true);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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

    dialog?.addEventListener("keydown", handleKeyDown);
    return () => dialog?.removeEventListener("keydown", handleKeyDown);
    // The dialog is recreated only when its target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectingDocumentId]);

  useEffect(() => {
    if (!focusRequest) return;

    const target = focusRequest.empty
      ? document.getElementById("document-queue-empty")
      : document.getElementById(
          `document-action-${focusRequest.documentId}-${focusRequest.action}`
        );

    if (target) {
      target.focus();
      setFocusRequest(null);
    }
  }, [entries, focusRequest]);

  useEffect(() => {
    if (!location.hash.startsWith("#documento-") || openedHashRef.current === location.hash) return;
    let documentId: string;
    try {
      documentId = decodeURIComponent(location.hash.slice("#documento-".length));
    } catch {
      return;
    }
    const entry = entries.find((candidate) => candidate.document.id === documentId);
    if (!entry || entry.document.status !== "Em análise") return;
    openedHashRef.current = location.hash;
    beginRejection(documentId);
  }, [entries, location.hash]);

  if (!currentUser) return null;
  const currentUserId = currentUser.id;

  const sentCount = entries.filter(({ document }) => document.status === "Enviado").length;
  const inReviewCount = entries.filter(
    ({ document }) => document.status === "Em análise"
  ).length;

  const requestNextFocus = (removedDocumentId: string) => {
    const next = nextEntryAfter(entries, removedDocumentId);
    setFocusRequest(
      next
        ? { documentId: next.document.id, action: actionFor(next) }
        : { empty: true }
    );
  };

  const startReview = (entry: QueueEntry) => {
    setActionError("");
    try {
      startDocumentReview(entry.item.id, entry.document.id, currentUserId);
      setAnnouncement(`${entry.document.label} entrou em análise.`);
      setFocusRequest({ documentId: entry.document.id, action: "approve" });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível iniciar a análise."
      );
    }
  };

  const approve = (entry: QueueEntry) => {
    setActionError("");
    try {
      reviewDocument(
        entry.item.id,
        entry.document.id,
        { decision: "approve" },
        currentUserId
      );
      setAnnouncement(`${entry.document.label} aprovado. A pauta avançou.`);
      requestNextFocus(entry.document.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível aprovar o documento."
      );
    }
  };

  const reject = (entry: QueueEntry) => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setValidationError("Informe o motivo da rejeição.");
      reasonRef.current?.focus();
      return;
    }

    setValidationError("");
    setActionError("");
    try {
      reviewDocument(
        entry.item.id,
        entry.document.id,
        { decision: "reject", reason },
        currentUserId
      );
      setAnnouncement(`${entry.document.label} rejeitado. A pauta avançou.`);
      closeRejection(false);
      requestNextFocus(entry.document.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível rejeitar o documento."
      );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análise documental"
        title="Documentos"
        description="Revise apenas os arquivos fictícios recebidos. Cada decisão entra no histórico e gera uma notificação para o cliente."
      />

      <section
        aria-label="Indicadores da fila documental"
        className="border-y border-espresso/15 bg-champagne/30 px-4 py-3 sm:px-5"
      >
        <dl className="grid grid-cols-3 divide-x divide-espresso/15">
          <div className="px-2 first:pl-0 sm:px-5">
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-cacao/75">
              Aguardando
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
              {sentCount}
            </dd>
          </div>
          <div className="px-2 sm:px-5">
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-cacao/75">
              Em análise
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
              {inReviewCount}
            </dd>
          </div>
          <div className="px-2 pr-0 sm:px-5">
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-cacao/75">
              Na pauta
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
              {entries.length}
            </dd>
          </div>
        </dl>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {actionError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {actionError}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <div id="document-queue-empty" tabIndex={-1} className={focusRing}>
          <EmptyState
            icon={SearchX}
            title="Fila documental em dia"
            description="Nenhum documento enviado ou em análise aguarda uma decisão."
          />
        </div>
      ) : (
        <section aria-label="Fila de documentos" className="folio-sheet overflow-hidden">
          <div
            role="table"
            aria-label="Documentos aguardando decisão"
            className="divide-y divide-espresso/10"
          >
            <div
              role="row"
              className="hidden 2xl:grid 2xl:grid-cols-[minmax(10rem,1.35fr)_4rem_5rem_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_6rem_7rem_minmax(12rem,auto)] 2xl:gap-3 2xl:bg-espresso 2xl:px-4 2xl:py-3 2xl:text-[0.68rem] 2xl:font-bold 2xl:uppercase 2xl:tracking-[0.1em] 2xl:text-champagne"
            >
              {[
                "Documento",
                "Versão",
                "Tamanho",
                "Processo",
                "Cliente",
                "Estado",
                "Atualização",
                "Despacho"
              ].map((label) => (
                <span key={label} role="columnheader">
                  {label}
                </span>
              ))}
            </div>

            {entries.map((entry) => {
              const { item, document: caseDocument, client } = entry;
              const service = getServiceById(item.serviceId);
              const latestVersion =
                caseDocument.versions[caseDocument.versions.length - 1];
              const actionName = `${caseDocument.label} do protocolo ${item.protocol}`;

              return (
                <article
                  key={caseDocument.id}
                  id={`documento-${caseDocument.id}`}
                  tabIndex={-1}
                  role="row"
                  className="scroll-mt-28 grid gap-4 bg-ivory px-4 py-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech sm:grid-cols-2 sm:px-5 2xl:grid-cols-[minmax(10rem,1.35fr)_4rem_5rem_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_6rem_7rem_minmax(12rem,auto)] 2xl:items-center 2xl:gap-3 2xl:px-4 2xl:py-4"
                >
                  <div role="cell" className="min-w-0 sm:col-span-2 2xl:col-span-1">
                    <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Documento
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <FileCheck2
                        aria-hidden="true"
                        className="h-5 w-5 flex-none text-tealTech"
                      />
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-espresso">
                          {caseDocument.label}
                        </h2>
                        <p className="mt-0.5 truncate text-xs text-cacao/75">
                          {latestVersion?.fileName ?? service?.name ?? "Sem arquivo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div role="cell">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Versão
                    </span>
                    <span className="mt-1 block font-semibold text-espresso 2xl:mt-0">
                      v{caseDocument.versions.length}
                    </span>
                  </div>

                  <div role="cell">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Tamanho
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-espresso 2xl:mt-0">
                      {latestVersion?.sizeLabel ?? "—"}
                    </span>
                  </div>

                  <div role="cell">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Processo
                    </span>
                    <Link
                      to={`/admin/processos/${item.id}`}
                      className={`${focusRing} mt-1 inline-flex min-h-11 items-center rounded-lg font-bold text-tealTech hover:underline 2xl:mt-0`}
                    >
                      {item.protocol}
                    </Link>
                  </div>

                  <div role="cell" className="min-w-0">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Cliente
                    </span>
                    <span className="mt-1 flex min-h-11 min-w-0 items-center gap-2 text-sm font-semibold text-espresso 2xl:mt-0">
                      <UserRound
                        aria-hidden="true"
                        className="h-4 w-4 flex-none text-tealTech"
                      />
                      <span className="truncate">
                        {client?.name ?? "Cliente não encontrado"}
                      </span>
                    </span>
                  </div>

                  <div role="cell">
                    <span className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Estado
                    </span>
                    <StatusBadge status={caseDocument.status} />
                  </div>

                  <div role="cell">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 2xl:hidden">
                      Atualização
                    </span>
                    <time
                      dateTime={caseDocument.updatedAt}
                      className="mt-1 block text-xs font-semibold leading-5 text-cacao/75 2xl:mt-0"
                    >
                      {formatUpdatedAt(caseDocument.updatedAt)}
                    </time>
                  </div>

                  <div
                    role="cell"
                    className="flex flex-wrap gap-2 sm:col-span-2 2xl:col-span-1 2xl:justify-end"
                  >
                    {caseDocument.status === "Enviado" ? (
                      <button
                        id={`document-action-${caseDocument.id}-start`}
                        type="button"
                        onClick={() => startReview(entry)}
                        className={`${focusRing} inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-espresso px-4 text-sm font-bold text-ivory transition hover:bg-cacao 2xl:flex-none`}
                        aria-label={`Iniciar análise de ${actionName}`}
                      >
                        <FileClock aria-hidden="true" className="h-4 w-4" />
                        Iniciar análise
                      </button>
                    ) : (
                      <>
                        <button
                          id={`document-action-${caseDocument.id}-approve`}
                          type="button"
                          onClick={() => approve(entry)}
                          className={`${focusRing} inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 text-sm font-bold text-white transition hover:bg-[#0b625c] 2xl:flex-none`}
                          aria-label={`Aprovar ${actionName}`}
                        >
                          <Check aria-hidden="true" className="h-4 w-4" />
                          Aprovar e seguir
                        </button>
                        <button
                          ref={(node) => {
                            if (node) rejectionTriggers.current.set(caseDocument.id, node);
                            else rejectionTriggers.current.delete(caseDocument.id);
                          }}
                          type="button"
                          onClick={() => beginRejection(caseDocument.id)}
                          className={`${focusRing} inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-800 transition hover:bg-red-100 2xl:flex-none`}
                          aria-label={`Rejeitar ${actionName}`}
                          aria-haspopup="dialog"
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                          Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <p className="border-t border-dashed border-espresso/20 pt-3 text-xs leading-5 text-cacao/70">
        Demonstração frontend: os nomes e tamanhos representam uma biblioteca fictícia; nenhum arquivo real é armazenado ou analisado.
      </p>

      {rejectingEntry ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-espresso/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRejection(true);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-dialog-title"
            aria-describedby="rejection-dialog-description"
            className="w-full max-w-xl rounded-t-2xl border border-red-200 bg-ivory p-5 shadow-2xl sm:rounded-lg sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-700">
                  Decisão documental
                </p>
                <h2
                  id="rejection-dialog-title"
                  className="mt-2 font-display text-2xl font-semibold text-espresso"
                >
                  Registrar ajuste necessário
                </h2>
              </div>
              <button
                type="button"
                onClick={() => closeRejection(true)}
                aria-label="Fechar rejeição"
                className={`${focusRing} inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg text-cacao hover:bg-red-50`}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <p id="rejection-dialog-description" className="mt-3 text-sm leading-6 text-cacao/75">
              O motivo será registrado no histórico e enviado ao cliente. Descreva somente o ajuste verificável.
            </p>

            <label
              htmlFor={`rejection-reason-${rejectingEntry.document.id}`}
              className="mt-5 block text-sm font-bold text-espresso"
            >
              Motivo da rejeição de {rejectingEntry.document.label} do protocolo {rejectingEntry.item.protocol}
            </label>
            <textarea
              ref={reasonRef}
              id={`rejection-reason-${rejectingEntry.document.id}`}
              rows={4}
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                if (validationError) setValidationError("");
              }}
              aria-describedby={
                validationError
                  ? `rejection-error-${rejectingEntry.document.id}`
                  : "rejection-dialog-description"
              }
              aria-invalid={Boolean(validationError)}
              placeholder="Explique objetivamente o ajuste necessário"
              className={`${focusRing} mt-2 w-full rounded-lg border border-espresso/25 bg-white px-3.5 py-3 text-sm leading-6 text-espresso shadow-sm`}
            />

            {validationError ? (
              <p
                id={`rejection-error-${rejectingEntry.document.id}`}
                role="alert"
                className="mt-2 text-sm font-semibold text-red-800"
              >
                {validationError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeRejection(true)}
                className={`${focusRing} min-h-11 rounded-lg px-5 text-sm font-bold text-cacao transition hover:bg-champagne/60`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => reject(rejectingEntry)}
                className={`${focusRing} min-h-11 rounded-lg bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800`}
              >
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
