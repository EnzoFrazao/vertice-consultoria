import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { PortalNotification } from "@/shared/ui/portal/PortalShell.types";
import { portalFocusRing } from "@/shared/ui/portal/portalStyles";

interface PortalNotificationsPanelProps {
  notifications: PortalNotification[];
  unreadCount: number;
  onMarkNotification?: (notificationId: string) => void;
  onMarkAllNotifications?: () => void;
  onNavigate: () => void;
}

export function PortalNotificationsPanel({
  notifications,
  unreadCount,
  onMarkNotification,
  onMarkAllNotifications,
  onNavigate
}: PortalNotificationsPanelProps) {
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
            className={`${portalFocusRing} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-tealTech transition hover:bg-tealTech/10`}
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
                      className={`${portalFocusRing} flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-lg p-2 transition-colors duration-200 hover:bg-espresso/5`}
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
                      className={`${portalFocusRing} grid h-11 w-11 shrink-0 place-items-center rounded-xl text-cacao/50 transition hover:bg-tealTech/10 hover:text-tealTech`}
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
