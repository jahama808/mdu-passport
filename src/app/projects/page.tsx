import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { listActiveProjects } from "@/lib/data";
import {
  titleCase,
  formatDate,
  projectStatusColor,
  isOverdue,
  islandAccentStyle,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsOverviewPage() {
  const { user } = await getSessionContext();
  if (!user) redirect("/login");
  const projects = await listActiveProjects();
  const overdueCount = projects.filter((p) =>
    isOverdue(p.due_date, p.status),
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} ongoing project{projects.length === 1 ? "" : "s"}
          {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""} · completed
          projects live on each property page
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No ongoing projects. Create one from a property page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const overdue = isOverdue(p.due_date, p.status);
            return (
              <Link
                key={p.id}
                href={`/properties/${p.property_id}/projects/${p.id}`}
                className="block"
              >
                <Card
                  className="h-full hover:border-foreground/20 border-l-4"
                  style={{
                    ...islandAccentStyle(p.property?.island ?? null),
                    borderLeftColor: "var(--island-accent)",
                  }}
                >
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm leading-snug">
                        {p.title}
                      </span>
                      <span
                        className={`inline-flex shrink-0 text-xs px-2 py-0.5 rounded-full border ${projectStatusColor(
                          p.status,
                        )}`}
                      >
                        {titleCase(p.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {p.property?.name ?? "Unknown property"}
                      </Badge>
                      {p.property?.island ? (
                        <Badge variant="secondary" className="text-xs">
                          {titleCase(p.property.island)}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.due_date ? (
                        <span
                          className={
                            overdue
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : ""
                          }
                        >
                          Expected finish {formatDate(p.due_date)}
                          {overdue ? " · overdue" : ""}
                        </span>
                      ) : (
                        "No expected finish date"
                      )}
                    </div>
                    {p.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
