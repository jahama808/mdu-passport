"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { emlToMarkdown } from "@/lib/eml";
import { extractPropertyFromMarkdown, type ExtractedProperty } from "@/lib/property-extract";
import type { Property } from "@/lib/types";

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

const MERGEABLE_FIELDS = [
  "address",
  "island",
  "gm_name",
  "gm_email",
  "notes",
] as const satisfies readonly (keyof Property)[];

export async function importPassportEml(
  propertyId: string,
  input: { filename: string; raw: string },
): Promise<EmlImportResult> {
  await requireUser();
  const db = createServiceClient();

  const { markdown, subject } = emlToMarkdown(input.raw);

  const now = new Date().toISOString();
  const { error: sessionError } = await db.from("property_scan_sessions").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    started_at: now,
    ended_at: now,
    status: "imported",
    passport_md: markdown,
    notes: `Imported ${input.filename}${subject ? ` — ${subject}` : ""}`,
  });
  if (sessionError) throw sessionError;

  const filledFields: string[] = [];
  const skippedFields: string[] = [];

  let extracted: ExtractedProperty = {};
  try {
    extracted = await extractPropertyFromMarkdown(markdown);
  } catch (err) {
    console.error("eml extraction failed", err);
  }

  if (Object.keys(extracted).length > 0) {
    const { data: current, error: getError } = await db
      .from("properties")
      .select("address,island,gm_name,gm_email,notes")
      .eq("id", propertyId)
      .eq("user_id", WORKSPACE_OWNER_ID)
      .single();
    if (getError) throw getError;

    const patch: Record<string, string> = {};
    for (const field of MERGEABLE_FIELDS) {
      const incoming = extracted[field];
      if (typeof incoming !== "string" || incoming.trim().length === 0) continue;
      if (current && (current as Record<string, unknown>)[field]) {
        skippedFields.push(field);
        continue;
      }
      patch[field] = incoming.trim();
      filledFields.push(field);
    }

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await db
        .from("properties")
        .update(patch)
        .eq("id", propertyId)
        .eq("user_id", WORKSPACE_OWNER_ID);
      if (updateError) throw updateError;
    }
  }

  revalidatePath(`/properties/${propertyId}/passport`);
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath("/properties");
  revalidatePath("/");

  return { filledFields, skippedFields };
}
