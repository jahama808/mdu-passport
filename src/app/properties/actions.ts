"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

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
  await requireUser();
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

export async function deleteProperty(id: string) {
  await requireUser();
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
