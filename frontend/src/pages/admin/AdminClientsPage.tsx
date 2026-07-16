import { FolderKanban, Mail, MapPin, Phone, SearchX, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { EmptyState, PageHeader, StatusBadge } from "@/shared/ui/portal";
import { getServiceById } from "@/domain/catalog";
import { adminFocusRing as focusRing } from "@/pages/admin/adminStyles";

export function AdminClientsPage() {
  const { state } = usePortalData();
  const clients = state.users
    .filter((user) => user.role === "client")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Índice de partes"
        title="Clientes"
        description="Diretório somente leitura das pessoas que já enviaram solicitações nesta demonstração."
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum cliente no índice"
          description="Os clientes aparecerão aqui quando houver solicitações recebidas."
        />
      ) : (
        <section
          aria-label="Diretório de clientes"
          className="folio-sheet overflow-hidden divide-y divide-espresso/10"
        >
          <div className="hidden bg-espresso px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-champagne lg:grid lg:grid-cols-[minmax(11rem,1fr)_minmax(12rem,1.1fr)_minmax(12rem,1.1fr)_minmax(15rem,1.35fr)] lg:gap-5">
            <span>Parte</span>
            <span>Contato</span>
            <span>Endereço</span>
            <span>Processos vinculados</span>
          </div>

          {clients.map((client, index) => {
            const cases = state.cases
              .filter((item) => item.clientId === client.id)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            const active = cases.filter((item) => item.status !== "Concluído").length;

            return (
              <article
                key={client.id}
                className="grid gap-5 bg-ivory px-5 py-6 lg:grid-cols-[minmax(11rem,1fr)_minmax(12rem,1.1fr)_minmax(12rem,1.1fr)_minmax(15rem,1.35fr)] lg:items-start lg:gap-5"
              >
                <div className="min-w-0">
                  <span className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75 lg:hidden">
                    Parte
                  </span>
                  <div className="flex items-start gap-3">
                    <span className="font-display text-sm font-semibold text-bronze">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-champagne text-bronze">
                      <UserRound aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-semibold leading-tight text-espresso">
                        {client.name}
                      </h2>
                      <div className="mt-2">
                        <StatusBadge
                          status={`${active} ${active === 1 ? "ativo" : "ativos"}`}
                          tone={active > 0 ? "info" : "neutral"}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <dl className="grid min-w-0 gap-3 border-y border-espresso/10 py-4 text-sm lg:border-0 lg:py-0">
                  <div className="min-w-0">
                    <dt className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75">
                      <Mail aria-hidden="true" className="h-4 w-4" /> E-mail
                    </dt>
                    <dd className="mt-1.5 break-all font-semibold leading-6 text-espresso">
                      {client.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75">
                      <Phone aria-hidden="true" className="h-4 w-4" /> Telefone
                    </dt>
                    <dd className="mt-1.5 font-semibold leading-6 text-espresso">{client.phone}</dd>
                  </div>
                </dl>

                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75">
                    <MapPin aria-hidden="true" className="h-4 w-4" /> Endereço
                  </p>
                  <p className="mt-1.5 break-words text-sm font-semibold leading-6 text-espresso">
                    {client.address}
                  </p>
                </div>

                <div className="min-w-0 border-t border-espresso/10 pt-4 lg:border-0 lg:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-wide text-cacao/75">
                      Processos vinculados
                    </p>
                    <span className="text-xs font-semibold text-cacao/70">
                      {cases.length} {cases.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>

                  {cases.length > 0 ? (
                    <ul className="mt-2 divide-y divide-espresso/10 border-y border-espresso/10">
                      {cases.slice(0, 2).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <Link
                              to={`/admin/processos/${item.id}`}
                              className={`${focusRing} inline-flex min-h-11 items-center rounded-lg font-bold text-tealTech hover:underline`}
                            >
                              {item.protocol}
                            </Link>
                            <p className="truncate text-xs text-cacao/70">
                              {getServiceById(item.serviceId)?.name ?? "Serviço não encontrado"}
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-cacao/70">
                      Nenhum processo vinculado.
                    </p>
                  )}

                  <Link
                    to={`/admin/processos?cliente=${client.id}`}
                    className={`${focusRing} mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-tealTech transition hover:bg-tealTech/10`}
                    aria-label={`Ver processos de ${client.name}`}
                  >
                    <FolderKanban aria-hidden="true" className="h-5 w-5" />
                    {cases.length > 2 ? `Ver todos (+${cases.length - 2})` : "Ver processos"}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="border-t border-dashed border-espresso/20 pt-3 text-xs leading-5 text-cacao/70">
        O administrador consulta apenas clientes com solicitações recebidas. Cadastro e edição de
        clientes não fazem parte desta versão frontend.
      </p>
    </div>
  );
}
