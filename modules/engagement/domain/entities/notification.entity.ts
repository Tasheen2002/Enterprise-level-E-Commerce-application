// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  NotificationId,
  NotificationType,
  ChannelType,
  NotificationStatus,
} from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class NotificationCreatedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly type: string,
    public readonly status: string
  ) {
    super(notificationId, "Notification");
  }

  get eventType(): string {
    return "notification.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      notificationId: this.notificationId,
      type: this.type,
      status: this.status,
    };
  }
}

export class NotificationStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly error?: string
  ) {
    super(notificationId, "Notification");
  }

  get eventType(): string {
    return "notification.status_changed";
  }

  getPayload(): Record<string, unknown> {
    return {
      notificationId: this.notificationId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      error: this.error,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface NotificationProps {
  id: NotificationId;
  type: NotificationType;
  payload: Record<string, any>;
  status: NotificationStatus;
  channel?: ChannelType;
  templateId?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface NotificationDTO {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: string;
  channel?: string;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Notification extends AggregateRoot {
  private constructor(private props: NotificationProps) {
    super();
  }

  static create(
    params: Omit<NotificationProps, "id" | "createdAt" | "updatedAt" | "status">
  ): Notification {
    const entity = new Notification({
      ...params,
      id: NotificationId.create(),
      payload: params.payload || {},
      status: NotificationStatus.pending(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new NotificationCreatedEvent(
        entity.props.id.getValue(),
        entity.props.type.getValue(),
        entity.props.status.getValue()
      )
    );

    return entity;
  }

  static fromPersistence(props: NotificationProps): Notification {
    return new Notification(props);
  }

  // Getters
  get id(): NotificationId {
    return this.props.id;
  }
  get type(): NotificationType {
    return this.props.type;
  }
  get channel(): ChannelType | undefined {
    return this.props.channel;
  }
  get templateId(): string | undefined {
    return this.props.templateId;
  }
  get payload(): Record<string, any> {
    return this.props.payload;
  }
  get status(): NotificationStatus {
    return this.props.status;
  }
  get scheduledAt(): Date | undefined {
    return this.props.scheduledAt;
  }
  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }
  get error(): string | undefined {
    return this.props.error;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  private updateStatus(newStatus: NotificationStatus, error?: string): void {
    const oldStatusLabel = this.props.status.getValue();
    const newStatusLabel = newStatus.getValue();

    if (oldStatusLabel === newStatusLabel && this.props.error === error) return;

    this.props.status = newStatus;
    this.props.error = error;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new NotificationStatusChangedEvent(
        this.props.id.getValue(),
        oldStatusLabel,
        newStatusLabel,
        error
      )
    );
  }

  updatePayload(payload: Record<string, any>): void {
    this.props.payload = { ...this.props.payload, ...payload };
    this.props.updatedAt = new Date();
  }

  schedule(scheduledAt: Date): void {
    if (scheduledAt <= new Date()) {
      throw new DomainValidationError("Scheduled time must be in the future");
    }
    this.props.scheduledAt = scheduledAt;
    this.updateStatus(NotificationStatus.scheduled());
  }

  markAsSending(): void {
    this.updateStatus(NotificationStatus.sending());
  }

  markAsSent(): void {
    this.props.sentAt = new Date();
    this.updateStatus(NotificationStatus.sent());
  }

  markAsFailed(error: string): void {
    this.updateStatus(NotificationStatus.failed(), error);
  }

  retry(): void {
    if (!this.props.status.isFailed()) {
      throw new DomainValidationError("Can only retry failed notifications");
    }
    this.updateStatus(NotificationStatus.pending());
  }

  // Helpers
  isPending(): boolean {
    return this.props.status.isPending();
  }

  isScheduled(): boolean {
    return this.props.status.isScheduled();
  }

  isSending(): boolean {
    return this.props.status.isSending();
  }

  isSent(): boolean {
    return this.props.status.isSent();
  }

  isFailed(): boolean {
    return this.props.status.isFailed();
  }

  isDue(): boolean {
    if (!this.props.scheduledAt) {
      return true;
    }
    return this.props.scheduledAt <= new Date();
  }

  equals(other: Notification): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Notification): NotificationDTO {
    return {
      id: entity.props.id.getValue(),
      type: entity.props.type.getValue(),
      payload: entity.props.payload,
      status: entity.props.status.getValue(),
      channel: entity.props.channel?.getValue(),
      templateId: entity.props.templateId,
      scheduledAt: entity.props.scheduledAt?.toISOString(),
      sentAt: entity.props.sentAt?.toISOString(),
      error: entity.props.error,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateNotificationData {
  type: NotificationType;
  channel?: ChannelType;
  templateId?: string;
  payload?: Record<string, any>;
  scheduledAt?: Date;
}
