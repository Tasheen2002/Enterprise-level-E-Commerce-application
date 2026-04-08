import {
  SubscriptionId,
  SubscriptionStatus,
} from "../value-objects/index.js";

export interface CreateNewsletterSubscriptionData {
  email: string;
  source?: string;
}

export interface NewsletterSubscriptionEntityData {
  subscriptionId: string;
  email: string;
  status: SubscriptionStatus;
  source?: string;
  createdAt: Date;
}

export interface NewsletterSubscriptionDatabaseRow {
  subscription_id: string;
  email: string;
  status: string | null;
  source: string | null;
  created_at: Date;
}

export class NewsletterSubscription {
  private constructor(
    private readonly subscriptionId: SubscriptionId,
    private readonly email: string,
    private status: SubscriptionStatus,
    private readonly createdAt: Date,
    private readonly source?: string
  ) {}

  // Factory methods
  static create(data: CreateNewsletterSubscriptionData): NewsletterSubscription {
    const subscriptionId = SubscriptionId.create();

    if (!data.email) {
      throw new Error("Email is required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    return new NewsletterSubscription(
      subscriptionId,
      data.email.toLowerCase().trim(),
      SubscriptionStatus.active(),
      new Date(),
      data.source
    );
  }

  static reconstitute(data: NewsletterSubscriptionEntityData): NewsletterSubscription {
    const subscriptionId = SubscriptionId.fromString(data.subscriptionId);

    return new NewsletterSubscription(
      subscriptionId,
      data.email,
      data.status,
      data.createdAt,
      data.source
    );
  }

  static fromDatabaseRow(row: NewsletterSubscriptionDatabaseRow): NewsletterSubscription {
    return new NewsletterSubscription(
      SubscriptionId.fromString(row.subscription_id),
      row.email,
      row.status ? SubscriptionStatus.fromString(row.status) : SubscriptionStatus.active(),
      row.created_at,
      row.source || undefined
    );
  }

  // Getters
  getSubscriptionId(): SubscriptionId {
    return this.subscriptionId;
  }

  getEmail(): string {
    return this.email;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getSource(): string | undefined {
    return this.source;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business methods
  activate(): void {
    this.status = SubscriptionStatus.active();
  }

  unsubscribe(): void {
    this.status = SubscriptionStatus.unsubscribed();
  }

  bounce(): void {
    this.status = SubscriptionStatus.bounced();
  }

  markAsSpam(): void {
    this.status = SubscriptionStatus.spam();
  }

  // Helper methods
  isActive(): boolean {
    return this.status.isActive();
  }

  isUnsubscribed(): boolean {
    return this.status.isUnsubscribed();
  }

  isBounced(): boolean {
    return this.status.isBounced();
  }

  isSpam(): boolean {
    return this.status.isSpam();
  }

  canReceiveEmails(): boolean {
    return this.status.canReceiveEmails();
  }

  // Convert to data for persistence
  toData(): NewsletterSubscriptionEntityData {
    return {
      subscriptionId: this.subscriptionId.getValue(),
      email: this.email,
      status: this.status,
      source: this.source,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): NewsletterSubscriptionDatabaseRow {
    return {
      subscription_id: this.subscriptionId.getValue(),
      email: this.email,
      status: this.status.getValue(),
      source: this.source || null,
      created_at: this.createdAt,
    };
  }

  equals(other: NewsletterSubscription): boolean {
    return this.subscriptionId.equals(other.subscriptionId);
  }
}
