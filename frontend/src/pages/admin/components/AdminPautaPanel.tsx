import type {
  AdminPauta,
  PautaGroup,
  PautaItem
} from "@/domain/selectors";
import type { Case } from "@/domain/types";

const pautaGroups: Array<{ id: PautaGroup; label: string; description: string }> = [
  { id: "decide", label: "Decidir agora", description: "Triagens e documentos prontos para despacho." },
  { id: "client", label: "Depende do cliente", description: "Aguardando informação ou documento." },
  { id: "progress", label: "Em andamento", description: "Processos que seguem sem decisão imediata." }
];

type AdminPautaPanelProps = {
  groups: AdminPauta;
  cases: Case[];
  selectedItemId?: string;
  onTriggerMount: (itemId: string, node: HTMLButtonElement | null) => void;
  onSelect: (item: PautaItem, trigger: HTMLButtonElement) => void;
};

export function AdminPautaPanel({
  groups,
  cases,
  selectedItemId,
  onTriggerMount,
  onSelect
}: AdminPautaPanelProps) {
  return (
    <section aria-labelledby="pauta-heading" className="folio-sheet overflow-hidden lg:sticky lg:top-28">
      <header className="border-b border-espresso/15 bg-espresso px-4 py-5 text-ivory">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-champagne">Índice operacional</p>
        <h2 id="pauta-heading" className="mt-1 font-display text-2xl font-semibold">Pauta</h2>
      </header>

      <div className="divide-y divide-espresso/15">
        {pautaGroups.map((group) => (
          <section key={group.id} aria-labelledby={`pauta-${group.id}`}>
            <div className="bg-champagne/25 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h3 id={`pauta-${group.id}`} className="text-sm font-bold text-espresso">{group.label}</h3>
                <span className="text-xs font-bold text-tealTech">{groups[group.id].length}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-cacao/70">{group.description}</p>
            </div>
            {groups[group.id].length ? (
              <ol className="divide-y divide-espresso/10">
                {groups[group.id].map((entry) => {
                  const item = cases.find((candidate) => candidate.id === entry.caseId);
                  const isSelected = entry.id === selectedItemId;
                  return (
                    <li key={entry.id}>
                      <button
                        ref={(node) => onTriggerMount(entry.id, node)}
                        type="button"
                        aria-current={isSelected ? "true" : undefined}
                        onClick={(event) => onSelect(entry, event.currentTarget)}
                        className={`w-full min-h-20 border-l-4 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech ${
                          isSelected
                            ? "border-tealTech bg-tealTech/[0.07]"
                            : "border-transparent hover:border-bronze/50 hover:bg-champagne/20"
                        }`}
                      >
                        <span className="block text-xs font-bold text-tealTech">{item?.protocol}</span>
                        <span className="mt-1 block text-sm font-semibold leading-5 text-espresso">{entry.label}</span>
                        <span className="mt-1 block text-xs text-cacao/65">{entry.detail}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="px-4 py-4 text-xs leading-5 text-cacao/65">Nenhum item neste grupo.</p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
