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

export class VariantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly productId: string,
  ) {
    super(variantId, 'ProductVariant');
  }
  get eventType(): string { return 'product-variant.updated'; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, productId: this.productId };
  }
}

export class VariantDeletedEvent extends DomainEvent {
  constructor(
    public readonly variantId: string,
    public readonly productId: string,
  ) {
    super(variantId, 'ProductVariant');
  }
  get eventType(): string { return 'product-variant.deleted'; }
  getPayload(): Record<string, unknown> {
    return { variantId: this.variantId, productId: this.productId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface ProductVariantProps {
  id: VariantId;
  productId: ProductId;
  sku: SKU;
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
}

export interface ProductVariantDTO {
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
}

// ── Entity ─────────────────────────────────────────────────────────────

export class ProductVariant extends AggregateRoot {
  private props: ProductVariantProps;

  private constructor(props: ProductVariantProps) {
    super();
    this.props = props;
  }

  static create(params: {
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
  }): ProductVariant {
    const variantId = VariantId.create();
    const sku = params.sku
      ? SKU.fromString(params.sku)
      : SKU.create(params.autoSkuValue || "");
    const now = new Date();

    const variant = new ProductVariant({
      id: variantId,
      productId: ProductId.fromString(params.productId),
      sku,
      size: params.size || null,
      color: params.color || null,
      barcode: params.barcode || null,
      weightG: params.weightG || null,
      dims: params.dims || null,
      taxClass: params.taxClass || null,
      allowBackorder: params.allowBackorder || false,
      allowPreorder: params.allowPreorder || false,
      restockEta: params.restockEta || null,
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

  // ── Getters ────────────────────────────────────────────────────────

  get id(): VariantId { return this.props.id; }
  get productId(): ProductId { return this.props.productId; }
  get sku(): SKU { return this.props.sku; }
  get size(): string | null { return this.props.size; }
  get color(): string | null { return this.props.color; }
  get barcode(): string | null { return this.props.barcode; }
  get weightG(): number | null { return this.props.weightG; }
  get dims(): Record<string, any> | null { return this.props.dims; }
  get taxClass(): string | null { return this.props.taxClass; }
  get allowBackorder(): boolean { return this.props.allowBackorder; }
  get allowPreorder(): boolean { return this.props.allowPreorder; }
  get restockEta(): Date | null { return this.props.restockEta; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateSku(newSku: string): void {
    this.props.sku = SKU.fromString(newSku);
    this.touch();
  }

  updateSize(newSize: string | null): void {
    this.props.size = newSize?.trim() || null;
    this.touch();
  }

  updateColor(newColor: string | null): void {
    this.props.color = newColor?.trim() || null;
    this.touch();
  }

  updateBarcode(newBarcode: string | null): void {
    this.props.barcode = newBarcode?.trim() || null;
    this.touch();
  }

  updateWeight(newWeightG: number | null): void {
    if (newWeightG !== null && newWeightG < 0) {
      throw new DomainValidationError("Weight cannot be negative");
    }
    this.props.weightG = newWeightG;
    this.touch();
  }

  updateDimensions(newDims: Record<string, any> | null): void {
    this.props.dims = newDims;
    this.touch();
  }

  updateTaxClass(newTaxClass: string | null): void {
    this.props.taxClass = newTaxClass?.trim() || null;
    this.touch();
  }

  setBackorderPolicy(allowBackorder: boolean): void {
    this.props.allowBackorder = allowBackorder;
    this.touch();
  }

  setPreorderPolicy(allowPreorder: boolean): void {
    this.props.allowPreorder = allowPreorder;
    this.touch();
  }

  setRestockEta(restockEta: Date | null): void {
    if (restockEta && restockEta <= new Date()) {
      throw new InvalidOperationError("Restock ETA must be in the future");
    }
    this.props.restockEta = restockEta;
    this.touch();
  }

  isAvailableForBackorder(): boolean {
    return this.props.allowBackorder;
  }

  isAvailableForPreorder(): boolean {
    return this.props.allowPreorder;
  }

  markDeleted(): void {
    this.addDomainEvent(
      new VariantDeletedEvent(
        this.props.id.getValue(),
        this.props.productId.getValue(),
      ),
    );
  }

  // ── Internal ───────────────────────────────────────────────────────

  private touch(): void {
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new VariantUpdatedEvent(
        this.props.id.getValue(),
        this.props.productId.getValue(),
      ),
    );
  }

  // ── Serialisation ──────────────────────────────────────────────────

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
      restockEta: entity.props.restockEta,
      createdAt: entity.props.createdAt,
      updatedAt: entity.props.updatedAt,
    };
  }

  equals(other: ProductVariant): boolean {
    return this.props.id.equals(other.props.id);
  }
}
