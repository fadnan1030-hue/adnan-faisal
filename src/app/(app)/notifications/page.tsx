import Link from "next/link";
import { requireSession } from "@/lib/auth-helpers";
import { getCurrentProjectId } from "@/lib/current-project";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, Th, Td, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { buttonSecondaryClass } from "@/components/ui/form";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

export default async function NotificationsPage() {
  const session = await requireSession();
  const projectId = await getCurrentProjectId();
  const now = new Date();

  const [stored, overduePm, overdueCm, overdueActions, overdueSce] = projectId
    ? await Promise.all([
        prisma.notification.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.pmRecord.findMany({
          where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] }, plannedDate: { lt: now } },
          include: { equipment: { select: { tagNumber: true } } },
          orderBy: { plannedDate: "asc" },
          take: 20,
        }),
        prisma.cmRecord.findMany({
          where: { projectId, status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] }, breakdownDate: { lt: now } },
          include: { equipment: { select: { tagNumber: true } } },
          orderBy: { breakdownDate: "asc" },
          take: 20,
        }),
        prisma.action.findMany({
          where: { projectId, status: { in: ["OPEN", "IN_PROGRESS", "ASSIGNED", "PENDING_VERIFICATION"] }, targetDate: { lt: now } },
          orderBy: { targetDate: "asc" },
          take: 20,
        }),
        prisma.sceRecord.findMany({
          where: { projectId, nextDueDate: { lt: now }, status: { notIn: ["COMPLETED", "VERIFIED"] } },
          include: { equipment: { select: { tagNumber: true } } },
          orderBy: { nextDueDate: "asc" },
          take: 20,
        }),
      ])
    : [[], [], [], [], []];

  const alertCount = overduePm.length + overdueCm.length + overdueActions.length + overdueSce.length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Spec section 34 — live alerts for overdue PM/CM, overdue actions and SCE due/overdue, plus assigned notifications."
        actions={
          stored.some((n) => !n.isRead) && (
            <form action={markAllNotificationsRead}>
              <button type="submit" className={buttonSecondaryClass}>
                Mark all read
              </button>
            </form>
          )
        }
      />

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-ink">Live Alerts ({alertCount})</h2>
        <Table>
          <THead>
            <tr>
              <Th>Type</Th>
              <Th>Equipment</Th>
              <Th>Detail</Th>
              <Th>Due</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {alertCount === 0 && <EmptyRow colSpan={5} message="No overdue items. Nice work." />}
            {overduePm.map((r) => (
              <tr key={`pm-${r.id}`}>
                <Td><StatusBadge status="PM_OVERDUE" /></Td>
                <Td>{r.equipment.tagNumber}</Td>
                <Td>{r.pmType ?? "PM"}</Td>
                <Td>{formatDate(r.plannedDate)}</Td>
                <Td>
                  <Link href={`/pm/${r.id}`} className="text-indigo-700 hover:underline text-xs">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
            {overdueCm.map((r) => (
              <tr key={`cm-${r.id}`}>
                <Td><StatusBadge status="CM_OVERDUE" /></Td>
                <Td>{r.equipment.tagNumber}</Td>
                <Td className="max-w-xs truncate">{r.failureDescription ?? "CM"}</Td>
                <Td>{formatDate(r.breakdownDate)}</Td>
                <Td>
                  <Link href={`/cm/${r.id}`} className="text-indigo-700 hover:underline text-xs">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
            {overdueActions.map((r) => (
              <tr key={`action-${r.id}`}>
                <Td><StatusBadge status="ACTION_OVERDUE" /></Td>
                <Td>—</Td>
                <Td className="max-w-xs truncate">{r.description}</Td>
                <Td>{formatDate(r.targetDate)}</Td>
                <Td>
                  <Link href={`/actions/${r.id}`} className="text-indigo-700 hover:underline text-xs">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
            {overdueSce.map((r) => (
              <tr key={`sce-${r.id}`}>
                <Td><StatusBadge status="SCE_OVERDUE" /></Td>
                <Td>{r.equipment.tagNumber}</Td>
                <Td>{r.sceCategory}</Td>
                <Td>{formatDate(r.nextDueDate)}</Td>
                <Td>
                  <Link href={`/sce/${r.id}`} className="text-indigo-700 hover:underline text-xs">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Assigned Notifications</h2>
        <Table>
          <THead>
            <tr>
              <Th>Message</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <TBody>
            {stored.length === 0 && <EmptyRow colSpan={4} />}
            {stored.map((n) => (
              <tr key={n.id}>
                <Td>{n.link ? <Link href={n.link} className="text-indigo-700 hover:underline">{n.message}</Link> : n.message}</Td>
                <Td>{formatDateTime(n.createdAt)}</Td>
                <Td>{n.isRead ? <StatusBadge status="CLOSED" /> : <StatusBadge status="OPEN" />}</Td>
                <Td>
                  {!n.isRead && (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className={buttonSecondaryClass}>
                        Mark read
                      </button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
