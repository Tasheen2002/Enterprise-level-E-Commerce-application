import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { WishlistId } from "../value-objects";
import { WishlistItem } from "./wishlist-item.entity";
import {
  DomainValidationError,
  WishlistItemAlreadyExistsError,
  WishlistItemNotFoundError,
} from "../errors/engagement.errors";

// ============================================================================
// Domain Events
// ============================================================================

export class WishlistCreatedEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly userId?: string,
    public readonly guestToken?: string,
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
    public readonly toUserId: string,
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

// ── Item-collection events emitted by the root on items' behalf ──────

export class WishlistItemAddedEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly variantId: string,
  ) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.item_added";
  }

  getPayload(): Record<string, unknown> {
    return { wishlistId: this.wishlistId, variantId: this.variantId };
  }
}

export class WishlistItemRemovedEvent extends DomainEvent {
  constructor(
    public readonly wishlistId: string,
    public readonly variantId: string,
  ) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.item_removed";
  }

  getPayload(): Record<string, unknown> {
    return { wishlistId: this.wishlistId, variantId: this.variantId };
  }
}

export class WishlistClearedEvent extends DomainEvent {
  constructor(public readonly wishlistId: string) {
    super(wishlistId, "Wishlist");
  }

  get eventType(): string {
    return "wishlist.cleared";
  }

  getPayload(): Record<string, unknown> {
    return { wishlistId: this.wishlistId };
  }
}

// ============================================================================
// Props & DTO
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
// Entity
// ============================================================================

// `WishlistItem` is a child entity owned by this aggregate. Mutations to
// the items collection flow through `addItem`/`removeItem`/`clearItems`
// so the root can emit events and bump `updatedAt`. Persistence is by
// `IWishlistRepository.save(wishlist)` — there is no separate
// write-capable item repository.
export class Wishlist extends AggregateRoot {
  private constructor(
    private props: WishlistProps,
    private _items: WishlistItem[] = [],
  ) {
    super();
  }

  static create(
    params: Omit<
      WishlistProps,
      "id" | "createdAt" | "updatedAt" | "isDefault" | "isPublic"
    > & {
      isDefault?: boolean;
      isPublic?: boolean;
    },
  ): Wishlist {
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
        entity.props.guestToken,
      ),
    );

    return entity;
  }

  static fromPersistence(
    props: WishlistProps,
    items: WishlistItem[] = [],
  ): Wishlist {
    return new Wishlist(props, items);
  }

  private static validateOwnership(userId?: string, guestToken?: string): void {
    if (!userId && !guestToken) {
      throw new DomainValidationError(
        "Wishlist must belong to either a user or a guest",
      );
    }
    if (userId && guestToken) {
      throw new DomainValidationError(
        "Wishlist cannot belong to both a user and a guest simultaneously",
      );
    }
  }

  // ── Getters ──────────────────────────────────────────────────────────
  get id(): WishlistId { return this.props.id; }
  get userId(): string | undefined { return this.props.userId; }
  get guestToken(): string | undefined { return this.props.guestToken; }
  get name(): string | undefined { return this.props.name; }
  get isDefault(): boolean { return this.props.isDefault; }
  get isPublic(): boolean { return this.props.isPublic; }
  get description(): string | undefined { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  // Returned readonly to prevent external mutation; use aggregate methods
  // (`addItem`/`removeItem`/`clearItems`) to mutate.
  get items(): readonly WishlistItem[] { return this._items; }

  // ── Business methods (header) ────────────────────────────────────────

  updateName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new DomainValidationError("Wishlist name cannot be empty");
    }
    this.props.name = trimmed;
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  makeDefault(): void {
    this.props.isDefault = true;
    this.touch();
  }

  removeDefault(): void {
    this.props.isDefault = false;
    this.touch();
  }

  makePublic(): void {
    this.props.isPublic = true;
    this.touch();
  }

  makePrivate(): void {
    this.props.isPublic = false;
    this.touch();
  }

  transferToUser(userId: string): void {
    const oldGuestToken = this.props.guestToken;
    this.props.userId = userId;
    this.props.guestToken = undefined;
    this.touch();

    if (oldGuestToken) {
      this.addDomainEvent(
        new WishlistOwnershipTransferredEvent(
          this.props.id.getValue(),
          oldGuestToken,
          userId,
        ),
      );
    }
  }

  // ── Items collection (aggregate methods) ────────────────────────────

  addItem(variantId: string): WishlistItem {
    if (this._items.some((i) => i.variantId === variantId)) {
      throw new WishlistItemAlreadyExistsError(variantId);
    }
    const item = WishlistItem.create({
      wishlistId: this.props.id,
      variantId,
    });
    this._items.push(item);
    this.touch();
    this.addDomainEvent(
      new WishlistItemAddedEvent(this.props.id.getValue(), variantId),
    );
    return item;
  }

  removeItem(variantId: string): void {
    const idx = this._items.findIndex((i) => i.variantId === variantId);
    if (idx === -1) {
      throw new WishlistItemNotFoundError(variantId);
    }
    this._items.splice(idx, 1);
    this.touch();
    this.addDomainEvent(
      new WishlistItemRemovedEvent(this.props.id.getValue(), variantId),
    );
  }

  clearItems(): void {
    if (this._items.length === 0) return;
    this._items = [];
    this.touch();
    this.addDomainEvent(new WishlistClearedEvent(this.props.id.getValue()));
  }

  hasItem(variantId: string): boolean {
    return this._items.some((i) => i.variantId === variantId);
  }

  itemCount(): number {
    return this._items.length;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  isUserWishlist(): boolean {
    return !!this.props.userId;
  }

  isGuestWishlist(): boolean {
    return !!this.props.guestToken;
  }

  equals(other: Wishlist): boolean {
    return this.props.id.equals(other.props.id);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
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
// Supporting Input Types
// ============================================================================

export interface CreateWishlistData {
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  description?: string;
}
