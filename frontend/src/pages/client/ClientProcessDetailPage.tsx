import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileClock,
  FileText,
  House,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { CaseFolio, EmptyState, StatusBadge } from "@/shared/ui/portal";
import { createWhatsAppUrl } from "@/shared/config/contact";
import { getServiceById } from "@/data/demo/catalog";
import { derivePendingActions } from "@/data/demo/repository";
import type { TimelineEventType } from "@/data/demo/types";
import {
  formatDate,
  formatPropertyAddress,
  formatPropertyLabel,
  getDocumentActionLabel,
  getPendingActionHref,
  getTimelineIconLabel
} from "@/pages/client/clientUtils";

function TimelineIcon({ type }: { type: TimelineEventType }) {
  if (type === "whatsapp-started") return <MessageCircle aria-hidden="true" className="h-4 w-4" />;
  if (type === "status-changed") return <Clock3 aria-hidden="true" className="h-4 w-4" />;
  if (type.startsWith("document")) return <FileText aria-hidden="true" className="h-4 w-4" />;
  return <Check aria-hidden="true" className="h-4 w-4" />;
}

function focusDocument(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const disclosure = target.closest("details");
  if (disclosure) disclosure.open = true;
  target.focus({ preventScroll: true });
  target.scrollIntoView?.({ block: "center" });
}

