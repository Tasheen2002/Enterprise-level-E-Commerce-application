import { VariantId } from "../value-objects/variant-id.vo";
import { ProductId } from "../value-objects/product-id.vo";
import { SKU } from "../value-objects/sku.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

export class ProductVariant {
  private constructor(
    private readonly id: VariantId,
    private readonly productId: ProductId,
    private sku: SKU,
    private size: string | null,
    private color: string | null,
    private barcode: string | null,
    private weightG: number | null,
    private dims: Record<string, any> | null,
    private taxClass: string | null,
    private allowBackorder: boolean,
    private allowPreorder: boolean,
    private restockEta: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(data: CreateVariantData): ProductVariant {
    const variantId = VariantId.create();
    const sku = data.sku
      ? SKU.fromString(data.sku)
      : SKU.create(data.autoSkuValue || "");
    const now = new Date();

    return new ProductVariant(
      variantId,
      ProductId.fromString(data.productId),
      sku,
      data.size || null,
      data.color || null,
      data.barcode || null,
      data.weightG || null,
      data.dims || null,
      data.taxClass || null,
      data.allowBackorder || false,
      data.allowPreorder || false,
      data.restockEta || null,
      now,
      now,
    );
  }

  static reconstitute(data: VariantData): ProductVariant {
    return new ProductVariant(
      VariantId.fromString(data.id),
      ProductId.fromString(data.productId),
      SKU.fromString(data.sku),
      data.size,
      data.color,
      data.barcode,
      data.weightG,
      data.dims,
      data.taxClass,
      data.allowBackorder,
      data.allowPreorder,
      data.restockEta,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromDatabaseRow(row: VariantRow): ProductVariant {
    return new ProductVariant(
      VariantId.fromString(row.variant_id),
      ProductId.fromString(row.product_id),
      SKU.fromString(row.sku),
      row.size,
      row.color,
      row.barcode,
      row.weight_g,
      row.dims,
      row.tax_class,
      row.allow_backorder,
      row.allow_preorder,
      row.restock_eta,
      row.created_at,
      row.updated_at,
    );
  }

  // Getters
  getId(): VariantId {
    return this.id;
  }

  getProductId(): ProductId {
    return this.productId;
  }

  getSku(): SKU {
    return this.sku;
  }

  getSize(): string | null {
    return this.size;
  }

  getColor(): string | null {
    return this.color;
  }

  getBarcode(): string | null {
    return this.barcode;
  }

  getWeightG(): number | null {
    return this.weightG;
  }

  getDims(): Record<string, any> | null {
    return this.dims;
  }

  getTaxClass(): string | null {
    return this.taxClass;
  }

  getAllowBackorder(): boolean {
    return this.allowBackorder;
  }

  getAllowPreorder(): boolean {
    return this.allowPreorder;
  }

  getRestockEta(): Date | null {
    return this.restockEta;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  updateSku(newSku: string): void {
    this.sku = SKU.fromString(newSku);
    this.touch();
  }

  updateSize(newSize: string | null): void {
    this.size = newSize?.trim() || null;
    this.touch();
  }

  updateColor(newColor: string | null): void {
    this.color = newColor?.trim() || null;
    this.touch();
  }

  updateBarcode(newBarcode: string | null): void {
    this.barcode = newBarcode?.trim() || null;
    this.touch();
  }

  updateWeight(newWeightG: number | null): void {
    if (newWeightG !== null && newWeightG < 0) {
      throw new DomainValidationError("Weight cannot be negative");
    }
    this.weightG = newWeightG;
    this.touch();
  }

  updateDimensions(newDims: Record<string, any> | null): void {
    this.dims = newDims;
    this.touch();
  }

  updateTaxClass(newTaxClass: string | null): void {
    this.taxClass = newTaxClass?.trim() || null;
    this.touch();
  }

  setBackorderPolicy(allowBackorder: boolean): void {
    this.allowBackorder = allowBackorder;
    this.touch();
  }

  setPreorderPolicy(allowPreorder: boolean): void {
    this.allowPreorder = allowPreorder;
    this.touch();
  }

  setRestockEta(restockEta: Date | null): void {
    if (restockEta && restockEta <= new Date()) {
      throw new InvalidOperationError("Restock ETA must be in the future");
    }
    this.restockEta = restockEta;
    this.touch();
  }

  isAvailableForBackorder(): boolean {
    return this.allowBackorder;
  }

  isAvailableForPreorder(): boolean {
    return this.allowPreorder;
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to data for persistence
  toData(): VariantData {
    return {
      id: this.id.getValue(),
      productId: this.productId.getValue(),
      sku: this.sku.getValue(),
      size: this.size,
      color: this.color,
      barcode: this.barcode,
      weightG: this.weightG,
      dims: this.dims,
      taxClass: this.taxClass,
      allowBackorder: this.allowBackorder,
      allowPreorder: this.allowPreorder,
      restockEta: this.restockEta,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): VariantRow {
    return {
      variant_id: this.id.getValue(),
      product_id: this.productId.getValue(),
      sku: this.sku.getValue(),
      size: this.size,
      color: this.color,
      barcode: this.barcode,
      weight_g: this.weightG,
      dims: this.dims,
      tax_class: this.taxClass,
      allow_backorder: this.allowBackorder,
      allow_preorder: this.allowPreorder,
      restock_eta: this.restockEta,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  equals(other: ProductVariant): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateVariantData {
  productId: string;
  sku?: string;
  autoSkuValue?: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: Record<string, any>;
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
}

export interface VariantData {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  weightG: number | null;
  dims: Record<string, any> | null;
  taxClass: string | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  restockEta: Date | null;
  createdAt: Date;
  updatedAt: Date;
  onHand?: number;
  inventory?: number;
}

export interface VariantRow {
  variant_id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  weight_g: number | null;
  dims: Record<string, any> | null;
  tax_class: string | null;
  allow_backorder: boolean;
  allow_preorder: boolean;
  restock_eta: Date | null;
  created_at: Date;
  updated_at: Date;
}
