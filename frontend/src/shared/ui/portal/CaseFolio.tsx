import { AlertTriangle, Check } from "lucide-react";
import type { ReactNode } from "react";
import type { CaseStatus } from "@/domain/types";

const macroPhases = [
  "Entrada",
  "Documentação",
  "Análise técnica",
  "Órgãos",
  "Conclusão"
] as const;

const statusPhaseIndex: Partial<Record<CaseStatus, number>> = {
  Novo: 0,
  "Documentos pendentes": 1,
  "Documentos em análise": 1,
  "Análise técnica": 2,
  "Prefeitura/cartório": 3,
  Concluído: 4
};

export interface CaseFolioProps {
  protocol: string;
  serviceName: string;
  propertyLabel: string;
  objective: string;
  status: CaseStatus;
  priority?: ReactNode;
  children?: ReactNode;
}

export function CaseFolio({
  protocol,
  serviceName,
  propertyLabel,
  objective,
  status,
  priority,
  children
}: CaseFolioProps) {
  const currentPhaseIndex = statusPhaseIndex[status];
  const awaitsClient = status === "Aguardando cliente";

  return (
    <article
      aria-label={`Fólio ${protocol}`}
      className={`folio-sheet overflow-hidden ${
        priority ? "lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start" : ""
      }`}
    >
      <header className="relative overflow-hidden border-b border-espresso/15 bg-espresso px-5 py-7 text-ivory sm:px-8 sm:py-9 lg:col-start-1 lg:row-start-1">
        <div aria-hidden="true" className="folio-cadastral-lines absolute inset-y-0 right-0 w-2/5 opacity-30" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-champagne">
              {protocol}
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-bronze" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ivory/70">
              {status}
            </p>
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ivory sm:text-4xl">
            {serviceName}
          </h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-champagne sm:text-base">
            {propertyLabel}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory/75">{objective}</p>
        </div>
      </header>

      {priority ? (
        <div className="border-b border-espresso/15 bg-champagne/20 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-fit lg:border-b-0 lg:border-l">
          {priority}
        </div>
      ) : null}

      <section className="px-5 py-6 sm:px-8 sm:py-7 lg:col-start-1" aria-labelledby={`${protocol}-progress-title`}>
        <div className="flex items-center justify-between gap-4">
          <h3
            id={`${protocol}-progress-title`}
            className="text-xs font-bold uppercase tracking-[0.2em] text-cacao"
          >
            Andamento
          </h3>
          <p className="text-xs font-semibold text-cacao/75">
            {currentPhaseIndex === undefined
              ? "Fase em pausa"
              : `Fase ${currentPhaseIndex + 1} de ${macroPhases.length}`}
          </p>
        </div>

        <ol
          aria-label="Andamento do processo"
          className={`mt-5 grid gap-2 border-y border-espresso/10 py-2 ${
            priority ? "2xl:grid-cols-5 2xl:gap-0" : "lg:grid-cols-5 lg:gap-0"
          }`}
        >
          {macroPhases.map((phase, index) => {
            const isCurrent = currentPhaseIndex !== undefined && index === currentPhaseIndex;
            const isComplete =
              currentPhaseIndex !== undefined &&
              (index < currentPhaseIndex || status === "Concluído");

            return (
              <li
                key={phase}
                aria-current={isCurrent ? "step" : undefined}
                className={`folio-rule relative flex min-h-16 items-center gap-3 px-3 py-3 ${
                  priority
                    ? "2xl:min-h-24 2xl:items-start 2xl:border-l 2xl:border-espresso/10 2xl:px-4"
                    : "lg:min-h-24 lg:items-start lg:border-l lg:border-espresso/10 lg:px-4"
                } ${
                  isCurrent ? "bg-tealTech/[0.07] text-espresso" : "text-cacao/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center border text-xs font-bold ${
                    isCurrent
                      ? "border-tealTech bg-tealTech text-white"
                      : isComplete
                        ? "border-tealTech/30 bg-tealTech/10 text-tealTech"
                        : "border-espresso/20 bg-ivory text-cacao/70"
                  }`}
                >
                  {isComplete && !isCurrent ? <Check className="h-4 w-4" /> : null}
                  {!(isComplete && !isCurrent) ? (
                    <span
                      className="folio-phase-number"
                      data-number={String(index + 1).padStart(2, "0")}
                    />
                  ) : null}
                </span>
                <span className="pt-1 text-sm font-semibold leading-5">{phase}</span>
              </li>
            );
          })}
        </ol>

        {awaitsClient ? (
          <aside
            role="note"
            className="mt-4 flex items-start gap-3 border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-amber-950"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Aguardando cliente</p>
              <p className="mt-1 text-xs leading-5">
                O processo está em pausa até receber uma informação, resposta ou documento do cliente.
              </p>
            </div>
          </aside>
        ) : null}
      </section>

      {children ? <div className="border-t border-espresso/10 px-5 py-6 sm:px-8 sm:py-8 lg:col-start-1">{children}</div> : null}
    </article>
  );
}
