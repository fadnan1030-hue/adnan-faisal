import { prisma } from "@/lib/prisma";
import type { AuditAction, SourceModule } from "@prisma/client";

// Spec section 44: every important create/update/delete/status-change must
// be logged with actor, timestamp and before/after values.
export async function writeAuditLog(params: {
  projectId?: string | null;
  entityType: SourceModule;
  entityId: string;
  action: AuditAction;
  actorId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      projectId: params.projectId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId: params.actorId ?? undefined,
      previousValue: params.previousValue === undefined ? undefined : (params.previousValue as object),
      newValue: params.newValue === undefined ? undefined : (params.newValue as object),
    },
  });
}
