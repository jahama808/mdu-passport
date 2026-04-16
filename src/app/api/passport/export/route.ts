import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { requireUser } from "@/lib/auth";
import {
  getProperty,
  listCommonAreaEquipment,
  listCommonAreas,
  listEquipmentTypes,
  listPropertyNotes,
  listScansForProperty,
} from "@/lib/data";
import { titleCase, formatDate } from "@/lib/format";

export async function GET(req: Request) {
  await requireUser();
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: "missing propertyId" }, { status: 400 });

  const property = await getProperty(propertyId);
  if (!property) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [areas, equipmentTypes, notes, scans] = await Promise.all([
    listCommonAreas(propertyId),
    listEquipmentTypes(),
    listPropertyNotes(propertyId),
    listScansForProperty(propertyId),
  ]);

  const equipmentByArea: Record<string, Awaited<ReturnType<typeof listCommonAreaEquipment>>> = {};
  for (const area of areas) {
    equipmentByArea[area.id] = await listCommonAreaEquipment(area.id);
  }
  const equipmentIndex = new Map(equipmentTypes.map((e) => [e.id, e]));

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }
  function line(text: string, options: { size?: number; bold?: boolean; gap?: number } = {}) {
    const { size = 10, bold = false, gap = 4 } = options;
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const split = doc.splitTextToSize(text, pageWidth - margin * 2);
    for (const chunk of split) {
      ensureSpace(size + gap);
      doc.text(chunk, margin, y);
      y += size + gap;
    }
  }
  function hr() {
    ensureSpace(12);
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  }

  line("MDU Property Passport", { size: 20, bold: true, gap: 6 });
  line(property.name, { size: 16, bold: true, gap: 4 });
  line(
    `${titleCase(property.type)}${property.island ? " · " + titleCase(property.island) : ""}${
      property.address ? " · " + property.address : ""
    }`,
    { size: 10, gap: 4 },
  );
  if (property.gm_name || property.gm_email) {
    line(
      `GM: ${property.gm_name ?? "—"}${property.gm_email ? " · " + property.gm_email : ""}`,
      { size: 10 },
    );
  }
  line(`Generated ${new Date().toLocaleString()}`, { size: 9, gap: 8 });
  hr();

  const counts = {
    total: areas.length,
    completed: areas.filter((a) => a.installation_status === "completed").length,
    in_progress: areas.filter((a) => a.installation_status === "in_progress").length,
    not_started: areas.filter((a) => a.installation_status === "not_started").length,
  };
  line("Common Area Summary", { size: 14, bold: true, gap: 6 });
  line(
    `${counts.total} areas · ${counts.completed} completed · ${counts.in_progress} in progress · ${counts.not_started} not started`,
    { size: 10, gap: 8 },
  );

  for (const area of areas) {
    ensureSpace(40);
    line(area.area_name, { size: 12, bold: true, gap: 3 });
    line(
      `${titleCase(area.area_type)} · ${titleCase(area.installation_status)} · priority ${area.priority}${
        area.installation_date ? " · " + formatDate(area.installation_date) : ""
      }`,
      { size: 9, gap: 4 },
    );
    if (area.description) line(area.description, { size: 10, gap: 4 });
    const rows = equipmentByArea[area.id] ?? [];
    if (rows.length > 0) {
      line("Equipment:", { size: 10, bold: true, gap: 3 });
      for (const r of rows) {
        const et = equipmentIndex.get(r.equipment_type_id);
        const label = et
          ? `${et.name}${et.model ? " (" + et.model + ")" : ""}`
          : "(unknown)";
        line(
          `  • ${r.quantity}× ${label}${r.notes ? " — " + r.notes : ""}`,
          { size: 10 },
        );
      }
    }
    if (area.notes) {
      line("Notes:", { size: 10, bold: true, gap: 3 });
      line(area.notes, { size: 10, gap: 4 });
    }
    y += 4;
  }

  if (scans.length > 0) {
    hr();
    line("Sighting Inventory", { size: 14, bold: true, gap: 6 });
    const byLocation = new Map<string, typeof scans>();
    for (const s of scans) {
      const key = s.location ?? "Unlabeled";
      const arr = byLocation.get(key) ?? [];
      arr.push(s);
      byLocation.set(key, arr);
    }
    for (const [loc, items] of byLocation) {
      line(loc, { size: 12, bold: true, gap: 3 });
      for (const s of items) {
        const bits = [
          s.device_type ? titleCase(s.device_type) : null,
          s.device_model,
          s.label_sn ? `SN ${s.label_sn}` : null,
          s.label_mac ? `MAC ${s.label_mac}` : null,
        ].filter(Boolean);
        line(`  • ${bits.join(" · ") || "(sighting)"}`, { size: 10, gap: 2 });
        if (s.narration) line(`    ${s.narration}`, { size: 9, gap: 3 });
      }
      y += 2;
    }
  }

  if (notes.length > 0) {
    hr();
    line("Property Notes", { size: 14, bold: true, gap: 6 });
    for (const n of notes) {
      line(formatDate(n.created_at), { size: 9, bold: true, gap: 2 });
      line(n.content, { size: 10, gap: 6 });
    }
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  const filename = `${property.slug || "property"}-passport.pdf`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
