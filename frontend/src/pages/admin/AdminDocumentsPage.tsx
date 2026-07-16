import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { PageHeader } from "@/shared/ui/portal";
import {
  buildAdminDocumentQueue,
  type AdminDocumentQueueEntry
} from "@/domain/selectors";
import { AdminDocumentQueue } from "@/pages/admin/components/AdminDocumentQueue";
import { AdminRejectionDialog } from "@/pages/admin/components/AdminRejectionDialog";

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
  const rejectionTriggerCallbacks = useRef(
    new Map<string, (node: HTMLButtonElement | null) => void>()
  );
  const openedHashRef = useRef("");

  const getRejectionTriggerRef = useCallback((documentId: string) => {
    const existingCallback = rejectionTriggerCallbacks.current.get(documentId);
    if (existingCallback) return existingCallback;

    const callback = (node: HTMLButtonElement | null) => {
      if (node) rejectionTriggers.current.set(documentId, node);
      else rejectionTriggers.current.delete(documentId);
    };
    rejectionTriggerCallbacks.current.set(documentId, callback);
    return callback;
  }, []);

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

      <AdminDocumentQueue
        entries={entries}
        getRejectionTriggerRef={getRejectionTriggerRef}
        startReview={startReview}
        approve={approve}
        beginRejection={beginRejection}
      />

      <p className="border-t border-dashed border-espresso/20 pt-3 text-xs leading-5 text-cacao/70">
        Demonstração frontend: os nomes e tamanhos representam uma biblioteca fictícia; nenhum arquivo real é armazenado ou analisado.
      </p>

      {rejectingEntry ? (
        <AdminRejectionDialog
          rejectingEntry={rejectingEntry}
          dialogRef={dialogRef}
          reasonRef={reasonRef}
          rejectionReason={rejectionReason}
          validationError={validationError}
          onReasonChange={(value) => {
            setRejectionReason(value);
            if (validationError) setValidationError("");
          }}
          onClose={closeRejection}
          onConfirm={() => reject(rejectingEntry)}
        />
      ) : null}
    </div>
  );
}
