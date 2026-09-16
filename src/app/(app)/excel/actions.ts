"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { parseWorkbookFirstSheet, WORK_ORDER_IMPORT_MAPPING } from "@/lib/excel-import";
import { redirectWithError, str } from "@/lib/action-helpers";
import type { DuplicateStrategy, MaintenanceStatus } from "@prisma/client";

function parseExcelDate(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseExcelNumber(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export async function importWorkOrders(formData: FormData) {
  const session = await requireModuleAccess("EXCEL_IO", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/excel", "Select a project first.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirectWithError("/excel", "Please choose an .xlsx file to import.");
  }

  const duplicateStrategy = (str(formData, "duplicateStrategy") || "SKIP") as DuplicateStrategy;

  const { sheetName, rows } = await parseWorkbookFirstSheet(await (file as File).arrayBuffer());

  const importJob = await prisma.importJob.create({
    data: {
      projectId: projectId!,
      targetEntity: "WORK_ORDER",
      sourceFileName: (file as File).name,
      sheetName,
      columnMapping: WORK_ORDER_IMPORT_MAPPING,
      duplicateStrategy,
      status: "IMPORTING",
      totalRows: rows.length,
      createdById: session.user.id,
    },
  });

  let imported = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const mapped: Record<string, string> = {};
    for (const [excelHeader, field] of Object.entries(WORK_ORDER_IMPORT_MAPPING)) {
      if (row.values[excelHeader] !== undefined) mapped[field] = row.values[excelHeader];
    }

    const workOrderNumber = mapped.workOrderNumber?.trim();
    if (!workOrderNumber) {
      failed++;
      await prisma.importError.create({
        data: { importJobId: importJob.id, rowNumber: row.rowNumber, rowData: row.values, errorMessage: "Missing WO#." },
      });
      continue;
    }

    const actualStart = parseExcelDate(mapped.actualStartDate);
    const actualFinish = parseExcelDate(mapped.actualFinishDate);
    if (actualStart && actualFinish && actualFinish < actualStart) {
      failed++;
      await prisma.importError.create({
        data: {
          importJobId: importJob.id,
          rowNumber: row.rowNumber,
          rowData: row.values,
          errorMessage: "Actual finish date cannot be before actual start date.",
        },
      });
      continue;
    }

    const existing = await prisma.workOrder.findUnique({
      where: { projectId_workOrderNumber: { projectId: projectId!, workOrderNumber } },
    });

    if (existing && duplicateStrategy === "SKIP") {
      skipped++;
      continue;
    }

    const status: MaintenanceStatus = actualFinish ? "COMPLETED" : "PLANNED";
    const data = {
      projectId: projectId!,
      workOrderNumber,
      workCenter: mapped.workCenter || undefined,
      operationShortText: mapped.operationShortText || undefined,
      scope: mapped.scope || undefined,
      equipmentSortField: mapped.equipmentSortField || undefined,
      location: mapped.location || undefined,
      plannedStartDate: parseExcelDate(mapped.plannedStartDate),
      plannedFinishDate: parseExcelDate(mapped.plannedFinishDate),
      earliestFinishDate: parseExcelDate(mapped.earliestFinishDate),
      actualStartDate: actualStart,
      actualFinishDate: actualFinish,
      plannedHours: parseExcelNumber(mapped.plannedHours),
      actualHours: parseExcelNumber(mapped.actualHours),
      remarks: mapped.remarks || undefined,
      status,
    };

    if (existing && duplicateStrategy === "UPDATE") {
      await prisma.workOrder.update({ where: { id: existing.id }, data });
    } else {
      await prisma.workOrder.create({ data });
    }
    imported++;
  }

  await prisma.importJob.update({
    where: { id: importJob.id },
    data: { status: "COMPLETED", importedRows: imported, failedRows: failed, completedAt: new Date() },
  });

  await writeAuditLog({
    projectId,
    entityType: "WORK_ORDER",
    entityId: importJob.id,
    action: "IMPORT",
    actorId: session.user.id,
    newValue: { imported, failed, skipped },
  });

  revalidatePath("/excel");
  revalidatePath("/work-orders");
  redirect(`/excel?jobId=${importJob.id}`);
}
