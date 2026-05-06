import { InvalidSlugError } from "../errors";

export class Slug {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  private constructor(private readonly value: string) {
    if (!value) {
      throw new InvalidSlugError("Slug cannot be empty");
    }
    if (!Slug.isValidSlug(value)) {
      throw new InvalidSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    }
  }

  static create(title: string): Slug {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

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

  private static isValidSlug(slug: string): boolean {
    return Slug.SLUG_REGEX.test(slug);
  }
}
