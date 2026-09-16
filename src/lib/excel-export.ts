import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

// Spec section 40 - clean, analysis-ready worksheets (no merged cells, no
// presentation formatting), one dataset per sheet, driven directly by the
// live database rather than a static report.

function addSheet<T extends Record<string, unknown>>(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: { header: string; key: string; width?: number }[],
  rows: T[]
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  return sheet;
}

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export type ExportDataset =
  | "equipment"
  | "workorders"
  | "pm"
  | "cm"
  | "findings"
  | "actions"
  | "sce"
  | "hse"
  | "qc"
  | "timesheet"
  | "all";

async function buildEquipmentSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.equipment.findMany({ where: { projectId }, orderBy: { tagNumber: "asc" } });
  addSheet(
    workbook,
    "Equipment",
    [
      { header: "Tag Number", key: "tagNumber", width: 20 },
      { header: "Description", key: "description", width: 30 },
      { header: "Type", key: "equipmentType", width: 16 },
      { header: "Area", key: "area", width: 12 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Criticality", key: "criticality", width: 12 },
      { header: "SCE", key: "isSce", width: 8 },
      { header: "Status", key: "operationalStatus", width: 16 },
      { header: "Manufacturer", key: "manufacturer", width: 16 },
      { header: "Model", key: "model", width: 16 },
      { header: "Serial Number", key: "serialNumber", width: 16 },
    ],
    rows.map((r) => ({ ...r, isSce: r.isSce ? "Yes" : "No" }))
  );
}

async function buildWorkOrderSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.workOrder.findMany({
    where: { projectId },
    include: { equipment: { select: { tagNumber: true } } },
    orderBy: { plannedStartDate: "desc" },
  });
  addSheet(
    workbook,
    "Work Orders",
    [
      { header: "WO #", key: "workOrderNumber", width: 16 },
      { header: "Type", key: "type", width: 8 },
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Work Center", key: "workCenter", width: 14 },
      { header: "Scope", key: "scope", width: 30 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Planned Start", key: "plannedStartDate", width: 14 },
      { header: "Planned Finish", key: "plannedFinishDate", width: 14 },
      { header: "Actual Start", key: "actualStartDate", width: 14 },
      { header: "Actual Finish", key: "actualFinishDate", width: 14 },
      { header: "Planned Hours", key: "plannedHours", width: 12 },
      { header: "Actual Hours", key: "actualHours", width: 12 },
      { header: "Status", key: "status", width: 14 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment?.tagNumber ?? r.equipmentSortField ?? "",
      plannedStartDate: fmtDate(r.plannedStartDate),
      plannedFinishDate: fmtDate(r.plannedFinishDate),
      actualStartDate: fmtDate(r.actualStartDate),
      actualFinishDate: fmtDate(r.actualFinishDate),
      plannedHours: r.plannedHours?.toString() ?? "",
      actualHours: r.actualHours?.toString() ?? "",
    }))
  );
}

async function buildPmSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.pmRecord.findMany({
    where: { projectId },
    include: { equipment: { select: { tagNumber: true } } },
    orderBy: { plannedDate: "desc" },
  });
  addSheet(
    workbook,
    "PM",
    [
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "PM Type", key: "pmType", width: 18 },
      { header: "Frequency", key: "pmFrequency", width: 14 },
      { header: "Planned Date", key: "plannedDate", width: 14 },
      { header: "Actual Finish", key: "actualFinish", width: 14 },
      { header: "Planned Hours", key: "plannedHours", width: 12 },
      { header: "Actual Hours", key: "actualHours", width: 12 },
      { header: "Discipline", key: "responsibleDiscipline", width: 14 },
      { header: "Status", key: "status", width: 14 },
      { header: "Findings", key: "findingsText", width: 30 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment.tagNumber,
      plannedDate: fmtDate(r.plannedDate),
      actualFinish: fmtDate(r.actualFinish),
      plannedHours: r.plannedHours?.toString() ?? "",
      actualHours: r.actualHours?.toString() ?? "",
    }))
  );
}

async function buildCmSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.cmRecord.findMany({
    where: { projectId },
    include: { equipment: { select: { tagNumber: true } } },
    orderBy: { breakdownDate: "desc" },
  });
  addSheet(
    workbook,
    "CM",
    [
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Breakdown Date", key: "breakdownDate", width: 14 },
      { header: "Failure Description", key: "failureDescription", width: 30 },
      { header: "Root Cause", key: "rootCause", width: 24 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Downtime Hours", key: "downtimeHours", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment.tagNumber,
      breakdownDate: fmtDate(r.breakdownDate),
      downtimeHours: r.downtimeHours?.toString() ?? "",
    }))
  );
}

async function buildFindingsSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.finding.findMany({
    where: { projectId },
    include: { equipment: { select: { tagNumber: true } } },
    orderBy: { date: "desc" },
  });
  addSheet(
    workbook,
    "Findings",
    [
      { header: "Date", key: "date", width: 14 },
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Category", key: "category", width: 16 },
      { header: "Description", key: "description", width: 34 },
      { header: "Severity", key: "severity", width: 10 },
      { header: "Risk Level", key: "riskLevel", width: 10 },
      { header: "Responsible Person", key: "responsiblePerson", width: 18 },
      { header: "Target Date", key: "targetDate", width: 14 },
      { header: "Status", key: "status", width: 14 },
      { header: "Closure Date", key: "closureDate", width: 14 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment?.tagNumber ?? "",
      date: fmtDate(r.date),
      targetDate: fmtDate(r.targetDate),
      closureDate: fmtDate(r.closureDate),
    }))
  );
}

