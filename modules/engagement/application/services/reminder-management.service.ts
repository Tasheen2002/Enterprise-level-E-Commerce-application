import {
  IReminderRepository,
  ReminderQueryOptions,
  ReminderFilters,
} from "../../domain/repositories/reminder.repository";
import {
  Reminder,
  ReminderDTO,
} from "../../domain/entities/reminder.entity";
import {
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
} from "../../domain/value-objects";
import { ReminderNotFoundError } from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedReminderResult {
  items: ReminderDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class ReminderManagementService {
  constructor(private readonly reminderRepository: IReminderRepository) {}

  async createReminder(data: {
    type: string;
    variantId: string;
    userId?: string;
    contact: string;
    channel: string;
    optInAt?: Date;
  }): Promise<ReminderDTO> {
    const reminder = Reminder.create({
      type: ReminderType.fromString(data.type),
      variantId: data.variantId,
      userId: data.userId,
      contact: ContactType.fromString(data.contact),
      channel: ChannelType.fromString(data.channel),
      optInAt: data.optInAt,
    });

    await this.reminderRepository.save(reminder);
    return Reminder.toDTO(reminder);
  }

  async getReminderById(reminderId: string): Promise<ReminderDTO | null> {
    const entity = await this.reminderRepository.findById(ReminderId.fromString(reminderId));
    return entity ? Reminder.toDTO(entity) : null;
  }

  async optInReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(ReminderId.fromString(reminderId));
    if (!reminder) throw new ReminderNotFoundError(reminderId);
    reminder.optIn();
    await this.reminderRepository.save(reminder);
  }

  async markReminderAsSent(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(ReminderId.fromString(reminderId));
    if (!reminder) throw new ReminderNotFoundError(reminderId);
    reminder.markAsSent();
    await this.reminderRepository.save(reminder);
  }

  async unsubscribeReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(ReminderId.fromString(reminderId));
    if (!reminder) throw new ReminderNotFoundError(reminderId);
    reminder.unsubscribe();
    await this.reminderRepository.save(reminder);
  }

  async deleteReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(ReminderId.fromString(reminderId));
    if (!reminder) throw new ReminderNotFoundError(reminderId);
    await this.reminderRepository.delete(reminder.id);
  }

  async getRemindersByUser(
    userId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findByUserId(userId, options);
    return this.mapPaginated(result);
  }

  async getRemindersByVariant(
    variantId: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findByVariantId(variantId, options);
    return this.mapPaginated(result);
  }

  async getRemindersByType(
    type: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findByType(
      ReminderType.fromString(type),
      options,
    );
    return this.mapPaginated(result);
  }

  async getRemindersByStatus(
    status: string,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findByStatus(
      ReminderStatus.fromString(status),
      options,
    );
    return this.mapPaginated(result);
  }

  async getPendingReminders(options?: ReminderQueryOptions): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findPendingReminders(options);
    return this.mapPaginated(result);
  }

  async getRemindersWithFilters(
    filters: ReminderFilters,
    options?: ReminderQueryOptions,
  ): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findWithFilters(filters, options);
    return this.mapPaginated(result);
  }

  async getAllReminders(options?: ReminderQueryOptions): Promise<PaginatedReminderResult> {
    const result = await this.reminderRepository.findAll(options);
    return this.mapPaginated(result);
  }

  async countReminders(filters?: ReminderFilters): Promise<number> {
    return this.reminderRepository.count(filters);
  }

  async countRemindersByType(type: string): Promise<number> {
    return this.reminderRepository.countByType(ReminderType.fromString(type));
  }

  async countRemindersByStatus(status: string): Promise<number> {
    return this.reminderRepository.countByStatus(ReminderStatus.fromString(status));
  }

  async reminderExists(reminderId: string): Promise<boolean> {
    return this.reminderRepository.exists(ReminderId.fromString(reminderId));
  }

  async hasUserReminders(userId: string): Promise<boolean> {
    const count = await this.reminderRepository.countByUserId(userId);
    return count > 0;
  }

  async hasVariantReminders(variantId: string): Promise<boolean> {
    const count = await this.reminderRepository.countByVariantId(variantId);
    return count > 0;
  }

  async getReminderByUserAndVariant(
    userId: string,
    variantId: string,
  ): Promise<ReminderDTO | null> {
    const entity = await this.reminderRepository.findByUserIdAndVariantId(userId, variantId);
    return entity ? Reminder.toDTO(entity) : null;
  }

  async hasReminderForUserAndVariant(userId: string, variantId: string): Promise<boolean> {
    return this.reminderRepository.existsByUserIdAndVariantId(userId, variantId);
  }

  private mapPaginated(result: PaginatedResult<Reminder>): PaginatedReminderResult {
    return {
      items: result.items.map(Reminder.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
