import { Search, SearchX, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getServiceById, SERVICES } from "@/domain/catalog";
import { CASE_STATUSES } from "@/domain/types";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { getClient } from "@/pages/admin/adminProcessUtils";
import {
  adminFieldClass as fieldClass,
  adminFocusRing as focusRing
} from "@/pages/admin/adminStyles";
import { formatDate } from "@/shared/lib/formatters";
import { EmptyState, PageHeader, StatusBadge } from "@/shared/ui/portal";

export function AdminProcessesPage() {
  const { state } = usePortalData();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [clientFilter, setClientFilter] = useState(() => searchParams.get("cliente") ?? "");
  const clients = state.users
    .filter((user) => user.role === "client")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const filteredCases = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return [...state.cases]
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => !serviceFilter || item.serviceId === serviceFilter)
      .filter((item) => !clientFilter || item.clientId === clientFilter)
      .filter((item) => {
        if (!query) return true;
        const client = getClient(state.users, item);
        const service = getServiceById(item.serviceId);
        return [
          item.protocol,
          client?.name,
          client?.email,
          service?.name,
          item.property.address,
          item.property.neighborhood,
          item.property.city,
          item.property.registrationNumber
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(query);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [clientFilter, search, serviceFilter, state.cases, state.users, statusFilter]);

  const hasFilters = Boolean(search || statusFilter || serviceFilter || clientFilter);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestão"
        title="Processos"
        description="Localize solicitações por protocolo, cliente, serviço ou situação atual."
      />

      <section
        aria-label="Filtros de processos"
        className="rounded-2xl border border-espresso/10 bg-ivory p-4 shadow-[0_12px_36px_rgba(32,19,13,0.05)] sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(10rem,1fr))]">
          <label className="block text-sm font-semibold text-espresso">
            Buscar processos
            <span className="relative mt-2 block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cacao/60"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Protocolo, cliente ou imóvel"
                className={`${fieldClass} pl-10`}
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os status</option>
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por serviço
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os serviços</option>
              {SERVICES.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-espresso">
            Filtrar por cliente
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className={`${fieldClass} mt-2`}
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-4">
          <p className="text-sm text-cacao/70">
            <strong className="text-espresso">{filteredCases.length}</strong>{" "}
            {filteredCases.length === 1 ? "processo encontrado" : "processos encontrados"}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setServiceFilter("");
                setClientFilter("");
              }}
              className={`${focusRing} min-h-11 rounded-xl px-4 text-sm font-bold text-tealTech transition hover:bg-tealTech/10`}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </section>

      {filteredCases.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum processo encontrado"
          description="Ajuste os filtros ou limpe a busca para visualizar outras solicitações."
        />
      ) : (
        <section
          aria-label="Lista de processos"
          className="overflow-hidden border-y border-espresso/15 bg-ivory"
        >
          <div
            aria-hidden="true"
            className="hidden min-h-11 grid-cols-[minmax(10rem,0.8fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)_8.5rem_7rem] items-center gap-4 border-b border-espresso/15 bg-champagne/30 px-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cacao/65 lg:grid"
          >
            <span>Registro</span>
            <span>Imóvel e serviço</span>
            <span>Parte interessada</span>
            <span>Estado</span>
            <span className="text-right">Movimento</span>
          </div>
          {filteredCases.map((item) => {
            const client = getClient(state.users, item);
            const service = getServiceById(item.serviceId);
            const pendingDocuments = item.documents.filter((document) =>
              ["Pendente", "Rejeitado"].includes(document.status)
            ).length;
            return (
              <Link
                key={item.id}
                to={`/admin/processos/${item.id}`}
                className={`${focusRing} group grid min-h-24 gap-4 border-b border-espresso/10 px-5 py-4 transition last:border-b-0 hover:bg-tealTech/[0.045] lg:grid-cols-[minmax(10rem,0.8fr)_minmax(13rem,1.35fr)_minmax(10rem,0.8fr)_8.5rem_7rem] lg:items-center`}
                aria-label={`${item.protocol}, ${service?.name ?? "serviço"}, ${client?.name ?? "cliente"}`}
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-espresso group-hover:text-tealTech">
                    {item.protocol}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-cacao/60">
                    {pendingDocuments === 0
                      ? "Documentação em dia"
                      : `${pendingDocuments} ${pendingDocuments === 1 ? "pendência" : "pendências"}`}
                  </span>
                </span>
                <span className="min-w-0 border-l-2 border-bronze/50 pl-3">
                  <span className="block truncate text-sm font-semibold text-espresso">
                    {item.property.address}, {item.property.number}
                  </span>
                  <span className="mt-1 block truncate text-xs text-cacao/70">
                    {service?.name ?? "Serviço imobiliário"} · {item.property.city}/
                    {item.property.state}
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-2 text-sm text-cacao/75">
                  <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-tealTech" />
                  <span className="truncate">{client?.name ?? "Cliente não encontrado"}</span>
                </span>
                <StatusBadge status={item.status} />
                <span className="text-sm text-cacao/65 lg:text-right">
                  <span className="mr-2 font-bold uppercase tracking-wide text-cacao/50 lg:hidden">
                    Atualizado
                  </span>
                  {formatDate(item.updatedAt)}
                </span>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
