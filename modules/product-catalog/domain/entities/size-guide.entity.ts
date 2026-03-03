import { DomainValidationError } from "../errors";
import { SizeGuideId } from "../value-objects/size-guide-id.vo";

export { SizeGuideId };

export enum Region {
  UK = "UK",
  US = "US",
  EU = "EU",
}

export class SizeGuide {
  private constructor(
    private readonly id: SizeGuideId,
    private title: string,
    private bodyHtml: string | null,
    private region: Region,
    private category: string | null,
  ) {}

  static create(data: CreateSizeGuideData): SizeGuide {
    const sizeGuideId = SizeGuideId.create();

    return new SizeGuide(
      sizeGuideId,
      data.title,
      data.bodyHtml || null,
      data.region,
      data.category || null,
    );
  }

  static reconstitute(data: SizeGuideData): SizeGuide {
    return new SizeGuide(
      SizeGuideId.fromString(data.id),
      data.title,
      data.bodyHtml,
      data.region,
      data.category,
    );
  }

  static fromDatabaseRow(row: SizeGuideRow): SizeGuide {
    return new SizeGuide(
      SizeGuideId.fromString(row.size_guide_id),
      row.title,
      row.body_html,
      row.region as Region,
      row.category,
    );
  }

  // Getters
  getId(): SizeGuideId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getBodyHtml(): string | null {
    return this.bodyHtml;
  }

  getRegion(): Region {
    return this.region;
  }

  getCategory(): string | null {
    return this.category;
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

  updateBodyHtml(newBodyHtml: string | null): void {
    this.bodyHtml = newBodyHtml?.trim() || null;
  }

  updateRegion(newRegion: Region): void {
    this.region = newRegion;
  }

  updateCategory(newCategory: string | null): void {
    if (newCategory && newCategory.trim().length > 100) {
      throw new DomainValidationError("Category cannot be longer than 100 characters");
    }

    this.category = newCategory?.trim() || null;
  }

  // Validation methods
  isForRegion(region: Region): boolean {
    return this.region === region;
  }

  isForCategory(category: string): boolean {
    return this.category === category;
  }

  isGeneral(): boolean {
    return this.category === null;
  }

  hasContent(): boolean {
    return this.bodyHtml !== null && this.bodyHtml.trim().length > 0;
  }

  // Helper methods for regions
  isUK(): boolean {
    return this.region === Region.UK;
  }

  isUS(): boolean {
    return this.region === Region.US;
  }

  isEU(): boolean {
    return this.region === Region.EU;
  }

  // Convert to data for persistence
  toData(): SizeGuideData {
    return {
      id: this.id.getValue(),
      title: this.title,
      bodyHtml: this.bodyHtml,
      region: this.region,
      category: this.category,
    };
  }

  toDatabaseRow(): SizeGuideRow {
    return {
      size_guide_id: this.id.getValue(),
      title: this.title,
      body_html: this.bodyHtml,
      region: this.region,
      category: this.category,
    };
  }

  equals(other: SizeGuide): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateSizeGuideData {
  title: string;
  bodyHtml?: string;
  region: Region;
  category?: string;
}

export interface SizeGuideData {
  id: string;
  title: string;
  bodyHtml: string | null;
  region: Region;
  category: string | null;
}

export interface SizeGuideRow {
  size_guide_id: string;
  title: string;
  body_html: string | null;
  region: Region;
  category: string | null;
}
