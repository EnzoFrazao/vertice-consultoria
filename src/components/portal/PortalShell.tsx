import {
  Bell,
  CheckCheck,
  LogOut,
  Menu,
  X,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type PortalRole = "client" | "admin";

export interface PortalNavigationItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface PortalNotification {
  id: string;
  title: string;
  message?: string;
  createdAtLabel?: string;
  isRead: boolean;
  href?: string;
}

export interface PortalShellProps {
  role: PortalRole;
  userName: string;
  navigation: PortalNavigationItem[];
  currentPath: string;
  notifications: PortalNotification[];
  unreadCount?: number;
  onLogout: () => void;
  onMarkNotification?: (notificationId: string) => void;
  onMarkAllNotifications?: () => void;
  children: ReactNode;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

function getRoleLabel(role: PortalRole) {
  return role === "admin" ? "Área administrativa" : "Área do cliente";
}

function getActiveNavigationHref(items: PortalNavigationItem[], currentPath: string) {
  return items
    .filter(({ href }) => currentPath === href || currentPath.startsWith(`${href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;
}

interface NavigationProps {
  items: PortalNavigationItem[];
  activeHref?: string;
  onNavigate?: () => void;
}

function Navigation({ items, activeHref, onNavigate }: NavigationProps) {
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
            className={`${focusRing} group flex min-h-11 items-center gap-3 rounded-none border-l-2 px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
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

interface NotificationsPanelProps {
  notifications: PortalNotification[];
  unreadCount: number;
  onMarkNotification?: (notificationId: string) => void;
  onMarkAllNotifications?: () => void;
  onNavigate: () => void;
}

function NotificationsPanel({
  notifications,
  unreadCount,
  onMarkNotification,
  onMarkAllNotifications,
  onNavigate
}: NotificationsPanelProps) {
  return (
    <div
      id="portal-notifications"
      role="region"
      aria-label="Notificações"
      className="fixed left-3 right-3 top-[4.75rem] z-50 w-auto overflow-hidden rounded-2xl border border-espresso/10 bg-ivory shadow-glass sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(24rem,calc(100vw-1.5rem))]"
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-espresso/10 px-4 py-3">
        <div>
          <p className="font-semibold text-espresso">Notificações</p>
          <p className="text-xs text-cacao/[0.55]">
            {unreadCount === 0
              ? "Você está em dia"
              : `${unreadCount} ${unreadCount === 1 ? "não lida" : "não lidas"}`}
          </p>
        </div>
        {unreadCount > 0 && onMarkAllNotifications ? (
          <button
            type="button"
            onClick={onMarkAllNotifications}
            className={`${focusRing} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-tealTech transition hover:bg-tealTech/10`}
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="grid min-h-40 place-items-center px-6 py-8 text-center">
          <div>
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-tealTech/10 text-tealTech">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-cacao/[0.65]">
              Nenhuma notificação por enquanto.
            </p>
          </div>
        </div>
      ) : (
        <ul className="max-h-[min(26rem,65vh)] divide-y divide-espresso/10 overflow-y-auto">
          {notifications.map((notification) => {
            const content = (
              <>
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.isRead ? "bg-espresso/[0.15]" : "bg-tealTech"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-5 text-espresso">
                      {notification.title}
                    </span>
                    <span className="sr-only">
                      {notification.isRead ? "Lida." : "Não lida."}
                    </span>
                    {notification.message ? (
                      <span className="mt-1 block text-xs leading-5 text-cacao/[0.65]">
                        {notification.message}
                      </span>
                    ) : null}
                    {notification.createdAtLabel ? (
                      <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-wide text-cacao/[0.45]">
                        {notification.createdAtLabel}
                      </span>
                    ) : null}
                  </span>
                </span>
              </>
            );

            return (
              <li
                key={notification.id}
                className={notification.isRead ? "bg-ivory" : "bg-tealTech/[0.045]"}
              >
                <div className="flex items-start gap-2 p-3">
                  {notification.href ? (
                    <Link
                      to={notification.href}
                      onClick={onNavigate}
                      className={`${focusRing} flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-lg p-2 transition-colors duration-200 hover:bg-espresso/5`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1 rounded-xl p-2">{content}</div>
                  )}
                  {!notification.isRead && onMarkNotification ? (
                    <button
                      type="button"
                      onClick={() => onMarkNotification(notification.id)}
                      aria-label={`Marcar ${notification.title} como lida`}
                      title="Marcar como lida"
                      className={`${focusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-cacao/50 transition hover:bg-tealTech/10 hover:text-tealTech`}
                    >
                      <CheckCheck aria-hidden="true" className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PortalShell({
  role,
  userName,
  navigation,
  currentPath,
  notifications,
  unreadCount: unreadCountProp,
  onLogout,
  onMarkNotification,
  onMarkAllNotifications,
  children
}: PortalShellProps) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const applicationRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuCloseRef = useRef<HTMLButtonElement>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const focusBeforeDrawerRef = useRef<HTMLElement | null>(null);
  const activeHref = useMemo(
    () => getActiveNavigationHref(navigation, currentPath),
    [currentPath, navigation]
  );
  const unreadCount =
    unreadCountProp ?? notifications.filter((notification) => !notification.isRead).length;
  const roleLabel = getRoleLabel(role);

  useEffect(() => {
    if (!areNotificationsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAreNotificationsOpen(false);
      notificationTriggerRef.current?.focus();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [areNotificationsOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const desktopMediaQuery = window.matchMedia("(min-width: 1280px)");
    const handleDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileNavigationOpen(false);
    };

    if (desktopMediaQuery.matches) setIsMobileNavigationOpen(false);
    desktopMediaQuery.addEventListener("change", handleDesktopBreakpoint);

    return () => {
      desktopMediaQuery.removeEventListener("change", handleDesktopBreakpoint);
    };
  }, []);

  useEffect(() => {
    if (!isMobileNavigationOpen) return;

    const application = applicationRef.current;
    const drawer = mobileDrawerRef.current;
    const hadInertAttribute = application?.hasAttribute("inert") ?? false;
    const previousAriaHidden = application?.getAttribute("aria-hidden") ?? null;
    const previousBodyOverflow = document.body.style.overflow;

    application?.setAttribute("inert", "");
    application?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";
    mobileMenuCloseRef.current?.focus();

    const getFocusableElements = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const handleDrawerKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileNavigationOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        drawer?.focus();
        return;
      }

      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement || !drawer?.contains(activeElement))
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        (activeElement === lastFocusableElement || !drawer?.contains(activeElement))
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleDrawerKeyboard);

    return () => {
      document.removeEventListener("keydown", handleDrawerKeyboard);
      document.body.style.overflow = previousBodyOverflow;

      if (application) {
        if (!hadInertAttribute) application.removeAttribute("inert");
        if (previousAriaHidden === null) application.removeAttribute("aria-hidden");
        else application.setAttribute("aria-hidden", previousAriaHidden);
      }

      focusBeforeDrawerRef.current?.focus();
      focusBeforeDrawerRef.current = null;
    };
  }, [isMobileNavigationOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-mist text-espresso">
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
            <Navigation items={navigation} activeHref={activeHref} />
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
                onClick={() => {
                  focusBeforeDrawerRef.current = mobileMenuTriggerRef.current;
                  setAreNotificationsOpen(false);
                  setIsMobileNavigationOpen(true);
                }}
                aria-label="Abrir menu de navegação"
                aria-expanded={isMobileNavigationOpen}
                aria-controls="portal-mobile-navigation"
                className={`${focusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-espresso transition hover:bg-espresso/5 xl:hidden`}
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
              </button>

              <Link
                to={role === "admin" ? "/admin" : "/cliente"}
                aria-label="Vértice Consultoria"
                className={`${focusRing} inline-flex min-h-11 min-w-0 items-center rounded-lg py-1`}
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
                    onClick={() => {
                      setIsMobileNavigationOpen(false);
                      setAreNotificationsOpen((isOpen) => !isOpen);
                    }}
                    aria-label={
                      unreadCount > 0
                        ? `Notificações, ${unreadCount} ${
                            unreadCount === 1 ? "não lida" : "não lidas"
                          }`
                        : "Notificações"
                    }
                    aria-expanded={areNotificationsOpen}
                    aria-controls="portal-notifications"
                    className={`${focusRing} relative grid h-11 w-11 place-items-center rounded-xl text-cacao/70 transition hover:bg-espresso/5 hover:text-espresso`}
                  >
                    <Bell aria-hidden="true" className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-0.5 top-0.5 grid min-h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-tealTech px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ivory">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {areNotificationsOpen ? (
                    <NotificationsPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkNotification={onMarkNotification}
                      onMarkAllNotifications={onMarkAllNotifications}
                      onNavigate={() => setAreNotificationsOpen(false)}
                    />
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Sair da conta"
                  className={`${focusRing} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-cacao/[0.65] transition hover:bg-espresso/5 hover:text-espresso sm:px-4`}
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

      {isMobileNavigationOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setIsMobileNavigationOpen(false)}
            className="absolute inset-0 bg-espresso/[0.55] backdrop-blur-sm"
          />
          <aside
            ref={mobileDrawerRef}
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
                ref={mobileMenuCloseRef}
                type="button"
                onClick={() => setIsMobileNavigationOpen(false)}
                aria-label="Fechar menu"
                className={`${focusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ivory/70 transition hover:bg-white/10 hover:text-ivory`}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto py-5">
              <Navigation
                items={navigation}
                activeHref={activeHref}
                onNavigate={() => setIsMobileNavigationOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
