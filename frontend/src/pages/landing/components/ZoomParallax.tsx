import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform
} from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ZoomParallaxImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
};

type ZoomParallaxProps = {
  images: ZoomParallaxImage[];
  prompt?: string;
  children: ReactNode;
};

const imageFrames = [
  "h-[34vh] w-[82vw] md:h-[34vh] md:w-[40vw]",
  "-top-[2vh] -left-[31vw] h-[21vh] w-[42vw] md:-top-[3vh] md:-left-[36vw] md:h-[24vh] md:w-[24vw]",
  "top-[5vh] left-[31vw] h-[20vh] w-[40vw] md:top-[0vh] md:left-[34vw] md:h-[22vh] md:w-[23vw]",
  "hidden md:block md:-top-[28vh] md:left-[33vw] md:h-[20vh] md:w-[22vw]",
  "top-[30vh] -left-[19vw] h-[20vh] w-[52vw] md:top-[31vh] md:-left-[28vw] md:h-[24vh] md:w-[34vw]",
  "hidden md:block md:top-[31vh] md:left-[31vw] md:h-[22vh] md:w-[31vw]",
  "hidden"
];

export function ZoomParallax({
  images,
  prompt = "Role para baixo e veja a clareza tomar forma.",
  children
}: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);
  const heroReveal = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [hasReachedHero, setHasReachedHero] = useState(false);
  const heroIsInteractive = Boolean(shouldReduceMotion) || hasReachedHero;
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  const mainScale = useTransform(scrollYProgress, [0, 0.46, 0.58], [1, 2.72, 2.46]);
  const scale5 = useTransform(scrollYProgress, [0, 0.38], [1, 2.25]);
  const scale6 = useTransform(scrollYProgress, [0, 0.38], [1, 2.42]);
  const scale8 = useTransform(scrollYProgress, [0, 0.38], [1, 2.58]);
  const scale9 = useTransform(scrollYProgress, [0, 0.38], [1, 2.72]);
  const promptOpacity = useTransform(scrollYProgress, [0, 0.09, 0.17], [1, 1, 0]);
  const introImageY = useTransform(scrollYProgress, [0, 0.16], [90, 0]);
  const mainImageOpacity = useTransform(scrollYProgress, [0, 0.49, 0.54], [1, 1, 0]);
  const sideImagesOpacity = useTransform(scrollYProgress, [0, 0.18, 0.34], [1, 0.82, 0]);
  const transitionCoverOpacity = useTransform(
    scrollYProgress,
    [0.52, 0.555, 0.665, 0.675],
    [0, 1, 1, 0]
  );
  const transitionCoverScale = useTransform(scrollYProgress, [0.52, 0.58], [1.1, 1.08]);
  const transitionCoverY = useTransform(scrollYProgress, [0.52, 0.58], [-20, -28]);
  const heroOpacity = useTransform(scrollYProgress, [0.665, 0.675, 1], [0, 1, 1]);
  const heroPointerEvents = useTransform(scrollYProgress, (value) =>
    value > 0.675 ? "auto" : "none"
  );
  const scales = [mainScale, scale5, scale6, scale5, scale6, scale8, scale9];
  const transitionImage = images[0];

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (!shouldReduceMotion) setHasReachedHero(value > 0.675);
  });

  useEffect(() => {
    const element = heroReveal.current;
    if (!element) return;
    if (heroIsInteractive) element.removeAttribute("inert");
    else element.setAttribute("inert", "");
  }, [heroIsInteractive]);

  return (
    <div
      id="zoom-parallax"
      ref={container}
      data-testid="zoom-parallax-section"
      style={{ height: shouldReduceMotion ? "100vh" : undefined }}
      className="relative h-[210vh] bg-[#071312] md:h-[225vh]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,130,70,0.24),transparent_34%),linear-gradient(180deg,#20130d_0%,#071312_100%)]" />
        <motion.div
          data-testid="zoom-scroll-prompt"
          style={{ opacity: shouldReduceMotion ? 0 : promptOpacity }}
          className="pointer-events-none absolute left-5 right-5 top-[8vh] z-30 max-w-[22rem] text-left sm:left-[9vw] sm:right-auto sm:top-[9vh] sm:max-w-[34rem] md:left-[12vw] md:top-[10vh] md:max-w-[44rem] lg:max-w-[50rem]"
        >
          <p className="font-display text-4xl font-semibold leading-[0.96] tracking-normal text-ivory [text-shadow:0_8px_34px_rgba(0,0,0,0.72)] sm:text-6xl md:text-7xl">
            {prompt}
          </p>
        </motion.div>

        {images.map(({ src, srcSet, sizes, alt }, index) => {
          const scale = scales[index % scales.length];
          const isMainImage = index === 0;

          return (
            <motion.div
              key={`${src}-${index}`}
              style={{
                scale: shouldReduceMotion && isMainImage ? 3.6 : shouldReduceMotion ? 1 : scale,
                y: shouldReduceMotion ? 0 : introImageY,
                opacity:
                  shouldReduceMotion && !isMainImage
                    ? 0
                    : isMainImage
                      ? shouldReduceMotion
                        ? 0
                        : mainImageOpacity
                      : sideImagesOpacity
              }}
              className={`absolute top-0 flex h-full w-full transform-gpu items-center justify-center will-change-transform ${
                isMainImage ? "z-20" : "z-10"
              }`}
            >
              <div
                data-testid={`zoom-image-frame-${index}`}
                className={`relative overflow-hidden rounded-lg border border-white/14 shadow-[0_24px_70px_rgba(0,0,0,0.36)] ${
                  isMainImage ? "origin-center" : ""
                } ${imageFrames[index % imageFrames.length]}`}
              >
                <img
                  data-zoom-frame="true"
                  data-testid={isMainImage ? "hero-parallax-image" : undefined}
                  src={src}
                  srcSet={srcSet}
                  sizes={sizes}
                  alt={alt || `Imagem imobiliaria ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,19,18,0.08),rgba(7,19,18,0.22))]" />
              </div>
            </motion.div>
          );
        })}

        {transitionImage && (
          <motion.div
            aria-hidden="true"
            style={{
              opacity: shouldReduceMotion ? 0 : transitionCoverOpacity
            }}
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden bg-espresso"
          >
            <motion.img
              data-testid="zoom-transition-cover"
              src={transitionImage.src}
              srcSet={transitionImage.srcSet}
              sizes={transitionImage.sizes}
              alt="Imagem de transição suave para o hero da landing"
              loading="eager"
              style={{
                y: shouldReduceMotion ? -28 : transitionCoverY,
                scale: shouldReduceMotion ? 1.08 : transitionCoverScale
              }}
              className="absolute inset-x-0 -inset-y-10 h-[calc(100%+5rem)] w-full object-cover opacity-100"
            />
          </motion.div>
        )}

        <motion.div
          ref={heroReveal}
          data-testid="zoom-hero-reveal"
          aria-hidden={heroIsInteractive ? undefined : true}
          style={{
            opacity: shouldReduceMotion ? 1 : heroOpacity,
            pointerEvents: shouldReduceMotion ? "auto" : heroPointerEvents,
            y: 0
          }}
          className="absolute inset-0 z-40"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