async function buildActionsSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.action.findMany({
    where: { projectId },
    include: { equipment: { select: { tagNumber: true } } },
    orderBy: { targetDate: "asc" },
  });
  addSheet(
    workbook,
    "Actions",
    [
      { header: "Source Module", key: "sourceModule", width: 16 },
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Description", key: "description", width: 34 },
      { header: "Responsible Person", key: "responsiblePerson", width: 18 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Target Date", key: "targetDate", width: 14 },
      { header: "Status", key: "status", width: 14 },
      { header: "Closure Date", key: "closureDate", width: 14 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment?.tagNumber ?? "",
      targetDate: fmtDate(r.targetDate),
      closureDate: fmtDate(r.closureDate),
    }))
  );
}

async function buildSceSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.sceRecord.findMany({ where: { projectId }, include: { equipment: true } });
  addSheet(
    workbook,
    "SCE",
    [
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Category", key: "sceCategory", width: 20 },
      { header: "Test Frequency", key: "testFrequency", width: 14 },
      { header: "Last Test", key: "lastTestDate", width: 14 },
      { header: "Next Due", key: "nextDueDate", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ],
    rows.map((r) => ({
      ...r,
      equipmentTag: r.equipment.tagNumber,
      lastTestDate: fmtDate(r.lastTestDate),
      nextDueDate: fmtDate(r.nextDueDate),
    }))
  );
}

async function buildHseSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const [incidents, observations] = await Promise.all([
    prisma.hseIncident.findMany({ where: { projectId }, orderBy: { incidentDate: "desc" } }),
    prisma.hseObservation.findMany({ where: { projectId }, orderBy: { date: "desc" } }),
  ]);
  addSheet(
    workbook,
    "HSE Incidents",
    [
      { header: "Date", key: "incidentDate", width: 14 },
      { header: "Type", key: "incidentType", width: 16 },
      { header: "Description", key: "description", width: 34 },
      { header: "Location", key: "location", width: 16 },
      { header: "Status", key: "investigationStatus", width: 14 },
    ],
    incidents.map((r) => ({ ...r, incidentDate: fmtDate(r.incidentDate) }))
  );
  addSheet(
    workbook,
    "HSE Observations",
    [
      { header: "Date", key: "date", width: 14 },
      { header: "Area", key: "area", width: 14 },
      { header: "Category", key: "category", width: 18 },
      { header: "Description", key: "description", width: 34 },
      { header: "Status", key: "status", width: 14 },
    ],
    observations.map((r) => ({ ...r, date: fmtDate(r.date) }))
  );
}

async function buildQcSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const [inspections, ncrs] = await Promise.all([
    prisma.qcInspection.findMany({ where: { projectId }, orderBy: { date: "desc" } }),
    prisma.ncr.findMany({ where: { projectId }, orderBy: { date: "desc" } }),
  ]);
  addSheet(
    workbook,
    "QC Inspections",
    [
      { header: "Date", key: "date", width: 14 },
      { header: "Equipment", key: "equipmentTag", width: 18 },
      { header: "Type", key: "inspectionType", width: 16 },
      { header: "Result", key: "result", width: 12 },
    ],
    inspections.map((r) => ({ ...r, date: fmtDate(r.date) }))
  );
  addSheet(
    workbook,
    "NCRs",
    [
      { header: "NCR #", key: "ncrNumber", width: 14 },
      { header: "Date", key: "date", width: 14 },
      { header: "Description", key: "description", width: 34 },
      { header: "Severity", key: "severity", width: 10 },
      { header: "Status", key: "status", width: 14 },
    ],
    ncrs.map((r) => ({ ...r, date: fmtDate(r.date) }))
  );
}

async function buildTimesheetSheet(workbook: ExcelJS.Workbook, projectId: string) {
  const rows = await prisma.timesheet.findMany({
    where: { projectId },
    include: { employee: true },
    orderBy: { date: "desc" },
    take: 5000,
  });
  addSheet(
    workbook,
    "Timesheet",
    [
      { header: "Employee #", key: "employeeNumber", width: 14 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Date", key: "date", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Normal Hours", key: "normalHours", width: 12 },
      { header: "Overtime Hours", key: "overtimeHours", width: 12 },
    ],
    rows.map((r) => ({
      employeeNumber: r.employee.employeeNumber,
      employeeName: r.employee.name,
      date: fmtDate(r.date),
      status: r.status,
      normalHours: r.normalHours.toString(),
      overtimeHours: r.overtimeHours.toString(),
    }))
  );
}

const BUILDERS: Record<Exclude<ExportDataset, "all">, (wb: ExcelJS.Workbook, projectId: string) => Promise<void>> = {
  equipment: buildEquipmentSheet,
  workorders: buildWorkOrderSheet,
  pm: buildPmSheet,
  cm: buildCmSheet,
  findings: buildFindingsSheet,
  actions: buildActionsSheet,
  sce: buildSceSheet,
  hse: buildHseSheet,
  qc: buildQcSheet,
  timesheet: buildTimesheetSheet,
};

export async function buildExportWorkbook(projectId: string, dataset: ExportDataset): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Maintenance & KPI Management System";
  workbook.created = new Date();

  if (dataset === "all") {
    for (const builder of Object.values(BUILDERS)) {
      await builder(workbook, projectId);
    }
  } else {
    await BUILDERS[dataset](workbook, projectId);
  }

  return workbook;
}
