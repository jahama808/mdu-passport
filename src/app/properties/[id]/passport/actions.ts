"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  ingestEmlIntoProperty,
  parseAndExtractEml,
  type IngestResult,
} from "@/lib/passport-ingest";

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

export type EmlImportResult = IngestResult;

export async function importPassportEml(
  propertyId: string,
  input: { filename: string; raw: string },
): Promise<EmlImportResult> {
  await requireUser();

  const parsed = await parseAndExtractEml(input.raw);
  const result = await ingestEmlIntoProperty(propertyId, {
    filename: input.filename,
    parsed,
  });

  revalidatePath(`/properties/${propertyId}/passport`);
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath("/properties");
  revalidatePath("/");

  return result;
}
