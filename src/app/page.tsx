import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listProperties, statusSummaryForProperties } from "@/lib/data";
import { titleCase } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, Clock, Circle, Plus } from "lucide-react";

export default async function DashboardPage() {
  await requireUser();
  const properties = await listProperties();
  const summary = await statusSummaryForProperties(properties.map((p) => p.id));

  const totals = Object.values(summary).reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      completed: acc.completed + s.completed,
      in_progress: acc.in_progress + s.in_progress,
      not_started: acc.not_started + s.not_started,
    }),
    { total: 0, completed: 0, in_progress: 0, not_started: 0 },
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} properties · {totals.total} common areas
          </p>
        </div>
        <Link href="/properties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New property
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Properties" value={properties.length} />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Completed areas"
          value={totals.completed}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          label="In progress"
          value={totals.in_progress}
        />
        <StatCard
          icon={<Circle className="h-5 w-5 text-slate-500" />}
          label="Not started"
          value={totals.not_started}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Properties</h2>
        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No properties yet.{" "}
              <Link href="/properties/new" className="underline">
                Create your first
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const s = summary[p.id];
              return (
                <Link key={p.id} href={`/properties/${p.id}`}>
                  <Card className="hover:border-foreground/20 transition-colors h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="truncate">{p.name}</span>
                        <Badge variant="outline" className="shrink-0 ml-2">
                          {titleCase(p.type)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {p.island ? titleCase(p.island) : "—"}
                        {p.address ? ` · ${p.address}` : ""}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {s.completed}
                        </span>
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" /> {s.in_progress}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Circle className="h-3.5 w-3.5" /> {s.not_started}
                        </span>
                        <span className="ml-auto text-muted-foreground">{s.total} total</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="p-2 rounded-md bg-muted">{icon}</div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
