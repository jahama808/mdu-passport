"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function importPassport(
  propertyId: string,
  input: { filename: string; markdown: string },
) {
  await requireUser();
  const db = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await db.from("property_scan_sessions").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    started_at: now,
    ended_at: now,
    status: "imported",
    passport_md: input.markdown,
    notes: `Imported ${input.filename}`,
  });
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}/passport`);
  revalidatePath(`/properties/${propertyId}`);
}
