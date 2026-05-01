"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type EquipmentInput = {
  id?: string;
  name: string;
  item_id?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
};

export async function upsertEquipmentType(input: EquipmentInput) {
  await requireAdmin();
  const db = createServiceClient();
  const payload = {
    user_id: WORKSPACE_OWNER_ID,
    name: input.name.trim(),
    item_id: input.item_id?.trim() || null,
    category: input.category?.trim() || null,
    manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null,
    description: input.description?.trim() || null,
  };
  if (input.id) {
    const { error } = await db
      .from("equipment_types")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", WORKSPACE_OWNER_ID);
    if (error) throw error;
  } else {
    const { error } = await db.from("equipment_types").insert(payload);
    if (error) throw error;
  }
  revalidatePath("/equipment");
}

export async function deleteEquipmentType(id: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("equipment_types")
    .delete()
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath("/equipment");
}
