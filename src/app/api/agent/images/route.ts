import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAgentToken } from "@/lib/agent-auth";
import {
  getPropertyByIdOrSlug,
  listPropertyImages,
  signedPhotoUrls,
  PROPERTY_IMAGES_BUCKET,
} from "@/lib/data";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/images";
import { createServiceClient, WORKSPACE_OWNER_ID } from "@/lib/supabase/server";
import type { PropertyImage } from "@/lib/types";

function imageJson(img: PropertyImage, url?: string | null) {
  return {
    id: img.id,
    property_id: img.property_id,
    filename: img.filename,
    content_type: img.content_type,
    note: img.note,
    storage_path: img.storage_path,
    created_at: img.created_at,
    ...(url !== undefined ? { url } : {}),
  };
}

/** List a property's images: GET /api/agent/images?property=<id-or-slug> */
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
  const images = await listPropertyImages(property.id);
  const signed = await signedPhotoUrls(
    images.map((img) => img.storage_path),
    PROPERTY_IMAGES_BUCKET,
  );
  return NextResponse.json({
    property: { id: property.id, name: property.name, slug: property.slug },
    images: images.map((img) =>
      imageJson(img, signed[img.storage_path] ?? null),
    ),
  });
}

/**
 * Upload an image: POST /api/agent/images
 *
 * multipart/form-data — direct upload for small files (<4 MB on Vercel):
 *   fields: file, property (id or slug), note (optional)
 *
 * application/json — request a signed upload URL for large files:
 *   body: { property, filename, content_type, note? }
 *   PUT the file bytes to the returned upload.url, then call
 *   POST /api/agent/images/complete to register it.
 */
export async function POST(request: Request) {
  const agent = await verifyAgentToken(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return beginSignedUpload(request);
  }
  if (contentType.includes("multipart/form-data")) {
    return directUpload(request);
  }
  return NextResponse.json(
    { error: "Send multipart/form-data (direct upload) or application/json (signed upload URL)" },
    { status: 415 },
  );
}

async function directUpload(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 },
    );
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or PDF files are allowed" },
      { status: 415 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 15 MB); use the signed upload URL flow" },
      { status: 413 },
    );
  }
  const propertyParam = String(form.get("property") ?? "");
  if (!propertyParam) {
    return NextResponse.json(
      { error: "Missing 'property' field (id or slug)" },
      { status: 400 },
    );
  }
  const property = await getPropertyByIdOrSlug(propertyParam);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  const note = String(form.get("note") ?? "").trim();

  const db = createServiceClient();
  const path = `${property.id}/${crypto.randomUUID()}${ext}`;
  const { error: uploadError } = await db.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 502 });
  }
  const { data, error } = await db
    .from("property_images")
    .insert({
      user_id: WORKSPACE_OWNER_ID,
      property_id: property.id,
      storage_path: path,
      filename: file.name,
      content_type: file.type,
      note: note === "" ? null : note,
    })
    .select()
    .single();
  if (error) {
    await db.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath(`/properties/${property.id}`);
  return NextResponse.json({ image: imageJson(data as PropertyImage) }, { status: 201 });
}

async function beginSignedUpload(request: Request) {
  let body: {
    property?: string;
    filename?: string;
    content_type?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const ext = ALLOWED_IMAGE_TYPES[body.content_type ?? ""];
  if (!ext) {
    return NextResponse.json(
      { error: "content_type must be image/jpeg, image/png, or application/pdf" },
      { status: 415 },
    );
  }
  if (!body.property) {
    return NextResponse.json(
      { error: "Missing 'property' (id or slug)" },
      { status: 400 },
    );
  }
  const property = await getPropertyByIdOrSlug(body.property);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  const db = createServiceClient();
  const path = `${property.id}/${crypto.randomUUID()}${ext}`;
  const { data, error } = await db.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return NextResponse.json(
    {
      storage_path: path,
      upload: {
        method: "PUT",
        url: data.signedUrl,
        headers: { "Content-Type": body.content_type },
      },
      next: "PUT the file bytes to upload.url, then POST /api/agent/images/complete with { property, storage_path, filename, note }",
    },
    { status: 201 },
  );
}
