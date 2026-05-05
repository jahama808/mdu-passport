import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import {
  getProperty,
  listCommonAreas,
  listPropertyNotes,
  listScanSessions,
} from "@/lib/data";
import {
  titleCase,
  formatDate,
  statusColor,
  islandAccentStyle,
  formatPhone,
} from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PropertyCardBody from "@/components/property-card-body";
import {
  Pencil,
  Plus,
  Camera,
  FileText,
  StickyNote,
  Download,
  MapPin,
  ExternalLink,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const [areas, notes, sessions] = await Promise.all([
    listCommonAreas(id),
    listPropertyNotes(id),
    listScanSessions(id),
  ]);

  return (
    <div
      className="p-6 space-y-6 property-detail-shell"
      style={islandAccentStyle(property.island)}
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{property.name}</h1>
            <Badge variant="outline">{titleCase(property.type)}</Badge>
            {property.island ? (
              <Badge variant="secondary">{titleCase(property.island)}</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {property.address ?? "No address"}
          </p>
          {property.gm_name || property.gm_email ? (
            <p className="text-sm text-muted-foreground">
              GM: {property.gm_name ?? "—"}
              {property.gm_email ? ` · ${property.gm_email}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Link href={`/properties/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            </Link>
          ) : null}
          <Link href={`/api/passport/export?propertyId=${id}`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <PropertyCardBody property={property} />
          </CardContent>
        </Card>
      </div>

      {property.address || property.details?.website ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location
            </CardTitle>
            {property.details?.website ? (
              <a
                href={normalizeUrl(property.details.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm inline-flex items-center gap-1 underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                {displayHost(property.details.website)}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {property.address ? (
              <>
                <div className="text-sm text-muted-foreground">{property.address}</div>
                <div className="aspect-video w-full overflow-hidden rounded-md border">
                  <iframe
                    title={`Map of ${property.name}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Open in Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No address on file — add one to show a map.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Common areas</CardTitle>
            <div className="flex items-center gap-2">
              <Link
                href={`/api/passport/common-areas-excel?propertyId=${id}`}
              >
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel report
                </Button>
              </Link>
              {canWrite ? (
                <>
                  <Link href={`/properties/${id}/common-areas/upload`}>
                    <Button size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-1" /> Upload CSV
                    </Button>
                  </Link>
                  <Link href={`/properties/${id}/common-areas/new`}>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {areas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No common areas yet.</p>
            ) : (
              areas.map((a) => (
                <Link
                  key={a.id}
                  href={`/properties/${id}/common-areas/${a.id}`}
                  className="block border rounded-md px-3 py-2 hover:border-foreground/20 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{a.area_name}</span>
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${statusColor(
                        a.installation_status,
                      )}`}
                    >
                      {titleCase(a.installation_status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {titleCase(a.area_type)}
                    {a.installation_date ? ` · ${formatDate(a.installation_date)}` : ""}
                  </div>
                  {a.sublocation || a.btn ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.sublocation ? `Sublocation: ${a.sublocation}` : ""}
                      {a.sublocation && a.btn ? " · " : ""}
                      {a.btn ? `BTN: ${formatPhone(a.btn)}` : ""}
                    </div>
                  ) : null}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" /> Scan sessions
            </CardTitle>
            <Link href={`/properties/${id}/scans`}>
              <Button size="sm" variant="outline">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No walkthrough sessions yet.
              </p>
            ) : (
              sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(s.started_at)}</span>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                  {s.notes ? (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {s.notes}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Passport
            </CardTitle>
            <Link href={`/properties/${id}/passport`}>
              <Button size="sm" variant="outline">
                Open
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sessions.some((s) => s.passport_md) ? (
              <p className="text-sm text-muted-foreground">
                Passport document available.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Import a markdown passport or capture sightings.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Notes
            </CardTitle>
            <Link href={`/properties/${id}/notes`}>
              <Button size="sm" variant="outline">
                All ({notes.length})
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              notes.slice(0, 3).map((n) => (
                <div key={n.id} className="text-sm border-l-2 pl-3 py-1">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(n.created_at)}
                  </div>
                  <div className="whitespace-pre-wrap line-clamp-3">{n.content}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {property.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{property.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function displayHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

