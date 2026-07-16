import type { PortalNavigationItem, PortalRole } from "@/shared/ui/portal/PortalShell.types";

export function getPortalRoleLabel(role: PortalRole) {
  return role === "admin" ? "Área administrativa" : "Área do cliente";
}

export function getActiveNavigationHref(items: PortalNavigationItem[], currentPath: string) {
  return items
    .filter(({ href }) => currentPath === href || currentPath.startsWith(`${href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;
}
