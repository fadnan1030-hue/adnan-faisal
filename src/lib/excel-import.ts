import ExcelJS from "exceljs";

export interface ParsedRow {
  rowNumber: number;
  values: Record<string, string>;
}

/** Reads the first worksheet of an uploaded workbook into header-keyed rows. */
export async function parseWorkbookFirstSheet(buffer: ArrayBuffer): Promise<{
  sheetName: string;
  headers: string[];
  rows: ParsedRow[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The uploaded file has no worksheets.");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: ParsedRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      const v = cell.value;
      if (v instanceof Date) {
        values[header] = v.toISOString().slice(0, 10);
      } else if (v && typeof v === "object" && "result" in v) {
        values[header] = String((v as { result: unknown }).result ?? "");
      } else {
        values[header] = v === null || v === undefined ? "" : String(v);
      }
    });
    if (Object.keys(values).length > 0) rows.push({ rowNumber, values });
  });

  return { sheetName: sheet.name, headers: headers.filter(Boolean), rows };
}

// Default column mapping for the Work Order import example given in spec
// section 41 ("Detail" worksheet). Administrators can be given the
// ability to save alternate templates as a future enhancement (see
// README roadmap) - this implementation ships the one mapping the spec
// calls out explicitly, end to end.
export const WORK_ORDER_IMPORT_MAPPING: Record<string, string> = {
  "WO#": "workOrderNumber",
  "Work Center": "workCenter",
  "Operation Short Text": "operationShortText",
  Scope: "scope",
  "Sort Field": "equipmentSortField",
  Location: "location",
  "Plan start date": "plannedStartDate",
  "Plan Finish Date": "plannedFinishDate",
  "Earliest Finish Date": "earliestFinishDate",
  "Actual Start Date": "actualStartDate",
  "Actual Finish Date": "actualFinishDate",
  "Plan Hrs": "plannedHours",
  "Actual Hrs": "actualHours",
  Remarks: "remarks",
};
