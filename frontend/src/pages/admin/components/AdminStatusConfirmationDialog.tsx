import type { RefObject } from "react";
import type { CaseStatus } from "@/domain/types";
import { adminFocusRing as focusRing } from "@/pages/admin/adminStyles";

interface AdminStatusConfirmationDialogProps {
  currentStatus: CaseStatus;
  selectedStatus: CaseStatus;
  dialogRef: RefObject<HTMLDivElement>;
  cancelRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminStatusConfirmationDialog({
  currentStatus,
  selectedStatus,
  dialogRef,
  cancelRef,
  onClose,
  onConfirm
}: AdminStatusConfirmationDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-espresso/70 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-confirmation-title"
        className="w-full rounded-t-2xl border border-bronze/40 bg-ivory p-5 shadow-[0_28px_90px_rgba(32,19,13,0.32)] sm:max-w-lg sm:rounded-lg sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-tealTech">
          Confirmar movimento
        </p>
        <h2
          id="status-confirmation-title"
          className="mt-2 font-display text-2xl font-semibold text-espresso"
        >
          Alterar estado do processo?
        </h2>
        <p className="mt-4 flex min-h-12 items-center gap-3 border-y border-espresso/15 py-3 text-sm">
          <strong>{currentStatus}</strong>
          <span aria-hidden="true" className="text-bronze">
            →
          </span>
          <strong className="text-tealTech">{selectedStatus}</strong>
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className={`${focusRing} min-h-11 rounded-lg border border-espresso/20 px-4 text-sm font-bold text-espresso`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${focusRing} min-h-11 rounded-lg bg-tealTech px-4 text-sm font-bold text-white`}
          >
            Confirmar novo estado
          </button>
        </div>
      </section>
    </div>
  );
}
