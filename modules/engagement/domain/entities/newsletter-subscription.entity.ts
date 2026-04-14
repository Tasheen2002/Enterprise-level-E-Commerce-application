// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { SubscriptionId, SubscriptionStatus } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class SubscriptionCreatedEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly email: string,
    public readonly source?: string
  ) {
    super(subscriptionId, "Subscription");
  }

  get eventType(): string {
    return "subscription.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.subscriptionId,
      email: this.email,
      source: this.source,
    };
  }
}

export class SubscriptionStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super(subscriptionId, "Subscription");
  }

  get eventType(): string {
    return "subscription.status_changed";
  }

  getPayload(): Record<string, unknown> {
    return {
      subscriptionId: this.subscriptionId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface SubscriptionProps {
  id: SubscriptionId;
  email: string;
  status: SubscriptionStatus;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface SubscriptionDTO {
  id: string;
  email: string;
  status: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class NewsletterSubscription extends AggregateRoot {
  private constructor(private props: SubscriptionProps) {
    super();
  }

  static create(params: Omit<SubscriptionProps, "id" | "createdAt" | "updatedAt">): NewsletterSubscription {
    NewsletterSubscription.validateEmail(params.email);

    const entity = new NewsletterSubscription({
      id: SubscriptionId.create(),
      email: params.email.toLowerCase().trim(),
      status: SubscriptionStatus.active(),
      source: params.source,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new SubscriptionCreatedEvent(
        entity.props.id.getValue(),
        entity.props.email,
        entity.props.source
      )
    );

    return entity;
  }

  static fromPersistence(props: SubscriptionProps): NewsletterSubscription {
    return new NewsletterSubscription(props);
  }

  private static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new DomainValidationError("Email is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new DomainValidationError("Invalid email format");
    }
  }

  // Getters
  get id(): SubscriptionId {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get status(): SubscriptionStatus {
    return this.props.status;
  }
  get source(): string | undefined {
    return this.props.source;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  private updateStatus(newStatus: SubscriptionStatus): void {
    const oldStatusLabel = this.props.status.getValue();
    const newStatusLabel = newStatus.getValue();

    if (oldStatusLabel === newStatusLabel) return;

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new SubscriptionStatusChangedEvent(
        this.props.id.getValue(),
        oldStatusLabel,
        newStatusLabel
      )
    );
  }

  activate(): void {
    this.updateStatus(SubscriptionStatus.active());
  }

  unsubscribe(): void {
    this.updateStatus(SubscriptionStatus.unsubscribed());
  }

  bounce(): void {
    this.updateStatus(SubscriptionStatus.bounced());
  }

  markAsSpam(): void {
    this.updateStatus(SubscriptionStatus.spam());
  }

  // Helpers
  isActive(): boolean {
    return this.props.status.isActive();
  }

  isUnsubscribed(): boolean {
    return this.props.status.isUnsubscribed();
  }

  isBounced(): boolean {
    return this.props.status.isBounced();
  }

  isSpam(): boolean {
    return this.props.status.isSpam();
  }

  canReceiveEmails(): boolean {
    return this.props.status.canReceiveEmails();
  }

  equals(other: NewsletterSubscription): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: NewsletterSubscription): SubscriptionDTO {
    return {
      id: entity.props.id.getValue(),
      email: entity.props.email,
      status: entity.props.status.getValue(),
      source: entity.props.source,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateNewsletterSubscriptionData {
  email: string;
  source?: string;
}
