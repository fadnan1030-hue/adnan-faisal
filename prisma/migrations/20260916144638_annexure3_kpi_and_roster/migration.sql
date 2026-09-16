-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "availableMhrsPerWeek" DECIMAL(8,2),
ADD COLUMN     "reportNoBaseDate" TIMESTAMP(3),
ADD COLUMN     "reportNoBaseline" INTEGER,
ADD COLUMN     "rosterDirectQty" INTEGER,
ADD COLUMN     "rosterIndirectQty" INTEGER,
ADD COLUMN     "rosterStandardHours" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "KpiDailyEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ltiOccurred" BOOLEAN NOT NULL DEFAULT false,
    "directEmergencyMH" DECIMAL(8,2),
    "indirectEmergencyMH" DECIMAL(8,2),
    "zeroLeakage" BOOLEAN,
    "noRework" BOOLEAN,
    "trif" DECIMAL(6,2),
    "ptwPct" DECIMAL(5,2),
    "lsrViolations" INTEGER,
    "otherLsrPct" DECIMAL(5,2),
    "lsrCloseoutPct" DECIMAL(5,2),
    "safetyObsPct" DECIMAL(5,2),
    "leadershipWalkPct" DECIMAL(5,2),
    "vehicleIncidents" INTEGER,
    "securityViolations" INTEGER,
    "spills" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KpiDailyEntry_projectId_date_idx" ON "KpiDailyEntry"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "KpiDailyEntry_projectId_date_key" ON "KpiDailyEntry"("projectId", "date");

-- AddForeignKey
ALTER TABLE "KpiDailyEntry" ADD CONSTRAINT "KpiDailyEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
