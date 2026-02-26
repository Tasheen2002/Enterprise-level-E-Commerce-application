import { MediaAssetId } from "../value-objects/media-asset-id.vo";
import { ProductId } from "../value-objects/product-id.vo";
import { DomainValidationError } from "../errors";
import { EditorialLookId } from "../value-objects/editorial-look-id.vo";

export { EditorialLookId };

export class EditorialLook {
  private constructor(
    private readonly id: EditorialLookId,
    private title: string,
    private storyHtml: string | null,
    private heroAssetId: MediaAssetId | null,
    private publishedAt: Date | null,
    private productIds: Set<ProductId>,
  ) {}

  static create(data: CreateEditorialLookData): EditorialLook {
    const lookId = EditorialLookId.create();

    return new EditorialLook(
      lookId,
      data.title,
      data.storyHtml || null,
      data.heroAssetId ? MediaAssetId.fromString(data.heroAssetId) : null,
      data.publishedAt || null,
      new Set(data.productIds?.map((id) => ProductId.fromString(id)) || []),
    );
  }

  static reconstitute(data: EditorialLookData): EditorialLook {
    return new EditorialLook(
      EditorialLookId.fromString(data.id),
      data.title,
      data.storyHtml,
      data.heroAssetId ? MediaAssetId.fromString(data.heroAssetId) : null,
      data.publishedAt,
      new Set(data.productIds.map((id) => ProductId.fromString(id))),
    );
  }

  static fromDatabaseRow(
    row: EditorialLookRow,
    productIds: string[] = [],
  ): EditorialLook {
    return new EditorialLook(
      EditorialLookId.fromString(row.look_id),
      row.title,
      row.story_html,
      row.hero_asset_id ? MediaAssetId.fromString(row.hero_asset_id) : null,
      row.published_at,
      new Set(productIds.map((id) => ProductId.fromString(id))),
    );
  }

  // Getters
  getId(): EditorialLookId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getStoryHtml(): string | null {
    return this.storyHtml;
  }

  getHeroAssetId(): MediaAssetId | null {
    return this.heroAssetId;
  }

  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  getProductIds(): ProductId[] {
    return Array.from(this.productIds);
  }

  getProductCount(): number {
    return this.productIds.size;
  }

  // Business logic methods
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new DomainValidationError("Title cannot be empty");
    }

    if (newTitle.trim().length > 200) {
      throw new DomainValidationError("Title cannot be longer than 200 characters");
    }

    this.title = newTitle.trim();
  }

  updateStoryHtml(newStoryHtml: string | null): void {
    this.storyHtml = newStoryHtml?.trim() || null;
  }

  setHeroAsset(assetId: string | null): void {
    this.heroAssetId = assetId ? MediaAssetId.fromString(assetId) : null;
  }

  addProduct(productId: string): void {
    const productIdVo = ProductId.fromString(productId);
    this.productIds.add(productIdVo);
  }

  removeProduct(productId: string): void {
    const productIdVo = ProductId.fromString(productId);
    this.productIds.delete(productIdVo);
  }

  clearProducts(): void {
    this.productIds.clear();
  }

  setProducts(productIds: string[]): void {
    this.productIds.clear();
    productIds.forEach((id) => this.addProduct(id));
  }

  publish(): void {
    if (this.isPublished()) {
      return;
    }

    this.publishedAt = new Date();
  }

  unpublish(): void {
    this.publishedAt = null;
  }

  schedulePublication(publishDate: Date): void {
    // Allow any scheduled publication date (past, present, future)
    this.publishedAt = publishDate;
  }

  // Validation methods
  isPublished(): boolean {
    return this.publishedAt !== null && this.publishedAt <= new Date();
  }

  isScheduled(): boolean {
    return this.publishedAt !== null && this.publishedAt > new Date();
  }

  isDraft(): boolean {
    return this.publishedAt === null;
  }

  hasHeroImage(): boolean {
    return this.heroAssetId !== null;
  }

  hasStory(): boolean {
    return this.storyHtml !== null && this.storyHtml.trim().length > 0;
  }

  hasProducts(): boolean {
    return this.productIds.size > 0;
  }

  includesProduct(productId: string): boolean {
    const productIdVo = ProductId.fromString(productId);
    return Array.from(this.productIds).some((id) => id.equals(productIdVo));
  }

  canBePublished(): boolean {
    return this.title.trim().length > 0 && this.hasHeroImage();
  }

  // Convert to data for persistence
  toData(): EditorialLookData {
    return {
      id: this.id.getValue(),
      title: this.title,
      storyHtml: this.storyHtml,
      heroAssetId: this.heroAssetId?.getValue() || null,
      publishedAt: this.publishedAt,
      productIds: Array.from(this.productIds).map((id) => id.getValue()),
    };
  }

  toDatabaseRow(): EditorialLookRow {
    return {
      look_id: this.id.getValue(),
      title: this.title,
      story_html: this.storyHtml,
      hero_asset_id: this.heroAssetId?.getValue() || null,
      published_at: this.publishedAt,
    };
  }

  equals(other: EditorialLook): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateEditorialLookData {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: Date;
  productIds?: string[];
}

export interface EditorialLookData {
  id: string;
  title: string;
  storyHtml: string | null;
  heroAssetId: string | null;
  publishedAt: Date | null;
  productIds: string[];
}

export interface EditorialLookRow {
  look_id: string;
  title: string;
  story_html: string | null;
  hero_asset_id: string | null;
  published_at: Date | null;
}
