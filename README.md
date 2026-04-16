# MDU Passport

Property management + common area WiFi configurator for Hawaiian Telcom MDU / resort deployments.

Stack: Next.js 16 (App Router) · Supabase · Vercel · shadcn/ui.

## Local development

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, MDU_WORKSPACE_OWNER_ID
npm install
npm run dev
```

Open <http://localhost:3000>. Sign up with any email/password — Supabase Auth handles the session; all data reads filter by `MDU_WORKSPACE_OWNER_ID`.

## Features

- **Dashboard & property list** — status summary per property (completed / in progress / not started common areas).
- **Property CRUD** — name, slug, type, island, address, GM contact, notes.
- **Common Area Configurator** — per-property areas (pool, gym, lobby, hallway, courtyard, parking, office, other) with installation status, priority, date, and a dynamic equipment formset (add/remove rows).
- **Equipment catalog** — reusable equipment types (APs, switches, routers, ONTs, cable, mounts…) shared across properties.
- **Property Passport** — import walkthrough markdown and render alongside the sighting photo gallery.
- **Scan viewer** — read-only browser of `property_scans` grouped by location, with signed Supabase Storage URLs for photos.
- **Property notes** — timestamped notes timeline.
- **PDF export** — `/api/passport/export?propertyId=…` generates a downloadable passport PDF.

## Data

Uses the shared Supabase project `ynaexnssjefpayxnvdzi` (alongside the property-scan skill). Reads `properties`, `property_scan_sessions`, `property_scans` and owns `equipment_types`, `common_areas`, `common_area_equipment`, `property_notes`.

RLS is enabled on the MDU Passport tables; the Next.js server uses the service role key and filters by the workspace owner, and the proxy auth gate at `src/proxy.ts` redirects unauthenticated requests to `/login`.
