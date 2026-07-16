import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SERVICE_CATEGORIES } from "@/domain/catalog";
import { SectionIntro } from "@/pages/landing/components/SectionIntro";
import { fadeUp } from "@/pages/landing/components/animations";

type ServiceChoiceProps = {
  onSelectService: (serviceId: string) => void;
};

export function ServiceChoice({ onSelectService }: ServiceChoiceProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(SERVICE_CATEGORIES[0].id);
  const [activeServiceId, setActiveServiceId] = useState(SERVICE_CATEGORIES[0].services[0].id);
  const [isDesktopExplorer, setIsDesktopExplorer] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const updateMode = () => setIsDesktopExplorer(desktopQuery.matches);
    updateMode();
    desktopQuery.addEventListener?.("change", updateMode);
    return () => desktopQuery.removeEventListener?.("change", updateMode);
  }, []);

  const activeCategory =
    SERVICE_CATEGORIES.find((category) => category.id === activeCategoryId) ?? SERVICE_CATEGORIES[0];
  const activeService =
    activeCategory.services.find((service) => service.id === activeServiceId) ?? activeCategory.services[0];

  const selectCategory = (categoryId: string) => {
    const category = SERVICE_CATEGORIES.find((candidate) => candidate.id === categoryId);
    if (!category) return;
    setActiveCategoryId(category.id);
    setActiveServiceId(category.services[0].id);
  };

  return (
    <section id="servicos" className="relative overflow-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f4e3cc_100%)] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="absolute left-0 top-10 h-80 w-80 rounded-full bg-bronze/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Serviços"
          title="Encontre o caminho certo para o seu imóvel."
          text="Escolha a necessidade que mais se aproxima do seu momento. Depois do acesso, sua solicitação já começa com esse serviço selecionado."
        />
        <motion.article
          data-testid="service-selector"
          data-animation-replay="true"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative mt-12 overflow-hidden rounded-2xl border border-bronze/25 bg-white/85 p-5 shadow-glass backdrop-blur-xl sm:p-8 lg:p-9"
        >
          {isDesktopExplorer ? (
            <div className="relative grid overflow-hidden rounded-xl border border-espresso/15 lg:grid-cols-[13rem_minmax(12rem,0.72fr)_minmax(18rem,1.28fr)]">
              <nav aria-label="Categorias de serviços" className="bg-espresso p-3 text-ivory">
                <p className="px-3 pb-3 pt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-bronze">Índice</p>
                <ol className="border-y border-white/10">
                  {SERVICE_CATEGORIES.map((category, index) => {
                    const selected = category.id === activeCategory.id;
                    return (
                      <li key={category.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectCategory(category.id)}
                          className={`flex min-h-14 w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bronze ${
                            selected
                              ? "border-bronze bg-white/[0.08] text-ivory"
                              : "border-transparent text-ivory/70 hover:border-white/30 hover:text-ivory"
                          }`}
                        >
                          <span aria-hidden="true" className="text-[10px] tracking-[0.16em] text-bronze">{String(index + 1).padStart(2, "0")}</span>
                          <span>{category.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <section aria-labelledby="active-category-heading" className="border-r border-espresso/15 bg-ivory/75 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tealTech">Categoria</p>
                <h3 id="active-category-heading" className="mt-1 font-display text-xl font-semibold text-espresso">{activeCategory.name}</h3>
                <p className="mt-2 text-xs leading-5 text-cacao/70">{activeCategory.description}</p>
                <div className="mt-5 divide-y divide-espresso/10 border-y border-espresso/10">
                  {activeCategory.services.map((service) => {
                    const selected = service.id === activeService.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setActiveServiceId(service.id)}
                        className={`group flex min-h-16 w-full items-center justify-between gap-3 border-l-4 px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech ${
                          selected
                            ? "border-bronze bg-champagne/35 text-tealTech"
                            : "border-transparent text-espresso hover:bg-champagne/20 hover:text-tealTech"
                        }`}
                      >
                        <span>{service.name}</span>
                        {selected ? (
                          <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center border border-bronze bg-ivory text-tealTech"><Check className="h-4 w-4" /></span>
                        ) : (
                          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section role="region" aria-label="Serviço em foco" className="relative flex min-h-[25rem] flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#fff9ef_0%,#f2dfc6_100%)] p-6">
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tealTech">Serviço selecionado</p>
                  <h3 className="mt-6 max-w-xl font-display text-3xl font-semibold leading-tight text-espresso xl:text-4xl">{activeService.name}</h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-cacao/75">{activeService.description}</p>
                  <p className="mt-5 border-l-4 border-bronze pl-4 text-sm leading-6 text-cacao/70">
                    Ao entrar, sua nova solicitação já começa com este contexto — sem repetir a escolha.
                  </p>
                </div>
                <button type="button" onClick={() => onSelectService(activeService.id)} className="relative mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-tealTech px-5 py-3 text-center font-bold text-white transition-colors hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2">
                  Iniciar solicitação de {activeService.name}
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </section>
            </div>
          ) : (
            <div className="relative divide-y divide-espresso/15 border-y border-espresso/15">
              {SERVICE_CATEGORIES.map((category, categoryIndex) => {
                const selectedService = category.services.find((service) => service.id === activeServiceId);
                return (
                  <details key={category.id} open={categoryIndex === 0 ? true : undefined} className="group bg-ivory/70">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech">
                      <span aria-hidden="true" className="font-display text-lg text-bronze">{String(categoryIndex + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-espresso">{category.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-cacao/70">{category.description}</span>
                      </span>
                      <ChevronRight aria-hidden="true" className="h-5 w-5 text-tealTech transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="border-t border-espresso/10 px-3 pb-4">
                      {category.services.map((service) => {
                        const selected = service.id === activeServiceId;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setActiveCategoryId(category.id);
                              setActiveServiceId(service.id);
                            }}
                            className={`flex min-h-14 w-full items-center justify-between gap-3 border-b border-l-4 border-espresso/10 px-3 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tealTech ${selected ? "border-l-bronze bg-champagne/35 text-tealTech" : "border-l-transparent text-espresso"}`}
                          >
                            {service.name}
                            {selected ? (
                              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center border border-bronze bg-ivory text-tealTech"><Check className="h-4 w-4" /></span>
                            ) : (
                              <ChevronRight aria-hidden="true" className="h-4 w-4 text-tealTech" />
                            )}
                          </button>
                        );
                      })}
                      {selectedService ? (
                        <div className="mt-4 border-l-4 border-bronze bg-champagne/35 p-4">
                          <p className="text-sm leading-6 text-cacao/75">{selectedService.description}</p>
                          <button type="button" onClick={() => onSelectService(selectedService.id)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-tealTech px-4 py-3 text-center text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2">
                            Iniciar solicitação de {selectedService.name}
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          <div className="relative mt-6 flex flex-col gap-4 rounded-xl bg-[linear-gradient(135deg,#20130d_0%,#0d2926_100%)] p-5 text-ivory sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-semibold">Já possui uma solicitação?</p>
              <p className="mt-1 text-sm leading-6 text-champagne/75">Entre na sua conta para acompanhar documentos, pendências e histórico.</p>
            </div>
            <Link to="/login" className="inline-flex min-h-12 flex-none items-center justify-center gap-2 rounded-full border border-bronze/60 px-5 font-semibold text-champagne outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-bronze">
              Acessar minha conta
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
