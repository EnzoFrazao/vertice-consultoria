import { Check, FileCheck2, FileClock, SearchX, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getServiceById } from "@/domain/catalog";
import type { AdminDocumentQueueEntry } from "@/domain/selectors";
import { formatShortDateTime } from "@/shared/lib/formatters";
import { EmptyState, StatusBadge } from "@/shared/ui/portal";
import { adminFocusRing as focusRing } from "@/pages/admin/adminStyles";

interface AdminDocumentQueueProps {
  entries: AdminDocumentQueueEntry[];
  getRejectionTriggerRef: (documentId: string) => (node: HTMLButtonElement | null) => void;
  startReview: (entry: AdminDocumentQueueEntry) => void;
  approve: (entry: AdminDocumentQueueEntry) => void;
  beginRejection: (documentId: string) => void;
}

export function AdminDocumentQueue({
  entries,
  getRejectionTriggerRef,
  startReview,
  approve,
  beginRejection
}: AdminDocumentQueueProps) {
  return (
    <>
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
              const latestVersion = caseDocument.versions[caseDocument.versions.length - 1];
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
                      <FileCheck2 aria-hidden="true" className="h-5 w-5 flex-none text-tealTech" />
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
                      <UserRound aria-hidden="true" className="h-4 w-4 flex-none text-tealTech" />
                      <span className="truncate">{client?.name ?? "Cliente não encontrado"}</span>
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
                      {formatShortDateTime(caseDocument.updatedAt)}
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
                          ref={getRejectionTriggerRef(caseDocument.id)}
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
    </>
  );
}
