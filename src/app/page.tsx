import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { listProperties, statusSummaryForProperties } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardPropertyGrid from "@/components/dashboard-property-grid";
import { StatCard } from "@/components/stat-card";

export default async function DashboardPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const properties = await listProperties();
  const summaries = await statusSummaryForProperties(
    properties.map((p) => p.id),
  );

  const totals = Object.values(summaries).reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      completed: acc.completed + s.completed,
      in_progress: acc.in_progress + s.in_progress,
      not_started: acc.not_started + s.not_started,
    }),
    { total: 0, completed: 0, in_progress: 0, not_started: 0 },
  );
  const units = properties.reduce(
    (n, p) => n + parseInt(p.details?.billable_units || "0", 10),
    0,
  );
  const active = Object.values(summaries).filter(
    (s) => s.in_progress > 0 || s.not_started > 0,
  ).length;
  const pctDone = totals.total
    ? Math.round((totals.completed / totals.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wide text-[color:var(--brand-blue)] mb-1">
            Workspace · Hawaiian Telcom MDU
          </div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length} properties · {totals.total} common areas ·{" "}
            <span className="font-mono font-semibold text-[color:var(--brand-blue)]">
              {units.toLocaleString()} billable units
            </span>
          </p>
        </div>
        {canWrite ? (
          <Link href="/properties/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" /> New property
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Properties"
          value={properties.length}
          delta={`${active} active deployments`}
        />
        <StatCard
          label="Common areas"
          value={totals.total}
          delta={`${pctDone}% completed`}
        />
        <StatCard
          label="Billable units"
          value={units.toLocaleString()}
          delta="across six islands"
        />
        <StatCard
          label="Completed areas"
          value={totals.completed}
          delta={`${totals.not_started} queued`}
        />
      </div>

      <DashboardPropertyGrid properties={properties} summaries={summaries} />
    </div>
  );
}
