import { X } from "lucide-react";
import type { RefObject } from "react";
import type { AdminDocumentQueueEntry } from "@/domain/selectors";
import { adminFocusRing as focusRing } from "@/pages/admin/adminStyles";

interface AdminRejectionDialogProps {
  rejectingEntry: AdminDocumentQueueEntry;
  dialogRef: RefObject<HTMLDivElement>;
  reasonRef: RefObject<HTMLTextAreaElement>;
  rejectionReason: string;
  validationError: string;
  onReasonChange: (value: string) => void;
  onClose: (restoreFocus?: boolean) => void;
  onConfirm: () => void;
}

export function AdminRejectionDialog({
  rejectingEntry,
  dialogRef,
  reasonRef,
  rejectionReason,
  validationError,
  onReasonChange,
  onClose,
  onConfirm
}: AdminRejectionDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-espresso/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(true);
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
            onClick={() => onClose(true)}
            aria-label="Fechar rejeição"
            className={`${focusRing} inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg text-cacao hover:bg-red-50`}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p id="rejection-dialog-description" className="mt-3 text-sm leading-6 text-cacao/75">
          O motivo será registrado no histórico e enviado ao cliente. Descreva somente o ajuste
          verificável.
        </p>

        <label
          htmlFor={`rejection-reason-${rejectingEntry.document.id}`}
          className="mt-5 block text-sm font-bold text-espresso"
        >
          Motivo da rejeição de {rejectingEntry.document.label} do protocolo{" "}
          {rejectingEntry.item.protocol}
        </label>
        <textarea
          ref={reasonRef}
          id={`rejection-reason-${rejectingEntry.document.id}`}
          rows={4}
          value={rejectionReason}
          onChange={(event) => onReasonChange(event.target.value)}
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
            onClick={() => onClose(true)}
            className={`${focusRing} min-h-11 rounded-lg px-5 text-sm font-bold text-cacao transition hover:bg-champagne/60`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${focusRing} min-h-11 rounded-lg bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800`}
          >
            Confirmar rejeição
          </button>
        </div>
      </div>
    </div>
  );
}
