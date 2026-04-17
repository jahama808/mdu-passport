"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function updateScanNarration(
  propertyId: string,
  scanId: string,
  narration: string,
) {
  await requireUser();
  const db = createServiceClient();
  const trimmed = narration.trim();
  const { error } = await db
    .from("property_scans")
    .update({ narration: trimmed === "" ? null : trimmed })
    .eq("id", scanId)
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}/scans`);
  revalidatePath(`/properties/${propertyId}/passport`);
}
