import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import type {
  CommonArea,
  CommonAreaEquipment,
  EquipmentType,
  Property,
  PropertyDocument,
  PropertyNote,
  PropertyScan,
  PropertyScanSession,
} from "@/lib/types";

export async function listProperties(): Promise<Property[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("properties")
    .select("*")
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function getProperty(id: string): Promise<Property | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .maybeSingle();
  if (error) throw error;
  return (data as Property) ?? null;
}

export async function listCommonAreas(propertyId: string): Promise<CommonArea[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("common_areas")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("area_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CommonArea[];
}

export async function getCommonArea(id: string): Promise<CommonArea | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("common_areas")
    .select("*")
    .eq("id", id)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .maybeSingle();
  if (error) throw error;
  return (data as CommonArea) ?? null;
}

export async function listCommonAreaEquipment(
  commonAreaId: string,
): Promise<CommonAreaEquipment[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("common_area_equipment")
    .select("*")
    .eq("common_area_id", commonAreaId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as CommonAreaEquipment[];
}

export async function listEquipmentTypes(): Promise<EquipmentType[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("equipment_types")
    .select("*")
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("name");
  if (error) throw error;
  return (data ?? []) as EquipmentType[];
}

export async function listPropertyNotes(propertyId: string): Promise<PropertyNote[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("property_notes")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyNote[];
}

export async function listScanSessions(
  propertyId: string,
): Promise<PropertyScanSession[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("property_scan_sessions")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyScanSession[];
}

export async function listPropertyDocuments(
  propertyId: string,
): Promise<PropertyDocument[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("property_documents")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyDocument[];
}

export async function listScansForProperty(
  propertyId: string,
): Promise<PropertyScan[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("property_scans")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .order("captured_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PropertyScan[];
}

export type PropertyStatusSummary = {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
};

export async function statusSummaryForProperties(
  propertyIds: string[],
): Promise<Record<string, PropertyStatusSummary>> {
  const out: Record<string, PropertyStatusSummary> = {};
  for (const id of propertyIds) {
    out[id] = { total: 0, completed: 0, in_progress: 0, not_started: 0 };
  }
  if (propertyIds.length === 0) return out;
  const db = createServiceClient();
  const { data, error } = await db
    .from("common_areas")
    .select("property_id, installation_status")
    .in("property_id", propertyIds)
    .eq("user_id", WORKSPACE_OWNER_ID);
  if (error) throw error;
  for (const row of data ?? []) {
    const summary = out[row.property_id as string];
    if (!summary) continue;
    summary.total += 1;
    const status = row.installation_status as keyof PropertyStatusSummary;
    if (status === "completed" || status === "in_progress" || status === "not_started") {
      summary[status] += 1;
    }
  }
  return out;
}

export async function signedPhotoUrls(
  paths: string[],
  bucket = process.env.SUPABASE_SCAN_BUCKET ?? "property-scans",
  expiresIn = 60 * 60,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (paths.length === 0) return out;
  const db = createServiceClient();
  const unique = Array.from(new Set(paths));
  for (const p of unique) {
    const key = p.startsWith("http") ? null : p;
    if (!key) {
      out[p] = p;
      continue;
    }
    const { data } = await db.storage.from(bucket).createSignedUrl(key, expiresIn);
    if (data?.signedUrl) out[p] = data.signedUrl;
  }
  return out;
}
