"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { emlToMarkdown } from "@/lib/eml";
import { extractPropertyDetails } from "@/lib/property-extract";
import type { PropertyDetails } from "@/lib/types";

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

export type EmlImportResult = {
  filledFields: string[];
  skippedFields: string[];
};

export async function importPassportEml(
  propertyId: string,
  input: { filename: string; raw: string },
): Promise<EmlImportResult> {
  await requireUser();
  const db = createServiceClient();

  const { markdown, subject } = emlToMarkdown(input.raw);

  const { error: docError } = await db.from("property_documents").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    kind: "sales_notification",
    filename: input.filename,
    subject,
    content_md: markdown,
  });
  if (docError) throw docError;

  const extracted = await extractPropertyDetails(markdown);
  const { primary_address, island, ...detailInputs } = extracted;

  const filledFields: string[] = [];
  const skippedFields: string[] = [];

  const { data: current, error: getError } = await db
    .from("properties")
    .select("address, island, details")
    .eq("id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .single();
  if (getError) throw getError;

  const existing: PropertyDetails = (current?.details as PropertyDetails | null) ?? {};
  const mergedDetails: PropertyDetails = { ...existing };

  for (const [key, value] of Object.entries(detailInputs)) {
    if (typeof value !== "string" || value.trim().length === 0) continue;
    if ((existing as Record<string, unknown>)[key]) {
      skippedFields.push(key);
      continue;
    }
    (mergedDetails as Record<string, string>)[key] = value.trim();
    filledFields.push(key);
  }

  const rootPatch: Record<string, string> = {};
  if (primary_address && primary_address.trim().length > 0) {
    if (current?.address) {
      skippedFields.push("address");
    } else {
      rootPatch.address = primary_address.trim();
      filledFields.push("address");
    }
  }
  if (island) {
    if (current?.island) {
      skippedFields.push("island");
    } else {
      rootPatch.island = island;
      filledFields.push("island");
    }
  }

  const updatePayload: Record<string, unknown> = {};
  if (filledFields.some((f) => f !== "address" && f !== "island")) {
    updatePayload.details = mergedDetails;
  }
  Object.assign(updatePayload, rootPatch);

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await db
      .from("properties")
      .update(updatePayload)
      .eq("id", propertyId)
      .eq("user_id", WORKSPACE_OWNER_ID);
    if (updateError) throw updateError;
  }

  revalidatePath(`/properties/${propertyId}/passport`);
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath("/properties");
  revalidatePath("/");

  return { filledFields, skippedFields };
}
