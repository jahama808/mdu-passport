import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAgentToken } from "@/lib/agent-auth";
import { getPropertyByIdOrSlug, PROPERTY_IMAGES_BUCKET } from "@/lib/data";
import { ALLOWED_IMAGE_TYPES } from "@/lib/images";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import type { PropertyImage } from "@/lib/types";

/**
 * Register a file uploaded via a signed upload URL:
 * POST /api/agent/images/complete
 * body: { property, storage_path, filename?, note? }
 */
export async function POST(request: Request) {
  const agent = await verifyAgentToken(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: {
    property?: string;
    storage_path?: string;
    filename?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.property || !body.storage_path) {
    return NextResponse.json(
      { error: "Missing 'property' or 'storage_path'" },
      { status: 400 },
    );
  }
  const property = await getPropertyByIdOrSlug(body.property);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  if (!body.storage_path.startsWith(`${property.id}/`)) {
    return NextResponse.json(
      { error: "storage_path does not belong to this property" },
      { status: 400 },
    );
  }

  const db = createServiceClient();

  // Idempotent: if this path is already registered, return the existing record.
  const { data: existing } = await db
    .from("property_images")
    .select("*")
    .eq("storage_path", body.storage_path)
    .eq("user_id", WORKSPACE_OWNER_ID)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ image: existing as PropertyImage });
  }

  const { data: info, error: infoError } = await db.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .info(body.storage_path);
  if (infoError || !info) {
    return NextResponse.json(
      { error: "File not found in storage — PUT it to the signed upload URL first" },
      { status: 404 },
    );
  }
  const contentType = info.contentType ?? "application/octet-stream";
  if (!ALLOWED_IMAGE_TYPES[contentType]) {
    await db.storage.from(PROPERTY_IMAGES_BUCKET).remove([body.storage_path]);
    return NextResponse.json(
      { error: "Uploaded file must be JPEG, PNG, or PDF" },
      { status: 415 },
    );
  }

  const note = (body.note ?? "").trim();
  const { data, error } = await db
    .from("property_images")
    .insert({
      user_id: WORKSPACE_OWNER_ID,
      property_id: property.id,
      storage_path: body.storage_path,
      filename: body.filename?.trim() || body.storage_path.split("/").pop()!,
      content_type: contentType,
      note: note === "" ? null : note,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath(`/properties/${property.id}`);
  return NextResponse.json({ image: data as PropertyImage }, { status: 201 });
}
