import { ArrowRight, Building2, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemoApp } from "../../app/DemoAppProvider";
import { EmptyState, PageHeader, StatusBadge } from "../../components/portal";
import { getServiceById } from "../../data/demo/catalog";
import { formatDate, formatPropertyLabel } from "./clientUtils";

const primaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2";

export function ClientProcessesPage() {
  const { state, currentUser } = useDemoApp();
  if (!currentUser) return null;

  const cases = state.cases
    .filter((item) => item.clientId === currentUser.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Índice do patrimônio"
        title="Meus processos"
        description="Cada linha abre o fólio completo do imóvel: contexto, andamento, documentos e histórico em uma leitura contínua."
        actions={
          <Link className={primaryActionClass} to="/cliente/nova-solicitacao">
            <FilePlus2 aria-hidden="true" className="h-5 w-5" />
            Nova solicitação
          </Link>
        }
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Este espaço começa com o seu imóvel"
          description="Inicie uma solicitação para formar o primeiro fólio e acompanhar cada movimento do processo."
          action={
            <Link className={primaryActionClass} to="/cliente/nova-solicitacao">
              Iniciar solicitação
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <section aria-labelledby="folio-index-heading" className="folio-sheet overflow-hidden">
          <header className="grid gap-2 border-b border-espresso/15 bg-espresso px-5 py-5 text-ivory sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-champagne">Registro vivo</p>
              <h2 id="folio-index-heading" className="mt-1 font-display text-2xl font-semibold">Índice de fólios</h2>
            </div>
            <p className="text-sm text-ivory/75">{cases.length} {cases.length === 1 ? "processo" : "processos"}</p>
          </header>

          <ol className="divide-y divide-espresso/10">
            {cases.map((item, index) => {
              const service = getServiceById(item.serviceId);
              return (
                <li key={item.id}>
                  <Link
                    to={`/cliente/processos/${item.id}`}
                    className="group grid min-h-28 gap-4 border-l-4 border-transparent px-4 py-5 transition-colors hover:border-tealTech hover:bg-tealTech/[0.045] focus-visible:border-tealTech focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech sm:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(11rem,0.8fr)_auto] sm:items-center sm:px-6"
                  >
                    <span aria-hidden="true" className="font-display text-2xl text-bronze/75">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-[0.15em] text-tealTech">
                        {item.protocol}
                      </span>
                      <span className="mt-1.5 block font-display text-xl font-semibold text-espresso">
                        {service?.name ?? "Serviço imobiliário"}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-cacao/70">
                        {formatPropertyLabel(item.property)}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-cacao/60">Objetivo</span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-5 text-cacao/75">{item.objective}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-cacao/65">{formatDate(item.updatedAt)}</span>
                      <ArrowRight aria-hidden="true" className="h-5 w-5 text-tealTech transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
