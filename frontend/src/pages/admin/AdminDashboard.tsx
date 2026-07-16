import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getServiceById } from "@/domain/catalog";
import { buildAdminPauta, type PautaItem } from "@/domain/selectors";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { AdminDashboardDossier } from "@/pages/admin/components/AdminDashboardDossier";
import { AdminPautaPanel } from "@/pages/admin/components/AdminPautaPanel";
import { PageHeader } from "@/shared/ui/portal";

export function AdminDashboard() {
  const {
    state,
    currentUser,
    startDocumentReview,
    reviewDocument,
    recordWhatsAppStarted
  } = usePortalData();
  const groups = buildAdminPauta(state);
  const allItems = [...groups.decide, ...groups.client, ...groups.progress];
  const [selectedId, setSelectedId] = useState(() => allItems[0]?.id ?? "");
  const [announcement, setAnnouncement] = useState("");
  const [mobileDossierOpen, setMobileDossierOpen] = useState(false);
  const [isMobilePauta, setIsMobilePauta] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 1023px)").matches
      : true
  );
  const dispatchHeadingRef = useRef<HTMLHeadingElement>(null);
  const mobileDossierRef = useRef<HTMLDivElement>(null);
  const mobileBackRef = useRef<HTMLButtonElement>(null);
  const pautaTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pautaButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const selectedItem = allItems.find((item) => item.id === selectedId) ?? allItems[0];
  const activeCase = selectedItem
    ? state.cases.find((item) => item.id === selectedItem.caseId)
    : undefined;
  const activeDocument =
    activeCase && selectedItem?.documentId
      ? activeCase.documents.find((document) => document.id === selectedItem.documentId)
      : undefined;
  const activeClient = activeCase
    ? state.users.find((user) => user.id === activeCase.clientId)
    : undefined;
  const activeService = activeCase ? getServiceById(activeCase.serviceId) : undefined;
  const activeCases = state.cases.filter((item) => item.status !== "Concluído").length;
  const completedCases = state.cases.length - activeCases;
  const decisionCount = groups.decide.length;
  const clientCount = groups.client.length;

  useEffect(() => {
    if (!mobileDossierOpen || !isMobilePauta) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => mobileBackRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobilePauta, mobileDossierOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const updateMode = () => {
      setIsMobilePauta(mobileQuery.matches);
      if (!mobileQuery.matches) setMobileDossierOpen(false);
    };
    updateMode();
    mobileQuery.addEventListener?.("change", updateMode);
    return () => mobileQuery.removeEventListener?.("change", updateMode);
  }, []);

  const closeMobileDossier = () => {
    setMobileDossierOpen(false);
    const nextTrigger = selectedItem
      ? pautaButtonsRef.current.get(selectedItem.id)
      : undefined;
    window.setTimeout(() => (nextTrigger ?? pautaTriggerRef.current)?.focus(), 0);
  };

  const handleMobileDossierKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMobilePauta || !mobileDossierOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileDossier();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!currentUser) return null;

  const focusDispatch = () => {
    window.requestAnimationFrame(() => dispatchHeadingRef.current?.focus({ preventScroll: true }));
  };

  const handlePautaTriggerMount = (
    itemId: string,
    node: HTMLButtonElement | null
  ) => {
    if (node) pautaButtonsRef.current.set(itemId, node);
    else pautaButtonsRef.current.delete(itemId);
  };

  const handlePautaSelect = (
    item: PautaItem,
    trigger: HTMLButtonElement
  ) => {
    pautaTriggerRef.current = trigger;
    setSelectedId(item.id);
    if (isMobilePauta) setMobileDossierOpen(true);
    else focusDispatch();
  };

  const selectNextAfter = (itemId: string) => {
    const index = allItems.findIndex((item) => item.id === itemId);
    const next = allItems[index + 1] ?? allItems[index - 1];
    setSelectedId(next?.id ?? "");
  };

  const handleStartReview = () => {
    if (!activeCase || !activeDocument || !selectedItem) return;
    startDocumentReview(activeCase.id, activeDocument.id, currentUser.id);
    setAnnouncement(`${activeDocument.label} entrou em análise.`);
    focusDispatch();
  };

  const handleApprove = () => {
    if (!activeCase || !activeDocument || !selectedItem) return;
    reviewDocument(activeCase.id, activeDocument.id, { decision: "approve" }, currentUser.id);
    setAnnouncement(`${activeDocument.label} aprovado. Próximo item selecionado.`);
    selectNextAfter(selectedItem.id);
    focusDispatch();
  };

  const handleContactClient = () => {
    if (!activeCase) return;
    recordWhatsAppStarted(activeCase.id, currentUser.id);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Central de decisão"
        title="Mesa de Operações"
        description="Uma pauta viva conecta cada item ao fólio do imóvel e mostra somente o próximo despacho válido."
      />

      <section
        aria-label="Pulso operacional"
        className="grid overflow-hidden border-y border-espresso/15 bg-ivory/60 sm:grid-cols-4"
      >
        {[
          ["Ativos", activeCases],
          ["Para decidir", decisionCount],
          ["Dependem do cliente", clientCount],
          ["Concluídos", completedCases]
        ].map(([label, value], index) => (
          <div key={label} className={`px-4 py-4 sm:px-5 ${index ? "border-t border-espresso/10 sm:border-l sm:border-t-0" : ""}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-cacao/65">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-espresso">{value}</p>
          </div>
        ))}
      </section>

      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <AdminPautaPanel
          groups={groups}
          cases={state.cases}
          selectedItemId={selectedItem?.id}
          onTriggerMount={handlePautaTriggerMount}
          onSelect={handlePautaSelect}
        />

        {activeCase && selectedItem ? (
          <AdminDashboardDossier
            activeCase={activeCase}
            activeDocument={activeDocument}
            activeClient={activeClient}
            activeService={activeService}
            selectedItem={selectedItem}
            mobileDossierOpen={mobileDossierOpen}
            isMobilePauta={isMobilePauta}
            mobileDossierRef={mobileDossierRef}
            mobileBackRef={mobileBackRef}
            dispatchHeadingRef={dispatchHeadingRef}
            onKeyDown={handleMobileDossierKeyDown}
            onClose={closeMobileDossier}
            onStartReview={handleStartReview}
            onApprove={handleApprove}
            onContactClient={handleContactClient}
          />
        ) : (
          <section className="folio-sheet flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-tealTech" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-espresso">Mesa livre</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-cacao/70">Nenhum processo aberto precisa de decisão neste momento.</p>
          </section>
        )}
      </div>
    </div>
  );
}
