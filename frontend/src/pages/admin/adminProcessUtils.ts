import type { Case, User } from "@/domain/types";

export function getClient(users: User[], item: Case) {
  return users.find((user) => user.id === item.clientId);
}
