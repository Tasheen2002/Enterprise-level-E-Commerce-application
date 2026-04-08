import { WishlistId } from "../value-objects/index.js";

export interface CreateWishlistData {
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  description?: string;
}

export interface WishlistEntityData {
  wishlistId: string;
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault: boolean;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistDatabaseRow {
  wishlist_id: string;
  user_id: string | null;
  guest_token: string | null;
  name: string | null;
  is_default: boolean;
  is_public: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export class Wishlist {
  private constructor(
    private readonly wishlistId: WishlistId,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private userId?: string,
    private guestToken?: string,
    private name?: string,
    private isDefault: boolean = false,
    private isPublic: boolean = false,
    private description?: string
  ) {}

  // Factory methods
  static create(data: CreateWishlistData): Wishlist {
    const wishlistId = WishlistId.create();

    // Validation: must have either userId or guestToken
    if (!data.userId && !data.guestToken) {
      throw new Error("Wishlist must belong to either a user or a guest");
    }

    // Validation: cannot have both userId and guestToken
    if (data.userId && data.guestToken) {
      throw new Error("Wishlist cannot belong to both a user and a guest");
    }

    const now = new Date();

    return new Wishlist(
      wishlistId,
      now,
      now,
      data.userId,
      data.guestToken,
      data.name,
      data.isDefault || false,
      data.isPublic || false,
      data.description
    );
  }

  static reconstitute(data: WishlistEntityData): Wishlist {
    const wishlistId = WishlistId.fromString(data.wishlistId);

    return new Wishlist(
      wishlistId,
      data.createdAt,
      data.updatedAt,
      data.userId,
      data.guestToken,
      data.name,
      data.isDefault,
      data.isPublic,
      data.description
    );
  }

  static fromDatabaseRow(row: WishlistDatabaseRow): Wishlist {
    return new Wishlist(
      WishlistId.fromString(row.wishlist_id),
      row.created_at,
      row.updated_at,
      row.user_id || undefined,
      row.guest_token || undefined,
      row.name || undefined,
      row.is_default,
      row.is_public,
      row.description || undefined
    );
  }

  // Getters
  getWishlistId(): WishlistId {
    return this.wishlistId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getGuestToken(): string | undefined {
    return this.guestToken;
  }

  getName(): string | undefined {
    return this.name;
  }

  getIsDefault(): boolean {
    return this.isDefault;
  }

  getIsPublic(): boolean {
    return this.isPublic;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  updateName(name: string): void {
    this.name = name.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.description = description?.trim();
    this.touch();
  }

  makeDefault(): void {
    this.isDefault = true;
    this.touch();
  }

  removeDefault(): void {
    this.isDefault = false;
    this.touch();
  }

  makePublic(): void {
    this.isPublic = true;
    this.touch();
  }

  makePrivate(): void {
    this.isPublic = false;
    this.touch();
  }

  transferToUser(userId: string): void {
    if (!userId) {
      throw new Error("User ID cannot be empty");
    }

    this.userId = userId;
    this.guestToken = undefined;
    this.touch();
  }

  // Helper methods
  isUserWishlist(): boolean {
    return !!this.userId;
  }

  isGuestWishlist(): boolean {
    return !!this.guestToken;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to data for persistence
  toData(): WishlistEntityData {
    return {
      wishlistId: this.wishlistId.getValue(),
      userId: this.userId,
      guestToken: this.guestToken,
      name: this.name,
      isDefault: this.isDefault,
      isPublic: this.isPublic,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): WishlistDatabaseRow {
    return {
      wishlist_id: this.wishlistId.getValue(),
      user_id: this.userId || null,
      guest_token: this.guestToken || null,
      name: this.name || null,
      is_default: this.isDefault,
      is_public: this.isPublic,
      description: this.description || null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  equals(other: Wishlist): boolean {
    return this.wishlistId.equals(other.wishlistId);
  }
}
