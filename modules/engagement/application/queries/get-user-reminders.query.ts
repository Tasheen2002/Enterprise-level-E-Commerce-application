import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService, PaginatedReminderResult } from "../services/reminder-management.service";

export interface GetUserRemindersQuery extends IQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetUserRemindersHandler implements IQueryHandler<GetUserRemindersQuery, PaginatedReminderResult> {
  constructor(private readonly reminderManagementService: ReminderManagementService) {}

  async handle(query: GetUserRemindersQuery): Promise<PaginatedReminderResult> {
    return this.reminderManagementService.getRemindersByUser(
      query.userId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
