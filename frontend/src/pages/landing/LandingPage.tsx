import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Fingerprint,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ZoomParallax } from "@/pages/landing/components/ZoomParallax";
import { LANDING_WHATSAPP_URL } from "@/shared/config/contact";
import { SERVICE_CATEGORIES } from "@/data/demo/catalog";
import { DEMO_PENDING_SERVICE_STORAGE_KEY } from "@/data/demo/repository";

const heroImageBase =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop";
const heroImage = `${heroImageBase}&w=2600&q=84`;
const heroImageSrcSet = [
  `${heroImageBase}&w=1600&q=82 1600w`,
  `${heroImageBase}&w=2200&q=83 2200w`,
  `${heroImageBase}&w=2600&q=84 2600w`
].join(", ");

const zoomParallaxImages = [
  {
    src: heroImage,
    srcSet: heroImageSrcSet,
    sizes: "100vw",
    alt: "Imóvel premium moderno para análise de valor e regularização"
  },
  {
    src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1280&q=82",
    alt: "Chaves de imóvel entregues durante atendimento imobiliário"
  },
  {
    src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1280&q=82",
    alt: "Fachada residencial para análise de valor de mercado"
  },
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1280&q=82",
    alt: "Contrato e documentos organizados sobre mesa de trabalho"
  },
  {
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1280&q=82",
    alt: "Planilhas e cálculo financeiro para avaliação imobiliária"
  },
  {
    src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1280&q=82",
    alt: "Documentos imobiliários em conferência técnica"
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1280&q=82",
    alt: "Atendimento consultivo para decisão imobiliária"
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 }
};

const replayViewport = { once: false, amount: 0.32 };

const steps = [
  {
    icon: Camera,
    title: "Envie as informações do imóvel",
    text: "A experiência orienta dados, fotos, localização e documentos importantes, sem depender de conversa solta por aplicativos."
  },
  {
    icon: Fingerprint,
    title: "A jornada organiza tudo com segurança",
    text: "Cada item entra em um fluxo claro, com camadas de privacidade, rastreabilidade e atenção à LGPD."
  },
  {
    icon: ClipboardCheck,
    title: "Receba orientação para decidir",
    text: "A análise especializada cruza contexto técnico e documentação para ajudar você a avançar com mais confiança."
  }
];

export type LandingPageProps = {
  onStartService?: (serviceId: string) => void;
};

function LandingPage({ onStartService }: LandingPageProps) {
  const handleServiceSelect = (serviceId: string) => {
    try {
      window.sessionStorage.setItem(DEMO_PENDING_SERVICE_STORAGE_KEY, serviceId);
    } catch {
      // A seleção continua válida na sessão React quando o storage não está disponível.
    }
    onStartService?.(serviceId);
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-ivory text-cacao">
      <ZoomParallaxIntro />
      <WhatWeDo />
      <ServiceChoice onSelectService={handleServiceSelect} />
      <HowItWorks />
      <SiteFooter />
      <WhatsAppButton />
    </main>
  );
}

function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [-28, 110]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.18]);

  return (
    <section
      ref={heroRef}
      data-testid="site-hero"
      className="relative h-screen min-h-screen overflow-hidden bg-espresso text-ivory"
    >
      <motion.img
        data-testid="hero-background-image"
        src={heroImage}
        srcSet={heroImageSrcSet}
        sizes="100vw"
        alt="Imóvel premium moderno para regularização e análise de valor"
        style={{
          y: shouldReduceMotion ? 0 : imageY,
          scale: shouldReduceMotion ? 1.08 : imageScale
        }}
        className="absolute inset-x-0 -inset-y-10 h-[calc(100%+5rem)] w-full object-cover opacity-100"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,10,6,0.92)_0%,rgba(22,10,6,0.72)_48%,rgba(7,19,18,0.24)_100%)]" />
      <DataConstellation />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a
          href="#top"
          aria-label="Vértice Consultoria"
          className="inline-flex rounded-lg bg-ivory/95 px-2.5 py-1.5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-bronze"
        >
          <img
            src="/brand/vertice-consultoria.png"
            alt="Vértice Consultoria"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          <a className="nav-link" href="#servicos">Serviços</a>
          <a className="nav-link" href="#seguranca">Como funciona</a>
          <a className="nav-link" href="#contato">Contato</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-ivory outline-none backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-bronze sm:px-5"
          >
            Acessar minha conta
          </Link>
          <a href="#servicos" className="glass-button hidden lg:inline-flex">Escolher serviço</a>
        </div>
      </header>

      <div
        id="top"
        className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-center px-5 pb-12 pt-6 sm:px-8 sm:pb-20 lg:px-10"
      >
        <motion.div
          data-testid="hero-copy-animation"
          data-animation-replay="true"
          variants={fadeUp}
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ ...replayViewport, amount: 0.45 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-bronze">
            Regularização fundiária · Análise de valor
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-ivory sm:text-6xl lg:text-7xl">
            Regularize, avalie e decida sobre seu imóvel com clareza.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-champagne/80">
            Organize documentos, compreenda o valor do seu imóvel e avance com mais clareza em cada decisão.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#servicos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tealTech px-6 font-bold text-white transition-colors hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
              Regularizar meu imóvel
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#servicos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-champagne/45 bg-white/5 px-6 font-semibold text-ivory backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
              Avaliar valor de mercado
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DataConstellation() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-50 lg:block">
      <svg viewBox="0 0 640 760" className="h-full w-full" fill="none">
        <path d="M80 130L520 260L230 610L570 680" stroke="rgba(224,192,151,0.32)" />
        <path d="M250 80L150 360L510 510" stroke="rgba(15,118,110,0.34)" />
        {[88, 196, 318, 426].map((x, index) => (
          <circle key={x} cx={x} cy={152 + index * 120} r="4" fill="rgba(185,130,70,0.9)" />
        ))}
      </svg>
    </div>
  );
}

