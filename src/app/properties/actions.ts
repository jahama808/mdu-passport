"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import {
  ingestEmlIntoProperty,
  parseAndExtractEml,
  type IngestResult,
} from "@/lib/passport-ingest";

export type PropertyInput = {
  id?: string;
  name: string;
  slug?: string;
  type: string;
  address?: string;
  island?: string;
  gm_name?: string;
  gm_email?: string;
  notes?: string;
};

export async function upsertProperty(input: PropertyInput) {
  await requireAdmin();
  const db = createServiceClient();
  const slug =
    input.slug && input.slug.trim().length > 0
      ? slugify(input.slug, { lower: true, strict: true })
      : slugify(input.name, { lower: true, strict: true });
  const payload = {
    user_id: WORKSPACE_OWNER_ID,
    name: input.name.trim(),
    slug,
    type: input.type,
    address: input.address?.trim() || null,
    island: input.island || null,
    gm_name: input.gm_name?.trim() || null,
    gm_email: input.gm_email?.trim() || null,
    notes: input.notes?.trim() || null,
  };
  if (input.id) {
    const { error } = await db.from("properties").update(payload).eq("id", input.id);
    if (error) throw error;
    revalidatePath(`/properties/${input.id}`);
    revalidatePath("/properties");
    revalidatePath("/");
    return { id: input.id };
  }
  const { data, error } = await db
    .from("properties")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/properties");
  revalidatePath("/");
  return { id: data.id as string };
}

export type EmlRouteResult = IngestResult & {
  propertyId: string;
  propertyName: string;
  matched: boolean;
};

export async function importEmlAndRouteToProperty(input: {
  filename: string;
  raw: string;
}): Promise<EmlRouteResult> {
  await requireAdmin();
  const db = createServiceClient();

  const parsed = await parseAndExtractEml(input.raw);
  const customer = parsed.extracted.customer?.trim();
  const primaryAddress = parsed.extracted.primary_address?.trim();

  const { data: candidates, error: listError } = await db
    .from("properties")
    .select("id,name,address")
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (listError) throw listError;

  const nameLower = customer?.toLowerCase();
  const addressLower = primaryAddress?.toLowerCase();

  let match =
    nameLower
      ? candidates?.find((p) => p.name?.toLowerCase().trim() === nameLower)
      : undefined;
  if (!match && addressLower) {
    match = candidates?.find((p) => {
      const a = p.address?.toLowerCase().trim();
      if (!a) return false;
      return a === addressLower || a.includes(addressLower) || addressLower.includes(a);
    });
  }

  let propertyId: string;
  let propertyName: string;
  let matched = false;

  if (match) {
    propertyId = match.id as string;
    propertyName = match.name as string;
    matched = true;
  } else {
    const fallbackName =
      customer && customer.length > 0
        ? customer
        : input.filename.replace(/\.eml$/i, "").trim() || "Untitled property";
    const slug = slugify(fallbackName, { lower: true, strict: true });
    const { data: inserted, error: insertError } = await db
      .from("properties")
      .insert({
        user_id: WORKSPACE_OWNER_ID,
        name: fallbackName,
        slug,
        type: "mdu",
      })
      .select("id,name")
      .single();
    if (insertError) throw insertError;
    propertyId = inserted.id as string;
    propertyName = inserted.name as string;
  }

  const result = await ingestEmlIntoProperty(propertyId, {
    filename: input.filename,
    parsed,
  });

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/passport`);
  revalidatePath(`/properties/${propertyId}/edit`);

  return { ...result, propertyId, propertyName, matched };
}

export async function deleteProperty(id: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath("/properties");
  revalidatePath("/");
  redirect("/properties");
}
