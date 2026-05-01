import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import {
  getProperty,
  listCommonAreaEquipment,
  listCommonAreas,
  listEquipmentTypes,
} from "@/lib/data";
import { titleCase, formatDate } from "@/lib/format";

export async function GET(req: Request) {
  await requireUser();
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId)
    return NextResponse.json({ error: "missing propertyId" }, { status: 400 });

  const property = await getProperty(propertyId);
  if (!property)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const [areas, equipmentTypes] = await Promise.all([
    listCommonAreas(propertyId),
    listEquipmentTypes(),
  ]);

  const equipmentByArea: Record<
    string,
    Awaited<ReturnType<typeof listCommonAreaEquipment>>
  > = {};
  for (const area of areas) {
    equipmentByArea[area.id] = await listCommonAreaEquipment(area.id);
  }
  const equipmentIndex = new Map(equipmentTypes.map((e) => [e.id, e]));

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

  // --- Summary sheet ---
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { key: "a", width: 36 },
    { key: "b", width: 18 },
    { key: "c", width: 18 },
    { key: "d", width: 18 },
    { key: "e", width: 28 },
  ];

  const titleRow = summary.addRow([property.name]);
  titleRow.font = { size: 18, bold: true };
  summary.mergeCells(`A${titleRow.number}:E${titleRow.number}`);

  const subtitleRow = summary.addRow([
    [
      titleCase(property.type),
      property.island ? titleCase(property.island) : null,
      property.address ?? null,
    ]
      .filter(Boolean)
      .join(" · "),
  ]);
  subtitleRow.font = { size: 11, color: { argb: "FF555555" } };
  summary.mergeCells(`A${subtitleRow.number}:E${subtitleRow.number}`);

  const dateRow = summary.addRow([`Report generated: ${generatedLabel}`]);
  dateRow.font = { size: 10, italic: true, color: { argb: "FF777777" } };
  summary.mergeCells(`A${dateRow.number}:E${dateRow.number}`);

  summary.addRow([]);

  // Area totals
  const areaCounts = {
    total: areas.length,
    completed: areas.filter((a) => a.installation_status === "completed").length,
    in_progress: areas.filter((a) => a.installation_status === "in_progress")
      .length,
    not_started: areas.filter((a) => a.installation_status === "not_started")
      .length,
  };
  const areasHeader = summary.addRow(["Common Areas Overview"]);
  areasHeader.font = { size: 13, bold: true };
  summary.mergeCells(`A${areasHeader.number}:E${areasHeader.number}`);

  const areaStatsHeader = summary.addRow([
    "Total",
    "Completed",
    "In Progress",
    "Not Started",
  ]);
  areaStatsHeader.font = { bold: true };
  areaStatsHeader.eachCell((cell) => {
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
  summary.addRow([
    areaCounts.total,
    areaCounts.completed,
    areaCounts.in_progress,
    areaCounts.not_started,
  ]);

  summary.addRow([]);

  // Equipment totals across all areas
  const equipmentTotals = new Map<
    string,
    {
      name: string;
      item_id: string | null;
      model: string | null;
      category: string | null;
      qty: number;
    }
  >();
  for (const area of areas) {
    const rows = equipmentByArea[area.id] ?? [];
    for (const r of rows) {
      const et = equipmentIndex.get(r.equipment_type_id);
      const key = r.equipment_type_id;
      const prev = equipmentTotals.get(key);
      if (prev) {
        prev.qty += r.quantity;
      } else {
        equipmentTotals.set(key, {
          name: et?.name ?? "(unknown)",
          item_id: et?.item_id ?? null,
          model: et?.model ?? null,
          category: et?.category ?? null,
          qty: r.quantity,
        });
      }
    }
  }
  const equipmentSorted = Array.from(equipmentTotals.values()).sort((a, b) => {
    if (b.qty !== a.qty) return b.qty - a.qty;
    return a.name.localeCompare(b.name);
  });

  const equipHeader = summary.addRow(["Equipment Totals (All Common Areas)"]);
  equipHeader.font = { size: 13, bold: true };
  summary.mergeCells(`A${equipHeader.number}:E${equipHeader.number}`);

  const equipColsHeader = summary.addRow([
    "Equipment",
    "Item ID",
    "Model",
    "Category",
    "Quantity",
  ]);
  equipColsHeader.font = { bold: true };
  equipColsHeader.eachCell((cell) => {
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

  if (equipmentSorted.length === 0) {
    const emptyRow = summary.addRow(["No equipment recorded yet."]);
    emptyRow.font = { italic: true, color: { argb: "FF888888" } };
    summary.mergeCells(`A${emptyRow.number}:E${emptyRow.number}`);
  } else {
    let grand = 0;
    for (const item of equipmentSorted) {
      summary.addRow([
        item.name,
        item.item_id ?? "—",
        item.model ?? "—",
        item.category ?? "—",
        item.qty,
      ]);
      grand += item.qty;
    }
    const totalRow = summary.addRow(["", "", "", "Total", grand]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });
  }

  summary.eachRow({ includeEmpty: false }, (row) => {
    row.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  // --- Common Areas sheet ---
  const ca = wb.addWorksheet("Common Areas");
  ca.columns = [
    { key: "a", width: 30 },
    { key: "b", width: 18 },
    { key: "c", width: 22 },
    { key: "d", width: 18 },
    { key: "e", width: 10 },
    { key: "f", width: 14 },
    { key: "g", width: 40 },
  ];

  const caTitle = ca.addRow([property.name]);
  caTitle.font = { size: 18, bold: true };
  ca.mergeCells(`A${caTitle.number}:G${caTitle.number}`);

  const caSub = ca.addRow([`Report generated: ${generatedLabel}`]);
  caSub.font = { size: 10, italic: true, color: { argb: "FF777777" } };
  ca.mergeCells(`A${caSub.number}:G${caSub.number}`);

  ca.addRow([]);

  if (areas.length === 0) {
    const empty = ca.addRow(["No common areas on file."]);
    empty.font = { italic: true, color: { argb: "FF888888" } };
    ca.mergeCells(`A${empty.number}:G${empty.number}`);
  }

  for (const area of areas) {
    const nameRow = ca.addRow([area.area_name]);
    nameRow.font = { size: 13, bold: true };
    ca.mergeCells(`A${nameRow.number}:G${nameRow.number}`);

    const metaRow = ca.addRow([
      [
        titleCase(area.area_type),
        area.sublocation ? `Sublocation: ${area.sublocation}` : null,
        `Status: ${titleCase(area.installation_status)}`,
        area.installation_date
          ? `Installed: ${formatDate(area.installation_date)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
    metaRow.font = { size: 10, color: { argb: "FF555555" } };
    ca.mergeCells(`A${metaRow.number}:G${metaRow.number}`);

    if (area.description) {
      const descRow = ca.addRow([area.description]);
      descRow.font = { size: 10, italic: true };
      descRow.alignment = { wrapText: true, vertical: "top" };
      ca.mergeCells(`A${descRow.number}:G${descRow.number}`);
    }

    const rows = equipmentByArea[area.id] ?? [];
    const header = ca.addRow([
      "Equipment",
      "Item ID",
      "Manufacturer",
      "Model",
      "Qty",
      "Category",
      "Notes",
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

    if (rows.length === 0) {
      const none = ca.addRow(["No equipment recorded for this area."]);
      none.font = { italic: true, color: { argb: "FF888888" } };
      ca.mergeCells(`A${none.number}:G${none.number}`);
    } else {
      let areaTotal = 0;
      for (const r of rows) {
        const et = equipmentIndex.get(r.equipment_type_id);
        ca.addRow([
          et?.name ?? "(unknown)",
          et?.item_id ?? "—",
          et?.manufacturer ?? "—",
          et?.model ?? "—",
          r.quantity,
          et?.category ?? "—",
          r.notes ?? "",
        ]);
        areaTotal += r.quantity;
      }
      const subtotal = ca.addRow(["", "", "", "Subtotal", areaTotal, "", ""]);
      subtotal.font = { bold: true };
      subtotal.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });
    }

    if (area.notes) {
      const notesLabel = ca.addRow(["Notes"]);
      notesLabel.font = { bold: true, size: 10 };
      const notes = ca.addRow([area.notes]);
      notes.font = { size: 10 };
      notes.alignment = { wrapText: true, vertical: "top" };
      ca.mergeCells(`A${notes.number}:G${notes.number}`);
    }

    ca.addRow([]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const dateSuffix = generatedAt.toISOString().slice(0, 10);
  const filename = `${property.slug || "property"}-common-areas-${dateSuffix}.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
