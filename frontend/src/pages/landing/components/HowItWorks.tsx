import { Camera, ClipboardCheck, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { SectionIntro } from "@/pages/landing/components/SectionIntro";
import { fadeUp } from "@/pages/landing/components/animations";

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

export function HowItWorks() {
  return (
    <section id="seguranca" className="bg-ivory">
      <div
        data-testid="journey-panel"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#071312_0%,#0d1f1d_100%)] px-5 py-24 text-ivory sm:px-8 lg:px-10"
      >
        <div className="relative mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Como funciona"
            title="Menos improviso. Mais clareza em cada etapa."
            text="Informações, contexto e orientação reunidos em três etapas compreensíveis."
            light
          />
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
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-bronze/50 bg-bronze/10 text-bronze">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-7 font-display text-2xl font-semibold text-ivory">
                    {step.title}
                  </h3>
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
