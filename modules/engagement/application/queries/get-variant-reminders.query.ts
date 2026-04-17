import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService, PaginatedReminderResult } from "../services/reminder-management.service";

export interface GetVariantRemindersQuery extends IQuery {
  readonly variantId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetVariantRemindersHandler implements IQueryHandler<GetVariantRemindersQuery, PaginatedReminderResult> {
  constructor(private readonly reminderManagementService: ReminderManagementService) {}

  async handle(query: GetVariantRemindersQuery): Promise<PaginatedReminderResult> {
    return this.reminderManagementService.getRemindersByVariant(
      query.variantId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
