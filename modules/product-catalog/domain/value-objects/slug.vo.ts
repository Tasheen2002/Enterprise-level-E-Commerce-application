import { InvalidSlugError } from "../errors";

export class Slug {
  private constructor(private readonly value: string) {
    if (!value) {
      throw new InvalidSlugError("Slug cannot be empty");
    }

    if (!this.isValidSlug(value)) {
      throw new InvalidSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    }
  }

  static create(title: string): Slug {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens and spaces
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return new Slug(slug);
  }

  static fromString(value: string): Slug {
    return new Slug(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }
}
