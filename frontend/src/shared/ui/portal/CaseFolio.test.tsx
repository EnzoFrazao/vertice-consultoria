import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CaseStatus } from "@/data/demo/types";
import { CaseFolio } from "@/shared/ui/portal/CaseFolio";

const baseProps = {
  protocol: "RV-2026-0042",
  serviceName: "Regularização de imóveis",
  propertyLabel: "Casa · Rua das Palmeiras, 120",
  objective: "Atualizar a matrícula antes da venda."
};

const statusPhases: Array<[CaseStatus, string]> = [
  ["Novo", "Entrada"],
  ["Documentos pendentes", "Documentação"],
  ["Documentos em análise", "Documentação"],
  ["Análise técnica", "Análise técnica"],
  ["Prefeitura/cartório", "Órgãos"],
  ["Concluído", "Conclusão"]
];

describe("CaseFolio", () => {
  it("renders a case cover, five macro phases and optional content", () => {
    render(
      <CaseFolio {...baseProps} status="Análise técnica">
        <section aria-label="Conteúdo operacional">Próxima ação</section>
      </CaseFolio>
    );

    const folio = screen.getByRole("article", { name: "Fólio RV-2026-0042" });
    expect(within(folio).getByText("RV-2026-0042")).toBeInTheDocument();
    expect(
      within(folio).getByRole("heading", { name: "Regularização de imóveis" })
    ).toBeInTheDocument();
    expect(within(folio).getByText("Casa · Rua das Palmeiras, 120")).toBeInTheDocument();
    expect(within(folio).getByText("Atualizar a matrícula antes da venda.")).toBeInTheDocument();

    const phases = within(folio).getByRole("list", { name: "Andamento do processo" });
    expect(within(phases).getAllByRole("listitem")).toHaveLength(5);
    expect(within(phases).getByText("Entrada")).toBeInTheDocument();
    expect(within(phases).getByText("Documentação")).toBeInTheDocument();
    expect(within(phases).getByText("Análise técnica")).toBeInTheDocument();
    expect(within(phases).getByText("Órgãos")).toBeInTheDocument();
    expect(within(phases).getByText("Conclusão")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conteúdo operacional" })).toHaveTextContent(
      "Próxima ação"
    );
  });

  it.each(statusPhases)("maps %s to the %s macro phase", (status, phase) => {
    render(<CaseFolio {...baseProps} status={status} />);

    const phases = screen.getByRole("list", { name: "Andamento do processo" });
    expect(within(phases).getByText(phase).closest("li")).toHaveAttribute(
      "aria-current",
      "step"
    );
  });

  it("shows awaiting client as an honest pause when the previous phase is not persisted", () => {
    render(<CaseFolio {...baseProps} status="Aguardando cliente" />);

    const phases = screen.getByRole("list", { name: "Andamento do processo" });
    expect(within(phases).getAllByRole("listitem")).toHaveLength(5);
    expect(within(phases).queryByText("Aguardando cliente")).not.toBeInTheDocument();
    expect(within(phases).queryAllByRole("listitem", { current: "step" })).toHaveLength(0);
    expect(screen.getByText("Fase em pausa")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Aguardando cliente");
    expect(screen.getByRole("note")).not.toHaveTextContent(/fase de documentação/i);
  });
});
