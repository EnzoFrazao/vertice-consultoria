import { fireEvent, render as renderTestingLibrary, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

function render(ui: ReactElement) {
  return renderTestingLibrary(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("landing portal entry", () => {
  it("presents the nine services as an interactive category explorer", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /encontre o caminho certo para o seu imóvel/i
      })
    ).toBeInTheDocument();

    const explorer = screen.getByTestId("service-selector");
    expect(screen.getByRole("navigation", { name: "Categorias de serviços" })).toBeInTheDocument();

    const categories = [
      ["Orientação geral", ["Regularização de imóveis"]],
      ["Regularização e registro", ["Escritura", "Averbação", "Retificação de área", "Regularização em prefeitura/cartório"]],
      ["Posse e sucessão", ["Usucapião", "Inventário imobiliário"]],
      ["Terrenos", ["Desmembramento de terreno"]],
      ["Avaliação", ["Análise de Valor de Mercado"]]
    ] as const;

    categories.forEach(([category, services]) => {
      fireEvent.click(screen.getByRole("button", { name: category }));
      services.forEach((service) =>
        expect(screen.getByRole("button", { name: service })).toBeInTheDocument()
      );
    });

    expect(within(explorer).getByRole("region", { name: "Serviço em foco" })).toBeInTheDocument();

    expect(screen.queryByTestId("guided-flow-wizard")).not.toBeInTheDocument();
  });

  it("hands the selected service to the portal entry flow", () => {
    const onStartService = vi.fn();
    render(<App onStartService={onStartService} />);

    fireEvent.click(screen.getByRole("button", { name: "Regularização e registro" }));
    fireEvent.click(screen.getByRole("button", { name: "Escritura" }));
    expect(onStartService).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /iniciar solicitação de escritura/i }));

    expect(onStartService).toHaveBeenCalledWith("escritura");
  });

  it("offers account access from the public experience", () => {
    render(<App />);

    const links = screen.getAllByRole("link", { name: /acessar minha conta/i });
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });
});
