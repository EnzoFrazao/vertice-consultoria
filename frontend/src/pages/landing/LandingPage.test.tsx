import { fireEvent, render as renderTestingLibrary, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "@/pages/landing/LandingPage";

function render(ui: ReactElement) {
  return renderTestingLibrary(<MemoryRouter>{ui}</MemoryRouter>);
}

function installMatchMedia(matches: (query: string) => boolean) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  return () => {
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: originalMatchMedia
      });
    } else {
      delete (window as Window & { matchMedia?: typeof window.matchMedia }).matchMedia;
    }
  };
}

describe("real estate guided landing", () => {
  const premiumHomePhotoId = "photo-1600585154340-be6161a56a0c";
  let originalScrollRestoration: History["scrollRestoration"];
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    originalScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "auto";
    scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
    window.history.scrollRestoration = originalScrollRestoration;
    window.history.replaceState(null, "", "/");
  });

  it("presents the service positioning and routes both hero actions to the catalog", () => {
    render(<LandingPage />);

    expect(screen.getAllByText(/Regulariza/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Escolha a necessidade que mais se aproxima do seu momento/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /regularizar meu/i, hidden: true })
    ).toHaveAttribute("href", "#servicos");
    expect(
      screen.getByRole("link", { name: /^avaliar valor de mercado$/i, hidden: true })
    ).toHaveAttribute("href", "#servicos");
    expect(screen.queryByText("Plataforma")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Principal", hidden: true })).getByRole(
        "link",
        { name: /como funciona/i, hidden: true }
      )
    ).toHaveAttribute("href", "#seguranca");
    expect(screen.getByRole("link", { name: /contato/i, hidden: true })).toHaveAttribute(
      "href",
      "#contato"
    );
    expect(screen.queryByRole("link", { name: /diagn/i })).not.toBeInTheDocument();
  });

  it("uses a premium home image as the shared zoom and hero visual", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("hero-parallax-image")).toHaveAttribute(
      "src",
      expect.stringContaining(premiumHomePhotoId)
    );
    expect(screen.getByTestId("hero-parallax-image")).toHaveAttribute(
      "src",
      expect.stringContaining("w=2600&q=84")
    );
    expect(screen.getByTestId("hero-parallax-image")).toHaveAttribute(
      "srcset",
      expect.stringContaining("w=2600&q=84 2600w")
    );
    expect(screen.getByTestId("hero-parallax-image")).toHaveAttribute(
      "sizes",
      "100vw"
    );
    const premiumImages = screen.getAllByAltText(/premium/i);
    expect(premiumImages).toHaveLength(2);
    premiumImages.forEach((image) => {
      expect(image).toHaveAttribute(
        "src",
        expect.stringContaining(premiumHomePhotoId)
      );
      expect(image).toHaveAttribute("sizes", "100vw");
    });
    expect(screen.getByTestId("hero-background-image")).toHaveAttribute(
      "srcset",
      expect.stringContaining("w=2600&q=84 2600w")
    );
  });

  it("uses a short full-screen image handoff instead of an over-zoomed final frame", () => {
    render(<LandingPage />);

    const zoomSection = screen.getByTestId("zoom-parallax-section");
    const transitionCover = screen.getByTestId("zoom-transition-cover");

    expect(zoomSection).toHaveClass("h-[210vh]", "md:h-[225vh]");
    expect(transitionCover).toHaveAttribute(
      "src",
      expect.stringContaining(premiumHomePhotoId)
    );
    expect(transitionCover).toHaveAttribute(
      "srcset",
      expect.stringContaining("w=2600&q=84 2600w")
    );
    expect(transitionCover).toHaveAttribute("sizes", "100vw");
    expect(transitionCover).toHaveAttribute(
      "alt",
      expect.stringMatching(/transi/i)
    );
  });

  it("starts the zoom with a spread editorial collage around the main image", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("zoom-image-frame-0")).toHaveClass(
      "md:h-[34vh]",
      "md:w-[40vw]"
    );
    expect(screen.getByTestId("zoom-image-frame-1")).toHaveClass(
      "md:-left-[36vw]"
    );
    expect(screen.getByTestId("zoom-image-frame-3")).toHaveClass(
      "md:-top-[28vh]",
      "md:left-[33vw]"
    );
    expect(screen.getByTestId("zoom-image-frame-5")).toHaveClass(
      "md:top-[31vh]",
      "md:left-[31vw]"
    );
  });

  it("uses a large elegant display treatment for the zoom prompt", () => {
    render(<LandingPage />);

    const prompt = screen.getByText(/revele o caminho mais seguro/i);

    expect(prompt).toHaveClass("font-display", "text-4xl", "md:text-7xl");
    expect(prompt).not.toHaveClass("text-sm");
  });

  it("keeps the transition cover and hero image color treatment consistent", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("zoom-transition-cover")).toHaveClass(
      "opacity-100"
    );
    expect(screen.getByTestId("hero-background-image")).toHaveClass(
      "opacity-100"
    );
    expect(
      screen.queryByTestId("zoom-transition-color-overlay")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("hero-color-overlay")).not.toBeInTheDocument();
  });

  it("uses a clean editorial hero without the guided journey panel", () => {
    render(<LandingPage />);

    expect(
      within(screen.getByRole("banner", { hidden: true })).getByRole("link", {
        name: "Vértice Consultoria",
        hidden: true
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Regularização fundiária · Análise de valor")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Regularize, avalie e decida sobre seu imóvel com clareza.",
        hidden: true
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Organize documentos, compreenda o valor do seu imóvel e avance com mais clareza em cada decisão."
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId("hero-flow-panel")).not.toBeInTheDocument();
  });

  it("uses the supplied Vértice Consultoria mark in the public identity", () => {
    render(<LandingPage />);

    const marks = screen.getAllByRole("img", { name: "Vértice Consultoria", hidden: true });
    expect(marks.length).toBeGreaterThanOrEqual(2);
    marks.forEach((mark) =>
      expect(mark).toHaveAttribute("src", "/brand/vertice-consultoria.png")
    );
  });

  it("adds a concise editorial section explaining what the service does", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("region", {
        name: "Transformamos dúvidas imobiliárias em próximos passos mais claros."
      })
    ).toHaveAttribute("id", "o-que-fazemos");
    expect(
      screen.getByText(
        "Apoiamos quem precisa regularizar um imóvel ou compreender seu valor de mercado, reunindo as informações essenciais antes da análise especializada."
      )
    ).toBeInTheDocument();
    [
      "Documentação organizada",
      "Critérios de mercado",
      "Orientação objetiva"
    ].forEach((principle) => {
      expect(screen.getByText(principle)).toBeInTheDocument();
    });
  });

  it("marks scroll reveal animations as repeatable when sections re-enter", () => {
    render(<LandingPage />);

    [
      "hero-copy-animation",
      "what-we-do-animation",
      "service-selector",
      "how-step-0",
      "how-step-1",
      "how-step-2"
    ].forEach((testId) => {
      expect(screen.getByTestId(testId)).toHaveAttribute(
        "data-animation-replay",
        "true"
      );
    });
  });

  it("stores and hands off the selected catalog service", () => {
    const onStartService = vi.fn();
    render(<LandingPage onStartService={onStartService} />);

    fireEvent.click(screen.getByRole("button", { name: "Avaliação" }));
    fireEvent.click(screen.getByRole("button", { name: "Análise de Valor de Mercado" }));
    fireEvent.click(screen.getByRole("button", { name: /iniciar solicitação de análise de valor/i }));

    expect(onStartService).toHaveBeenCalledWith("analise-valor-mercado");
    expect(window.sessionStorage.getItem("rv.demo.pending-service")).toBe(
      "analise-valor-mercado"
    );
    expect(screen.queryByTestId("guided-flow-wizard")).not.toBeInTheDocument();
  });

  it("keeps every category and its focused service inside one explorer", () => {
    render(<LandingPage />);

    const selector = screen.getByTestId("service-selector");
    expect(within(selector).getByRole("navigation", { name: "Categorias de serviços" })).toBeInTheDocument();
    fireEvent.click(within(selector).getByRole("button", { name: "Orientação geral" }));
    expect(within(selector).getByRole("button", { name: "Regularização de imóveis" })).toBeInTheDocument();
    fireEvent.click(within(selector).getByRole("button", { name: "Posse e sucessão" }));
    expect(within(selector).getByRole("button", { name: "Inventário imobiliário" })).toBeInTheDocument();
    expect(within(selector).getByRole("region", { name: "Serviço em foco" })).toBeInTheDocument();
  });

  it("marks the selected service with shape and iconography, not only color", () => {
    render(<LandingPage />);

    const selectedService = screen.getByRole("button", { name: "Regularização de imóveis" });
    expect(selectedService).toHaveAttribute("aria-pressed", "true");
    expect(selectedService).toHaveClass("border-l-4", "border-bronze", "bg-champagne/35");
    expect(selectedService.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the mobile catalog as accordions with the same non-color selection cue", async () => {
    const restoreMatchMedia = installMatchMedia((query) =>
      query.includes("min-width") ? false : false
    );

    try {
      render(<LandingPage />);

      await waitFor(() =>
        expect(
          screen.queryByRole("navigation", { name: "Categorias de serviços" })
        ).not.toBeInTheDocument()
      );
      expect(document.querySelectorAll("#servicos details")).toHaveLength(5);
      const selectedService = screen.getByRole("button", {
        name: "Regularização de imóveis"
      });
      expect(selectedService).toHaveClass("border-l-4", "border-l-bronze", "bg-champagne/35");
    } finally {
      restoreMatchMedia();
    }
  });

  it("reveals an interactive hero immediately when reduced motion is preferred", async () => {
    const restoreMatchMedia = installMatchMedia((query) =>
      query.includes("prefers-reduced-motion")
    );

    try {
      render(<LandingPage />);

      await waitFor(() => {
        expect(screen.getByTestId("zoom-hero-reveal")).not.toHaveAttribute("aria-hidden");
        expect(screen.getByTestId("zoom-hero-reveal")).not.toHaveAttribute("inert");
      });
    } finally {
      restoreMatchMedia();
    }
  });

  it("renders the approved landing sections in order", () => {
    render(<LandingPage />);

    expect(
      Array.from(
        document.querySelectorAll(
          "#zoom-parallax, #o-que-fazemos, #servicos, #seguranca, #contato"
        )
      ).map((section) => section.id)
    ).toEqual([
      "zoom-parallax",
      "o-que-fazemos",
      "servicos",
      "seguranca",
      "contato"
    ]);
  });

  it("starts with the zoom parallax intro and reveals the hero inside it", () => {
    render(<LandingPage />);

    const zoomSection = screen.getByTestId("zoom-parallax-section");
    const zoomReveal = screen.getByTestId("zoom-hero-reveal");
    const zoomImages = zoomSection.querySelectorAll("[data-zoom-frame='true']");
    const hero = screen.getByTestId("site-hero");

    expect(zoomImages).toHaveLength(7);
    expect(zoomImages[0]).toHaveAttribute(
      "src",
      expect.stringContaining(premiumHomePhotoId)
    );
    expect(zoomImages[0]).toHaveAttribute(
      "alt",
      expect.stringMatching(/premium/i)
    );
    expect(screen.getByText(/role para baixo/i)).toBeInTheDocument();
    expect(screen.getByText(/regularize, avalie/i)).toBeInTheDocument();
    expect(zoomReveal).toContainElement(hero);
    expect(zoomSection).toContainElement(hero);
    expect(zoomReveal).toHaveAttribute("aria-hidden", "true");
    expect(zoomReveal).toHaveAttribute("inert");
    expect(screen.queryByText(/transforme papelada/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/documentos, chaves e crit/i)
    ).not.toBeInTheDocument();
  });

  it("leaves route scrolling and browser restoration to the application lifecycle", () => {
    render(<LandingPage />);

    expect(window.history.scrollRestoration).toBe("auto");
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("keeps the concise three-step explanation", () => {
    render(<LandingPage />);

    expect(screen.getByText(/envie as informa/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Informações, contexto e orientação reunidos em três etapas compreensíveis."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/receba orientação para decidir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp/i)).toHaveAttribute("href");
  });

  it("removes the old diagnostic and guided wizard from the public landing", () => {
    render(<LandingPage />);

    expect(screen.queryByText(/escolha o que quer resolver/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comece pelo caminho certo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /diagn/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("service-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("guided-flow-wizard")).not.toBeInTheDocument();
    expect(screen.queryByText(/processo IC/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Residencial Lagoa Prime/i)).not.toBeInTheDocument();
  });

  it("uses a compact institutional footer as the contact destination", () => {
    render(<LandingPage />);

    const footer = screen.getByRole("contentinfo");

    expect(footer).toHaveAttribute("id", "contato");
    expect(footer).toHaveTextContent("Vértice Consultoria");
    expect(footer).toHaveTextContent(
      "Clareza para regularizar, avaliar e decidir sobre seu imóvel."
    );
    expect(
      footer.querySelector('a[href="#servicos"]')
    ).toBeInTheDocument();
    expect(footer.querySelector('a[href="/login"]')).toHaveTextContent(
      "Acessar minha conta"
    );
    expect(
      footer.querySelector('a[href="#seguranca"]')
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", {
        name: "Falar pelo WhatsApp",
        exact: true
      })
    ).toHaveAttribute(
      "href",
      "https://wa.me/5500000000000?text=Ol%C3%A1!%20Tenho%20interesse%20em%20regulariza%C3%A7%C3%A3o%20ou%20avalia%C3%A7%C3%A3o%20imobili%C3%A1ria."
    );
  });

  it("removes the repeated trust cards and oversized final CTA", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("journey-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("trust-panel")).not.toBeInTheDocument();
    [
      "LGPD em primeiro plano",
      "Envio seguro",
      "Critério técnico",
      "Menos burocracia"
    ].forEach((heading) => {
      expect(
        screen.queryByRole("heading", { name: heading, exact: true })
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", {
        name: "Escolha o caminho certo para o seu imóvel."
      })
    ).not.toBeInTheDocument();
  });
});
