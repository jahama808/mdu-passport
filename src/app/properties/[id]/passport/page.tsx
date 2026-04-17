import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireUser } from "@/lib/auth";
import {
  getProperty,
  listScanSessions,
  listScansForProperty,
  signedPhotoUrls,
} from "@/lib/data";
import { titleCase, formatDateTime } from "@/lib/format";
import type { PropertyDetails } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Upload } from "lucide-react";
import PassportImport from "@/components/passport-import";
import PassportImportEml from "@/components/passport-import-eml";

export default async function PassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const [sessions, scans] = await Promise.all([
    listScanSessions(id),
    listScansForProperty(id),
  ]);
  const latestPassport = sessions.find((s) => s.passport_md)?.passport_md ?? null;
  const photos = scans.flatMap((s) => s.photo_urls ?? []);
  const signed = await signedPhotoUrls(photos);
  const details = property.details ?? null;
  const detailEntries = details
    ? (Object.entries(details).filter(
        ([, v]) => typeof v === "string" && v.trim().length > 0,
      ) as [keyof PropertyDetails, string][])
    : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Property Passport</h1>
          <p className="text-sm text-muted-foreground">{property.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PassportImportEml propertyId={id}>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" /> Import .eml
            </Button>
          </PassportImportEml>
          <PassportImport propertyId={id}>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import markdown
            </Button>
          </PassportImport>
        </div>
      </div>

      {detailEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {detailEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {titleCase(key)}
                  </dt>
                  <dd className="whitespace-pre-wrap">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {latestPassport ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{latestPassport}</ReactMarkdown>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No passport document yet. Import a markdown file to get started.
          </CardContent>
        </Card>
      )}

      {scans.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sighting photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {scans
                .filter((s) => s.photo_urls && s.photo_urls.length > 0)
                .map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="relative aspect-square rounded overflow-hidden bg-muted">
                      <Image
                        src={signed[s.photo_urls![0]] ?? s.photo_urls![0]}
                        alt={s.device_type ?? "sighting"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {s.device_type ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {titleCase(s.device_type)}
                        </Badge>
                      ) : null}
                      <span className="truncate text-muted-foreground">
                        {s.location ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {sessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="text-sm border-l-2 pl-3 py-1">
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(s.started_at)}
                </div>
                {s.notes ? <div className="whitespace-pre-wrap">{s.notes}</div> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
