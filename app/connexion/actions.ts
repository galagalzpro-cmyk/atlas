"use server";

import { redirect } from "next/navigation";
import { authenticateWithPassword, createSession, destroySession } from "../../lib/server/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Adresse électronique et mot de passe requis." };

  const user = await authenticateWithPassword(email, password);
  if (!user) return { error: "Connexion impossible. Vérifiez les identifiants ou la configuration serveur." };

  await createSession(user.id);
  redirect(user.role === "atlas_admin" ? "/administration" : "/professionnels");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/connexion");
}
