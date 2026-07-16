import { motion } from "framer-motion";
import { fadeUp, replayViewport } from "@/pages/landing/components/animations";

export function WhatWeDo() {
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
