import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import type { KeyboardEventHandler, RefObject } from "react";
import { Link } from "react-router-dom";
import type { PautaItem } from "@/domain/selectors";
import type { Case, CaseDocument, Service, User } from "@/domain/types";
import { formatDate, formatPropertyLabelCompact } from "@/shared/lib/formatters";
import { createWhatsAppUrl } from "@/shared/config/contact";
import { CaseFolio, StatusBadge } from "@/shared/ui/portal";
import { adminFocusRing } from "@/pages/admin/adminStyles";

type AdminDashboardDossierProps = {
  activeCase: Case;
  activeDocument?: CaseDocument;
  activeClient?: User;
  activeService?: Service;
  selectedItem: PautaItem;
  mobileDossierOpen: boolean;
  isMobilePauta: boolean;
  mobileDossierRef: RefObject<HTMLDivElement>;
  mobileBackRef: RefObject<HTMLButtonElement>;
  dispatchHeadingRef: RefObject<HTMLHeadingElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onClose: () => void;
  onStartReview: () => void;
  onApprove: () => void;
  onContactClient: () => void;
};

export function AdminDashboardDossier({
  activeCase,
  activeDocument,
  activeClient,
  activeService,
  selectedItem,
  mobileDossierOpen,
  isMobilePauta,
  mobileDossierRef,
  mobileBackRef,
  dispatchHeadingRef,
  onKeyDown,
  onClose,
  onStartReview,
  onApprove,
  onContactClient
}: AdminDashboardDossierProps) {
  return (
    <div
      ref={mobileDossierRef}
      role={mobileDossierOpen && isMobilePauta ? "dialog" : undefined}
      aria-modal={mobileDossierOpen && isMobilePauta ? "true" : undefined}
      aria-label={
        mobileDossierOpen && isMobilePauta ? `Dossiê operacional ${activeCase.protocol}` : undefined
      }
      onKeyDown={onKeyDown}
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
          onClick={onClose}
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
        propertyLabel={formatPropertyLabelCompact(activeCase.property)}
        objective={activeCase.objective}
        status={activeCase.status}
        priority={
          <section className="border-t-4 border-t-tealTech p-5" aria-labelledby="dispatch-heading">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">
              Despachar e seguir
            </p>
            <h2
              id="dispatch-heading"
              ref={dispatchHeadingRef}
              tabIndex={-1}
              className="mt-2 font-display text-2xl font-semibold text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
            >
              Despacho contextual
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-espresso">
              {selectedItem.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-cacao/70">{selectedItem.detail}</p>

            {activeDocument?.status === "Enviado" ? (
              <button
                type="button"
                onClick={onStartReview}
                className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] ${adminFocusRing}`}
              >
                Iniciar análise
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}

            {activeDocument?.status === "Em análise" ? (
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={onApprove}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] ${adminFocusRing}`}
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
                className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] ${adminFocusRing}`}
              >
                Abrir operação
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : null}

            {selectedItem.group === "client" && activeClient ? (
              <a
                href={createWhatsAppUrl(
                  `Olá, ${activeClient.name}. Quero falar sobre o protocolo ${activeCase.protocol}, serviço ${activeService?.name ?? "imobiliário"}.`
                )}
                target="_blank"
                rel="noreferrer"
                onClick={onContactClient}
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
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
              Parte interessada
            </p>
            <p className="mt-2 text-sm font-semibold text-espresso">
              {activeClient?.name ?? "Cliente"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
              Último movimento
            </p>
            <p className="mt-2 text-sm font-semibold text-espresso">
              {formatDate(activeCase.updatedAt)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
              Registro atual
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={activeCase.status} />
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-tealTech hover:bg-tealTech/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
                to={`/admin/processos/${activeCase.id}`}
              >
                Ver fólio completo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </CaseFolio>
    </div>
  );
}
