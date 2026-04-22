import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import {
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
} from "../value-objects";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class ReminderCreatedEvent extends DomainEvent {
  constructor(
    public readonly reminderId: string,
    public readonly type: string,
    public readonly variantId: string,
    public readonly userId?: string,
  ) {
    super(reminderId, "Reminder");
  }

  get eventType(): string {
    return "reminder.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      reminderId: this.reminderId,
      type: this.type,
      variantId: this.variantId,
      userId: this.userId,
    };
  }
}

export class ReminderStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly reminderId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {
    super(reminderId, "Reminder");
  }

  get eventType(): string {
    return "reminder.status_changed";
  }

  getPayload(): Record<string, unknown> {
    return {
      reminderId: this.reminderId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface ReminderProps {
  id: ReminderId;
  type: ReminderType;
  variantId: string;
  userId?: string;
  contact: ContactType;
  channel: ChannelType;
  status: ReminderStatus;
  optInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface ReminderDTO {
  id: string;
  type: string;
  variantId: string;
  userId?: string;
  contact: string;
  channel: string;
  status: string;
  optInAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Reminder extends AggregateRoot {
  private constructor(private props: ReminderProps) {
    super();
  }

  static create(
    params: Omit<ReminderProps, "id" | "createdAt" | "updatedAt" | "status">,
  ): Reminder {
    Reminder.validateVariantId(params.variantId);

    const entity = new Reminder({
      ...params,
      id: ReminderId.create(),
      status: ReminderStatus.pending(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new ReminderCreatedEvent(
        entity.props.id.getValue(),
        entity.props.type.getValue(),
        entity.props.variantId,
        entity.props.userId,
      ),
    );

    return entity;
  }

  static fromPersistence(props: ReminderProps): Reminder {
    return new Reminder(props);
  }

  private static validateVariantId(variantId: string): void {
    if (variantId.trim().length === 0) {
      throw new DomainValidationError("Variant ID is required");
    }
  }

  // Getters
  get id(): ReminderId {
    return this.props.id;
  }
  get type(): ReminderType {
    return this.props.type;
  }
  get variantId(): string {
    return this.props.variantId;
  }
  get userId(): string | undefined {
    return this.props.userId;
  }
  get contact(): ContactType {
    return this.props.contact;
  }
  get channel(): ChannelType {
    return this.props.channel;
  }
  get optInAt(): Date | undefined {
    return this.props.optInAt;
  }
  get status(): ReminderStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  private updateStatus(newStatus: ReminderStatus): void {
    const oldStatusLabel = this.props.status.getValue();
    const newStatusLabel = newStatus.getValue();

    if (oldStatusLabel === newStatusLabel) return;

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReminderStatusChangedEvent(
        this.props.id.getValue(),
        oldStatusLabel,
        newStatusLabel,
      ),
    );
  }

  optIn(): void {
    if (!this.props.status.isPending()) {
      throw new InvalidOperationError("Can only opt in to a pending reminder");
    }
    this.props.optInAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsSent(): void {
    if (!this.props.status.isPending()) {
      throw new InvalidOperationError("Can only mark a pending reminder as sent");
    }
    this.updateStatus(ReminderStatus.sent());
  }

  unsubscribe(): void {
    if (this.props.status.isUnsubscribed()) {
      throw new InvalidOperationError("Reminder is already unsubscribed");
    }
    this.updateStatus(ReminderStatus.unsubscribed());
  }

  // Helper methods
  isPending(): boolean {
    return this.props.status.isPending();
  }

  isSent(): boolean {
    return this.props.status.isSent();
  }

  isUnsubscribed(): boolean {
    return this.props.status.isUnsubscribed();
  }

  isRestockReminder(): boolean {
    return this.props.type.isRestock();
  }

  isPriceDropReminder(): boolean {
    return this.props.type.isPriceDrop();
  }

  equals(other: Reminder): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Reminder): ReminderDTO {
    return {
      id: entity.props.id.getValue(),
      type: entity.props.type.getValue(),
      variantId: entity.props.variantId,
      userId: entity.props.userId,
      contact: entity.props.contact.getValue(),
      channel: entity.props.channel.getValue(),
      status: entity.props.status.getValue(),
      optInAt: entity.props.optInAt?.toISOString(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateReminderData {
  type: ReminderType;
  variantId: string;
  userId?: string;
  contact: ContactType;
  channel: ChannelType;
  optInAt?: Date;
}
