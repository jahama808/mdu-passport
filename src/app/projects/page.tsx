import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { listActiveProjects } from "@/lib/data";
import { isOverdue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ActiveProjectsGrid from "@/components/active-projects-grid";

export default async function ProjectsOverviewPage() {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const projects = await listActiveProjects();
  const overdueCount = projects.filter((p) =>
    isOverdue(p.due_date, p.status),
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} ongoing project{projects.length === 1 ? "" : "s"}
            {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""} · sorted by
            priority (P1 highest, P10 lowest) · completed projects live on each
            property page
          </p>
        </div>
        <Link href="/api/projects/export">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No ongoing projects. Create one from a property page.
          </CardContent>
        </Card>
      ) : (
        <ActiveProjectsGrid projects={projects} canWrite={role === "admin"} />
      )}
    </div>
  );
}
