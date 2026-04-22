/**
 * Cross-module service interfaces for order management.
 * These define what order-management needs from other modules,
 * decoupling it from their concrete implementations.
 */

// ---- Variant Lookup ----

export interface ExternalVariantData {
  getId(): { getValue(): string };
  getProductId(): { getValue(): string };
  getSku(): { getValue(): string };
  getSize(): string | null;
  getColor(): string | null;
  getWeightG(): number | null;
  getDims(): Record<string, unknown> | null;
}

export interface IExternalVariantService {
  getVariantById(variantId: string): Promise<ExternalVariantData | null>;
}

// ---- Product Lookup ----

export interface ExternalProductData {
  getId(): { getValue(): string };
  getTitle(): string;
  getPrice(): { getValue(): number };
}

export interface IExternalProductService {
  getProductById(productId: string): Promise<ExternalProductData | null>;
}

// ---- Product Media Lookup ----

export interface ExternalMediaAsset {
  isCover: boolean;
  storageKey?: string;
}

export interface IExternalProductMediaService {
  getProductMedia(
    productId: string,
    options?: { coverOnly?: boolean },
  ): Promise<{ mediaAssets: ExternalMediaAsset[] }>;
}

// ---- Stock Management ----

export interface ExternalStockData {
  getStockLevel(): { getAvailable(): number };
}

export interface IExternalStockService {
  getStock(
    variantId: string,
    locationId: string,
  ): Promise<ExternalStockData | null>;
  adjustStock(
    variantId: string,
    locationId: string,
    quantityDelta: number,
    reason: string,
    referenceId?: string,
  ): Promise<unknown>;
  reserveStock(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<unknown>;
}
