import {
  IReminderRepository,
  ReminderQueryOptions,
  ReminderFilterOptions,
} from "../../domain/repositories/reminder.repository.js";
import { Reminder } from "../../domain/entities/reminder.entity.js";
import {
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
} from "../../domain/value-objects/index.js";

export class ReminderManagementService {
  constructor(private readonly reminderRepository: IReminderRepository) {}

  async createReminder(data: {
    type: ReminderType;
    variantId: string;
    userId?: string;
    contact: ContactType;
    channel: ChannelType;
    optInAt?: Date;
  }): Promise<Reminder> {
    const reminder = Reminder.create({
      type: data.type,
      variantId: data.variantId,
      userId: data.userId,
      contact: data.contact,
      channel: data.channel,
      optInAt: data.optInAt,
    });

    await this.reminderRepository.save(reminder);
    return reminder;
  }

  async getReminder(reminderId: string): Promise<Reminder | null> {
    return await this.reminderRepository.findById(
      ReminderId.fromString(reminderId)
    );
  }

  async optInReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(
      ReminderId.fromString(reminderId)
    );

    if (!reminder) {
      throw new Error(`Reminder with ID ${reminderId} not found`);
    }

    reminder.optIn();
    await this.reminderRepository.update(reminder);
  }

  async markReminderAsSent(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(
      ReminderId.fromString(reminderId)
    );

    if (!reminder) {
      throw new Error(`Reminder with ID ${reminderId} not found`);
    }

    reminder.markAsSent();
    await this.reminderRepository.update(reminder);
  }

  async unsubscribeReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepository.findById(
      ReminderId.fromString(reminderId)
    );

    if (!reminder) {
      throw new Error(`Reminder with ID ${reminderId} not found`);
    }

    reminder.unsubscribe();
    await this.reminderRepository.update(reminder);
  }

  async deleteReminder(reminderId: string): Promise<void> {
    const exists = await this.reminderRepository.exists(
      ReminderId.fromString(reminderId)
    );

    if (!exists) {
      throw new Error(`Reminder with ID ${reminderId} not found`);
    }

    await this.reminderRepository.delete(ReminderId.fromString(reminderId));
  }

  async getRemindersByUser(
    userId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findByUserId(userId, options);
  }

  async getRemindersByVariant(
    variantId: string,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findByVariantId(variantId, options);
  }

  async getRemindersByType(
    type: ReminderType,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findByType(type, options);
  }

  async getRemindersByStatus(
    status: ReminderStatus,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findByStatus(status, options);
  }

  async getPendingReminders(
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findPendingReminders(options);
  }

  async getRemindersWithFilters(
    filters: ReminderFilterOptions,
    options?: ReminderQueryOptions
  ): Promise<Reminder[]> {
    return await this.reminderRepository.findWithFilters(filters, options);
  }

  async getAllReminders(options?: ReminderQueryOptions): Promise<Reminder[]> {
    return await this.reminderRepository.findAll(options);
  }

  async countReminders(filters?: ReminderFilterOptions): Promise<number> {
    return await this.reminderRepository.count(filters);
  }

  async countRemindersByType(type: ReminderType): Promise<number> {
    return await this.reminderRepository.countByType(type);
  }

  async countRemindersByStatus(status: ReminderStatus): Promise<number> {
    return await this.reminderRepository.countByStatus(status);
  }

  async reminderExists(reminderId: string): Promise<boolean> {
    return await this.reminderRepository.exists(
      ReminderId.fromString(reminderId)
    );
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
    variantId: string
  ): Promise<Reminder | null> {
    return await this.reminderRepository.findByUserIdAndVariantId(
      userId,
      variantId
    );
  }

  async hasReminderForUserAndVariant(
    userId: string,
    variantId: string
  ): Promise<boolean> {
    return await this.reminderRepository.existsByUserIdAndVariantId(
      userId,
      variantId
    );
  }
}
