import { DomainValidationError } from "../errors/product-catalog.errors";


export enum Region {
  UK = "UK",
  US = "US",
  EU = "EU",
}

const ALL_REGIONS: readonly Region[] = [Region.UK, Region.US, Region.EU];

export namespace Region {
  export function fromString(region: string): Region {
    if (!region || typeof region !== "string") {
      throw new DomainValidationError(
        "Region must be a non-empty string",
      );
    }
    const normalized = region.toUpperCase();
    if (!ALL_REGIONS.includes(normalized as Region)) {
      throw new DomainValidationError(`Invalid region: ${region}`);
    }
    return normalized as Region;
  }

  export function getAllValues(): Region[] {
    return [...ALL_REGIONS];
  }

  export function getDisplayName(region: Region): string {
    switch (region) {
      case Region.UK: return "United Kingdom";
      case Region.US: return "United States";
      case Region.EU: return "European Union";
    }
  }
}
