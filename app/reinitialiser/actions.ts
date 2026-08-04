"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "../../lib/server/password-reset";

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!token || password !== confirmation) redirect(`/reinitialiser?token=${encodeURIComponent(token)}&error=mismatch`);
  try {
    await resetPassword(token, password);
    redirect("/connexion?reset=1");
  } catch {
    redirect(`/reinitialiser?token=${encodeURIComponent(token)}&error=invalid`);
  }
}
