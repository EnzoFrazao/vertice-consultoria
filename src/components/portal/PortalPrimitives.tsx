import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: PageHeaderProps) {
  return (
    <header
      className={joinClasses(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-tealTech">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold leading-tight text-espresso sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cacao/70 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export type StatusBadgeTone = "neutral" | "brand" | "info" | "warning" | "success" | "danger";

export interface StatusBadgeProps {
  status: string;
  tone?: StatusBadgeTone;
  className?: string;
}

const statusToneClasses: Record<StatusBadgeTone, string> = {
  neutral: "border-espresso/10 bg-espresso/5 text-cacao/75",
  brand: "border-bronze/25 bg-champagne/70 text-cacao",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-tealTech/20 bg-tealTech/10 text-tealTech",
  danger: "border-red-200 bg-red-50 text-red-700"
};

const exactStatusTones: Record<string, StatusBadgeTone> = {
  aprovado: "success",
  concluido: "success",
  rejeitado: "danger",
  pendente: "warning",
  "documentos pendentes": "warning",
  "aguardando cliente": "warning",
  "em analise": "info",
  "documentos em analise": "info",
  "analise tecnica": "info",
  "prefeitura/cartorio": "info",
  novo: "brand",
  enviado: "brand"
};

function inferStatusTone(status: string): StatusBadgeTone {
  const normalized = status
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return exactStatusTones[normalized] ?? "neutral";
}

export function StatusBadge({ status, tone, className }: StatusBadgeProps) {
  const resolvedTone = tone ?? inferStatusTone(status);

  return (
    <span
      className={joinClasses(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        statusToneClasses[resolvedTone],
        className
      )}
    >
      {status}
    </span>
  );
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={joinClasses(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-espresso/[0.15] bg-ivory/70 px-5 py-10 text-center",
        className
      )}
    >
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-tealTech/10 text-tealTech">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="font-display text-xl font-semibold text-espresso">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-cacao/[0.65]">{description}</p>
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </section>
  );
}

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <article
      className={joinClasses(
        "min-w-0 rounded-2xl border border-espresso/10 bg-ivory p-5 shadow-[0_12px_36px_rgba(32,19,13,0.06)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cacao/[0.55]">{label}</p>
          <p className="mt-3 break-words font-display text-3xl font-semibold leading-none text-espresso">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-champagne text-bronze">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-4 text-sm leading-5 text-cacao/60">{hint}</p> : null}
    </article>
  );
}
