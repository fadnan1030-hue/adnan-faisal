import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = [
    { name: "Amina Admin", email: "admin@demo.local", role: "ADMIN" as const },
    { name: "Marcus Manager", email: "manager@demo.local", role: "MAINTENANCE_MANAGER" as const },
    { name: "Elena Engineer", email: "engineer@demo.local", role: "MAINTENANCE_ENGINEER" as const },
    { name: "Sam Supervisor", email: "supervisor@demo.local", role: "SUPERVISOR" as const },
    { name: "Tariq Technician", email: "tech@demo.local", role: "TECHNICIAN" as const },
    { name: "Hana HSE", email: "hse@demo.local", role: "HSE_USER" as const },
    { name: "Quentin QC", email: "qc@demo.local", role: "QC_USER" as const },
    { name: "Mona Management", email: "mgmt@demo.local", role: "MANAGEMENT" as const },
    { name: "Victor Viewer", email: "viewer@demo.local", role: "VIEWER" as const },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true },
      create: { ...u, passwordHash },
    });
    createdUsers[u.email] = created.id;
  }
  console.log(`Seeded ${users.length} demo users (password: ${DEMO_PASSWORD})`);

  // ---------------------------------------------------------------------
  // Demo project (clearly a sample configuration - spec section 6 & 80)
  // ---------------------------------------------------------------------
  const project = await prisma.project.upsert({
    where: { code: "OQ-AP-2026" },
    update: {},
    create: {
      code: "OQ-AP-2026",
      name: "OQ-AP AMC Contract 2026-31 (R&E Works) [DEMO]",
      client: "OQ",
      contractor: "APSTT1 [DEMO]",
      contractNumber: "AMC-2026-31",
      location: "Area Plant Complex",
      projectManager: "Mona Management",
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      plannedCompletionDate: new Date("2026-12-31"),
      ltiFreeStartDate: new Date("2026-01-01"),
      currentPeriodLabel: "Aug-2026",
    },
  });
  console.log(`Seeded demo project ${project.code}`);

  for (const email of Object.keys(createdUsers)) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: createdUsers[email] } },
      update: {},
      create: { projectId: project.id, userId: createdUsers[email] },
    });
  }

  // ---------------------------------------------------------------------
  // Configurable lookup lists (spec section 54)
  // ---------------------------------------------------------------------
  const configOptions: { category: string; code: string; label: string; sortOrder?: number }[] = [
    { category: "AREA", code: "AREA-1", label: "Area 1" },
    { category: "AREA", code: "AREA-2", label: "Area 2" },
    { category: "AREA", code: "AREA-3", label: "Area 3" },
    { category: "UNIT", code: "U-100", label: "Unit 100 - Separation" },
    { category: "UNIT", code: "U-200", label: "Unit 200 - Compression" },
    { category: "UNIT", code: "U-300", label: "Unit 300 - Utilities" },
    { category: "DISCIPLINE", code: "MECH", label: "Mechanical" },
    { category: "DISCIPLINE", code: "ELEC", label: "Electrical" },
    { category: "DISCIPLINE", code: "INST", label: "Instrument" },
    { category: "DISCIPLINE", code: "CIVIL", label: "Civil" },
    { category: "WORK_CENTER", code: "WC-MECH", label: "Mechanical Work Center" },
    { category: "WORK_CENTER", code: "WC-ELEC", label: "Electrical Work Center" },
    { category: "WORK_CENTER", code: "WC-INST", label: "Instrument Work Center" },
    { category: "EQUIPMENT_TYPE", code: "PSV", label: "Pressure Safety Valve" },
    { category: "EQUIPMENT_TYPE", code: "PUMP", label: "Pump" },
    { category: "EQUIPMENT_TYPE", code: "STRAINER", label: "Strainer" },
    { category: "EQUIPMENT_TYPE", code: "COMPRESSOR", label: "Compressor" },
    { category: "EQUIPMENT_TYPE", code: "VALVE", label: "Valve" },
    { category: "PM_FREQUENCY", code: "WEEKLY", label: "Weekly" },
    { category: "PM_FREQUENCY", code: "MONTHLY", label: "Monthly" },
    { category: "PM_FREQUENCY", code: "QUARTERLY", label: "Quarterly" },
    { category: "PM_FREQUENCY", code: "SEMI_ANNUAL", label: "Semi-Annual" },
    { category: "PM_FREQUENCY", code: "ANNUAL", label: "Annual" },
    { category: "FINDING_CATEGORY", code: "LEAKAGE", label: "Leakage" },
    { category: "FINDING_CATEGORY", code: "CORROSION", label: "Corrosion" },
    { category: "FINDING_CATEGORY", code: "EROSION", label: "Erosion" },
    { category: "FINDING_CATEGORY", code: "VIBRATION", label: "Vibration" },
    { category: "FINDING_CATEGORY", code: "TEMPERATURE", label: "Temperature" },
    { category: "FINDING_CATEGORY", code: "MECH_DAMAGE", label: "Mechanical damage" },
    { category: "FINDING_CATEGORY", code: "ELEC_DEFECT", label: "Electrical defect" },
    { category: "FINDING_CATEGORY", code: "INST_DEFECT", label: "Instrument defect" },
    { category: "FINDING_CATEGORY", code: "LUBRICATION", label: "Lubrication issue" },
    { category: "FINDING_CATEGORY", code: "ALIGNMENT", label: "Alignment issue" },
    { category: "FINDING_CATEGORY", code: "INSULATION", label: "Insulation issue" },
    { category: "FINDING_CATEGORY", code: "STRUCTURAL", label: "Structural defect" },
    { category: "FINDING_CATEGORY", code: "SAFETY", label: "Safety issue" },
    { category: "FINDING_CATEGORY", code: "HOUSEKEEPING", label: "Housekeeping" },
    { category: "FINDING_CATEGORY", code: "OTHER", label: "Other" },
    { category: "HSE_OBSERVATION_CATEGORY", code: "UNSAFE_ACT", label: "Unsafe Act" },
    { category: "HSE_OBSERVATION_CATEGORY", code: "UNSAFE_CONDITION", label: "Unsafe Condition" },
    { category: "HSE_OBSERVATION_CATEGORY", code: "GOOD_PRACTICE", label: "Good Practice" },
    { category: "HSE_OBSERVATION_CATEGORY", code: "PTW", label: "Permit to Work" },
    { category: "HSE_OBSERVATION_CATEGORY", code: "LSR", label: "Life Saving Rule" },
    { category: "QC_INSPECTION_TYPE", code: "VISUAL", label: "Visual Inspection" },
    { category: "QC_INSPECTION_TYPE", code: "NDT", label: "NDT" },
    { category: "QC_INSPECTION_TYPE", code: "DIMENSIONAL", label: "Dimensional" },
    { category: "QC_INSPECTION_TYPE", code: "FUNCTIONAL", label: "Functional Test" },
    { category: "NCR_CATEGORY", code: "WORKMANSHIP", label: "Workmanship" },
    { category: "NCR_CATEGORY", code: "MATERIAL", label: "Material" },
    { category: "NCR_CATEGORY", code: "DOCUMENTATION", label: "Documentation" },
    { category: "NCR_CATEGORY", code: "PROCEDURE", label: "Procedure" },
  ];

  for (const [i, opt] of configOptions.entries()) {
    await prisma.configOption.upsert({
      where: { projectId_category_code: { projectId: project.id, category: opt.category, code: opt.code } },
      update: { label: opt.label },
      create: { projectId: project.id, sortOrder: opt.sortOrder ?? i, ...opt },
    });
  }
  console.log(`Seeded ${configOptions.length} configuration options`);

  // ---------------------------------------------------------------------
  // Contractors + employees
  // ---------------------------------------------------------------------
  const contractor = await prisma.contractor.upsert({
    where: { projectId_name: { projectId: project.id, name: "APSTT1 [DEMO]" } },
    update: {},
    create: {
      projectId: project.id,
      name: "APSTT1 [DEMO]",
      contactName: "Contracts Desk",
      contactEmail: "contracts@apstt1-demo.local",
    },
  });

  const employeeSeed = [
    { number: "EMP-1001", name: "Tariq Technician", craft: "Mechanical Technician", discipline: "MECH", userEmail: "tech@demo.local" },
    { number: "EMP-1002", name: "Sam Supervisor", craft: "Maintenance Supervisor", discipline: "MECH", userEmail: "supervisor@demo.local" },
    { number: "EMP-1003", name: "Elena Engineer", craft: "Maintenance Engineer", discipline: "MECH", userEmail: "engineer@demo.local" },
    { number: "EMP-1004", name: "Yusuf Electrician", craft: "Electrical Technician", discipline: "ELEC" },
    { number: "EMP-1005", name: "Priya Instrument Tech", craft: "Instrument Technician", discipline: "INST" },
  ];

  for (const e of employeeSeed) {
    await prisma.employee.upsert({
      where: { projectId_employeeNumber: { projectId: project.id, employeeNumber: e.number } },
      update: {},
      create: {
        projectId: project.id,
        employeeNumber: e.number,
        name: e.name,
        craft: e.craft,
        discipline: e.discipline,
        contractorId: contractor.id,
        userId: e.userEmail ? createdUsers[e.userEmail] : undefined,
      },
    });
  }
  console.log(`Seeded ${employeeSeed.length} employees`);

  // ---------------------------------------------------------------------
  // Equipment master (demo)
  // ---------------------------------------------------------------------
  const equipmentSeed = [
    { tag: "A31-PSV-715CX", desc: "Pressure Safety Valve - Separator Outlet", type: "PSV", area: "Area 1", unit: "U-100", criticality: "CRITICAL" as const, isSce: true, sceCategory: "Category 1 - Pressure Protection" },
    { tag: "A31-PSV-716CX", desc: "Pressure Safety Valve - Separator Inlet", type: "PSV", area: "Area 1", unit: "U-100", criticality: "CRITICAL" as const, isSce: true, sceCategory: "Category 1 - Pressure Protection" },
    { tag: "ST-101", desc: "Strainer - Feed Line", type: "STRAINER", area: "Area 3", unit: "U-100", criticality: "MEDIUM" as const, isSce: false },
    { tag: "ST-102", desc: "Strainer - Export Line", type: "STRAINER", area: "Area 3", unit: "U-200", criticality: "MEDIUM" as const, isSce: false },
    { tag: "P-201A", desc: "Export Pump A", type: "PUMP", area: "Area 2", unit: "U-200", criticality: "HIGH" as const, isSce: false },
    { tag: "P-201B", desc: "Export Pump B (Standby)", type: "PUMP", area: "Area 2", unit: "U-200", criticality: "HIGH" as const, isSce: false },
    { tag: "P-202A", desc: "Condensate Pump A", type: "PUMP", area: "Area 2", unit: "U-200", criticality: "MEDIUM" as const, isSce: false },
    { tag: "C-301", desc: "Gas Export Compressor", type: "COMPRESSOR", area: "Area 3", unit: "U-300", criticality: "CRITICAL" as const, isSce: true, sceCategory: "Category 2 - Process Containment" },
    { tag: "V-401", desc: "ESD Valve - Main Header", type: "VALVE", area: "Area 1", unit: "U-100", criticality: "CRITICAL" as const, isSce: true, sceCategory: "Category 1 - Emergency Shutdown" },
    { tag: "V-402", desc: "Blowdown Valve", type: "VALVE", area: "Area 1", unit: "U-100", criticality: "HIGH" as const, isSce: false },
    { tag: "PSV-720", desc: "Pressure Safety Valve - Compressor Suction", type: "PSV", area: "Area 3", unit: "U-300", criticality: "CRITICAL" as const, isSce: true, sceCategory: "Category 1 - Pressure Protection" },
    { tag: "ST-103", desc: "Strainer - Utility Water", type: "STRAINER", area: "Area 3", unit: "U-300", criticality: "LOW" as const, isSce: false },
  ];

  const equipmentIds: Record<string, string> = {};
  for (const e of equipmentSeed) {
    const eq = await prisma.equipment.upsert({
      where: { projectId_tagNumber: { projectId: project.id, tagNumber: e.tag } },
      update: {},
      create: {
        projectId: project.id,
        tagNumber: e.tag,
        description: e.desc,
        equipmentType: e.type,
        area: e.area,
        unit: e.unit,
        discipline: "MECH",
        criticality: e.criticality,
        isSce: e.isSce,
        sceCategory: e.sceCategory,
        pmFrequency: "MONTHLY",
        operationalStatus: "OPERATIONAL",
      },
    });
    equipmentIds[e.tag] = eq.id;

    if (e.isSce) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + (Math.random() > 0.5 ? 20 : -5));
      await prisma.sceRecord.upsert({
        where: { equipmentId: eq.id },
        update: {},
        create: {
          projectId: project.id,
          equipmentId: eq.id,
          sceCategory: e.sceCategory ?? "SCE",
          criticalFunction: "Overpressure / emergency isolation protection",
          testFrequency: "ANNUAL",
          lastTestDate: new Date(new Date().setMonth(new Date().getMonth() - 10)),
          nextDueDate: nextDue,
          status: nextDue < new Date() ? "OVERDUE" : "PLANNED",
          responsiblePerson: "Elena Engineer",
        },
      });
    }
  }
  console.log(`Seeded ${equipmentSeed.length} equipment records`);

  // ---------------------------------------------------------------------
  // Work orders / PM / CM (demo — spread across past 45 days and next 10)
  // ---------------------------------------------------------------------
  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  let woCounter = 400001;

  const pmPlan = [
    { tag: "A31-PSV-715CX", offset: -20, status: "COMPLETED" as const, pmType: "Functional Test" },
    { tag: "A31-PSV-716CX", offset: -18, status: "COMPLETED" as const, pmType: "Functional Test" },
    { tag: "ST-101", offset: -15, status: "COMPLETED" as const, pmType: "Cleaning" },
    { tag: "ST-102", offset: -10, status: "COMPLETED" as const, pmType: "Cleaning" },
    { tag: "P-201A", offset: -8, status: "COMPLETED" as const, pmType: "Lubrication" },
    { tag: "P-201B", offset: -5, status: "PARTIALLY_COMPLETED" as const, pmType: "Vibration Check" },
    { tag: "C-301", offset: -3, status: "IN_PROGRESS" as const, pmType: "Overhaul Inspection" },
    { tag: "V-401", offset: 2, status: "PLANNED" as const, pmType: "Functional Test" },
    { tag: "V-402", offset: 4, status: "PLANNED" as const, pmType: "Visual Inspection" },
    { tag: "PSV-720", offset: -25, status: "COMPLETED" as const, pmType: "Functional Test" },
  ];

  for (const p of pmPlan) {
    const woNumber = `WO-${woCounter++}`;
    const plannedDate = daysFromNow(p.offset);
    const wo = await prisma.workOrder.upsert({
      where: { projectId_workOrderNumber: { projectId: project.id, workOrderNumber: woNumber } },
      update: {},
      create: {
        projectId: project.id,
        workOrderNumber: woNumber,
        workCenter: "WC-MECH",
        operationShortText: `${p.pmType} - ${p.tag}`,
        scope: `${p.pmType} on ${p.tag}`,
        equipmentId: equipmentIds[p.tag],
        equipmentSortField: p.tag,
        type: "PM",
        priority: "MEDIUM",
        plannedStartDate: plannedDate,
        plannedFinishDate: plannedDate,
        earliestFinishDate: plannedDate,
        actualStartDate: p.status !== "PLANNED" ? plannedDate : undefined,
        actualFinishDate: p.status === "COMPLETED" ? plannedDate : undefined,
        plannedHours: 4,
        actualHours: p.status === "COMPLETED" ? 3.5 : p.status === "PARTIALLY_COMPLETED" ? 2 : undefined,
        status: p.status,
      },
    });

    await prisma.pmRecord.create({
      data: {
        projectId: project.id,
        workOrderId: wo.id,
        equipmentId: equipmentIds[p.tag],
        pmType: p.pmType,
        pmFrequency: "MONTHLY",
        plannedDate,
        actualStart: p.status !== "PLANNED" ? plannedDate : undefined,
        actualFinish: p.status === "COMPLETED" ? plannedDate : undefined,
        plannedHours: 4,
        actualHours: p.status === "COMPLETED" ? 3.5 : p.status === "PARTIALLY_COMPLETED" ? 2 : undefined,
        responsibleDiscipline: "MECH",
        workCenter: "WC-MECH",
        status: p.status,
        findingsText: p.status === "PARTIALLY_COMPLETED" ? "Vibration slightly above baseline; re-check next cycle." : undefined,
      },
    });

    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: equipmentIds[p.tag],
        eventDate: plannedDate,
        eventType: "PM",
        sourceId: wo.id,
        title: `PM — ${p.pmType}`,
        summary: `Status: ${p.status}`,
      },
    });
  }
  console.log(`Seeded ${pmPlan.length} PM work orders`);

  const cmPlan = [
    { tag: "P-202A", offset: -12, status: "COMPLETED" as const, desc: "Excessive noise from bearing", root: "Bearing wear", downtime: 6 },
    { tag: "ST-103", offset: -7, status: "COMPLETED" as const, desc: "Strainer blocked, differential pressure high", root: "Debris ingress", downtime: 2 },
    { tag: "P-201A", offset: -2, status: "IN_PROGRESS" as const, desc: "Mechanical seal leak", root: undefined, downtime: undefined },
    { tag: "V-402", offset: 0, status: "ASSIGNED" as const, desc: "Valve actuator slow to respond", root: undefined, downtime: undefined },
    { tag: "C-301", offset: -30, status: "COMPLETED" as const, desc: "High vibration trip", root: "Coupling misalignment", downtime: 12 },
  ];

  for (const c of cmPlan) {
    const woNumber = `WO-${woCounter++}`;
    const breakdownDate = daysFromNow(c.offset);
    const wo = await prisma.workOrder.upsert({
      where: { projectId_workOrderNumber: { projectId: project.id, workOrderNumber: woNumber } },
      update: {},
      create: {
        projectId: project.id,
        workOrderNumber: woNumber,
        workCenter: "WC-MECH",
        operationShortText: `CM - ${c.tag}`,
        scope: c.desc,
        equipmentId: equipmentIds[c.tag],
        equipmentSortField: c.tag,
        type: "CM",
        priority: "HIGH",
        plannedStartDate: breakdownDate,
        plannedFinishDate: breakdownDate,
        earliestFinishDate: breakdownDate,
        actualStartDate: c.status !== "PLANNED" ? breakdownDate : undefined,
        actualFinishDate: c.status === "COMPLETED" ? breakdownDate : undefined,
        plannedHours: 6,
        actualHours: c.status === "COMPLETED" ? c.downtime : undefined,
        status: c.status,
      },
    });

    await prisma.cmRecord.create({
      data: {
        projectId: project.id,
        workOrderId: wo.id,
        equipmentId: equipmentIds[c.tag],
        breakdownDate,
        priority: "HIGH",
        failureDescription: c.desc,
        rootCause: c.root,
        actualStart: c.status !== "PLANNED" ? breakdownDate : undefined,
        actualFinish: c.status === "COMPLETED" ? breakdownDate : undefined,
        downtimeHours: c.downtime,
        status: c.status,
      },
    });

    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: equipmentIds[c.tag],
        eventDate: breakdownDate,
        eventType: "CM",
        sourceId: wo.id,
        title: "Breakdown / CM",
        summary: c.desc,
      },
    });
  }
  console.log(`Seeded ${cmPlan.length} CM work orders`);

  return { project, createdUsers, equipmentIds };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
