import type { DemoActionContext } from "@/infrastructure/actions/context";

export function createNotificationActions(context: DemoActionContext) {
  function markNotificationRead(notificationId: string, userId: string) {
    const state = context.getState();
    const notification = state.notifications.find((item) => item.id === notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notificação não encontrada.");
    }
    if (notification.readAt) return state;

    return context.commit({
      ...state,
      notifications: state.notifications.map((item) =>
        item.id === notificationId ? { ...item, readAt: context.now().toISOString() } : item
      ),
      updatedAt: context.now().toISOString()
    });
  }

  function markAllNotificationsRead(userId: string) {
    context.getUser(userId);
    const state = context.getState();
    const readAt = context.now().toISOString();
    return context.commit({
      ...state,
      notifications: state.notifications.map((item) =>
        item.userId === userId && !item.readAt ? { ...item, readAt } : item
      ),
      updatedAt: readAt
    });
  }

  return { markNotificationRead, markAllNotificationsRead };
}
