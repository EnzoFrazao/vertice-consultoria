import { Link } from "react-router-dom";
import type { PortalNavigationItem } from "@/shared/ui/portal/PortalShell.types";
import { portalFocusRing } from "@/shared/ui/portal/portalStyles";

interface PortalNavigationProps {
  items: PortalNavigationItem[];
  activeHref?: string;
  onNavigate?: () => void;
}

export function PortalNavigation({ items, activeHref, onNavigate }: PortalNavigationProps) {
  return (
    <nav aria-label="Navegação do portal" className="border-y border-white/10">
      {items.map(({ label, href }, index) => {
        const isActive = href === activeHref;

        return (
          <Link
            key={href}
            to={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={`${portalFocusRing} group flex min-h-11 items-center gap-3 rounded-none border-l-2 px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
              isActive
                ? "border-bronze bg-white/[0.04] text-ivory"
                : "border-transparent text-ivory/70 hover:border-white/25 hover:bg-white/[0.035] hover:text-ivory"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-7 shrink-0 text-[10px] font-bold tracking-[0.18em] ${
                isActive ? "text-bronze" : "text-ivory/45"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
