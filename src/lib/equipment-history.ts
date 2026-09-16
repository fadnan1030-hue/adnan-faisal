import { prisma } from "@/lib/prisma";
import type { SourceModule } from "@prisma/client";

// Denormalized timeline writer - called alongside PM/CM/Finding/Inspection/
// Action mutations so Equipment > History renders a single ordered query
// instead of fanning out across six tables on every page view.
export async function recordEquipmentHistoryEvent(params: {
  equipmentId: string | null | undefined;
  eventDate: Date;
  eventType: SourceModule;
  sourceId: string;
  title: string;
  summary?: string | null;
}) {
  if (!params.equipmentId) return;

  await prisma.equipmentHistoryEvent.create({
    data: {
      equipmentId: params.equipmentId,
      eventDate: params.eventDate,
      eventType: params.eventType,
      sourceId: params.sourceId,
      title: params.title,
      summary: params.summary ?? undefined,
    },
  });
}
