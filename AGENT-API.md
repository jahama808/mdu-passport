# Agent API

Machine-to-machine interface for agents (e.g. Hermes) to upload property
images and notes. All endpoints live under `/api/agent` and are
authenticated with a bearer token checked against the `api_tokens` table
(`active = true`). Tokens are managed directly in Supabase; there is no
self-serve signup.

```
Authorization: Bearer <token>
```

Unauthorized requests get `401 {"error": "Unauthorized"}`. Properties may
be referenced by UUID or slug everywhere a `property` parameter appears.

## List properties

```
GET /api/agent/properties
```

```bash
curl -H "Authorization: Bearer $TOKEN" https://<host>/api/agent/properties
```

Returns `{ properties: [{ id, name, slug, type, island, address }] }`.
Use this to resolve a property name to its id/slug before uploading.

## Upload an image (small files, < 4 MB)

Allowed types: JPEG, PNG, PDF. On Vercel the request body is capped around
4.5 MB — use the signed-URL flow below for anything bigger.

```
POST /api/agent/images            (multipart/form-data)
  file      the image or PDF (required)
  property  property id or slug (required)
  note      caption shown next to the image (optional)
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg;type=image/jpeg" \
  -F "property=kaanapali-plantation" \
  -F "note=Demarc closet, building B" \
  https://<host>/api/agent/images
```

Returns `201 { image: { id, property_id, filename, content_type, note, storage_path, created_at } }`.

## Upload an image (large files)

Step 1 — request a signed upload URL:

```
POST /api/agent/images            (application/json)
  { "property": "<id-or-slug>", "filename": "photo.jpg",
    "content_type": "image/jpeg", "note": "..." }
```

Returns `201 { storage_path, upload: { method: "PUT", url, headers } }`.

Step 2 — PUT the file bytes straight to Supabase storage (no size limit
from the app):

```bash
curl -X PUT -H "Content-Type: image/jpeg" --data-binary @photo.jpg "<upload.url>"
```

Step 3 — register the upload:

```
POST /api/agent/images/complete   (application/json)
  { "property": "<id-or-slug>", "storage_path": "<from step 1>",
    "filename": "photo.jpg", "note": "..." }
```

Returns `201 { image: {...} }`. Idempotent — re-posting the same
`storage_path` returns the existing record.

## List a property's images

```
GET /api/agent/images?property=<id-or-slug>
```

Returns the property's images newest-first, each with a signed `url`
(valid 1 hour) for viewing.

## Property notes

```
GET  /api/agent/notes?property=<id-or-slug>
POST /api/agent/notes             (application/json)
  { "property": "<id-or-slug>", "content": "..." }
```

```bash
curl -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"property": "kaanapali-plantation", "content": "GM asked about pool AP."}' \
  https://<host>/api/agent/notes
```

Images uploaded here appear in the Images card on the property page;
notes appear in the Notes card.
