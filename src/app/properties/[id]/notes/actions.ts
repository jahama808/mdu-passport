"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function addNote(propertyId: string, content: string) {
  await requireAdmin();
  const db = createServiceClient();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Note cannot be empty");
  const { error } = await db.from("property_notes").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    content: trimmed,
  });
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}/notes`);
  revalidatePath(`/properties/${propertyId}`);
}

export async function deleteNote(propertyId: string, id: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("property_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}/notes`);
  revalidatePath(`/properties/${propertyId}`);
}
