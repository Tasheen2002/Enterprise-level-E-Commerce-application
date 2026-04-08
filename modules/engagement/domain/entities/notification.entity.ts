import {
  NotificationId,
  NotificationType,
  ChannelType,
  NotificationStatus,
} from "../value-objects/index.js";

export interface CreateNotificationData {
  type: NotificationType;
  channel?: ChannelType;
  templateId?: string;
  payload?: Record<string, any>;
  scheduledAt?: Date;
}

export interface NotificationEntityData {
  notificationId: string;
  type: NotificationType;
  channel?: ChannelType;
  templateId?: string;
  payload: Record<string, any>;
  status?: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
}

export interface NotificationDatabaseRow {
  notification_id: string;
  type: string;
  channel: string | null;
  template_id: string | null;
  payload: Record<string, any>;
  status: string | null;
  scheduled_at: Date | null;
  sent_at: Date | null;
  error: string | null;
}

export class Notification {
  private constructor(
    private readonly notificationId: NotificationId,
    private readonly type: NotificationType,
    private payload: Record<string, any>,
    private status: NotificationStatus,
    private readonly channel?: ChannelType,
    private readonly templateId?: string,
    private scheduledAt?: Date,
    private sentAt?: Date,
    private error?: string
  ) {}

  // Factory methods
  static create(data: CreateNotificationData): Notification {
    const notificationId = NotificationId.create();

    return new Notification(
      notificationId,
      data.type,
      data.payload || {},
      NotificationStatus.pending(),
      data.channel,
      data.templateId,
      data.scheduledAt
    );
  }

  static reconstitute(data: NotificationEntityData): Notification {
    const notificationId = NotificationId.fromString(data.notificationId);

    return new Notification(
      notificationId,
      data.type,
      data.payload,
      data.status || NotificationStatus.pending(),
      data.channel,
      data.templateId,
      data.scheduledAt,
      data.sentAt,
      data.error
    );
  }

  static fromDatabaseRow(row: NotificationDatabaseRow): Notification {
    return new Notification(
      NotificationId.fromString(row.notification_id),
      NotificationType.fromString(row.type),
      row.payload,
      row.status ? NotificationStatus.fromString(row.status) : NotificationStatus.pending(),
      row.channel ? ChannelType.fromString(row.channel) : undefined,
      row.template_id || undefined,
      row.scheduled_at || undefined,
      row.sent_at || undefined,
      row.error || undefined
    );
  }

  // Getters
  getNotificationId(): NotificationId {
    return this.notificationId;
  }

  getType(): NotificationType {
    return this.type;
  }

  getChannel(): ChannelType | undefined {
    return this.channel;
  }

  getTemplateId(): string | undefined {
    return this.templateId;
  }

  getPayload(): Record<string, any> {
    return this.payload;
  }

  getStatus(): NotificationStatus {
    return this.status;
  }

  getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }

  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  getError(): string | undefined {
    return this.error;
  }

  // Business methods
  updatePayload(payload: Record<string, any>): void {
    this.payload = { ...this.payload, ...payload };
  }

  schedule(scheduledAt: Date): void {
    if (scheduledAt <= new Date()) {
      throw new Error("Scheduled time must be in the future");
    }
    this.scheduledAt = scheduledAt;
    this.status = NotificationStatus.scheduled();
  }

  markAsSending(): void {
    this.status = NotificationStatus.sending();
  }

  markAsSent(): void {
    this.status = NotificationStatus.sent();
    this.sentAt = new Date();
    this.error = undefined;
  }

  markAsFailed(error: string): void {
    this.status = NotificationStatus.failed();
    this.error = error;
  }

  retry(): void {
    if (!this.status.isFailed()) {
      throw new Error("Can only retry failed notifications");
    }
    this.status = NotificationStatus.pending();
    this.error = undefined;
  }

  // Helper methods
  isPending(): boolean {
    return this.status.isPending();
  }

  isScheduled(): boolean {
    return this.status.isScheduled();
  }

  isSending(): boolean {
    return this.status.isSending();
  }

  isSent(): boolean {
    return this.status.isSent();
  }

  isFailed(): boolean {
    return this.status.isFailed();
  }

  isDue(): boolean {
    if (!this.scheduledAt) {
      return true;
    }
    return this.scheduledAt <= new Date();
  }

  // Convert to data for persistence
  toData(): NotificationEntityData {
    return {
      notificationId: this.notificationId.getValue(),
      type: this.type,
      channel: this.channel,
      templateId: this.templateId,
      payload: this.payload,
      status: this.status,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      error: this.error,
    };
  }

  toDatabaseRow(): NotificationDatabaseRow {
    return {
      notification_id: this.notificationId.getValue(),
      type: this.type.getValue(),
      channel: this.channel?.getValue() || null,
      template_id: this.templateId || null,
      payload: this.payload,
      status: this.status.getValue(),
      scheduled_at: this.scheduledAt || null,
      sent_at: this.sentAt || null,
      error: this.error || null,
    };
  }

  equals(other: Notification): boolean {
    return this.notificationId.equals(other.notificationId);
  }
}
