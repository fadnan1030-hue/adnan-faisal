import { NextRequest, NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { buildExportWorkbook, type ExportDataset } from "@/lib/excel-export";
import { writeAuditLog } from "@/lib/audit";

const VALID_DATASETS: ExportDataset[] = [
  "equipment",
  "workorders",
  "pm",
  "cm",
  "findings",
  "actions",
  "sce",
  "hse",
  "qc",
  "timesheet",
  "all",
];

export async function GET(request: NextRequest) {
  const session = await requireModuleAccess("EXCEL_IO", "read");
  const projectId = await getCurrentProjectId();
  if (!projectId) {
    return NextResponse.json({ error: "No project selected." }, { status: 400 });
  }

  const datasetParam = request.nextUrl.searchParams.get("dataset") ?? "all";
  if (!VALID_DATASETS.includes(datasetParam as ExportDataset)) {
    return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
  }
  const dataset = datasetParam as ExportDataset;

  const workbook = await buildExportWorkbook(projectId, dataset);
  const buffer = await workbook.xlsx.writeBuffer();

  await writeAuditLog({
    projectId,
    entityType: "PROJECT",
    entityId: projectId,
    action: "EXPORT",
    actorId: session.user.id,
    newValue: { dataset },
  });

  const fileName = `export-${dataset}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
