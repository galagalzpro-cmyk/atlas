"use server";

import { redirect } from "next/navigation";
import { databaseConfigured } from "../../lib/server/database";
import { authenticateWithPassword, createSession, destroySession, getCurrentUser } from "../../lib/server/auth";
import { writeAuditEvent } from "../../lib/server/audit";

export interface LoginState {
  error?: string;
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Adresse électronique et mot de passe requis." };

  try {
    const user = await authenticateWithPassword(email, password);
    if (!user) {
      if (databaseConfigured()) {
        await writeAuditEvent({
          action: "identity.login",
          targetType: "session",
          outcome: "denied",
          metadata: { reason: "invalid_credentials" },
        });
      }
      return { error: "Connexion impossible. Vérifiez les identifiants." };
    }

    await createSession(user.id);
    await writeAuditEvent({
      actorUserId: user.id,
      action: "identity.login",
      targetType: "session",
      outcome: "success",
      metadata: { role: user.role },
    });

    if (user.role === "atlas_admin") redirect("/administration");
    if (user.role === "professional" || user.role === "organization_admin") redirect("/professionnels");
    redirect("/compte");
  } catch {
    return { error: "Le service de connexion est momentanément indisponible." };
  }
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await writeAuditEvent({
      actorUserId: user.id,
      action: "identity.logout",
      targetType: "session",
      outcome: "success",
      metadata: { role: user.role },
    });
  }
  await destroySession();
  redirect("/connexion");
}
