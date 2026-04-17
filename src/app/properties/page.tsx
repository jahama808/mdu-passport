import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { listProperties } from "@/lib/data";
import { titleCase } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PropertyCardBody from "@/components/property-card-body";
import PropertyImportEml from "@/components/property-import-eml";

export default async function PropertiesPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const properties = await listProperties();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Properties</h1>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <PropertyImportEml />
            <Link href="/properties/new">
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" /> New property
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <Card className="h-full hover:border-foreground/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{p.name}</span>
                  <Badge variant="outline">{titleCase(p.type)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <PropertyCardBody property={p} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
