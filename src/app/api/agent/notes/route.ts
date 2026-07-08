import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAgentToken } from "@/lib/agent-auth";
import { getPropertyByIdOrSlug, listPropertyNotes } from "@/lib/data";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";

/** List a property's notes: GET /api/agent/notes?property=<id-or-slug> */
export async function GET(request: Request) {
  const agent = await verifyAgentToken(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const propertyParam = new URL(request.url).searchParams.get("property");
  if (!propertyParam) {
    return NextResponse.json(
      { error: "Missing ?property=<id-or-slug>" },
      { status: 400 },
    );
  }
  const property = await getPropertyByIdOrSlug(propertyParam);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  const notes = await listPropertyNotes(property.id);
  return NextResponse.json({
    property: { id: property.id, name: property.name, slug: property.slug },
    notes,
  });
}

/**
 * Add a note to a property: POST /api/agent/notes
 * body: { property, content }
 */
export async function POST(request: Request) {
  const agent = await verifyAgentToken(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { property?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const content = (body.content ?? "").trim();
  if (!body.property || content === "") {
    return NextResponse.json(
      { error: "Missing 'property' or 'content'" },
      { status: 400 },
    );
  }
  const property = await getPropertyByIdOrSlug(body.property);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  const db = createServiceClient();
  const { data, error } = await db
    .from("property_notes")
    .insert({
      user_id: WORKSPACE_OWNER_ID,
      property_id: property.id,
      content,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath(`/properties/${property.id}`);
  revalidatePath(`/properties/${property.id}/notes`);
  return NextResponse.json({ note: data }, { status: 201 });
}
