import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { VariantId } from "../value-objects/variant-id.vo";
import { ProductId } from "../value-objects/product-id.vo";
import { SKU } from "../value-objects/sku.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class VariantCreatedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly productId: string,
  ) {
    super(variantId, 'ProductVariant');
  }
  get eventType(): string { return 'product-variant.created'; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, productId: this.productId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

// Variant physical dimensions in millimetres (consumers may use any unit
// internally — the field name documents the intended meaning).
export interface VariantDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface ProductVariantProps {
  id: VariantId;
  productId: ProductId;
  sku: SKU;
  size: string | null;
  color: string | null;
  barcode: string | null;
  weightG: number | null;
  dims: VariantDimensions | null;
  taxClass: string | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  restockEta: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantDTO {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  weightG: number | null;
  dims: VariantDimensions | null;
  taxClass: string | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  restockEta: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class ProductVariant extends AggregateRoot {
  private constructor(private props: ProductVariantProps) {
    super();
    ProductVariant.validate(props);
  }

  static create(params: {
    productId: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    barcode?: string | null;
    weightG?: number | null;
    dims?: VariantDimensions | null;
    taxClass?: string | null;
    allowBackorder?: boolean;
    allowPreorder?: boolean;
    restockEta?: Date | null;
  }): ProductVariant {
    // Future-only check is a business rule for new variants, not an invariant —
    // historical variants whose restock date has passed must reload from persistence.
    ProductVariant.validateRestockEta(params.restockEta ?? null);

    const variantId = VariantId.create();
    const now = new Date();

    const variant = new ProductVariant({
      id: variantId,
      productId: ProductId.fromString(params.productId),
      sku: SKU.create(params.sku),
      size: params.size?.trim() ?? null,
      color: params.color?.trim() ?? null,
      barcode: params.barcode?.trim() ?? null,
      weightG: params.weightG ?? null,
      dims: params.dims ?? null,
      taxClass: params.taxClass?.trim() ?? null,
      allowBackorder: params.allowBackorder ?? false,
      allowPreorder: params.allowPreorder ?? false,
      restockEta: params.restockEta ?? null,
      createdAt: now,
      updatedAt: now,
    });

    variant.addDomainEvent(
      new VariantCreatedEvent(variantId.getValue(), params.productId),
    );

    return variant;
  }

  static fromPersistence(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: ProductVariantProps): void {
    ProductVariant.validateWeight(props.weightG);
  }

  private static validateWeight(weightG: number | null): void {
    if (weightG !== null && weightG < 0) {
      throw new DomainValidationError("Weight cannot be negative");
    }
  }

  private static validateRestockEta(restockEta: Date | null): void {
    if (restockEta !== null && restockEta <= new Date()) {
      throw new InvalidOperationError("Restock ETA must be in the future");
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): VariantId { return this.props.id; }
  get productId(): ProductId { return this.props.productId; }
  get sku(): SKU { return this.props.sku; }
  get size(): string | null { return this.props.size; }
  get color(): string | null { return this.props.color; }
  get barcode(): string | null { return this.props.barcode; }
  get weightG(): number | null { return this.props.weightG; }
  get dims(): VariantDimensions | null { return this.props.dims; }
  get taxClass(): string | null { return this.props.taxClass; }
  get allowBackorder(): boolean { return this.props.allowBackorder; }
  get allowPreorder(): boolean { return this.props.allowPreorder; }
  get restockEta(): Date | null { return this.props.restockEta; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateSku(newSku: string): void {
    this.props.sku = SKU.create(newSku);
    this.markUpdated();
  }

  updateSize(newSize: string | null): void {
    this.props.size = newSize?.trim() ?? null;
    this.markUpdated();
  }

  updateColor(newColor: string | null): void {
    this.props.color = newColor?.trim() ?? null;
    this.markUpdated();
  }

  updateBarcode(newBarcode: string | null): void {
    this.props.barcode = newBarcode?.trim() ?? null;
    this.markUpdated();
  }

  updateWeight(newWeightG: number | null): void {
    ProductVariant.validateWeight(newWeightG);
    this.props.weightG = newWeightG;
    this.markUpdated();
  }

  updateDimensions(newDims: VariantDimensions | null): void {
    this.props.dims = newDims;
    this.markUpdated();
  }

  updateTaxClass(newTaxClass: string | null): void {
    this.props.taxClass = newTaxClass?.trim() ?? null;
    this.markUpdated();
  }

  setBackorderPolicy(allowBackorder: boolean): void {
    this.props.allowBackorder = allowBackorder;
    this.markUpdated();
  }

  setPreorderPolicy(allowPreorder: boolean): void {
    this.props.allowPreorder = allowPreorder;
    this.markUpdated();
  }

  setRestockEta(restockEta: Date | null): void {
    ProductVariant.validateRestockEta(restockEta);
    this.props.restockEta = restockEta;
    this.markUpdated();
  }

  // ── Query Methods ──────────────────────────────────────────────────

  isAvailableForBackorder(): boolean {
    return this.props.allowBackorder;
  }

  isAvailableForPreorder(): boolean {
    return this.props.allowPreorder;
  }

  // ── Internal ───────────────────────────────────────────────────────

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: ProductVariant): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: ProductVariant): ProductVariantDTO {
    return {
      id: entity.props.id.getValue(),
      productId: entity.props.productId.getValue(),
      sku: entity.props.sku.getValue(),
      size: entity.props.size,
      color: entity.props.color,
      barcode: entity.props.barcode,
      weightG: entity.props.weightG,
      dims: entity.props.dims,
      taxClass: entity.props.taxClass,
      allowBackorder: entity.props.allowBackorder,
      allowPreorder: entity.props.allowPreorder,
      restockEta: entity.props.restockEta?.toISOString() ?? null,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
