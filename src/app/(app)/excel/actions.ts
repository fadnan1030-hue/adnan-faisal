"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProjectId } from "@/lib/current-project";
import { parseWorkbookFirstSheet, WORK_ORDER_IMPORT_MAPPING } from "@/lib/excel-import";
import { redirectWithError, str } from "@/lib/action-helpers";
import type { DuplicateStrategy, MaintenanceStatus, WorkOrderType, Priority } from "@prisma/client";

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

const BULK_STATUS_MAP: Record<string, MaintenanceStatus> = {
  "not started": "PLANNED",
  "in progress": "IN_PROGRESS",
  completed: "COMPLETED",
  rescheduled: "RESCHEDULED",
};

const BULK_PRIORITY_MAP: Record<string, Priority> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT",
};

/**
 * Quick "paste rows copied from Excel" import, for touch-ups that don't
 * warrant the full workbook upload wizard. Column order matches the
 * project's prior offline dashboard tool so existing muscle memory / copied
 * ranges keep working: Report Date, Scope, Discipline (PM/CM/General/
 * Emergency Callout), Activity, Location, Sort Field, Work Order #,
 * Reference #, Plan Start, Plan Finish, Actual Start, Actual Finish,
 * Planned Hours, Actual Hours, Status, Week, Remarks, ABC Indicator
 * (optional), Priority (optional). Report Date/Reference #/Week have no
 * equivalent column on WorkOrder, so they're parsed but not stored.
 */
export async function importBulkPaste(formData: FormData) {
  const session = await requireModuleAccess("EXCEL_IO", "write");
  const projectId = await getCurrentProjectId();
  if (!projectId) redirectWithError("/excel", "Select a project first.");

  const text = str(formData, "bulkPaste");
  if (!text) redirectWithError("/excel", "Paste at least one row.");

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  const importJob = await prisma.importJob.create({
    data: {
      projectId: projectId!,
      targetEntity: "WORK_ORDER",
      sourceFileName: "Bulk paste",
      duplicateStrategy: "UPDATE",
      status: "IMPORTING",
      totalRows: lines.length,
      createdById: session.user.id,
    },
  });

  let imported = 0;
  let failed = 0;

  for (const [i, line] of lines.entries()) {
    const rowNumber = i + 1;
    const cols = line.split("\t").map((c) => c.trim());
    const [
      ,
      // reportDate - not stored, no equivalent column
      scope,
      discipline,
      activity,
      location,
      sortField,
      workOrderNumber,
      ,
      // referenceNumber - not stored, no equivalent column
      planStart,
      planFinish,
      actualStart,
      actualFinish,
      plannedHours,
      actualHours,
      statusRaw,
      ,
      // week - not stored, no equivalent column
      remarks,
      abcIndicator,
      priorityRaw,
    ] = cols;

    if (!workOrderNumber) {
      failed++;
      await prisma.importError.create({
        data: { importJobId: importJob.id, rowNumber, rowData: { line }, errorMessage: "Missing Work Order #." },
      });
      continue;
    }

    const type: WorkOrderType = discipline?.trim().toUpperCase() === "PM" ? "PM" : "CM";
    const status = BULK_STATUS_MAP[statusRaw?.trim().toLowerCase()] ?? "PLANNED";
    const priority = BULK_PRIORITY_MAP[priorityRaw?.trim().toLowerCase()] ?? "MEDIUM";

    const data = {
      projectId: projectId!,
      workOrderNumber,
      operationShortText: activity || undefined,
      scope: scope || undefined,
      equipmentSortField: sortField || undefined,
      location: location || undefined,
      abcIndicator: abcIndicator || undefined,
      priority,
      type,
      plannedStartDate: parseExcelDate(planStart),
      plannedFinishDate: parseExcelDate(planFinish),
      actualStartDate: parseExcelDate(actualStart),
      actualFinishDate: parseExcelDate(actualFinish),
      plannedHours: parseExcelNumber(plannedHours),
      actualHours: parseExcelNumber(actualHours),
      remarks: remarks || undefined,
      status,
    };

    const existing = await prisma.workOrder.findUnique({
      where: { projectId_workOrderNumber: { projectId: projectId!, workOrderNumber } },
    });

    if (existing) {
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
    newValue: { imported, failed },
  });

  revalidatePath("/excel");
  revalidatePath("/work-orders");
  redirect(`/excel?jobId=${importJob.id}`);
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
