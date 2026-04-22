// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { WishlistId } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class WishlistCreatedEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly userId?: string,
    public readonly guestToken?: string
  ) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      wishlistId: this.wishlistId,
      userId: this.userId,
      guestToken: this.guestToken,
    };
  }
}

export class WishlistOwnershipTransferredEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly fromGuestToken: string,
    public readonly toUserId: string
  ) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.ownership_transferred";
  }

  getPayload(): Record<string, unknown> {
    return {
      wishlistId: this.wishlistId,
      fromGuestToken: this.fromGuestToken,
      toUserId: this.toUserId,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface WishlistProps {
  id: WishlistId;
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault: boolean;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface WishlistDTO {
  id: string;
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault: boolean;
  isPublic: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Wishlist extends AggregateRoot {
  private constructor(private props: WishlistProps) {
    super();
  }

  static create(params: Omit<WishlistProps, "id" | "createdAt" | "updatedAt" | "isDefault" | "isPublic"> & { isDefault?: boolean; isPublic?: boolean }): Wishlist {
    Wishlist.validateOwnership(params.userId, params.guestToken);

    const entity = new Wishlist({
      ...params,
      id: WishlistId.create(),
      isDefault: params.isDefault ?? false,
      isPublic: params.isPublic ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new WishlistCreatedEvent(
        entity.props.id.getValue(),
        entity.props.userId,
        entity.props.guestToken
      )
    );

    return entity;
  }

  static fromPersistence(props: WishlistProps): Wishlist {
    return new Wishlist(props);
  }

  private static validateOwnership(userId?: string, guestToken?: string): void {
    if (!userId && !guestToken) {
      throw new DomainValidationError(
        "Wishlist must belong to either a user or a guest"
      );
    }
    if (userId && guestToken) {
      throw new DomainValidationError(
        "Wishlist cannot belong to both a user and a guest simultaneously"
      );
    }
  }

  // Getters
  get id(): WishlistId {
    return this.props.id;
  }
  get userId(): string | undefined {
    return this.props.userId;
  }
  get guestToken(): string | undefined {
    return this.props.guestToken;
  }
  get name(): string | undefined {
    return this.props.name;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get isPublic(): boolean {
    return this.props.isPublic;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new DomainValidationError("Wishlist name cannot be empty");
    }
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.props.updatedAt = new Date();
  }

  makeDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  removeDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  makePublic(): void {
    this.props.isPublic = true;
    this.props.updatedAt = new Date();
  }

  makePrivate(): void {
    this.props.isPublic = false;
    this.props.updatedAt = new Date();
  }

  transferToUser(userId: string): void {
    const oldGuestToken = this.props.guestToken;
    this.props.userId = userId;
    this.props.guestToken = undefined;
    this.props.updatedAt = new Date();

    if (oldGuestToken) {
      this.addDomainEvent(
        new WishlistOwnershipTransferredEvent(
          this.props.id.getValue(),
          oldGuestToken,
          userId
        )
      );
    }
  }

  // Helper methods
  isUserWishlist(): boolean {
    return !!this.props.userId;
  }

  isGuestWishlist(): boolean {
    return !!this.props.guestToken;
  }

  equals(other: Wishlist): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Wishlist): WishlistDTO {
    return {
      id: entity.props.id.getValue(),
      userId: entity.props.userId,
      guestToken: entity.props.guestToken,
      name: entity.props.name,
      isDefault: entity.props.isDefault,
      isPublic: entity.props.isPublic,
      description: entity.props.description,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateWishlistData {
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  description?: string;
}
