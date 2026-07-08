"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PROPERTY_IMAGES_BUCKET } from "@/lib/data";
import { ALLOWED_IMAGE_TYPES } from "@/lib/images";

export async function uploadPropertyImage(propertyId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error("Only JPEG, PNG, or PDF files are allowed");
  }
  const note = String(formData.get("note") ?? "").trim();
  const db = createServiceClient();
  const path = `${propertyId}/${crypto.randomUUID()}${ext}`;
  const { error: uploadError } = await db.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);
  const { error } = await db.from("property_images").insert({
    user_id: WORKSPACE_OWNER_ID,
    property_id: propertyId,
    storage_path: path,
    filename: file.name,
    content_type: file.type,
    note: note === "" ? null : note,
  });
  if (error) {
    await db.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
    throw error;
  }
  revalidatePath(`/properties/${propertyId}`);
}

export async function updatePropertyImageNote(
  propertyId: string,
  imageId: string,
  note: string,
) {
  await requireAdmin();
  const db = createServiceClient();
  const trimmed = note.trim();
  const { error } = await db
    .from("property_images")
    .update({ note: trimmed === "" ? null : trimmed })
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyImage(propertyId: string, imageId: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error: fetchError } = await db
    .from("property_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!data) return;
  const { error } = await db
    .from("property_images")
    .delete()
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  await db.storage.from(PROPERTY_IMAGES_BUCKET).remove([data.storage_path]);
  revalidatePath(`/properties/${propertyId}`);
}
