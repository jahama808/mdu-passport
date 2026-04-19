"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { titleCase, islandAccentStyle } from "@/lib/format";
import PropertyCardBody from "@/components/property-card-body";
import type { Property } from "@/lib/types";

export default function DashboardPropertyGrid({ properties }: { properties: Property[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return properties;
    return properties.filter((p) => p.name.toLowerCase().includes(q));
  }, [properties, query]);

  return (
    <>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by property name…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {query ? `No properties match "${query}".` : "No properties yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card
                className="property-card h-full transition-colors"
                style={islandAccentStyle(p.island)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {titleCase(p.type)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <PropertyCardBody property={p} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
