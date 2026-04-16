import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listProperties, statusSummaryForProperties } from "@/lib/data";
import { titleCase } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PropertiesPage() {
  await requireUser();
  const properties = await listProperties();
  const summary = await statusSummaryForProperties(properties.map((p) => p.id));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <Link href="/properties/new">
          <Button className="btn-gradient">
            <Plus className="h-4 w-4 mr-2" /> New property
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => {
          const s = summary[p.id];
          return (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="h-full hover:border-foreground/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <Badge variant="outline">{titleCase(p.type)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="text-sm text-muted-foreground">
                    {p.island ? titleCase(p.island) : "—"}
                  </div>
                  {p.address ? (
                    <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {s.completed} completed · {s.in_progress} in progress · {s.total} total
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
