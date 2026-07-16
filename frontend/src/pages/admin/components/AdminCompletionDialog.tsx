import { X } from "lucide-react";
import type { RefObject } from "react";
import { adminFocusRing as focusRing } from "@/pages/admin/adminStyles";

interface AdminCompletionDialogProps {
  dialogRef: RefObject<HTMLDivElement>;
  cancelRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminCompletionDialog({
  dialogRef,
  cancelRef,
  onClose,
  onConfirm
}: AdminCompletionDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-espresso/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        aria-describedby="completion-description"
        className="relative w-full max-w-xl border border-bronze/50 bg-ivory p-6 shadow-[0_28px_90px_rgba(32,19,13,0.32)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className={`${focusRing} absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-lg text-cacao transition hover:bg-espresso/5`}
          aria-label="Fechar confirmação"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">
          Decisão irreversível
        </p>
        <h2
          id="completion-title"
          className="mt-3 pr-10 font-display text-3xl font-semibold text-espresso"
        >
          Concluir processo?
        </h2>
        <p
          id="completion-description"
          className="mt-3 text-sm leading-6 text-cacao/75"
        >
          Depois da confirmação, o processo não poderá mais ser alterado nesta
          demonstração. Documentos e histórico continuarão disponíveis em modo
          de leitura.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className={`${focusRing} min-h-11 rounded-lg border border-espresso/20 px-5 text-sm font-bold text-espresso transition hover:bg-espresso/5`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${focusRing} min-h-11 rounded-lg bg-tealTech px-5 text-sm font-bold text-white transition hover:bg-tealTech/90`}
          >
            Confirmar conclusão
          </button>
        </div>
      </section>
    </div>
  );
}
