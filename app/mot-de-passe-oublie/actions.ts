"use server";

import { redirect } from "next/navigation";
import { requestPasswordReset } from "../../lib/server/password-reset";

export async function requestResetAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  if (email) await requestPasswordReset(email);
  redirect("/mot-de-passe-oublie?sent=1");
}