export function ClientProcessDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { state, currentUser, addMockDocumentVersion, recordWhatsAppStarted } = usePortalData();
  const [announcement, setAnnouncement] = useState("");
  const [historyOpen, setHistoryOpen] = useState(
    () => typeof window.matchMedia === "function" && window.matchMedia("(min-width: 640px)").matches
  );
  const item = state.cases.find(
    (candidate) => candidate.id === id && candidate.clientId === currentUser?.id
  );

  useEffect(() => {
    if (!item || !location.hash) return;
    let targetId: string;
    try {
      targetId = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const frame = window.requestAnimationFrame(() => focusDocument(targetId));
    return () => window.cancelAnimationFrame(frame);
  }, [item, location.hash]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktopHistory = window.matchMedia("(min-width: 640px)");
    const updateForViewport = () => setHistoryOpen(desktopHistory.matches);
    desktopHistory.addEventListener?.("change", updateForViewport);
    return () => desktopHistory.removeEventListener?.("change", updateForViewport);
  }, []);

  if (!currentUser) return null;
  if (!item) {
    return (
      <EmptyState
        icon={FileClock}
        title="Processo não encontrado"
        description="Este processo não existe ou não pertence à sua conta."
        action={
          <Link className="min-h-11 rounded-lg px-3 py-3 font-bold text-tealTech underline underline-offset-4" to="/cliente/processos">
            Voltar aos meus processos
          </Link>
        }
      />
    );
  }

  const service = getServiceById(item.serviceId);
  const isCompleted = item.status === "Concluído";
  const caseId = item.id;
  const currentUserId = currentUser.id;
  const pendingActions = derivePendingActions(state, { id: currentUser.id, role: "client" }).filter(
    (action) => action.caseId === item.id
  );
  const dominantAction = pendingActions[0];
  const whatsappMessage = `Olá! Quero falar sobre ${service?.name ?? "meu processo"}, protocolo ${item.protocol}.`;
  const whatsappHref = createWhatsAppUrl(whatsappMessage);

  function submitDocument(documentId: string, assetId: string, label: string) {
    addMockDocumentVersion(caseId, documentId, assetId, currentUserId);
    setAnnouncement(`${label} enviado para análise.`);
    window.requestAnimationFrame(() => focusDocument(`documento-${documentId}`));
  }

  return (
    <div className={`space-y-6 ${dominantAction ? "pb-24 sm:pb-0" : ""}`}>
      <Link
        to="/cliente/processos"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-cacao/75 transition-colors hover:bg-espresso/5 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Voltar aos processos
      </Link>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <CaseFolio
        protocol={item.protocol}
        serviceName={service?.name ?? "Processo imobiliário"}
        propertyLabel={formatPropertyLabel(item.property)}
        objective={item.objective}
        status={item.status}
        priority={
          <section
            id="agora-do-processo"
            tabIndex={-1}
            aria-labelledby="detail-now-heading"
            className="border-t-4 border-t-tealTech p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Próxima decisão</p>
            <h2 id="detail-now-heading" className="mt-1 font-display text-2xl font-semibold text-espresso">Agora</h2>
            {dominantAction && !isCompleted ? (
              <p className="mt-3 text-base font-semibold text-espresso">{dominantAction.title}</p>
            ) : (
              <p className="mt-3 text-base font-semibold text-espresso">Nada precisa de você agora</p>
            )}
            <p className="mt-1 text-sm leading-6 text-cacao/70">
              {dominantAction && !isCompleted
                ? dominantAction.kind === "client-response"
                  ? "A conversa já abre identificada com serviço e protocolo."
                  : "A ação abre exatamente o documento que impede o próximo movimento."
                : `Estado atual: ${item.status}`}
            </p>
            {dominantAction && !isCompleted ? (
              dominantAction.kind === "client-response" ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => recordWhatsAppStarted(caseId, currentUserId)}
                  className="mt-5 hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2 sm:inline-flex"
                >
                  {dominantAction.title}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={getPendingActionHref(dominantAction)}
                  className="mt-5 hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2 sm:inline-flex"
                >
                  {dominantAction.title}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )
            ) : null}
          </section>
        }
      >
        <div className="space-y-10">
          {isCompleted ? (
            <aside className="flex items-start gap-3 border-l-4 border-tealTech bg-tealTech/[0.07] px-4 py-4 text-sm leading-6 text-espresso">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-tealTech" />
              <p>
                <strong>Processo concluído e disponível somente para consulta.</strong> Documentos e movimentos continuam preservados neste fólio.
              </p>
            </aside>
          ) : null}

          <section aria-labelledby="documents-heading">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Livro documental</p>
              <h2 id="documents-heading" className="mt-1 font-display text-2xl font-semibold text-espresso">Documentos</h2>
              <p className="mt-2 text-sm leading-6 text-cacao/70">
                Cada linha registra obrigatoriedade, situação e versões. Os arquivos desta demonstração são apenas exemplos visuais.
              </p>
            </div>

            <div className="mt-6 divide-y divide-espresso/15 border-y border-espresso/15">
              {item.documents.map((document, index) => {
                const asset = state.mockDocumentAssets.find((candidate) => candidate.kind === document.kind);
                const canSubmit = !isCompleted && ["Pendente", "Rejeitado"].includes(document.status) && asset;
                const latestVersion = document.versions[document.versions.length - 1];
                const titleId = `documento-${document.id}`;

                return (
                  <details
                    key={document.id}
                    open={index === 0 || document.status === "Rejeitado"}
                    data-testid={`document-${document.kind}`}
                    className="group scroll-mt-28 bg-transparent open:bg-champagne/20"
                  >
                    <summary className="grid min-h-20 cursor-pointer list-none gap-3 px-2 py-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center sm:px-3">
                      <span aria-hidden="true" className="font-display text-lg text-bronze">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 id={titleId} tabIndex={-1} className="font-semibold text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech">
                            {document.label}
                          </h3>
                          <span className="text-xs text-cacao/65">{document.required ? "Obrigatório" : "Opcional"}</span>
                        </div>
                        <span className="mt-1 block break-all text-xs leading-5 text-cacao/70">
                          {latestVersion
                            ? `${latestVersion.fileName} · ${latestVersion.sizeLabel} · versão ${document.versions.length}`
                            : "Nenhum exemplo adicionado."}
                        </span>
                      </div>
                      <StatusBadge status={document.status} />
                    </summary>

                    <div className="grid gap-4 border-t border-espresso/10 px-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <div>
                        {document.rejectionReason ? (
                          <p className="border-l-4 border-red-600 bg-red-50 px-3 py-3 text-sm leading-5 text-red-800">
                            <strong>Ajuste solicitado:</strong> {document.rejectionReason}
                          </p>
                        ) : (
                          <p className="text-sm leading-6 text-cacao/70">
                            Atualizado em {formatDate(document.updatedAt, true)}.
                          </p>
                        )}
                      </div>
                      {canSubmit ? (
                        <button
                          type="button"
                          onClick={() => submitDocument(document.id, asset.id, document.label)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2"
                        >
                          <FileText aria-hidden="true" className="h-4 w-4" />
                          {getDocumentActionLabel(document.status)}
                        </button>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="property-heading" className="grid gap-6 border-y border-espresso/15 py-7 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Imóvel em contexto</p>
              <h2 id="property-heading" className="mt-1 font-display text-2xl font-semibold text-espresso">O bem deste fólio</h2>
              <div className="mt-4 flex items-start gap-3">
                <House aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
                <p className="text-sm leading-6 text-cacao/75">{formatPropertyAddress(item.property)}</p>
              </div>
              {item.property.registrationNumber ? (
                <p className="mt-3 text-sm text-cacao/75"><strong>Matrícula:</strong> {item.property.registrationNumber}</p>
              ) : null}
            </div>
            <aside
              id="contato-processo"
              tabIndex={-1}
              className="scroll-mt-28 border-l-4 border-bronze bg-champagne/35 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5 text-tealTech" />
              <h3 className="mt-3 font-semibold text-espresso">Conversa contextual</h3>
              <p className="mt-1 text-xs leading-5 text-cacao/70">Serviço e protocolo já seguem na mensagem.</p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => recordWhatsAppStarted(caseId, currentUserId)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-tealTech px-3 py-2 text-center text-sm font-bold text-tealTech hover:bg-tealTech/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech"
              >
                Falar sobre este processo no WhatsApp
              </a>
            </aside>
          </section>

          <details
            open={historyOpen}
            onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
            className="group"
          >
            <summary className="min-h-14 cursor-pointer list-none py-2 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Diário do fólio</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-espresso">Histórico do processo</h2>
            </summary>
            <ol className="mt-5 border-l border-espresso/15 pl-5">
              {[...item.timeline]
                .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                .map((event) => (
                  <li key={event.id} className="relative pb-6 last:pb-0">
                    <span aria-hidden="true" className="absolute -left-[1.62rem] top-1 grid h-5 w-5 place-items-center rounded-full border border-tealTech/30 bg-ivory text-tealTech">
                      <TimelineIcon type={event.type} />
                    </span>
                    <h3 className="text-sm font-semibold text-espresso">{event.title}</h3>
                    {event.description ? <p className="mt-1 text-sm leading-5 text-cacao/70">{event.description}</p> : null}
                    <p className="mt-1.5 text-xs text-cacao/65">
                      <span className="sr-only">{getTimelineIconLabel(event.type)}. </span>
                      {formatDate(event.createdAt, true)}
                    </p>
                  </li>
                ))}
            </ol>
          </details>
        </div>
      </CaseFolio>

      {dominantAction && !isCompleted ? (
        dominantAction.kind === "client-response" ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => recordWhatsAppStarted(caseId, currentUserId)}
            className="fixed inset-x-4 bottom-4 z-30 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-3 text-center text-sm font-bold text-white shadow-[0_14px_34px_rgba(15,118,110,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tealTech sm:hidden"
          >
            {dominantAction.title}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to={getPendingActionHref(dominantAction)}
            className="fixed inset-x-4 bottom-4 z-30 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-3 text-center text-sm font-bold text-white shadow-[0_14px_34px_rgba(15,118,110,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tealTech sm:hidden"
          >
            {dominantAction.title}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )
      ) : null}
    </div>
  );
}
