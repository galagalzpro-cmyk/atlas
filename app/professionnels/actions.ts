"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/server/auth";
import { createOrganization, inviteOrganizationMember } from "../../lib/server/organizations";
import { sendTransactionalEmail } from "../../lib/server/mail";

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const user = await requireRole(["organization_admin", "atlas_admin"]);
  await createOrganization({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    actorUserId: user.id,
  });
  revalidatePath("/professionnels");
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const user = await requireRole(["organization_admin", "atlas_admin"]);
  const role = String(formData.get("role") ?? "professional");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = await inviteOrganizationMember({
    organizationId: String(formData.get("organizationId") ?? ""),
    email,
    role: role === "organization_admin" ? "organization_admin" : "professional",
    actorUserId: user.id,
  });
  const baseUrl = process.env.ATLAS_APP_URL;
  if (baseUrl?.startsWith("https://")) {
    await sendTransactionalEmail({
      to: email,
      subject: "Invitation à rejoindre une organisation ATLAS",
      html: `<p>Vous avez été invité à rejoindre un espace professionnel ATLAS.</p><p><a href="${baseUrl}/invitation?token=${encodeURIComponent(token)}">Créer votre accès sécurisé</a></p><p>Cette invitation expire dans 7 jours et ne peut être utilisée qu’une seule fois.</p>`,
    });
  }
  revalidatePath("/professionnels");
}
