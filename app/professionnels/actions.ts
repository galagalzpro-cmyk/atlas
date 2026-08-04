"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/server/auth";
import { createOrganization, inviteOrganizationMember } from "../../lib/server/organizations";

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
  await inviteOrganizationMember({
    organizationId: String(formData.get("organizationId") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: role === "organization_admin" ? "organization_admin" : "professional",
    actorUserId: user.id,
  });
  revalidatePath("/professionnels");
}
