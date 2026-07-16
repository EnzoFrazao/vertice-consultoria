import { Bell, LogOut, Menu } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import { PortalNavigation } from "@/shared/ui/portal/PortalNavigation";
import { PortalNotificationsPanel } from "@/shared/ui/portal/PortalNotificationsPanel";
import type {
  PortalNavigationItem,
  PortalNotification,
  PortalRole
} from "@/shared/ui/portal/PortalShell.types";
import { portalFocusRing } from "@/shared/ui/portal/portalStyles";

interface PortalApplicationLayoutProps {
  role: PortalRole;
  roleLabel: string;
  userName: string;
  navigation: PortalNavigationItem[];
  activeHref?: string;
  applicationRef: RefObject<HTMLDivElement>;
  mobileMenuTriggerRef: RefObject<HTMLButtonElement>;
  isMobileNavigationOpen: boolean;
  onOpenMobileNavigation: () => void;
  notificationTriggerRef: RefObject<HTMLButtonElement>;
  areNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  notifications: PortalNotification[];
  unreadCount: number;
  onMarkNotification?: (notificationId: string) => void;
  onMarkAllNotifications?: () => void;
  onCloseNotifications: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export function PortalApplicationLayout({
  role,
  roleLabel,
  userName,
  navigation,
  activeHref,
  applicationRef,
  mobileMenuTriggerRef,
  isMobileNavigationOpen,
  onOpenMobileNavigation,
  notificationTriggerRef,
  areNotificationsOpen,
  onToggleNotifications,
  notifications,
  unreadCount,
  onMarkNotification,
  onMarkAllNotifications,
  onCloseNotifications,
  onLogout,
  children
}: PortalApplicationLayoutProps) {
  return (
    <div
      ref={applicationRef}
      data-testid="portal-application"
      className="mx-auto flex min-h-screen w-full max-w-[1920px]"
    >
      <aside
        data-testid="portal-desktop-index"
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-espresso px-3 py-6 xl:flex"
      >
        <div className="border-b border-white/10 px-2 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-bronze">
            {roleLabel}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-ivory/70">{userName}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <PortalNavigation items={navigation} activeHref={activeHref} />
        </div>
        <p className="border-t border-white/10 px-2 pt-4 text-xs leading-5 text-ivory/[0.45]">
          Clareza em cada etapa do seu imóvel.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-espresso/10 bg-ivory/95 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[4.5rem] w-full max-w-[1440px] items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-10 xl:px-12">
            <button
              ref={mobileMenuTriggerRef}
              type="button"
              onClick={onOpenMobileNavigation}
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileNavigationOpen}
              aria-controls="portal-mobile-navigation"
              className={`${portalFocusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-espresso transition hover:bg-espresso/5 xl:hidden`}
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <Link
              to={role === "admin" ? "/admin" : "/cliente"}
              aria-label="Vértice Consultoria"
              className={`${portalFocusRing} inline-flex min-h-11 min-w-0 items-center rounded-lg py-1`}
            >
              <img
                src="/brand/vertice-consultoria.png"
                alt="Vértice Consultoria"
                className="h-9 w-auto max-w-[38vw] object-contain object-left sm:h-10 sm:max-w-44"
              />
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="relative">
                <button
                  ref={notificationTriggerRef}
                  type="button"
                  onClick={onToggleNotifications}
                  aria-label={
                    unreadCount > 0
                      ? `Notificações, ${unreadCount} ${
                          unreadCount === 1 ? "não lida" : "não lidas"
                        }`
                      : "Notificações"
                  }
                  aria-expanded={areNotificationsOpen}
                  aria-controls="portal-notifications"
                  className={`${portalFocusRing} relative grid h-11 w-11 place-items-center rounded-xl text-cacao/70 transition hover:bg-espresso/5 hover:text-espresso`}
                >
                  <Bell aria-hidden="true" className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-0.5 top-0.5 grid min-h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-tealTech px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ivory">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </button>
                {areNotificationsOpen ? (
                  <PortalNotificationsPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkNotification={onMarkNotification}
                    onMarkAllNotifications={onMarkAllNotifications}
                    onNavigate={onCloseNotifications}
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={onLogout}
                aria-label="Sair da conta"
                className={`${portalFocusRing} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-cacao/[0.65] transition hover:bg-espresso/5 hover:text-espresso sm:px-4`}
              >
                <LogOut aria-hidden="true" className="h-5 w-5" />
                <span className="hidden sm:inline">Sair da conta</span>
                <span className="sm:hidden">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
