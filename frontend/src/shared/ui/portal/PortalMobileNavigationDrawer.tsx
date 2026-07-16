import { X } from "lucide-react";
import type { RefObject } from "react";
import { PortalNavigation } from "@/shared/ui/portal/PortalNavigation";
import type { PortalNavigationItem } from "@/shared/ui/portal/PortalShell.types";
import { portalFocusRing } from "@/shared/ui/portal/portalStyles";

interface PortalMobileNavigationDrawerProps {
  drawerRef: RefObject<HTMLElement>;
  closeButtonRef: RefObject<HTMLButtonElement>;
  roleLabel: string;
  userName: string;
  navigation: PortalNavigationItem[];
  activeHref?: string;
  onClose: () => void;
}

export function PortalMobileNavigationDrawer({
  drawerRef,
  closeButtonRef,
  roleLabel,
  userName,
  navigation,
  activeHref,
  onClose
}: PortalMobileNavigationDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-espresso/[0.55] backdrop-blur-sm"
      />
      <aside
        ref={drawerRef}
        id="portal-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        tabIndex={-1}
        className="relative flex h-full w-[min(20rem,86vw)] flex-col overflow-hidden bg-espresso px-4 py-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-2 pb-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">
              {roleLabel}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-ivory/70">{userName}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className={`${portalFocusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ivory/70 transition hover:bg-white/10 hover:text-ivory`}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <PortalNavigation
            items={navigation}
            activeHref={activeHref}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </div>
  );
}
