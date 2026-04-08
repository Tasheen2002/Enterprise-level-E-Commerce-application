import {
  EventId,
  SessionId,
  EventType,
  UserContext,
  ProductReference,
} from "../value-objects";

export interface AnalyticsEventMetadata {
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface CreateAnalyticsEventData {
  eventType: EventType;
  userContext: UserContext;
  sessionId: SessionId;
  productReference?: ProductReference;
  cartId?: string;
  eventData?: Record<string, any>;
  metadata?: AnalyticsEventMetadata;
}

export interface ReconstituteAnalyticsEventData {
  eventId: string;
  eventType: string;
  userId?: string;
  guestToken?: string;
  sessionId: string;
  productId?: string;
  variantId?: string;
  cartId?: string;
  eventData?: any;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  eventTimestamp: Date;
  createdAt: Date;
}

export class AnalyticsEvent {
  private constructor(
    private readonly eventId: EventId,
    private readonly eventType: EventType,
    private readonly userContext: UserContext,
    private readonly sessionId: SessionId,
    private readonly productReference: ProductReference | undefined,
    private readonly cartId: string | undefined,
    private readonly eventData: Record<string, any> | undefined,
    private readonly metadata: AnalyticsEventMetadata,
    private readonly eventTimestamp: Date,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateAnalyticsEventData): AnalyticsEvent {
    const now = new Date();

    return new AnalyticsEvent(
      EventId.generate(),
      data.eventType,
      data.userContext,
      data.sessionId,
      data.productReference,
      data.cartId,
      data.eventData,
      data.metadata || {},
      now,
      now
    );
  }

  static reconstitute(data: ReconstituteAnalyticsEventData): AnalyticsEvent {
    const userContext = data.userId
      ? UserContext.forUser(data.userId)
      : UserContext.forGuest(data.guestToken!);

    // Handle optional product reference reconstitution
    const productReference = data.productId
      ? ProductReference.create(data.productId, data.variantId)
      : undefined;

    return new AnalyticsEvent(
      EventId.create(data.eventId),
      EventType.create(data.eventType),
      userContext,
      SessionId.create(data.sessionId),
      productReference,
      data.cartId,
      data.eventData,
      {
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        referrer: data.referrer,
      },
      data.eventTimestamp,
      data.createdAt
    );
  }

  // Getters
  getEventId(): EventId {
    return this.eventId;
  }

  getEventType(): EventType {
    return this.eventType;
  }

  getUserContext(): UserContext {
    return this.userContext;
  }

  getSessionId(): SessionId {
    return this.sessionId;
  }

  getProductReference(): ProductReference | undefined {
    return this.productReference;
  }

  getCartId(): string | undefined {
    return this.cartId;
  }

  getEventData(): Record<string, any> | undefined {
    return this.eventData;
  }

  getMetadata(): AnalyticsEventMetadata {
    return this.metadata;
  }

  getEventTimestamp(): Date {
    return this.eventTimestamp;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business methods
  isProductView(): boolean {
    return this.eventType.isProductView();
  }

  isPurchase(): boolean {
    return this.eventType.isPurchase();
  }

  isFromAuthenticatedUser(): boolean {
    return this.userContext.isAuthenticated();
  }

  isFromGuest(): boolean {
    return this.userContext.isGuest();
  }

  // Persistence mapping
  toDatabaseRow(): any {
    return {
      event_id: this.eventId.getValue(),
      event_type: this.eventType.getValue(),
      user_id: this.userContext.getUserId() || null,
      guest_token: this.userContext.getGuestToken() || null,
      session_id: this.sessionId.getValue(),
      product_id: this.productReference?.getProductId() || null,
      variant_id: this.productReference?.getVariantId() || null,
      cart_id: this.cartId || null,
      event_data: this.eventData || null,
      user_agent: this.metadata.userAgent || null,
      ip_address: this.metadata.ipAddress || null,
      referrer: this.metadata.referrer || null,
      event_timestamp: this.eventTimestamp,
      created_at: this.createdAt,
    };
  }
}
