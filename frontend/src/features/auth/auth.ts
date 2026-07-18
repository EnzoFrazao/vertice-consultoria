import type { AuthSession, User } from "@/domain/types";

export const DEMO_CREDENTIALS = [
  { email: "cliente@demo.com", password: "cliente123" },
  { email: "admin@demo.com", password: "admin123" }
] as const;

export function authenticateDemoUser(
  email: string,
  password: string,
  users: ReadonlyArray<User>,
  now: () => Date = () => new Date()
): AuthSession | null {
  const normalizedEmail = email.trim().toLocaleLowerCase("pt-BR");
  const hasValidCredential = DEMO_CREDENTIALS.some(
    (credential) => credential.email === normalizedEmail && credential.password === password
  );

  if (!hasValidCredential) return null;

  const user = users.find(
    (candidate) => candidate.email.toLocaleLowerCase("pt-BR") === normalizedEmail
  );

  if (!user) return null;

  return {
    userId: user.id,
    role: user.role,
    signedInAt: now().toISOString()
  };
}
