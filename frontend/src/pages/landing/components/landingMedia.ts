const heroImageBase =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop";

export const heroImage = `${heroImageBase}&w=2600&q=84`;

export const heroImageSrcSet = [
  `${heroImageBase}&w=1600&q=82 1600w`,
  `${heroImageBase}&w=2200&q=83 2200w`,
  `${heroImageBase}&w=2600&q=84 2600w`
].join(", ");

export const zoomParallaxImages = [
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
