import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import {
  getProperty,
  listScanSessions,
  listScansForProperty,
  signedPhotoUrls,
} from "@/lib/data";
import { titleCase, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditableNarration from "@/components/editable-narration";

export default async function ScansPage({
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
  const [sessions, scans] = await Promise.all([
    listScanSessions(id),
    listScansForProperty(id),
  ]);
  const allPhotos = scans.flatMap((s) => s.photo_urls ?? []);
  const signed = await signedPhotoUrls(allPhotos);

  const byLocation = new Map<string, typeof scans>();
  for (const s of scans) {
    const key = s.location ?? "Unlabeled";
    const arr = byLocation.get(key) ?? [];
    arr.push(s);
    byLocation.set(key, arr);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Walkthrough scans</h1>
        <p className="text-sm text-muted-foreground">{property.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="border rounded-md px-3 py-2 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{formatDateTime(s.started_at)}</div>
                  {s.notes ? (
                    <div className="text-xs text-muted-foreground">{s.notes}</div>
                  ) : null}
                </div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {scans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sightings captured yet. Use the property-scan skill to record a walkthrough.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...byLocation.entries()].map(([loc, items]) => (
            <Card key={loc}>
              <CardHeader>
                <CardTitle className="text-base">{loc}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <div key={s.id} className="border rounded-md overflow-hidden">
                      {s.photo_urls && s.photo_urls.length > 0 ? (
                        <div
                          className={
                            s.photo_urls.length > 1
                              ? "grid grid-cols-2 gap-0.5 bg-muted"
                              : ""
                          }
                        >
                          {s.photo_urls.map((p) => (
                            <div
                              key={p}
                              className="aspect-[3/4] bg-muted relative overflow-hidden"
                            >
                              <Image
                                src={signed[p] ?? p}
                                alt={s.device_type ?? "sighting"}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="aspect-[3/4] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No photo
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          {s.device_type ? (
                            <Badge variant="outline">{titleCase(s.device_type)}</Badge>
                          ) : null}
                          {s.device_model ? (
                            <span className="text-sm font-medium truncate">
                              {s.device_model}
                            </span>
                          ) : null}
                        </div>
                        {s.label_sn ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground">SN:</span> {s.label_sn}
                          </div>
                        ) : null}
                        {s.label_mac ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground">MAC:</span>{" "}
                            {s.label_mac}
                          </div>
                        ) : null}
                        <EditableNarration
                          propertyId={id}
                          scanId={s.id}
                          initial={s.narration}
                          canWrite={canWrite}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
