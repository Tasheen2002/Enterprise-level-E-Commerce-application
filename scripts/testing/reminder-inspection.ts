import type {
  PrismaClient,
  ReminderTypeEnum,
  ReminderStatusEnum,
  ChannelEnum,
} from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface ReminderSummary {
  scope: "all-reminders";
  total: number;
  groups: Array<{
    type: ReminderTypeEnum;
    status: ReminderStatusEnum;
    channel: ChannelEnum;
    count: number;
  }>;
}

/** Enum groups (at most 24 today), never reminder/user identifiers, contacts or product relations. */
export async function inspectReminders(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: ReminderSummary) => void,
): Promise<void> {
  await runDatabaseInspection<ReminderSummary>(
    env,
    createClient,
    async (prisma) => {
      const rows = await prisma.reminder.groupBy({
        by: ["type", "status", "channel"],
        _count: { _all: true },
        orderBy: [{ type: "asc" }, { status: "asc" }, { channel: "asc" }],
      });
      const groups = rows.map(({ type, status, channel, _count }) => ({
        type,
        status,
        channel,
        count: _count._all,
      }));
      return {
        scope: "all-reminders",
        total: groups.reduce((sum, group) => sum + group.count, 0),
        groups,
      };
    },
    report,
  );
}
