-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MAINTENANCE_MANAGER', 'MAINTENANCE_ENGINEER', 'SUPERVISOR', 'TECHNICIAN', 'HSE_USER', 'QC_USER', 'MANAGEMENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'STANDBY', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('PM', 'CM');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PARTIALLY_COMPLETED', 'RESCHEDULED', 'CANCELLED', 'OVERDUE', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TrackerStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SceStatus" AS ENUM ('DUE', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'VERIFIED');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('BEFORE', 'DURING', 'DEFECT', 'FINDING', 'REPAIR', 'AFTER', 'NAMEPLATE', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceModule" AS ENUM ('PROJECT', 'EQUIPMENT', 'WORK_ORDER', 'PM', 'CM', 'DAILY_PLANNING', 'INSPECTION', 'FINDING', 'ACTION', 'SCE', 'HSE_INCIDENT', 'HSE_OBSERVATION', 'QC_INSPECTION', 'NCR', 'EMPLOYEE', 'TIMESHEET', 'KPI', 'USER', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "KpiModule" AS ENUM ('MAINTENANCE', 'SCE', 'HSE', 'QC', 'PLANNING');

-- CreateEnum
CREATE TYPE "KpiFormulaType" AS ENUM ('COMPLETION_PCT', 'COMPLIANCE_PCT', 'VARIANCE', 'VARIANCE_PCT', 'WEIGHTED_SCORE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE', 'SICK', 'OFF', 'TRAINING', 'HOLIDAY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('LTI', 'TRIF_RECORDABLE', 'FIRST_AID', 'MEDICAL_TREATMENT', 'NEAR_MISS', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('QC', 'GENERAL', 'SCE', 'HSE');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL', 'PENDING');

