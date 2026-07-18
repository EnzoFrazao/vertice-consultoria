import { Hero } from "@/pages/landing/components/Hero";
import { ZoomParallax } from "@/pages/landing/components/ZoomParallax";
import { zoomParallaxImages } from "@/pages/landing/components/landingMedia";

export function ZoomParallaxIntro() {
  return (
    <ZoomParallax
      images={zoomParallaxImages}
      prompt="Role para baixo e revele o caminho mais seguro para o seu imóvel."
    >
      <Hero />
    </ZoomParallax>
  );
}
