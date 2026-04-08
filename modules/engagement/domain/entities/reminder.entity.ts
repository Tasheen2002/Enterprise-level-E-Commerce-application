import {
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
} from "../value-objects/index.js";

export interface CreateReminderData {
  type: ReminderType;
  variantId: string;
  userId?: string;
  contact: ContactType;
  channel: ChannelType;
  optInAt?: Date;
}

export interface ReminderEntityData {
  reminderId: string;
  type: ReminderType;
  variantId: string;
  userId?: string;
  contact: ContactType;
  channel: ChannelType;
  optInAt?: Date;
  status: ReminderStatus;
}

export interface ReminderDatabaseRow {
  reminder_id: string;
  type: string;
  variant_id: string;
  user_id: string | null;
  contact: string;
  channel: string;
  opt_in_at: Date | null;
  status: string;
}

export class Reminder {
  private constructor(
    private readonly reminderId: ReminderId,
    private readonly type: ReminderType,
    private readonly variantId: string,
    private readonly contact: ContactType,
    private readonly channel: ChannelType,
    private status: ReminderStatus,
    private userId?: string,
    private optInAt?: Date
  ) {}

  // Factory methods
  static create(data: CreateReminderData): Reminder {
    const reminderId = ReminderId.create();

    if (!data.variantId) {
      throw new Error("Variant ID is required");
    }

    return new Reminder(
      reminderId,
      data.type,
      data.variantId,
      data.contact,
      data.channel,
      ReminderStatus.pending(),
      data.userId,
      data.optInAt
    );
  }

  static reconstitute(data: ReminderEntityData): Reminder {
    const reminderId = ReminderId.fromString(data.reminderId);

    return new Reminder(
      reminderId,
      data.type,
      data.variantId,
      data.contact,
      data.channel,
      data.status,
      data.userId,
      data.optInAt
    );
  }

  static fromDatabaseRow(row: ReminderDatabaseRow): Reminder {
    return new Reminder(
      ReminderId.fromString(row.reminder_id),
      ReminderType.fromString(row.type),
      row.variant_id,
      ContactType.fromString(row.contact),
      ChannelType.fromString(row.channel),
      ReminderStatus.fromString(row.status),
      row.user_id || undefined,
      row.opt_in_at || undefined
    );
  }

  // Getters
  getReminderId(): ReminderId {
    return this.reminderId;
  }

  getType(): ReminderType {
    return this.type;
  }

  getVariantId(): string {
    return this.variantId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getContact(): ContactType {
    return this.contact;
  }

  getChannel(): ChannelType {
    return this.channel;
  }

  getOptInAt(): Date | undefined {
    return this.optInAt;
  }

  getStatus(): ReminderStatus {
    return this.status;
  }

  // Business methods
  optIn(): void {
    this.optInAt = new Date();
  }

  markAsSent(): void {
    this.status = ReminderStatus.sent();
  }

  unsubscribe(): void {
    this.status = ReminderStatus.unsubscribed();
  }

  // Helper methods
  isPending(): boolean {
    return this.status.isPending();
  }

  isSent(): boolean {
    return this.status.isSent();
  }

  isUnsubscribed(): boolean {
    return this.status.isUnsubscribed();
  }

  isRestockReminder(): boolean {
    return this.type.isRestock();
  }

  isPriceDropReminder(): boolean {
    return this.type.isPriceDrop();
  }

  // Convert to data for persistence
  toData(): ReminderEntityData {
    return {
      reminderId: this.reminderId.getValue(),
      type: this.type,
      variantId: this.variantId,
      userId: this.userId,
      contact: this.contact,
      channel: this.channel,
      optInAt: this.optInAt,
      status: this.status,
    };
  }

  toDatabaseRow(): ReminderDatabaseRow {
    return {
      reminder_id: this.reminderId.getValue(),
      type: this.type.getValue(),
      variant_id: this.variantId,
      user_id: this.userId || null,
      contact: this.contact.getValue(),
      channel: this.channel.getValue(),
      opt_in_at: this.optInAt || null,
      status: this.status.getValue(),
    };
  }

  equals(other: Reminder): boolean {
    return this.reminderId.equals(other.reminderId);
  }
}