-- CreateEnum
CREATE TYPE "NcrSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentEntity" AS ENUM ('EQUIPMENT', 'WORK_ORDER', 'PM', 'CM', 'FINDING', 'ACTION', 'SCE', 'HSE_INCIDENT', 'HSE_OBSERVATION', 'QC_INSPECTION', 'NCR', 'PROJECT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'IMPORT', 'EXPORT', 'STATUS_CHANGE', 'APPROVAL', 'CLOSURE', 'LOGIN', 'PERMISSION_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('JOB_ASSIGNED', 'PM_OVERDUE', 'CM_OVERDUE', 'ACTION_OVERDUE', 'SCE_DUE', 'SCE_OVERDUE', 'QC_INSPECTION_DUE', 'HSE_ACTION_OVERDUE', 'APPROVAL_PENDING', 'FINDING_ASSIGNED', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('UPLOADED', 'MAPPING', 'VALIDATED', 'IMPORTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DuplicateStrategy" AS ENUM ('SKIP', 'UPDATE', 'CREATE_NEW', 'ASK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "contractor" TEXT,
    "contractNumber" TEXT,
    "location" TEXT,
    "projectManager" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "plannedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "ltiFreeStartDate" TIMESTAMP(3),
    "currentPeriodLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigOption" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "craft" TEXT,
    "discipline" TEXT,
    "contractorId" TEXT,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "equipmentType" TEXT,
    "equipmentCategory" TEXT,
    "area" TEXT,
    "unit" TEXT,
    "location" TEXT,
    "system" TEXT,
    "subsystem" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
    "abcIndicator" TEXT,
    "isSce" BOOLEAN NOT NULL DEFAULT false,
    "sceCategory" TEXT,
    "discipline" TEXT,
    "responsibleTeam" TEXT,
    "maintenanceStrategy" TEXT,
    "pmFrequency" TEXT,
    "installationDate" TIMESTAMP(3),
    "commissioningDate" TIMESTAMP(3),
    "operationalStatus" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentHistoryEvent" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" "SourceModule" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "workCenter" TEXT,
    "operationShortText" TEXT,
    "operationDescription" TEXT,
    "scope" TEXT,
    "equipmentId" TEXT,
    "equipmentSortField" TEXT,
    "location" TEXT,
    "abcIndicator" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "type" "WorkOrderType" NOT NULL DEFAULT 'PM',
    "plannedStartDate" TIMESTAMP(3),
    "plannedFinishDate" TIMESTAMP(3),
    "earliestFinishDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualFinishDate" TIMESTAMP(3),
    "plannedHours" DECIMAL(10,2),
    "actualHours" DECIMAL(10,2),
    "responsibleParty" TEXT,
    "contractorId" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "pmType" TEXT,
    "pmFrequency" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "plannedStart" TIMESTAMP(3),
    "plannedFinish" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualFinish" TIMESTAMP(3),
    "plannedHours" DECIMAL(10,2),
    "actualHours" DECIMAL(10,2),
    "responsibleDiscipline" TEXT,
    "workCenter" TEXT,
    "location" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
    "technicianId" TEXT,
    "supervisorId" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
    "findingsText" TEXT,
    "correctiveAction" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "breakdownDate" TIMESTAMP(3) NOT NULL,
    "notificationDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "failureDescription" TEXT,
    "problemStatement" TEXT,
    "finding" TEXT,
    "failureMode" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "spareParts" TEXT,
    "plannedHours" DECIMAL(10,2),
    "actualHours" DECIMAL(10,2),
    "technicianId" TEXT,
    "supervisorId" TEXT,
    "actualStart" TIMESTAMP(3),
    "actualFinish" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
    "downtimeHours" DECIMAL(10,2),
    "productionImpact" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "type" "InspectionType" NOT NULL DEFAULT 'GENERAL',
    "date" TIMESTAMP(3) NOT NULL,
    "inspector" TEXT,
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "workOrderId" TEXT,
    "pmRecordId" TEXT,
    "cmRecordId" TEXT,
    "inspectionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "immediateAction" TEXT,
    "recommendedAction" TEXT,
    "responsiblePerson" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "TrackerStatus" NOT NULL DEFAULT 'OPEN',
    "closureDate" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "findingId" TEXT,
    "workOrderId" TEXT,
    "pmRecordId" TEXT,
    "cmRecordId" TEXT,
    "inspectionId" TEXT,
    "category" "PhotoCategory" NOT NULL DEFAULT 'GENERAL',
    "caption" TEXT,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceModule" "SourceModule" NOT NULL,
    "sourceId" TEXT,
    "equipmentId" TEXT,
    "findingId" TEXT,
    "workOrderId" TEXT,
    "pmRecordId" TEXT,
    "cmRecordId" TEXT,
    "description" TEXT NOT NULL,
    "responsiblePerson" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "status" "TrackerStatus" NOT NULL DEFAULT 'OPEN',
    "closureDate" TIMESTAMP(3),
    "closureEvidence" TEXT,
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hseIncidentId" TEXT,
    "hseObservationId" TEXT,
    "qcInspectionId" TEXT,
    "ncrId" TEXT,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "sceCategory" TEXT NOT NULL,
    "criticalFunction" TEXT,
    "inspectionRequirement" TEXT,
    "testFrequency" TEXT,
    "lastTestDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "status" "SceStatus" NOT NULL DEFAULT 'DUE',
    "complianceStatus" TEXT,
    "responsiblePerson" TEXT,
    "closureStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceInspection" (
    "id" TEXT NOT NULL,
    "sceRecordId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "performedBy" TEXT,
    "finding" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HseIncident" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentType" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "personnelAffected" TEXT,
    "investigationStatus" "TrackerStatus" NOT NULL DEFAULT 'OPEN',
    "rootCause" TEXT,
    "correctiveActions" TEXT,
    "closureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HseIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HseObservation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "observer" TEXT,
    "area" TEXT,
    "equipmentTag" TEXT,
    "category" TEXT,
    "isPositive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "immediateAction" TEXT,
    "correctiveAction" TEXT,
    "responsiblePerson" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "TrackerStatus" NOT NULL DEFAULT 'OPEN',
    "closureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HseObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcInspection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "equipmentTag" TEXT,
    "workOrderId" TEXT,
    "inspectionType" TEXT,
    "inspector" TEXT,
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QcInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ncr" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ncrNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "equipmentTag" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "severity" "NcrSeverity" NOT NULL DEFAULT 'MINOR',
    "responsiblePerson" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "TrackerStatus" NOT NULL DEFAULT 'OPEN',
    "closureDate" TIMESTAMP(3),
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ncr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiDefinition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "module" "KpiModule" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formulaType" "KpiFormulaType" NOT NULL,
    "target" DECIMAL(10,2),
    "unit" TEXT,
    "weight" DECIMAL(5,2),
    "thresholds" JSONB,
    "reportingFrequency" "ReportingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiWeight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "module" "KpiModule" NOT NULL,
    "weightPct" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kpiDefinitionId" TEXT NOT NULL,
    "periodType" "ReportingFrequency" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(10,4),
    "achievedScore" DECIMAL(10,4),
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "normalHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityType" "DocumentEntity" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipmentId" TEXT,
    "workOrderId" TEXT,
    "pmRecordId" TEXT,
    "cmRecordId" TEXT,
    "findingId" TEXT,
    "sceRecordId" TEXT,
    "hseIncidentId" TEXT,
    "hseObservationId" TEXT,
    "qcInspectionId" TEXT,
    "ncrId" TEXT,
    "inspectionId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "entityType" "SourceModule" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sheetName" TEXT,
    "columnMapping" JSONB,
    "duplicateStrategy" "DuplicateStrategy" NOT NULL DEFAULT 'ASK',
    "status" "ImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibleWidgets" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedDashboardAccess" (
    "id" TEXT NOT NULL,
    "dashboardConfigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedDashboardAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ConfigOption_category_active_idx" ON "ConfigOption"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigOption_projectId_category_code_key" ON "ConfigOption"("projectId", "category", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_projectId_name_key" ON "Contractor"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_projectId_active_idx" ON "Employee"("projectId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_projectId_employeeNumber_key" ON "Employee"("projectId", "employeeNumber");

-- CreateIndex
CREATE INDEX "Equipment_projectId_active_idx" ON "Equipment"("projectId", "active");

-- CreateIndex
CREATE INDEX "Equipment_tagNumber_idx" ON "Equipment"("tagNumber");

-- CreateIndex
CREATE INDEX "Equipment_isSce_idx" ON "Equipment"("isSce");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_projectId_tagNumber_key" ON "Equipment"("projectId", "tagNumber");

-- CreateIndex
CREATE INDEX "EquipmentHistoryEvent_equipmentId_eventDate_idx" ON "EquipmentHistoryEvent"("equipmentId", "eventDate");

-- CreateIndex
CREATE INDEX "WorkOrder_projectId_status_idx" ON "WorkOrder"("projectId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_equipmentId_idx" ON "WorkOrder"("equipmentId");

-- CreateIndex
CREATE INDEX "WorkOrder_plannedFinishDate_idx" ON "WorkOrder"("plannedFinishDate");

-- CreateIndex
CREATE INDEX "WorkOrder_type_status_idx" ON "WorkOrder"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_projectId_workOrderNumber_key" ON "WorkOrder"("projectId", "workOrderNumber");

-- CreateIndex
CREATE INDEX "PmRecord_projectId_status_idx" ON "PmRecord"("projectId", "status");

-- CreateIndex
CREATE INDEX "PmRecord_equipmentId_idx" ON "PmRecord"("equipmentId");

-- CreateIndex
CREATE INDEX "PmRecord_plannedDate_idx" ON "PmRecord"("plannedDate");

-- CreateIndex
CREATE INDEX "CmRecord_projectId_status_idx" ON "CmRecord"("projectId", "status");

-- CreateIndex
CREATE INDEX "CmRecord_equipmentId_idx" ON "CmRecord"("equipmentId");

-- CreateIndex
CREATE INDEX "CmRecord_breakdownDate_idx" ON "CmRecord"("breakdownDate");

-- CreateIndex
CREATE INDEX "Inspection_projectId_type_idx" ON "Inspection"("projectId", "type");

-- CreateIndex
CREATE INDEX "Inspection_equipmentId_idx" ON "Inspection"("equipmentId");

-- CreateIndex
CREATE INDEX "Finding_projectId_status_idx" ON "Finding"("projectId", "status");

-- CreateIndex
CREATE INDEX "Finding_equipmentId_idx" ON "Finding"("equipmentId");

-- CreateIndex
CREATE INDEX "Finding_category_idx" ON "Finding"("category");

-- CreateIndex
CREATE INDEX "Finding_targetDate_idx" ON "Finding"("targetDate");

-- CreateIndex
CREATE INDEX "Photo_equipmentId_idx" ON "Photo"("equipmentId");

-- CreateIndex
CREATE INDEX "Photo_findingId_idx" ON "Photo"("findingId");

-- CreateIndex
CREATE INDEX "Photo_category_idx" ON "Photo"("category");

-- CreateIndex
CREATE INDEX "Action_projectId_status_idx" ON "Action"("projectId", "status");

-- CreateIndex
CREATE INDEX "Action_equipmentId_idx" ON "Action"("equipmentId");

-- CreateIndex
CREATE INDEX "Action_targetDate_idx" ON "Action"("targetDate");

-- CreateIndex
CREATE INDEX "Action_sourceModule_sourceId_idx" ON "Action"("sourceModule", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SceRecord_equipmentId_key" ON "SceRecord"("equipmentId");

-- CreateIndex
CREATE INDEX "SceRecord_projectId_status_idx" ON "SceRecord"("projectId", "status");

-- CreateIndex
CREATE INDEX "SceRecord_nextDueDate_idx" ON "SceRecord"("nextDueDate");

-- CreateIndex
CREATE INDEX "SceInspection_sceRecordId_date_idx" ON "SceInspection"("sceRecordId", "date");

-- CreateIndex
CREATE INDEX "HseIncident_projectId_incidentDate_idx" ON "HseIncident"("projectId", "incidentDate");

-- CreateIndex
CREATE INDEX "HseIncident_incidentType_idx" ON "HseIncident"("incidentType");

-- CreateIndex
CREATE INDEX "HseObservation_projectId_status_idx" ON "HseObservation"("projectId", "status");

-- CreateIndex
CREATE INDEX "HseObservation_date_idx" ON "HseObservation"("date");

-- CreateIndex
CREATE INDEX "QcInspection_projectId_date_idx" ON "QcInspection"("projectId", "date");

-- CreateIndex
CREATE INDEX "Ncr_projectId_status_idx" ON "Ncr"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ncr_projectId_ncrNumber_key" ON "Ncr"("projectId", "ncrNumber");

-- CreateIndex
CREATE INDEX "KpiDefinition_projectId_module_active_idx" ON "KpiDefinition"("projectId", "module", "active");

-- CreateIndex
CREATE UNIQUE INDEX "KpiWeight_projectId_module_key" ON "KpiWeight"("projectId", "module");

-- CreateIndex
CREATE INDEX "KpiResult_projectId_periodType_periodStart_idx" ON "KpiResult"("projectId", "periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "KpiResult_kpiDefinitionId_periodType_periodStart_key" ON "KpiResult"("kpiDefinitionId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "Timesheet_projectId_date_idx" ON "Timesheet"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_employeeId_date_key" ON "Timesheet"("employeeId", "date");

-- CreateIndex
CREATE INDEX "Document_entityType_idx" ON "Document"("entityType");

-- CreateIndex
CREATE INDEX "Document_equipmentId_idx" ON "Document"("equipmentId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_projectId_status_idx" ON "ImportJob"("projectId", "status");

-- CreateIndex
CREATE INDEX "ImportError_importJobId_idx" ON "ImportError"("importJobId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardConfig_projectId_name_key" ON "DashboardConfig"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SharedDashboardAccess_dashboardConfigId_userId_key" ON "SharedDashboardAccess"("dashboardConfigId", "userId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigOption" ADD CONSTRAINT "ConfigOption_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentHistoryEvent" ADD CONSTRAINT "EquipmentHistoryEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmRecord" ADD CONSTRAINT "PmRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmRecord" ADD CONSTRAINT "PmRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmRecord" ADD CONSTRAINT "PmRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmRecord" ADD CONSTRAINT "CmRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmRecord" ADD CONSTRAINT "CmRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmRecord" ADD CONSTRAINT "CmRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_pmRecordId_fkey" FOREIGN KEY ("pmRecordId") REFERENCES "PmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_cmRecordId_fkey" FOREIGN KEY ("cmRecordId") REFERENCES "CmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_pmRecordId_fkey" FOREIGN KEY ("pmRecordId") REFERENCES "PmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_cmRecordId_fkey" FOREIGN KEY ("cmRecordId") REFERENCES "CmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_pmRecordId_fkey" FOREIGN KEY ("pmRecordId") REFERENCES "PmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_cmRecordId_fkey" FOREIGN KEY ("cmRecordId") REFERENCES "CmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_hseIncidentId_fkey" FOREIGN KEY ("hseIncidentId") REFERENCES "HseIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_hseObservationId_fkey" FOREIGN KEY ("hseObservationId") REFERENCES "HseObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_qcInspectionId_fkey" FOREIGN KEY ("qcInspectionId") REFERENCES "QcInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "Ncr"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceRecord" ADD CONSTRAINT "SceRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceRecord" ADD CONSTRAINT "SceRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceInspection" ADD CONSTRAINT "SceInspection_sceRecordId_fkey" FOREIGN KEY ("sceRecordId") REFERENCES "SceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HseIncident" ADD CONSTRAINT "HseIncident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HseObservation" ADD CONSTRAINT "HseObservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcInspection" ADD CONSTRAINT "QcInspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiDefinition" ADD CONSTRAINT "KpiDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiWeight" ADD CONSTRAINT "KpiWeight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiResult" ADD CONSTRAINT "KpiResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiResult" ADD CONSTRAINT "KpiResult_kpiDefinitionId_fkey" FOREIGN KEY ("kpiDefinitionId") REFERENCES "KpiDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_pmRecordId_fkey" FOREIGN KEY ("pmRecordId") REFERENCES "PmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_cmRecordId_fkey" FOREIGN KEY ("cmRecordId") REFERENCES "CmRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_hseIncidentId_fkey" FOREIGN KEY ("hseIncidentId") REFERENCES "HseIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_hseObservationId_fkey" FOREIGN KEY ("hseObservationId") REFERENCES "HseObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_qcInspectionId_fkey" FOREIGN KEY ("qcInspectionId") REFERENCES "QcInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "Ncr"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardConfig" ADD CONSTRAINT "DashboardConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedDashboardAccess" ADD CONSTRAINT "SharedDashboardAccess_dashboardConfigId_fkey" FOREIGN KEY ("dashboardConfigId") REFERENCES "DashboardConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedDashboardAccess" ADD CONSTRAINT "SharedDashboardAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
