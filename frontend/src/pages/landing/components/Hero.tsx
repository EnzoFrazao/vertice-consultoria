import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { DataConstellation } from "@/pages/landing/components/DataConstellation";
import { SiteHeader } from "@/pages/landing/components/SiteHeader";
import { fadeUp, replayViewport } from "@/pages/landing/components/animations";
import { heroImage, heroImageSrcSet } from "@/pages/landing/components/landingMedia";

export function Hero() {
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

      <SiteHeader />

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
            Organize documentos, compreenda o valor do seu imóvel e avance com mais clareza em cada
            decisão.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#servicos"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tealTech px-6 font-bold text-white transition-colors hover:bg-[#0b625c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              Regularizar meu imóvel
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="#servicos"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-champagne/45 bg-white/5 px-6 font-semibold text-ivory backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              Avaliar valor de mercado
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
