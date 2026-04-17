import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { getProperty, listPropertyNotes } from "@/lib/data";
import NotesTimeline from "@/components/notes-timeline";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await getSessionContext();
  if (!user) redirect("/login");
  const canWrite = role === "admin";
  const { id } = await params;
  const [property, notes] = await Promise.all([
    getProperty(id),
    listPropertyNotes(id),
  ]);
  if (!property) notFound();
  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-sm text-muted-foreground">{property.name}</p>
      </div>
      <NotesTimeline propertyId={id} notes={notes} canWrite={canWrite} />
    </div>
  );
}
