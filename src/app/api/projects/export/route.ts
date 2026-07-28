import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import { listActiveProjects, latestNotesForProjects } from "@/lib/data";
import { summarizeRecentUpdates } from "@/lib/project-summary";
import { titleCase, formatDate, isOverdue } from "@/lib/format";

export async function GET() {
  await requireUser();

  const projects = await listActiveProjects();
  const latestNotes = await latestNotesForProjects(projects.map((p) => p.id));
  const summaries = await summarizeRecentUpdates(
    projects
      .filter((p) => latestNotes[p.id])
      .map((p) => ({
        projectId: p.id,
        projectTitle: p.title,
        note: latestNotes[p.id].content,
      })),
  );

  const generatedAt = new Date();
  const generatedLabel = generatedAt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "MDU Passport";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Projects");
  ws.columns = [
    { key: "property", width: 28 },
    { key: "island", width: 12 },
    { key: "project", width: 34 },
    { key: "description", width: 40 },
    { key: "status", width: 14 },
    { key: "priority", width: 10 },
    { key: "due", width: 16 },
    { key: "created", width: 14 },
    { key: "update", width: 52 },
  ];

  const titleRow = ws.addRow(["Active Projects"]);
  titleRow.font = { size: 18, bold: true };
  ws.mergeCells(`A${titleRow.number}:I${titleRow.number}`);

  const subRow = ws.addRow([
    `${projects.length} ongoing project${projects.length === 1 ? "" : "s"} · Report generated: ${generatedLabel}`,
  ]);
  subRow.font = { size: 10, italic: true, color: { argb: "FF777777" } };
  ws.mergeCells(`A${subRow.number}:I${subRow.number}`);

  ws.addRow([]);

  const header = ws.addRow([
    "Property",
    "Island",
    "Project",
    "Description",
    "Status",
    "Priority",
    "Due Date",
    "Created",
    "Recent Update",
  ]);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });

  if (projects.length === 0) {
    const empty = ws.addRow(["No ongoing projects."]);
    empty.font = { italic: true, color: { argb: "FF888888" } };
    ws.mergeCells(`A${empty.number}:I${empty.number}`);
  } else {
    for (const p of projects) {
      const overdue = isOverdue(p.due_date, p.status);
      const row = ws.addRow([
        p.property?.name ?? "(unknown property)",
        p.property?.island ? titleCase(p.property.island) : "—",
        p.title,
        p.description ?? "",
        titleCase(p.status),
        `P${p.priority}`,
        p.due_date
          ? `${formatDate(p.due_date)}${overdue ? " (overdue)" : ""}`
          : "—",
        formatDate(p.created_at),
        summaries[p.id] ?? "No notes yet.",
      ]);
      row.alignment = { vertical: "top", wrapText: true };
      if (overdue) {
        row.getCell(7).font = { color: { argb: "FFCC0000" }, bold: true };
      }
      if (!summaries[p.id]) {
        row.getCell(9).font = { italic: true, color: { argb: "FF888888" } };
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const dateSuffix = generatedAt.toISOString().slice(0, 10);
  const filename = `active-projects-${dateSuffix}.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
