import { Check, ChevronLeft, ChevronRight, FileCheck2, FilePlus2, House, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { PageHeader } from "@/shared/ui/portal";
import { getServiceById, SERVICE_CATEGORIES, SERVICES } from "@/domain/catalog";

type PropertyDraft = {
  type: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  registrationNumber: string;
  iptuNumber: string;
  notes: string;
};

const emptyProperty: PropertyDraft = {
  type: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  registrationNumber: "",
  iptuNumber: "",
  notes: ""
};

const fieldClass =
  "min-h-12 w-full rounded-xl border border-espresso/20 bg-white px-3.5 py-2.5 text-base text-espresso outline-none transition-colors placeholder:text-cacao/40 focus:border-tealTech focus:ring-2 focus:ring-tealTech/20 disabled:cursor-not-allowed disabled:bg-espresso/5 disabled:text-cacao/60";
const labelClass = "mb-2 block text-sm font-semibold text-espresso";
const primaryButtonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-bronze px-5 py-3 text-sm font-bold text-espresso transition-colors hover:bg-[#c99050] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-espresso/[0.15] bg-white px-5 py-3 text-sm font-bold text-cacao transition-colors hover:bg-espresso/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2";

const steps = [
  { title: "Serviço e objetivo", icon: FilePlus2 },
  { title: "Dados pessoais", icon: UserRound },
  { title: "Dados do imóvel", icon: House },
  { title: "Documentos e revisão", icon: FileCheck2 }
];

export function NewRequestPage() {
  const {
    currentUser,
    state,
    pendingServiceId,
    consumePendingServiceId,
    createCase,
    updateUserProfile
  } = usePortalData();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1);
  const previousStepRef = useRef(step);
  const [serviceId, setServiceId] = useState(() => pendingServiceId ?? SERVICES[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [phone, setPhone] = useState(() => currentUser?.phone ?? "");
  const [address, setAddress] = useState(() => currentUser?.address ?? "");
  const [property, setProperty] = useState<PropertyDraft>(emptyProperty);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (previousStepRef.current !== step) {
      headingRef.current?.focus();
      previousStepRef.current = step;
    }
  }, [step]);

  if (!currentUser) return null;
  const currentUserId = currentUser.id;
  const selectedService = getServiceById(serviceId);

  function goForward() {
    setError("");
    if (step === 1 && (!serviceId || !objective.trim())) {
      setError("Escolha o serviço e descreva o objetivo da solicitação.");
      return;
    }
    if (step === 2 && (!phone.trim() || !address.trim())) {
      setError("Informe telefone e endereço para continuar.");
      return;
    }
    if (
      step === 3 &&
      [property.type, property.address, property.number, property.neighborhood, property.city, property.state, property.postalCode].some(
        (value) => !value.trim()
      )
    ) {
      setError("Preencha os dados essenciais do imóvel para continuar.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  function updateProperty(field: keyof PropertyDraft, value: string) {
    setProperty((current) => ({ ...current, [field]: value }));
  }

  function toggleAsset(assetId: string) {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((candidate) => candidate !== assetId)
        : [...current, assetId]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUserProfile(currentUserId, { phone: phone.trim(), address: address.trim() });
    const created = createCase({
      clientId: currentUserId,
      serviceId,
      objective,
      property: {
        type: property.type,
        address: property.address,
        number: property.number,
        complement: property.complement || undefined,
        neighborhood: property.neighborhood,
        city: property.city,
        state: property.state,
        postalCode: property.postalCode,
        registrationNumber: property.registrationNumber || undefined,
        iptuNumber: property.iptuNumber || undefined,
        notes: property.notes || undefined
      },
      submittedAssetIds: selectedAssetIds
    });
    consumePendingServiceId();
    navigate(`/cliente/processos/${created.id}`, { replace: true });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Novo atendimento"
        title="Nova solicitação"
        description="Organize as informações essenciais em quatro etapas. Você poderá concluir mesmo que ainda faltem documentos."
      />

      <section className="overflow-hidden rounded-3xl border border-espresso/10 bg-ivory shadow-[0_18px_55px_rgba(32,19,13,0.08)]">
        <div className="bg-espresso px-5 py-6 text-ivory sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">Etapa {step} de 4</p>
              <p className="mt-1 text-sm text-ivory/60">{steps[step - 1].title}</p>
            </div>
            <span className="font-display text-2xl font-semibold text-champagne">{step * 25}%</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-bronze transition-[width] duration-300" style={{ width: `${step * 25}%` }} />
          </div>
          <ol aria-label="Etapas da solicitação" className="mt-5 hidden grid-cols-4 gap-3 md:grid">
            {steps.map(({ title, icon: Icon }, index) => {
              const number = index + 1;
              const active = number === step;
              const complete = number < step;
              return (
                <li key={title} aria-current={active ? "step" : undefined} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${active ? "bg-white/10 text-ivory" : complete ? "text-champagne/80" : "text-ivory/40"}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${active || complete ? "bg-bronze text-espresso" : "bg-white/10"}`}>
                    {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
                  </span>
                  <span>{title}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 lg:p-9">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold text-espresso outline-none sm:text-3xl">
            {steps[step - 1].title}
          </h2>

          {step === 1 ? (
            <div className="mt-6 grid gap-6">
              <div>
                <label htmlFor="request-service" className={labelClass}>Serviço</label>
                <select id="request-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className={fieldClass}>
                  {SERVICE_CATEGORIES.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                {selectedService ? <p className="mt-2 text-sm leading-6 text-cacao/60">{selectedService.description}</p> : null}
              </div>
              <div>
                <label htmlFor="request-objective" className={labelClass}>Objetivo da solicitação</label>
                <textarea
                  id="request-objective"
                  rows={5}
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  placeholder="Conte, em poucas palavras, o que você precisa resolver ou compreender."
                  className={`${fieldClass} resize-y`}
                />
                <p className="mt-2 text-xs leading-5 text-cacao/50">Essa descrição ajuda a contextualizar a análise inicial.</p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="request-name" className={labelClass}>Nome completo</label><input id="request-name" value={currentUser.name} disabled className={fieldClass} /></div>
              <div><label htmlFor="request-email" className={labelClass}>E-mail</label><input id="request-email" value={currentUser.email} disabled className={fieldClass} /></div>
              <div><label htmlFor="request-cpf" className={labelClass}>CPF</label><input id="request-cpf" value={currentUser.cpf} disabled className={fieldClass} /></div>
              <div><label htmlFor="request-phone" className={labelClass}>Telefone</label><input id="request-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></div>
              <div className="sm:col-span-2"><label htmlFor="request-address" className={labelClass}>Endereço</label><input id="request-address" value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} /></div>
              <p className="sm:col-span-2 text-sm leading-6 text-cacao/60">E-mail e CPF identificam a conta demo e, por isso, permanecem bloqueados.</p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><label htmlFor="property-type" className={labelClass}>Tipo do imóvel</label><input id="property-type" value={property.type} onChange={(event) => updateProperty("type", event.target.value)} placeholder="Casa, apartamento, terreno..." className={fieldClass} /></div>
              <div className="sm:col-span-2"><label htmlFor="property-address" className={labelClass}>Endereço do imóvel</label><input id="property-address" value={property.address} onChange={(event) => updateProperty("address", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-number" className={labelClass}>Número</label><input id="property-number" value={property.number} onChange={(event) => updateProperty("number", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-complement" className={labelClass}>Complemento <span className="font-normal text-cacao/50">(opcional)</span></label><input id="property-complement" value={property.complement} onChange={(event) => updateProperty("complement", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-neighborhood" className={labelClass}>Bairro</label><input id="property-neighborhood" value={property.neighborhood} onChange={(event) => updateProperty("neighborhood", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-city" className={labelClass}>Cidade</label><input id="property-city" value={property.city} onChange={(event) => updateProperty("city", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-state" className={labelClass}>Estado</label><input id="property-state" maxLength={2} value={property.state} onChange={(event) => updateProperty("state", event.target.value.toUpperCase())} className={fieldClass} /></div>
              <div><label htmlFor="property-postal" className={labelClass}>CEP</label><input id="property-postal" value={property.postalCode} onChange={(event) => updateProperty("postalCode", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-registration" className={labelClass}>Matrícula <span className="font-normal text-cacao/50">(opcional)</span></label><input id="property-registration" value={property.registrationNumber} onChange={(event) => updateProperty("registrationNumber", event.target.value)} className={fieldClass} /></div>
              <div><label htmlFor="property-iptu" className={labelClass}>Número do IPTU <span className="font-normal text-cacao/50">(opcional)</span></label><input id="property-iptu" value={property.iptuNumber} onChange={(event) => updateProperty("iptuNumber", event.target.value)} className={fieldClass} /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="property-notes" className={labelClass}>Observações <span className="font-normal text-cacao/50">(opcional)</span></label><textarea id="property-notes" rows={4} value={property.notes} onChange={(event) => updateProperty("notes", event.target.value)} className={`${fieldClass} resize-y`} /></div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-6 grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div>
                <div className="rounded-2xl border border-tealTech/20 bg-tealTech/10 p-4 text-sm leading-6 text-tealTech">
                  <strong>Nenhum documento é obrigatório nesta demonstração.</strong> Os itens não selecionados serão registrados como pendentes para envio posterior.
                </div>
                <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Documentos fictícios</legend>
                  {state.mockDocumentAssets.map((asset) => {
                    const selected = selectedAssetIds.includes(asset.id);
                    return (
                      <label key={asset.id} className={`flex min-h-28 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${selected ? "border-tealTech bg-tealTech/10" : "border-espresso/10 bg-white hover:border-tealTech/40"}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleAsset(asset.id)}
                          aria-label={`Adicionar ${asset.name}`}
                          className="mt-1 h-5 w-5 shrink-0 accent-tealTech"
                        />
                        <span className="min-w-0"><span className="block font-semibold text-espresso">{asset.name}</span><span className="mt-1 block text-xs leading-5 text-cacao/60">{asset.description}<br />{asset.fileName} · {asset.sizeLabel}</span></span>
                      </label>
                    );
                  })}
                </fieldset>
              </div>
              <aside className="h-fit rounded-3xl bg-espresso p-5 text-ivory">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-bronze">Revisão</p>
                <h3 className="mt-3 font-display text-xl font-semibold">{selectedService?.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/60">{objective}</p>
                <dl className="mt-5 space-y-4 border-t border-white/10 pt-5 text-sm">
                  <div><dt className="text-xs uppercase tracking-wide text-ivory/40">Titular</dt><dd className="mt-1 text-champagne">{currentUser.name}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-ivory/40">Imóvel</dt><dd className="mt-1 leading-5 text-champagne">{property.type} · {property.address}, {property.number}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-ivory/40">Exemplos selecionados</dt><dd className="mt-1 text-champagne">{selectedAssetIds.length} de {state.mockDocumentAssets.length}</dd></div>
                </dl>
              </aside>
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-espresso/10 pt-6 sm:flex-row sm:justify-between">
            {step > 1 ? <button type="button" onClick={goBack} className={secondaryButtonClass}><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Voltar</button> : <span />}
            {step < 4 ? <button type="button" onClick={goForward} className={primaryButtonClass}>Continuar <ChevronRight aria-hidden="true" className="h-4 w-4" /></button> : <button type="submit" className={primaryButtonClass}><FileCheck2 aria-hidden="true" className="h-4 w-4" /> Criar solicitação</button>}
          </div>
        </form>
      </section>
    </div>
  );
}
