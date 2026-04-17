import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ReminderManagementService } from "../services/reminder-management.service";
import { ReminderDTO } from "../../domain/entities/reminder.entity";
import { ReminderNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetReminderQuery extends IQuery {
  readonly reminderId: string;
}

export class GetReminderHandler implements IQueryHandler<GetReminderQuery, ReminderDTO> {
  constructor(private readonly reminderManagementService: ReminderManagementService) {}

  async handle(query: GetReminderQuery): Promise<ReminderDTO> {
    const dto = await this.reminderManagementService.getReminderById(query.reminderId);
    if (!dto) {
      throw new ReminderNotFoundError(query.reminderId);
    }
    return dto;
  }
}
