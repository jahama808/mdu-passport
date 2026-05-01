"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type EquipmentRow = {
  id?: string;
  equipment_type_id: string;
  quantity: number;
  notes?: string | null;
};

export type CommonAreaInput = {
  id?: string;
  property_id: string;
  area_type: string;
  area_name: string;
  description?: string | null;
  notes?: string | null;
  installation_status: string;
  installation_date?: string | null;
  sublocation?: string | null;
  btn?: string | null;
  equipment: EquipmentRow[];
};

export async function saveCommonArea(input: CommonAreaInput) {
  await requireAdmin();
  const db = createServiceClient();
  const btnDigits = (input.btn ?? "").replace(/\D/g, "");
  if (btnDigits && btnDigits.length !== 10) {
    throw new Error("BTN must be exactly 10 digits");
  }
  const areaPayload = {
    user_id: WORKSPACE_OWNER_ID,
    property_id: input.property_id,
    area_type: input.area_type,
    area_name: input.area_name.trim(),
    description: input.description?.trim() || null,
    notes: input.notes?.trim() || null,
    installation_status: input.installation_status,
    installation_date: input.installation_date || null,
    sublocation: input.sublocation?.trim() || null,
    btn: btnDigits || null,
  };

  let areaId = input.id;
  if (areaId) {
    const { error } = await db
      .from("common_areas")
      .update(areaPayload)
      .eq("id", areaId)
      .eq("user_id", WORKSPACE_OWNER_ID);
    if (error) throw error;
  } else {
    const { data, error } = await db
      .from("common_areas")
      .insert(areaPayload)
      .select("id")
      .single();
    if (error) throw error;
    areaId = data.id as string;
  }

  const { data: existing, error: readErr } = await db
    .from("common_area_equipment")
    .select("id")
    .eq("common_area_id", areaId)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (readErr) throw readErr;
  const existingIds = new Set((existing ?? []).map((r) => r.id as string));
  const sentIds = new Set(input.equipment.filter((e) => e.id).map((e) => e.id!));
  const toDelete = [...existingIds].filter((id) => !sentIds.has(id));
  if (toDelete.length > 0) {
    const { error: delErr } = await db
      .from("common_area_equipment")
      .delete()
      .in("id", toDelete);
    if (delErr) throw delErr;
  }

  for (const row of input.equipment) {
    if (!row.equipment_type_id) continue;
    if (row.id) {
      const { error: upErr } = await db
        .from("common_area_equipment")
        .update({
          equipment_type_id: row.equipment_type_id,
          quantity: row.quantity,
          notes: row.notes?.toString().trim() || null,
        })
        .eq("id", row.id)
        .eq("user_id", WORKSPACE_OWNER_ID);
      if (upErr) throw upErr;
    } else {
      const { error: insErr } = await db.from("common_area_equipment").insert({
        user_id: WORKSPACE_OWNER_ID,
        common_area_id: areaId,
        equipment_type_id: row.equipment_type_id,
        quantity: row.quantity,
        notes: row.notes?.toString().trim() || null,
      });
      if (insErr) throw insErr;
    }
  }

  revalidatePath(`/properties/${input.property_id}`);
  revalidatePath(`/properties/${input.property_id}/common-areas/${areaId}`);
  return { id: areaId! };
}

export async function deleteCommonArea(propertyId: string, id: string) {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db
    .from("common_areas")
    .delete()
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}
