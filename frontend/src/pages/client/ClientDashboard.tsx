import { ArrowRight, Building2, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { CaseFolio, EmptyState, PageHeader, StatusBadge } from "@/shared/ui/portal";
import { createWhatsAppUrl } from "@/shared/config/contact";
import { getServiceById } from "@/domain/catalog";
import { derivePendingActions } from "@/domain/selectors";
import { formatDate, formatPropertyLabelComplete } from "@/shared/lib/formatters";
import { getPendingActionHref } from "@/pages/client/clientUtils";

const primaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2";

export function ClientDashboard() {
  const { state, currentUser, recordWhatsAppStarted } = usePortalData();
  if (!currentUser) return null;

  const cases = state.cases
    .filter((item) => item.clientId === currentUser.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const pendingActions = derivePendingActions(state, {
    id: currentUser.id,
    role: "client"
  });
  const activeCase =
    cases.find((item) => pendingActions.some((action) => action.caseId === item.id)) ?? cases[0];

  if (!activeCase) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={`Olá, ${currentUser.name.split(" ")[0]}`}
          title="Seu imóvel, com cada etapa sob controle."
          description="Quando você iniciar uma solicitação, o dossiê do imóvel aparecerá aqui com cada decisão, documento e movimento."
        />
        <EmptyState
          icon={Building2}
          title="Este espaço começa com o seu imóvel"
          description="Conte o que precisa resolver e acompanhe todo o percurso em um único fólio."
          action={
            <Link className={primaryActionClass} to="/cliente/nova-solicitacao">
              Criar primeira solicitação
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  const activeService = getServiceById(activeCase.serviceId);
  const activeActions = pendingActions.filter((action) => action.caseId === activeCase.id);
  const dominantAction = activeActions[0];
  const responseHref = createWhatsAppUrl(
    `Olá! Quero responder à orientação sobre ${activeService?.name ?? "meu processo"}, protocolo ${activeCase.protocol}.`
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Dossiê de ${currentUser.name.split(" ")[0]}`}
        title="Seu imóvel não é um número em um painel."
        description="Ele é um fólio vivo: a situação atual, o que precisa acontecer agora e tudo o que já foi registrado."
        actions={
          <Link className={primaryActionClass} to="/cliente/nova-solicitacao">
            <FilePlus2 aria-hidden="true" className="h-5 w-5" />
            Nova solicitação
          </Link>
        }
      />

      <section
        aria-label="Resumo dos seus processos"
        className="grid border-y border-espresso/15 bg-ivory/55 sm:grid-cols-3"
      >
        <div className="px-4 py-4 sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">Fólios</p>
          <p className="mt-1 font-display text-2xl font-semibold text-espresso">{cases.length}</p>
        </div>
        <div className="border-t border-espresso/10 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
            Dependem de você
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-espresso">
            {pendingActions.length}
          </p>
        </div>
        <div className="border-t border-espresso/10 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">Em foco</p>
          <p className="mt-1 truncate text-sm font-bold text-espresso">{activeCase.protocol}</p>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] 2xl:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="Índice dos seus processos"
          className="folio-sheet overflow-hidden lg:sticky lg:top-28"
        >
          <div className="border-b border-espresso/15 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Índice</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-espresso">Seus fólios</h2>
          </div>
          <ol className="divide-y divide-espresso/10">
            {cases.map((item, index) => {
              const service = getServiceById(item.serviceId);
              const isActive = item.id === activeCase.id;
              return (
                <li key={item.id}>
                  <Link
                    to={`/cliente/processos/${item.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`group flex min-h-20 gap-3 border-l-4 px-3 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech ${
                      isActive
                        ? "border-tealTech bg-tealTech/[0.07]"
                        : "border-transparent hover:border-bronze/50 hover:bg-champagne/25"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="pt-0.5 text-[10px] font-bold tracking-[0.16em] text-bronze"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-espresso">{item.protocol}</span>
                      <span className="mt-1 block truncate text-xs leading-5 text-cacao/70">
                        {service?.name ?? "Serviço imobiliário"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link
            to="/cliente/processos"
            className="flex min-h-11 items-center justify-between border-t border-espresso/15 px-4 text-sm font-bold text-tealTech hover:bg-tealTech/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech"
          >
            Ver índice completo
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </nav>

        <CaseFolio
          protocol={activeCase.protocol}
          serviceName={activeService?.name ?? "Serviço imobiliário"}
          propertyLabel={formatPropertyLabelComplete(activeCase.property)}
          objective={activeCase.objective}
          status={activeCase.status}
          priority={
            <section
              id="agora-do-processo"
              tabIndex={-1}
              aria-labelledby="agora-heading"
              className="border-t-4 border-t-tealTech p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">
                Próxima decisão
              </p>
              <h2
                id="agora-heading"
                className="mt-2 font-display text-2xl font-semibold text-espresso"
              >
                Agora
              </h2>
              {dominantAction ? (
                <>
                  <p className="mt-4 text-base font-semibold leading-6 text-espresso">
                    {dominantAction.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-cacao/70">
                    {dominantAction.kind === "client-response"
                      ? "Abra uma conversa já identificada com serviço e protocolo."
                      : "Abra o documento certo; o restante do dossiê continua no lugar."}
                  </p>
                  {dominantAction.kind === "client-response" ? (
                    <a
                      className={`${primaryActionClass} mt-5 w-full text-center`}
                      href={responseHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => recordWhatsAppStarted(activeCase.id, currentUser.id)}
                    >
                      {dominantAction.title}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      className={`${primaryActionClass} mt-5 w-full`}
                      to={getPendingActionHref(dominantAction)}
                    >
                      {dominantAction.title}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  )}
                  {pendingActions.length > 1 ? (
                    <p className="mt-3 text-center text-xs font-semibold text-cacao/70">
                      mais {pendingActions.length - 1} ações
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-4 text-base font-semibold text-espresso">
                    Nada precisa de você agora
                  </p>
                  <p className="mt-2 text-sm leading-6 text-cacao/70">
                    Estado atual: {activeCase.status}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-cacao/70">
                    O processo segue com a equipe. Um novo movimento aparecerá aqui quando houver
                    algo a decidir.
                  </p>
                </>
              )}
            </section>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
                Último movimento
              </p>
              <p className="mt-2 text-sm font-semibold text-espresso">
                {formatDate(activeCase.updatedAt, true)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">
                Estado atual
              </p>
              <StatusBadge className="mt-2" status={activeCase.status} />
            </div>
          </div>
        </CaseFolio>
      </div>
    </div>
  );
}
