import { useEffect, useMemo, useRef, useState } from "react";
import { PortalApplicationLayout } from "@/shared/ui/portal/PortalApplicationLayout";
import { PortalMobileNavigationDrawer } from "@/shared/ui/portal/PortalMobileNavigationDrawer";
import {
  getActiveNavigationHref,
  getPortalRoleLabel
} from "@/shared/ui/portal/portalNavigationUtils";
import type { PortalShellProps } from "@/shared/ui/portal/PortalShell.types";

export type {
  PortalNavigationItem,
  PortalNotification,
  PortalRole,
  PortalShellProps
} from "@/shared/ui/portal/PortalShell.types";

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
  const roleLabel = getPortalRoleLabel(role);

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
      <PortalApplicationLayout
        role={role}
        roleLabel={roleLabel}
        userName={userName}
        navigation={navigation}
        activeHref={activeHref}
        applicationRef={applicationRef}
        mobileMenuTriggerRef={mobileMenuTriggerRef}
        isMobileNavigationOpen={isMobileNavigationOpen}
        onOpenMobileNavigation={() => {
          focusBeforeDrawerRef.current = mobileMenuTriggerRef.current;
          setAreNotificationsOpen(false);
          setIsMobileNavigationOpen(true);
        }}
        notificationTriggerRef={notificationTriggerRef}
        areNotificationsOpen={areNotificationsOpen}
        onToggleNotifications={() => {
          setIsMobileNavigationOpen(false);
          setAreNotificationsOpen((isOpen) => !isOpen);
        }}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkNotification={onMarkNotification}
        onMarkAllNotifications={onMarkAllNotifications}
        onCloseNotifications={() => setAreNotificationsOpen(false)}
        onLogout={onLogout}
      >
        {children}
      </PortalApplicationLayout>

      {isMobileNavigationOpen ? (
        <PortalMobileNavigationDrawer
          drawerRef={mobileDrawerRef}
          closeButtonRef={mobileMenuCloseRef}
          roleLabel={roleLabel}
          userName={userName}
          navigation={navigation}
          activeHref={activeHref}
          onClose={() => setIsMobileNavigationOpen(false)}
        />
      ) : null}
    </div>
  );
}
