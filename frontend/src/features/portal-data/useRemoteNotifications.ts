import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Notification } from "@/domain/types";
import type { PortalRepository } from "@/features/portal-data/PortalRepository";

export interface RemoteNotificationsSource {
  repository: PortalRepository;
  client: SupabaseClient;
}

export type RemoteNotificationsLoader = () => Promise<RemoteNotificationsSource>;

/*
 * Loaded lazily so builds and tests without Supabase credentials never evaluate
 * the client module (it throws when the environment variables are missing).
 */
async function loadRemoteNotificationsSource(): Promise<RemoteNotificationsSource> {
  const [{ supabase }, { createSupabasePortalRepository }] = await Promise.all([
    import("@/infrastructure/supabase/client"),
    import("@/infrastructure/supabase/SupabasePortalRepository")
  ]);

  return { repository: createSupabasePortalRepository(supabase), client: supabase };
}

export interface RemoteNotifications {
  notifications: Notification[];
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
}

/*
 * Hybrid bridge: reads the signed-in user's notifications from public.notifications
 * and keeps them fresh through Realtime. Any failure (no credentials, no Supabase
 * session, network) degrades to an empty list so the rest of the portal is unaffected.
 */
export function useRemoteNotifications(
  userId: string | undefined,
  loader: RemoteNotificationsLoader = loadRemoteNotificationsSource
): RemoteNotifications {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [source, setSource] = useState<RemoteNotificationsSource | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      try {
        const loaded = await loader();
        const { data } = await loaded.client.auth.getSession();

        // Demo users have no Supabase session: nothing to fetch.
        if (!active || data.session?.user.id !== userId) {
          return;
        }

        const refresh = async () => {
          try {
            const list = await loaded.repository.listNotifications(userId);
            if (active) {
              setNotifications(list);
            }
          } catch {
            // Keep the previous list; the bell must never break the portal.
          }
        };

        setSource(loaded);
        await refresh();

        const channel = loaded.client
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`
            },
            () => {
              void refresh();
            }
          )
          .subscribe();

        cleanup = () => {
          void loaded.client.removeChannel(channel);
        };
      } catch {
        // Supabase unavailable: stay on the demo-only experience.
      }
    };

    void start();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [userId, loader]);

  const markRead = useCallback(
    (notificationId: string) => {
      if (!source) return;
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, readAt } : item))
      );
      source.repository.markNotificationRead(notificationId).catch(() => {
        if (userId) {
          void source.repository.listNotifications(userId).then(setNotifications, () => undefined);
        }
      });
    },
    [source, userId]
  );

  const markAllRead = useCallback(() => {
    if (!source || !userId) return;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => (item.readAt ? item : { ...item, readAt }))
    );
    source.repository.markAllNotificationsRead(userId).catch(() => {
      void source.repository.listNotifications(userId).then(setNotifications, () => undefined);
    });
  }, [source, userId]);

  return useMemo(
    () => ({ notifications: userId ? notifications : [], markRead, markAllRead }),
    [markAllRead, markRead, notifications, userId]
  );
}
