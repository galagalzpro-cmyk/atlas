"use server";

import { redirect } from "next/navigation";
import { createSession } from "../../lib/server/auth";
import { registerFromInvitation } from "../../lib/server/invitations";

export async function acceptInvitationAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!token || password !== confirmation) redirect(`/invitation?token=${encodeURIComponent(token)}&error=mismatch`);
  try {
    const registration = await registerFromInvitation({ token, displayName, password });
    await createSession(registration.userId);
    redirect("/professionnels?invitation=accepted");
  } catch {
    redirect(`/invitation?token=${encodeURIComponent(token)}&error=invalid`);
  }
}