function WhatWeDo() {
  const principles = ["Documentação organizada", "Critérios de mercado", "Orientação objetiva"];

  return (
    <section
      id="o-que-fazemos"
      aria-labelledby="o-que-fazemos-title"
      className="relative overflow-hidden border-y border-bronze/20 bg-ivory px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-bronze/10 blur-3xl" />
      <motion.div
        data-testid="what-we-do-animation"
        data-animation-replay="true"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ ...replayViewport, amount: 0.4 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-end"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#08736b]">O que fazemos</p>
          <h2 id="o-que-fazemos-title" className="mt-4 font-display text-4xl font-semibold leading-tight text-espresso sm:text-5xl">
            Transformamos dúvidas imobiliárias em próximos passos mais claros.
          </h2>
        </div>
        <div>
          <p className="max-w-2xl text-lg leading-8 text-cacao/75">
            Apoiamos quem precisa regularizar um imóvel ou compreender seu valor de mercado, reunindo as informações essenciais antes da análise especializada.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {principles.map((principle, index) => (
              <div key={principle} className="flex items-center gap-3 border-t border-bronze/30 pt-3 text-sm font-semibold text-espresso">
                <span className="font-display text-lg text-bronze">{String(index + 1).padStart(2, "0")}</span>
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ServiceChoice({ onSelectService }: { onSelectService: (serviceId: string) => void }) {
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

function ZoomParallaxIntro() {
  return (
    <ZoomParallax images={zoomParallaxImages} prompt="Role para baixo e revele o caminho mais seguro para o seu imóvel.">
      <Hero />
    </ZoomParallax>
  );
}

function HowItWorks() {
  return (
    <section id="seguranca" className="bg-ivory">
      <div data-testid="journey-panel" className="relative overflow-hidden bg-[linear-gradient(180deg,#071312_0%,#0d1f1d_100%)] px-5 py-24 text-ivory sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-7xl">
          <SectionIntro eyebrow="Como funciona" title="Menos improviso. Mais clareza em cada etapa." text="Informações, contexto e orientação reunidos em três etapas compreensíveis." light />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  data-testid={`how-step-${index}`}
                  data-animation-replay="true"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.55, delay: index * 0.1 }}
                  className="min-h-[15rem] rounded-lg border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-bronze/50 bg-bronze/10 text-bronze"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-7 font-display text-2xl font-semibold text-ivory">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-champagne/75">{step.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer id="contato" className="bg-espresso px-5 py-12 text-ivory sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 border-b border-white/10 pb-9 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <a href="#top" aria-label="Vértice Consultoria" className="inline-flex rounded-lg bg-ivory/95 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
              <img src="/brand/vertice-consultoria.png" alt="Vértice Consultoria" className="h-16 w-auto object-contain" />
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-champagne/70">Clareza para regularizar, avaliar e decidir sobre seu imóvel.</p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
            <a className="footer-link" href="#servicos">Serviços</a>
            <Link className="footer-link" to="/login">Acessar minha conta</Link>
            <a className="footer-link" href="#seguranca">Como funciona</a>
          </nav>
          <a href={LANDING_WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full border border-bronze/50 px-5 font-semibold text-champagne transition-colors hover:border-bronze hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
            <MessageCircle className="h-5 w-5 text-bronze" aria-hidden="true" />
            Falar pelo WhatsApp
          </a>
        </div>
        <p className="pt-6 text-sm text-champagne/70">© {currentYear} Vértice Consultoria. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

function SectionIntro({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text: string; light?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${light ? "text-bronze" : "text-tealTech"}`}>{eyebrow}</p>
      <h2 className={`mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl ${light ? "text-ivory" : "text-espresso"}`}>{title}</h2>
      <p className={`mt-5 max-w-2xl text-lg leading-8 ${light ? "text-champagne/75" : "text-cacao/75"}`}>{text}</p>
    </div>
  );
}

function WhatsAppButton() {
  return (
    <a
      href={LANDING_WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366]"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}

export default LandingPage;
